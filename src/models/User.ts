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

export type UserRole = 'customer' | 'vendor' | 'super_admin' | 'admin' | 'manager' | 'support_staff' | 'auditor' | 'developer' | 'rider' | 'staff';

export interface IUser extends Document {
  name: string;
  phone: string; // Phone is the primary canonical identifier per spec §0.1
  email?: string; // Optional email, addable later from settings
  password?: string;
  role: UserRole; // Primary active role
  roles: UserRole[]; // Multi-role support: one user can be customer AND vendor on same phone number
  activeRole?: UserRole;
  isActive: boolean;
  profilePic?: string;
  isVerified?: boolean;
  storeName?: string;
  points?: number;
  walletBalance?: number;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  referralCode?: string;
  referredBy?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  invitedBy?: string;
  invitedAt?: Date;
  lastLoginAt?: Date;
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
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['customer', 'vendor', 'super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer', 'rider', 'staff'], default: 'customer' },
  roles: {
    type: [{ type: String, enum: ['customer', 'vendor', 'super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer', 'rider', 'staff'] }],
    default: ['customer'],
  },
  activeRole: { type: String, enum: ['customer', 'vendor', 'super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer', 'rider', 'staff'] },
  isActive: { type: Boolean, default: true },
  profilePic: { type: String },
  isVerified: { type: Boolean, default: false },
  storeName: { type: String },
  points: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  isBlacklisted: { type: Boolean, default: false, index: true },
  blacklistReason: { type: String },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  invitedBy: { type: String },
  invitedAt: { type: Date },
  lastLoginAt: { type: Date },
  savedAddresses: { type: [SavedAddressSchema], default: [] },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// ── Pre-save bcrypt hook ─────────────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
