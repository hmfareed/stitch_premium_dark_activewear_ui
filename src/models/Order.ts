import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  date: Date;
  status: string;
  total: number;
  itemsCount: number;
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    selectedSize?: string;
    category?: string;
    vendorEmail?: string;
    vendorStoreName?: string;
  }>;
  customerName: string;
  customerEmail: string;
  shippingAddress?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
  paymentInfo?: {
    method: string;
    network?: string;
    momoPhone?: string;
    paystackRef?: string;
    paymentStatus: 'Pending' | 'Paid' | 'Held' | 'Refunded';
    escrowStatus: 'Locked' | 'Released' | 'Disputed' | 'NA';
  };
  timeline: Array<{
    status: string;
    description: string;
    timestamp: Date;
  }>;
  assignedRiderName?: string;
  assignedRiderPhone?: string;
  trackingNumber?: string;
  refundReason?: string;
  refundAmount?: number;
  invoiceNumber?: string;
}

const OrderSchema: Schema<IOrder> = new Schema({
  orderId: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now },
  status: { type: String, required: true, default: 'Pending' },
  total: { type: Number, required: true },
  itemsCount: { type: Number, required: true },
  products: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true },
    selectedSize: { type: String },
    category: { type: String },
    vendorEmail: { type: String },
    vendorStoreName: { type: String },
  }],
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  shippingAddress: {
    fullName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    region: { type: String },
  },
  paymentInfo: {
    method: { type: String },
    network: { type: String },
    momoPhone: { type: String },
    paystackRef: { type: String },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Held', 'Refunded'], default: 'Pending' },
    escrowStatus: { type: String, enum: ['Locked', 'Released', 'Disputed', 'NA'], default: 'NA' },
  },
  assignedRiderName: { type: String },
  assignedRiderPhone: { type: String },
  trackingNumber: { type: String },
  refundReason: { type: String },
  refundAmount: { type: Number },
  invoiceNumber: { type: String },
  timeline: [{
    status: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
});

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
