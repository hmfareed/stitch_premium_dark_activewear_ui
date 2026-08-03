import mongoose, { Schema, Document, Model } from 'mongoose';

export type PromotionType = 'coupon' | 'promo_code' | 'flash_sale' | 'banner' | 'featured_product' | 'featured_vendor';

export interface IPromotion extends Document {
  promoId: string;
  type: PromotionType;
  title: string;
  code?: string;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed';
  bannerGradient?: string;
  bannerImage?: string;
  targetUrl?: string;
  targetProductId?: string;
  targetVendorEmail?: string;
  vendorEmail?: string;
  startDate?: Date;
  endDate?: Date;
  expiresAt?: Date;
  status?: string;
  uses?: number;
  limit?: number;
  isActive: boolean;
  createdAt: Date;
}

const PromotionSchema: Schema<IPromotion> = new Schema({
  promoId:           { type: String, required: true, unique: true, index: true },
  type:              { type: String, enum: ['coupon', 'promo_code', 'flash_sale', 'banner', 'featured_product', 'featured_vendor'], required: true },
  title:             { type: String, required: true },
  code:              { type: String, uppercase: true, trim: true },
  discountValue:     { type: Number, default: 0 },
  discountType:      { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  bannerGradient:    { type: String },
  bannerImage:       { type: String },
  targetUrl:         { type: String },
  targetProductId:   { type: String },
  targetVendorEmail: { type: String },
  vendorEmail:       { type: String },
  startDate:         { type: Date },
  endDate:           { type: Date },
  expiresAt:         { type: Date },
  status:            { type: String, default: 'active' },
  uses:              { type: Number, default: 0 },
  limit:             { type: Number, default: 100 },
  isActive:          { type: Boolean, default: true, index: true },
  createdAt:         { type: Date, default: Date.now },
});

export const Promotion: Model<IPromotion> =
  mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
