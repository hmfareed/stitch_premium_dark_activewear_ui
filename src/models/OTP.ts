import mongoose, { Schema, Document, Model } from 'mongoose';

export type OTPPurpose = 'delivery_confirm' | 'pickup_confirm' | 'password_reset' | 'signup_verify' | 'checkout';

export interface IOTP extends Document {
  phone: string;
  code: string;
  orderId?: string;
  subOrderId?: string;
  purpose: OTPPurpose;
  used: boolean;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema: Schema<IOTP> = new Schema({
  phone:      { type: String, required: true },
  code:       { type: String, required: true },
  orderId:    { type: String },
  subOrderId: { type: String },
  purpose:    { type: String, enum: ['delivery_confirm', 'pickup_confirm', 'password_reset', 'signup_verify', 'checkout'], default: 'checkout' },
  used:       { type: Boolean, default: false },
  attempts:   { type: Number, default: 0 },
  expiresAt:  { type: Date, required: true },
  createdAt:  { type: Date, default: Date.now },
});

// Auto-purge OTP records after 48 hours per spec §6.3 data protection compliance
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 172800 });

export const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
