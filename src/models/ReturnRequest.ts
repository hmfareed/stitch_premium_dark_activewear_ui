import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export type ReturnStatus = 'requested' | 'pickup_scheduled' | 'picked_up' | 'received' | 'refunded' | 'rejected';
export type HubCondition = 'good' | 'damaged' | 'wrong_item';

export interface IReturnRequest extends Document {
  subOrderId: string;
  orderId: string;
  buyerEmail: string;
  buyerName: string;
  items: IReturnItem[];
  reason: string;
  reasonDetail?: string;
  preferredPickupDate?: Date;
  pickupAddress?: string;
  status: ReturnStatus;
  rejectionReason?: string;
  refundAmount?: number;
  refundReference?: string;
  evidenceImages?: string[];
  vendorEmail?: string;

  // Reverse Logistics & Hub Inspection (Spec §2.5)
  reverseRiderId?: string;
  reverseRiderName?: string;
  reverseRiderPhone?: string;
  hubInspected?: boolean;
  hubInspectionCondition?: HubCondition;
  hubInspectedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema({
  productId:   { type: String, required: true },
  productName: { type: String, required: true },
  quantity:    { type: Number, required: true },
  price:       { type: Number, required: true },
  image:       { type: String },
}, { _id: false });

const ReturnRequestSchema: Schema<IReturnRequest> = new Schema({
  subOrderId:         { type: String, required: true, index: true },
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
  refundReference:    { type: String },
  evidenceImages:     { type: [String], default: [] },
  vendorEmail:        { type: String },

  // Reverse Logistics & Hub Inspection (Spec §2.5)
  reverseRiderId:         { type: String },
  reverseRiderName:       { type: String },
  reverseRiderPhone:      { type: String },
  hubInspected:           { type: Boolean, default: false },
  hubInspectionCondition: { type: String, enum: ['good', 'damaged', 'wrong_item'] },
  hubInspectedAt:         { type: Date },
}, { timestamps: true });

export const ReturnRequest: Model<IReturnRequest> =
  mongoose.models.ReturnRequest || mongoose.model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
