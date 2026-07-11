import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface IReturnRequest extends Document {
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  items: IReturnItem[];
  reason: string;
  reasonDetail?: string;
  preferredPickupDate?: Date;
  pickupAddress?: string;
  status: 'requested' | 'pickup_scheduled' | 'picked_up' | 'received' | 'refunded' | 'rejected';
  rejectionReason?: string;
  refundAmount?: number;
  evidenceImages?: string[];
  vendorEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema({
  productId:   { type: String, required: true },
  productName: { type: String, required: true },
  quantity:    { type: Number, required: true },
  price:       { type: Number, required: true },
  image:       { type: String },
});

const ReturnRequestSchema: Schema<IReturnRequest> = new Schema({
  orderId:            { type: String, required: true, index: true },
  buyerEmail:         { type: String, required: true },
  buyerName:          { type: String, required: true },
  items:              { type: [ReturnItemSchema], required: true },
  reason:             { type: String, required: true },
  reasonDetail:       { type: String },
  preferredPickupDate:{ type: Date },
  pickupAddress:      { type: String },
  status:             { type: String, enum: ['requested','pickup_scheduled','picked_up','received','refunded','rejected'], default: 'requested' },
  rejectionReason:    { type: String },
  refundAmount:       { type: Number },
  evidenceImages:     { type: [String], default: [] },
  vendorEmail:        { type: String },
}, { timestamps: true });

export const ReturnRequest: Model<IReturnRequest> =
  mongoose.models.ReturnRequest || mongoose.model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
