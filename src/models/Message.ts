import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  from: string;
  fromName: string;
  fromRole: 'super_admin' | 'vendor' | 'customer';
  to: string; // recipient email or 'broadcast_admins' or 'broadcast_all'
  toName: string;
  text: string;
  timestamp: Date;
  read: boolean;
}

const MessageSchema: Schema<IMessage> = new Schema({
  from: { type: String, required: true },
  fromName: { type: String, required: true },
  fromRole: { type: String, enum: ['super_admin', 'vendor', 'customer'], required: true },
  to: { type: String, required: true },
  toName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
