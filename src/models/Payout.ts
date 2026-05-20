import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayout extends Document {
  vendorEmail: string;
  vendorName?: string;
  amount: number;
  status: 'Pending' | 'Processing' | 'Paid' | 'Rejected';
  requestDate: Date;
  processedDate?: Date;
  paymentMethod: string;
  accountDetails: string;
  notes?: string;
}

const PayoutSchema: Schema<IPayout> = new Schema({
  vendorEmail: { type: String, required: true },
  vendorName: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processing', 'Paid', 'Rejected'], default: 'Pending' },
  requestDate: { type: Date, default: Date.now },
  processedDate: { type: Date },
  paymentMethod: { type: String, required: true },
  accountDetails: { type: String, required: true },
  notes: { type: String }
});

export const Payout: Model<IPayout> = mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);
