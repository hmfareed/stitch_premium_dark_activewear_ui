import mongoose, { Schema, Document, Model } from 'mongoose';

export type VendorStatus = 'pending' | 'approved' | 'rejected';

export interface IVendorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  businessCategory: string;
  momoNumber: string;
  status: VendorStatus;
  verificationDocs: string[];  // placeholder for future document upload URLs
  createdAt: Date;
}

const VendorProfileSchema: Schema<IVendorProfile> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true, trim: true },
  businessCategory: { type: String, required: true },
  momoNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  verificationDocs: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export const VendorProfile: Model<IVendorProfile> =
  mongoose.models.VendorProfile ||
  mongoose.model<IVendorProfile>('VendorProfile', VendorProfileSchema);
