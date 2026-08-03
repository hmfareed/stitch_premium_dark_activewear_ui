import mongoose, { Schema, Document, Model } from 'mongoose';

export type CommissionType = 'percentage' | 'fixed' | 'vendor_specific' | 'category_specific';

export interface ICommissionRule extends Document {
  ruleId: string;
  type: CommissionType;
  name: string;
  rate: number; // percentage (e.g. 5%) or fixed amount (e.g. 10 GHS)
  targetVendorEmail?: string;
  targetCategory?: string;
  isActive: boolean;
  createdAt: Date;
}

const CommissionRuleSchema: Schema<ICommissionRule> = new Schema({
  ruleId:            { type: String, required: true, unique: true, index: true },
  type:              { type: String, enum: ['percentage', 'fixed', 'vendor_specific', 'category_specific'], required: true },
  name:              { type: String, required: true },
  rate:              { type: Number, required: true },
  targetVendorEmail: { type: String },
  targetCategory:    { type: String },
  isActive:          { type: Boolean, default: true },
  createdAt:         { type: Date, default: Date.now },
});

export const CommissionRule: Model<ICommissionRule> =
  mongoose.models.CommissionRule || mongoose.model<ICommissionRule>('CommissionRule', CommissionRuleSchema);
