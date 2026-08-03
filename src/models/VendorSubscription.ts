import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Vendor subscription lifecycle tracking per spec §7.3–§7.5.
 * Tracks plan, start/end dates, status, and payment references.
 */
export type SubscriptionStatus = 'active' | 'grace' | 'lapsed' | 'cancelled' | 'paused';

export interface IVendorSubscription extends Document {
  vendorId: mongoose.Types.ObjectId;
  vendorEmail: string;
  storeId?: mongoose.Types.ObjectId;
  planTier: 'trial' | 'basic' | 'plus' | 'pro';
  planName: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  gracePeriodEndDate?: Date;
  paymentReference?: string;
  paymentMethod?: 'mobile_money' | 'card';
  amountPaid: number;
  currency: string;
  autoRenew: boolean;
  previousTier?: string;
  upgradeDate?: Date;
  downgradeScheduledTier?: string; // takes effect at next renewal per spec §7.4
  remindersSent: string[]; // track which reminder intervals were sent (e.g. '30d', '14d', '7d', '3d', '1d')
  createdAt: Date;
  updatedAt: Date;
}

const VendorSubscriptionSchema: Schema<IVendorSubscription> = new Schema({
  vendorId: { type: Schema.Types.ObjectId, ref: 'VendorProfile', required: true, index: true },
  vendorEmail: { type: String, required: true, lowercase: true, index: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
  planTier: { type: String, enum: ['trial', 'basic', 'plus', 'pro'], required: true },
  planName: { type: String, required: true },
  status: { type: String, enum: ['active', 'grace', 'lapsed', 'cancelled', 'paused'], default: 'active', index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true, index: true },
  gracePeriodEndDate: { type: Date },
  paymentReference: { type: String },
  paymentMethod: { type: String, enum: ['mobile_money', 'card'] },
  amountPaid: { type: Number, default: 0 },
  currency: { type: String, default: 'GHS' },
  autoRenew: { type: Boolean, default: false },
  previousTier: { type: String },
  upgradeDate: { type: Date },
  downgradeScheduledTier: { type: String },
  remindersSent: { type: [String], default: [] },
}, { timestamps: true });

export const VendorSubscription: Model<IVendorSubscription> =
  mongoose.models.VendorSubscription || mongoose.model<IVendorSubscription>('VendorSubscription', VendorSubscriptionSchema);
