import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPickupStation extends Document {
  stationId: string;
  name: string;
  city: string;
  address: string;
  gpsCode: string; // Ghana Post GPS code (e.g. GA-183-9021)
  operatingHours: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: Date;
}

const PickupStationSchema: Schema<IPickupStation> = new Schema({
  stationId:      { type: String, required: true, unique: true, index: true },
  name:           { type: String, required: true },
  city:           { type: String, required: true },
  address:        { type: String, required: true },
  gpsCode:        { type: String, required: true },
  operatingHours: { type: String, default: 'Mon-Sat: 8:00 AM - 7:00 PM' },
  contactPhone:   { type: String, required: true },
  isActive:       { type: Boolean, default: true, index: true },
  createdAt:      { type: Date, default: Date.now },
});

export const PickupStation: Model<IPickupStation> =
  mongoose.models.PickupStation || mongoose.model<IPickupStation>('PickupStation', PickupStationSchema);
