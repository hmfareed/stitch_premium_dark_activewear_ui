import mongoose, { Schema, Document, Model } from 'mongoose';

export type SubOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'vendor_processing'
  | 'awaiting_hub_dropoff'
  | 'hub_received'
  // Home Delivery Branch
  | 'ready_for_rider_pickup'
  | 'rider_assigned'
  | 'rider_collected'
  | 'out_for_delivery'
  | 'delivered'
  // Self Pickup Branch
  | 'ready_for_customer_pickup'
  | 'customer_picked_up'
  // Shared Terminal & Exceptions
  | 'completed'
  | 'cancelled'
  | 'failed_delivery'
  | 'return_requested'
  | 'return_in_transit'
  | 'return_received'
  | 'refunded';

export type FulfillmentMethod = 'home_delivery' | 'self_pickup';
export type FulfillmentSource = 'hub_stock' | 'vendor_dropoff_pending' | 'vendor_direct_pickup';

export interface ISubOrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize?: string;
  category?: string;
}

export interface ISubOrderTimeline {
  status: SubOrderStatus;
  description: string;
  timestamp: Date;
  updatedByRole?: 'customer' | 'vendor' | 'rider' | 'hub' | 'superadmin';
  updatedById?: string;
}

export interface ISubOrder extends Document {
  subOrderId: string;
  orderId: string; // References parent order
  storeId: string;
  vendorEmail: string;
  vendorStoreName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  items: ISubOrderItem[];
  subtotal: number;
  deliveryFee: number;
  commissionAmount: number; // 0 for now
  total: number;

  fulfillmentMethod: FulfillmentMethod;
  fulfillmentSource: FulfillmentSource;
  status: SubOrderStatus;

  // Delivery / Pickup Details
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
  pickupOtp?: string;
  deliveryOtp?: string;

  // Rider Assignment
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  assignedAt?: Date;

  // SLA & Confirmation Window
  estimatedDeliveryWindow?: string;
  deliveredAt?: Date;
  confirmationDeadline?: Date; // 48 hours after delivery

  timeline: ISubOrderTimeline[];

  createdAt: Date;
  updatedAt: Date;
}

const SubOrderItemSchema = new Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true },
  selectedSize: { type: String },
  category: { type: String },
}, { _id: false });

const SubOrderTimelineSchema = new Schema({
  status: { type: String, required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedByRole: { type: String, enum: ['customer', 'vendor', 'rider', 'hub', 'superadmin'] },
  updatedById: { type: String },
}, { _id: false });

const SubOrderSchema: Schema<ISubOrder> = new Schema({
  subOrderId: { type: String, required: true, unique: true, index: true },
  orderId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  vendorEmail: { type: String, required: true },
  vendorStoreName: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },

  items: { type: [SubOrderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  fulfillmentMethod: { type: String, enum: ['home_delivery', 'self_pickup'], required: true, default: 'home_delivery' },
  fulfillmentSource: { type: String, enum: ['hub_stock', 'vendor_dropoff_pending', 'vendor_direct_pickup'], required: true, default: 'vendor_dropoff_pending' },
  status: { type: String, required: true, default: 'paid' },

  shippingAddress: {
    fullName: { type: String },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    region: { type: String },
  },
  pickupOtp: { type: String },
  deliveryOtp: { type: String },

  riderId: { type: String, index: true },
  riderName: { type: String },
  riderPhone: { type: String },
  assignedAt: { type: Date },

  estimatedDeliveryWindow: { type: String },
  deliveredAt: { type: Date },
  confirmationDeadline: { type: Date },

  timeline: { type: [SubOrderTimelineSchema], default: [] },
}, { timestamps: true });

SubOrderSchema.index({ status: 1 });
SubOrderSchema.index({ storeId: 1, status: 1 });
SubOrderSchema.index({ vendorEmail: 1 });

export const SubOrder: Model<ISubOrder> = mongoose.models.SubOrder || mongoose.model<ISubOrder>('SubOrder', SubOrderSchema);
