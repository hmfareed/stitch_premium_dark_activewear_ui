import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromotion extends Document {
  code: string;
  name?: string;
  description?: string;
  vendorEmail?: string;
  type: 'platform' | 'vendor'; // platform-run vs vendor-run per spec §8.1
  discountType: 'percentage' | 'fixed' | 'shipping';
  discountValue: number;
  uses: number;
  limit: number;
  maxUsesPerCustomer: number;
  status: 'Active' | 'Expired';
  startDate?: Date;
  endDate?: Date;
  expiresAt: Date;
  featuredProductIds: string[];
  featuredStoreIds: string[];
  couponCode?: string;
  isActive: boolean;
  createdAt: Date;
}

const PromotionSchema: Schema<IPromotion> = new Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String },
  description: { type: String },
  vendorEmail: { type: String },
  type: { type: String, enum: ['platform', 'vendor'], default: 'vendor' },
  discountType: { type: String, enum: ['percentage', 'fixed', 'shipping'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  uses: { type: Number, default: 0 },
  limit: { type: Number, required: true, default: 100 },
  maxUsesPerCustomer: { type: Number, default: 1 },
  status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
  startDate: { type: Date },
  endDate: { type: Date },
  expiresAt: { type: Date, required: true },
  featuredProductIds: { type: [String], default: [] },
  featuredStoreIds: { type: [String], default: [] },
  couponCode: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

PromotionSchema.index({ code: 1 }, { unique: true });
PromotionSchema.index({ type: 1 });
PromotionSchema.index({ startDate: 1, endDate: 1 });

export const Promotion: Model<IPromotion> = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
