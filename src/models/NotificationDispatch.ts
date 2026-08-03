import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type RecipientAudience = 'all_vendors' | 'selected_vendors' | 'customers' | 'staff';

export interface INotificationDispatch extends Document {
  dispatchId: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  recipientAudience: RecipientAudience;
  selectedVendorEmails?: string[];
  status: 'sent' | 'queued' | 'failed';
  sentCount: number;
  createdAt: Date;
}

const NotificationDispatchSchema: Schema<INotificationDispatch> = new Schema({
  dispatchId:           { type: String, required: true, unique: true, index: true },
  title:                { type: String, required: true },
  message:              { type: String, required: true },
  channels:             { type: [{ type: String, enum: ['in_app', 'email', 'sms', 'push'] }], required: true },
  recipientAudience:    { type: String, enum: ['all_vendors', 'selected_vendors', 'customers', 'staff'], required: true },
  selectedVendorEmails: { type: [String], default: [] },
  status:               { type: String, enum: ['sent', 'queued', 'failed'], default: 'sent' },
  sentCount:            { type: Number, default: 0 },
  createdAt:            { type: Date, default: Date.now },
});

export const NotificationDispatch: Model<INotificationDispatch> =
  mongoose.models.NotificationDispatch || mongoose.model<INotificationDispatch>('NotificationDispatch', NotificationDispatchSchema);
