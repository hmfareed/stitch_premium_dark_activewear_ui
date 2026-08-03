import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayout extends Document {
  payoutRef?: string;
  vendorEmail: string;
  vendorName?: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected' | 'Processing';
  requestDate: Date;
  processedDate?: Date;
  paymentMethod: string;
  accountDetails: string;
  notes?: string;
  receiptSent?: boolean;
  receiptSentAt?: Date;
}

const PayoutSchema: Schema<IPayout> = new Schema({
  payoutRef:      { type: String },
  vendorEmail:    { type: String, required: true },
  vendorName:     { type: String },
  amount:         { type: Number, required: true },
  status:         { type: String, enum: ['Pending', 'Approved', 'Paid', 'Rejected', 'Processing'], default: 'Pending' },
  requestDate:    { type: Date, default: Date.now },
  processedDate:  { type: Date },
  paymentMethod:  { type: String, required: true },
  accountDetails: { type: String, required: true },
  notes:          { type: String },
  receiptSent:    { type: Boolean, default: false },
  receiptSentAt:  { type: Date },
});

export const Payout: Model<IPayout> = mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);
