import mongoose, { Schema, Document, Model } from 'mongoose';

export type AdjustmentType = 'stock_in' | 'stock_out' | 'damaged' | 'expired' | 'reconciliation';

export interface IStockAdjustment extends Document {
  adjustmentId: string;
  productId: string;
  productName: string;
  warehouseId: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
  performedBy: string;
  createdAt: Date;
}

const StockAdjustmentSchema: Schema<IStockAdjustment> = new Schema({
  adjustmentId: { type: String, required: true, unique: true, index: true },
  productId:    { type: String, required: true, index: true },
  productName:  { type: String, required: true },
  warehouseId:  { type: String, required: true, default: 'WH-TML-01' },
  type:         { type: String, enum: ['stock_in', 'stock_out', 'damaged', 'expired', 'reconciliation'], required: true },
  quantity:     { type: Number, required: true },
  reason:       { type: String, required: true },
  performedBy:  { type: String, default: 'Super Admin' },
  createdAt:    { type: Date, default: Date.now },
});

export const StockAdjustment: Model<IStockAdjustment> =
  mongoose.models.StockAdjustment || mongoose.model<IStockAdjustment>('StockAdjustment', StockAdjustmentSchema);
