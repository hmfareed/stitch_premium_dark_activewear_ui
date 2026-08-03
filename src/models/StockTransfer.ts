import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

export interface IStockTransfer extends Document {
  transferId: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  targetWarehouseId: string;
  targetWarehouseName: string;
  productId: string;
  productName: string;
  quantity: number;
  status: TransferStatus;
  notes?: string;
  requestedBy: string;
  createdAt: Date;
}

const StockTransferSchema: Schema<IStockTransfer> = new Schema({
  transferId:          { type: String, required: true, unique: true, index: true },
  sourceWarehouseId:   { type: String, required: true },
  sourceWarehouseName: { type: String, required: true },
  targetWarehouseId:   { type: String, required: true },
  targetWarehouseName: { type: String, required: true },
  productId:           { type: String, required: true },
  productName:         { type: String, required: true },
  quantity:            { type: Number, required: true },
  status:              { type: String, enum: ['pending', 'in_transit', 'completed', 'cancelled'], default: 'completed' },
  notes:               { type: String },
  requestedBy:         { type: String, default: 'Super Admin' },
  createdAt:           { type: Date, default: Date.now },
});

export const StockTransfer: Model<IStockTransfer> =
  mongoose.models.StockTransfer || mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
