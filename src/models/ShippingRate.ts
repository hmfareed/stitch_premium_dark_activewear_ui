import mongoose, { Schema, Document, Model } from 'mongoose';

export type ShippingZone = 'accra_metro' | 'kumasi_metro' | 'tamale_metro' | 'regional' | 'rural';

export interface IShippingRate extends Document {
  region: string;
  zone: ShippingZone;
  fee: number;
  estimatedDays: string;
  coversCOD: boolean;  // whether Cash on Delivery is available in this zone
  isActive: boolean;
}

const ShippingRateSchema: Schema<IShippingRate> = new Schema({
  region:       { type: String, required: true, unique: true },
  zone:         { type: String, enum: ['accra_metro', 'kumasi_metro', 'tamale_metro', 'regional', 'rural'], default: 'regional' },
  fee:          { type: Number, required: true },
  estimatedDays:{ type: String, default: '3-5 business days' },
  coversCOD:    { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
});

export const ShippingRate: Model<IShippingRate> = mongoose.models.ShippingRate || mongoose.model<IShippingRate>('ShippingRate', ShippingRateSchema);
