import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentChannel = 'cash' | 'card' | 'momo' | 'bank' | 'wallet';
export type PaymentStatus = 'pending' | 'verified' | 'refunded' | 'failed';

export interface IPaymentTransaction extends Document {
  transactionId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  channel: PaymentChannel;
  channelDetails: {
    network?: string; // MTN, Telecel, AirtelTigo for MoMo
    momoPhone?: string;
    cardLast4?: string;
    cardBrand?: string;
    bankName?: string;
    bankAccountRef?: string;
    walletId?: string;
    reference?: string; // Paystack / Gateway reference
  };
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  refundReference?: string;
  refundReason?: string;
  createdAt: Date;
}

const PaymentTransactionSchema: Schema<IPaymentTransaction> = new Schema({
  transactionId:   { type: String, required: true, unique: true, index: true },
  orderId:         { type: String, required: true, index: true },
  customerName:    { type: String, required: true },
  customerEmail:   { type: String, required: true },
  customerPhone:   { type: String },
  amount:          { type: Number, required: true },
  channel:         { type: String, enum: ['cash', 'card', 'momo', 'bank', 'wallet'], required: true },
  channelDetails: {
    network:        { type: String },
    momoPhone:      { type: String },
    cardLast4:      { type: String },
    cardBrand:      { type: String },
    bankName:       { type: String },
    bankAccountRef: { type: String },
    walletId:       { type: String },
    reference:      { type: String },
  },
  status:          { type: String, enum: ['pending', 'verified', 'refunded', 'failed'], default: 'verified' },
  verifiedBy:      { type: String },
  verifiedAt:      { type: Date },
  refundReference: { type: String },
  refundReason:    { type: String },
  createdAt:       { type: Date, default: Date.now },
});

export const PaymentTransaction: Model<IPaymentTransaction> =
  mongoose.models.PaymentTransaction || mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
