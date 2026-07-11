import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReferral extends Document {
  referrerEmail: string;
  referrerName?: string;
  referralCode: string;
  referreeEmail?: string;
  referreeName?: string;
  type: 'buyer' | 'vendor';
  rewardPoints: number;        // points credited to referrer
  status: 'pending' | 'completed' | 'rewarded';
  createdAt: Date;
  completedAt?: Date;
}

const ReferralSchema: Schema<IReferral> = new Schema({
  referrerEmail: { type: String, required: true, index: true },
  referrerName:  { type: String },
  referralCode:  { type: String, required: true, unique: true },
  referreeEmail: { type: String },
  referreeName:  { type: String },
  type:          { type: String, enum: ['buyer', 'vendor'], default: 'buyer' },
  rewardPoints:  { type: Number, default: 500 },  // 500 pts per successful referral
  status:        { type: String, enum: ['pending', 'completed', 'rewarded'], default: 'pending' },
  createdAt:     { type: Date, default: Date.now },
  completedAt:   { type: Date },
});

export const Referral: Model<IReferral> =
  mongoose.models.Referral || mongoose.model<IReferral>('Referral', ReferralSchema);
