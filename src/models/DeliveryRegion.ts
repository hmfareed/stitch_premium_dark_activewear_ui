import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliveryRegion extends Document {
  regionId: string;
  name: string;
  baseRate: number;
  perKmRate: number;
  estimatedHours: string;
  isActive: boolean;
  createdAt: Date;
}

const DeliveryRegionSchema: Schema<IDeliveryRegion> = new Schema({
  regionId:       { type: String, required: true, unique: true, index: true },
  name:           { type: String, required: true },
  baseRate:       { type: Number, required: true },
  perKmRate:      { type: Number, required: true },
  estimatedHours: { type: String, default: '24 - 48 Hours' },
  isActive:       { type: Boolean, default: true, index: true },
  createdAt:      { type: Date, default: Date.now },
});

export const DeliveryRegion: Model<IDeliveryRegion> =
  mongoose.models.DeliveryRegion || mongoose.model<IDeliveryRegion>('DeliveryRegion', DeliveryRegionSchema);
