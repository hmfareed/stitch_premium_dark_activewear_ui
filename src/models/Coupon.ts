import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiryDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

const CouponSchema: Schema<ICoupon> = new Schema({
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  discountPercent: { type: Number, required: true, min: 1, max: 100 },
  maxUses:         { type: Number, default: 100 },
  usedCount:       { type: Number, default: 0 },
  expiryDate:      { type: Date },
  isActive:        { type: Boolean, default: true },
  createdAt:       { type: Date, default: Date.now },
});

export const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
