import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStoreBranch extends Document {
  storeId: mongoose.Types.ObjectId;
  storeSlug: string;
  vendorEmail: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone?: string;
  managerName?: string;
  managerEmail?: string;
  isActive: boolean;
  createdAt: Date;
}

const StoreBranchSchema: Schema<IStoreBranch> = new Schema({
  storeId:      { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  storeSlug:    { type: String, required: true, index: true },
  vendorEmail:  { type: String, required: true, lowercase: true },
  name:         { type: String, required: true },
  code:         { type: String, required: true, unique: true },
  city:         { type: String, required: true, default: 'Accra' },
  address:      { type: String, required: true },
  phone:        { type: String },
  managerName:  { type: String },
  managerEmail: { type: String },
  isActive:     { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now },
});

export const StoreBranch: Model<IStoreBranch> =
  mongoose.models.StoreBranch || mongoose.model<IStoreBranch>('StoreBranch', StoreBranchSchema);
