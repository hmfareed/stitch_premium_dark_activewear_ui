import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConsignmentStock extends Document {
  storeId: string;
  vendorEmail: string;
  productId: string;
  productName: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  minReorderLevel: number;
  lastRestockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsignmentStockSchema: Schema<IConsignmentStock> = new Schema({
  storeId: { type: String, required: true, index: true },
  vendorEmail: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  productName: { type: String, required: true },
  warehouseId: { type: String, required: true, default: 'WH-TML-01' },
  quantity: { type: Number, required: true, default: 0 },
  reservedQuantity: { type: Number, default: 0 },
  minReorderLevel: { type: Number, default: 5 },
  lastRestockedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ConsignmentStockSchema.index({ storeId: 1, productId: 1 }, { unique: true });

export const ConsignmentStock: Model<IConsignmentStock> =
  mongoose.models.ConsignmentStock || mongoose.model<IConsignmentStock>('ConsignmentStock', ConsignmentStockSchema);
