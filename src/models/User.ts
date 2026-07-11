import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISavedAddress {
  label: string; // "Home", "Work", "Other"
  fullName: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'customer' | 'vendor' | 'super_admin';
  isActive: boolean;
  profilePic?: string;
  isVerified?: boolean;
  storeName?: string;
  points?: number;
  referralCode?: string;
  referredBy?: string;           // referrer email
  savedAddresses?: ISavedAddress[];
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

const SavedAddressSchema = new Schema({
  label: { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const UserSchema: Schema<IUser> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String },
  role: { type: String, enum: ['customer', 'vendor', 'super_admin'], default: 'customer' },
  isActive: { type: Boolean, default: true },
  profilePic: { type: String },
  isVerified: { type: Boolean, default: false },
  storeName: { type: String },
  points: { type: Number, default: 0 },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String },
  savedAddresses: { type: [SavedAddressSchema], default: [] },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// ── Pre-save bcrypt hook ─────────────────────────────────────────────────────
// Only re-hashes when `password` is actually modified, preventing double-hashing
// on saves that touch other fields (e.g. profile updates, role changes).
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  // Skip if already a bcrypt hash (migration-safe guard)
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
