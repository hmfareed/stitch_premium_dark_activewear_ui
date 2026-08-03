import mongoose, { Schema, Document, Model } from 'mongoose';

export type POStatus = 'draft' | 'submitted' | 'received' | 'cancelled';

export interface IPOItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface IPurchaseOrder extends Document {
  poId: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  items: IPOItem[];
  totalAmount: number;
  status: POStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  createdAt: Date;
}

const POItemSchema = new Schema({
  productId:   { type: String, required: true },
  productName: { type: String, required: true },
  unitPrice:   { type: Number, required: true },
  quantity:    { type: Number, required: true },
}, { _id: false });

const PurchaseOrderSchema: Schema<IPurchaseOrder> = new Schema({
  poId:                 { type: String, required: true, unique: true, index: true },
  supplierId:           { type: String, required: true },
  supplierName:         { type: String, required: true },
  warehouseId:          { type: String, required: true, default: 'WH-TML-01' },
  items:                { type: [POItemSchema], default: [] },
  totalAmount:          { type: Number, required: true },
  status:               { type: String, enum: ['draft', 'submitted', 'received', 'cancelled'], default: 'submitted' },
  orderDate:            { type: Date, default: Date.now },
  expectedDeliveryDate: { type: Date },
  createdAt:            { type: Date, default: Date.now },
});

export const PurchaseOrder: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder || mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
