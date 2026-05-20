import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShippingRate extends Document {
  region: string;
  fee: number;
  estimatedDays: string;
  isActive: boolean;
}

const ShippingRateSchema: Schema<IShippingRate> = new Schema({
  region: { type: String, required: true, unique: true },
  fee: { type: Number, required: true },
  estimatedDays: { type: String, default: '3-5 business days' },
  isActive: { type: Boolean, default: true },
});

export const ShippingRate: Model<IShippingRate> = mongoose.models.ShippingRate || mongoose.model<IShippingRate>('ShippingRate', ShippingRateSchema);
