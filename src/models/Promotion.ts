import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromotion extends Document {
  code: string;
  vendorEmail: string; // The vendor who created this promo
  type: 'Percentage' | 'Fixed' | 'Shipping';
  discountValue: number; // e.g. 20 for 20%, 50 for 50 GHS
  uses: number;
  limit: number;
  status: 'Active' | 'Expired';
  expiresAt: Date;
  createdAt: Date;
}

const PromotionSchema: Schema<IPromotion> = new Schema({
  code: { type: String, required: true, uppercase: true, trim: true },
  vendorEmail: { type: String, required: true },
  type: { type: String, enum: ['Percentage', 'Fixed', 'Shipping'], required: true },
  discountValue: { type: Number, required: true },
  uses: { type: Number, default: 0 },
  limit: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Ensure codes are unique per vendor (or globally, let's make it global for simplicity)
PromotionSchema.index({ code: 1 }, { unique: true });

export const Promotion: Model<IPromotion> = mongoose.models.Promotion || mongoose.model<IPromotion>('Promotion', PromotionSchema);
