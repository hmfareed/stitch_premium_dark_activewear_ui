import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWarehouse extends Document {
  code: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  managerName?: string;
  /** Coordinates for the hub — required for delivery-fee distance calculations (Phase 11) */
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: Date;
}

const WarehouseSchema: Schema<IWarehouse> = new Schema({
  code:        { type: String, required: true, unique: true, index: true },
  name:        { type: String, required: true },
  city:        { type: String, required: true, default: 'Tamale' },
  address:     { type: String, required: true },
  phone:       { type: String },
  managerName: { type: String },
  /** Shishegu Central Mosque coordinates used as Tamale hub reference point */
  latitude:    { type: Number, required: true, default: 9.4075 },
  longitude:   { type: Number, required: true, default: 0.8503 },
  isActive:    { type: Boolean, default: true },
  createdAt:   { type: Date, default: Date.now },
});

export const Warehouse: Model<IWarehouse> =
  mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

/**
 * Ensures single seed warehouse (Tamale Central Hub) exists per spec §2.3 / Phase 0.
 * Coordinates: Shishegu Central Mosque, Tamale (~9.4075° N, 0.8503° E)
 */
export async function ensureDefaultWarehouse(): Promise<IWarehouse> {
  let mainHub = await Warehouse.findOne({ code: 'WH-TML-01' });
  if (!mainHub) {
    mainHub = await Warehouse.create({
      code: 'WH-TML-01',
      name: 'AfriCart Tamale Central Hub',
      city: 'Tamale',
      address: 'Shishegu, Tamale, Northern Region, Ghana',
      phone: '+233 24 000 0000',
      managerName: 'Hub Operations Director',
      latitude: 9.4075,
      longitude: 0.8503,
      isActive: true,
    });
  } else if (!mainHub.latitude || mainHub.latitude === 0) {
    // Backfill coordinates onto existing hub record
    mainHub.latitude = 9.4075;
    mainHub.longitude = 0.8503;
    await mainHub.save();
  }
  return mainHub;
}
