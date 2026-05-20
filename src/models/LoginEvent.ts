import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoginEvent extends Document {
  email: string;
  userName: string;
  role?: string;
  success: boolean;
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  failReason?: string;
  timestamp: Date;
}

const LoginEventSchema: Schema<ILoginEvent> = new Schema({
  email: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  role: { type: String },
  success: { type: Boolean, required: true },
  ip: { type: String, default: 'Unknown' },
  userAgent: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Unknown Device' },
  browser: { type: String, default: 'Unknown Browser' },
  os: { type: String, default: 'Unknown OS' },
  failReason: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
});

export const LoginEvent: Model<ILoginEvent> = mongoose.models.LoginEvent || mongoose.model<ILoginEvent>('LoginEvent', LoginEventSchema);
