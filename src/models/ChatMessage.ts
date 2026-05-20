import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  orderId: string;
  sender: string; // email
  receiver: string; // email
  message: string;
  timestamp: Date;
  read: boolean;
}

const ChatMessageSchema: Schema = new Schema({
  orderId: { type: String, required: true },
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

export const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
