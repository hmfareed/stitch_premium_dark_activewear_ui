import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  token: string;
  ip?: string;
  userAgent?: string;
  activeRole?: string;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema: Schema<ISession> = new Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  ip: { type: String },
  userAgent: { type: String },
  activeRole: { type: String, default: 'customer' },
  expiresAt: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL index to automatically delete expired sessions from MongoDB
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
