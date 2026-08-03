import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  userEmail: string;
  userName: string;
  adminEmail?: string;
  adminName?: string;
  role: string;
  ip: string;
  browser: string;
  module: string; // e.g. 'Vendors', 'Products', 'Orders', 'Finance', 'Support', 'Settings', 'Users', 'Inventory'
  action: string; // e.g. 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'REFUND'
  target: string; // human-readable description
  targetId?: string;
  oldValue?: string; // JSON string representation or description of previous state
  newValue?: string; // JSON string representation or description of updated state
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema({
  userEmail:  { type: String, required: true, index: true },
  userName:   { type: String, required: true },
  adminEmail: { type: String },
  adminName:  { type: String },
  role:       { type: String, required: true, index: true },
  ip:         { type: String, required: true, default: '127.0.0.1' },
  browser:    { type: String, required: true, default: 'Chrome / Web Browser' },
  module:     { type: String, required: true, index: true, default: 'System' },
  action:     { type: String, required: true, index: true },
  target:     { type: String, required: true },
  targetId:   { type: String },
  oldValue:   { type: String },
  newValue:   { type: String },
  metadata:   { type: Schema.Types.Mixed },
  timestamp:  { type: Date, default: Date.now, index: true },
});

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
