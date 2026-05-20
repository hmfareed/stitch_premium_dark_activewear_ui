import mongoose, { Schema, Document, Model } from 'mongoose';

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
  profilePic?: string;
  isVerified?: boolean;
  storeName?: string;
  points?: number;
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
  profilePic: { type: String },
  isVerified: { type: Boolean, default: false },
  storeName: { type: String },
  points: { type: Number, default: 0 },
  savedAddresses: { type: [SavedAddressSchema], default: [] },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
