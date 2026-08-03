import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISystemAlert extends Document {
  alertId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  source?: string;
  read: boolean;
  createdAt: Date;
}

const SystemAlertSchema: Schema<ISystemAlert> = new Schema({
  alertId:   { type: String, required: true, unique: true, index: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  source:    { type: String },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const SystemAlert: Model<ISystemAlert> =
  mongoose.models.SystemAlert || mongoose.model<ISystemAlert>('SystemAlert', SystemAlertSchema);
