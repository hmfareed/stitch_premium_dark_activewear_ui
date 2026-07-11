import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOTP extends Document {
  phone: string;
  code: string;
  orderId?: string;
  purpose: 'checkout' | 'signup' | 'password_reset';
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSchema: Schema<IOTP> = new Schema({
  phone:     { type: String, required: true },
  code:      { type: String, required: true },
  orderId:   { type: String },
  purpose:   { type: String, enum: ['checkout', 'signup', 'password_reset'], default: 'checkout' },
  used:      { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: auto-delete expired OTPs from MongoDB
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP: Model<IOTP> = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);
