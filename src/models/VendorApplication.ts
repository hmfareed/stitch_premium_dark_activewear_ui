import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendorApplication extends Document {
  name: string;
  email: string;
  phone: string;
  role: string;
  storeName?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
}

const VendorApplicationSchema: Schema<IVendorApplication> = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  storeName: { type: String },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
});

export const VendorApplication: Model<IVendorApplication> = mongoose.models.VendorApplication || mongoose.model<IVendorApplication>('VendorApplication', VendorApplicationSchema);
