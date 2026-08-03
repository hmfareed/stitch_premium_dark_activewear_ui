import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommissionLog extends Document {
  logId: string;
  orderId: string;
  vendorEmail: string;
  vendorName: string;
  grossAmount: number;
  commissionType: string;
  commissionAmount: number;
  netVendorAmount: number;
  isManualAdjustment: boolean;
  notes?: string;
  createdAt: Date;
}

const CommissionLogSchema: Schema<ICommissionLog> = new Schema({
  logId:              { type: String, required: true, unique: true, index: true },
  orderId:            { type: String, required: true, index: true },
  vendorEmail:        { type: String, required: true, index: true },
  vendorName:         { type: String, default: 'AfriCart Vendor' },
  grossAmount:        { type: Number, required: true },
  commissionType:     { type: String, required: true },
  commissionAmount:   { type: Number, required: true },
  netVendorAmount:    { type: Number, required: true },
  isManualAdjustment: { type: Boolean, default: false },
  notes:              { type: String },
  createdAt:          { type: Date, default: Date.now },
});

export const CommissionLog: Model<ICommissionLog> =
  mongoose.models.CommissionLog || mongoose.model<ICommissionLog>('CommissionLog', CommissionLogSchema);
