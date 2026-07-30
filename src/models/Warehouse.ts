import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWarehouse extends Document {
  code: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  managerName?: string;
  isActive: boolean;
  createdAt: Date;
}

const WarehouseSchema: Schema<IWarehouse> = new Schema({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  city: { type: String, required: true, default: 'Tamale' },
  address: { type: String, required: true },
  phone: { type: String },
  managerName: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Warehouse: Model<IWarehouse> =
  mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);

/**
 * Ensures single seed warehouse (Tamale Central Hub) exists per spec §2.3
 */
export async function ensureDefaultWarehouse(): Promise<IWarehouse> {
  let mainHub = await Warehouse.findOne({ code: 'WH-TML-01' });
  if (!mainHub) {
    mainHub = await Warehouse.create({
      code: 'WH-TML-01',
      name: 'Tamale Central Warehouse & Fulfillment Hub',
      city: 'Tamale',
      address: 'Plot 14, Commercial Area, Tamale Central, Northern Region, Ghana',
      phone: '+233 24 000 0000',
      managerName: 'Hub Operations Director',
      isActive: true,
    });
  }
  return mainHub;
}
