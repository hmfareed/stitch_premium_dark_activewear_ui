import mongoose, { Schema, Document, Model } from 'mongoose';

export type TicketCategory = 'order_issue' | 'payment_dispute' | 'return_claim' | 'account' | 'other';
export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITicketMessage {
  senderRole: 'customer' | 'vendor' | 'superadmin';
  senderName: string;
  senderEmail: string;
  content: string;
  timestamp: Date;
}

export interface ISupportTicket extends Document {
  ticketId: string;
  userEmail: string;
  userName: string;
  userRole: 'customer' | 'vendor';
  subOrderId?: string;
  orderId?: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  messages: ITicketMessage[];
  assignedAdminEmail?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema({
  senderRole: { type: String, enum: ['customer', 'vendor', 'superadmin'], required: true },
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const SupportTicketSchema: Schema<ISupportTicket> = new Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  userEmail: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userRole: { type: String, enum: ['customer', 'vendor'], required: true, default: 'customer' },
  subOrderId: { type: String, index: true },
  orderId: { type: String, index: true },
  subject: { type: String, required: true },
  category: { type: String, enum: ['order_issue', 'payment_dispute', 'return_claim', 'account', 'other'], default: 'order_issue' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  messages: { type: [TicketMessageSchema], required: true },
  assignedAdminEmail: { type: String },
  resolvedAt: { type: Date },
}, { timestamps: true });

export const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
