import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  adminEmail: string;
  adminName: string;
  role: string;
  action: string;           // e.g. 'approve_vendor', 'issue_refund', 'delete_listing'
  target: string;           // human-readable target description
  targetId?: string;        // referenced document ID
  metadata?: Record<string, any>;
  ip?: string;
  timestamp: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema({
  adminEmail: { type: String, required: true, index: true },
  adminName:  { type: String, required: true },
  role:       { type: String, required: true },
  action:     { type: String, required: true, index: true },
  target:     { type: String, required: true },
  targetId:   { type: String },
  metadata:   { type: Schema.Types.Mixed },
  ip:         { type: String },
  timestamp:  { type: Date, default: Date.now, index: true },
});

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
