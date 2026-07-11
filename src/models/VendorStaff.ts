import mongoose, { Schema, Document, Model } from 'mongoose';

export type StaffPermission =
  | 'manage_products'
  | 'manage_orders'
  | 'view_analytics'
  | 'manage_promotions'
  | 'respond_reviews';

export interface IVendorStaff extends Document {
  ownerEmail: string;
  staffEmail: string;
  staffName?: string;
  role: 'manager';
  permissions: StaffPermission[];
  status: 'pending' | 'active' | 'revoked';
  invitedAt: Date;
  acceptedAt?: Date;
}

const VendorStaffSchema: Schema<IVendorStaff> = new Schema({
  ownerEmail:  { type: String, required: true, index: true },
  staffEmail:  { type: String, required: true },
  staffName:   { type: String },
  role:        { type: String, enum: ['manager'], default: 'manager' },
  permissions: { type: [String], default: ['manage_products', 'manage_orders'] },
  status:      { type: String, enum: ['pending', 'active', 'revoked'], default: 'pending' },
  invitedAt:   { type: Date, default: Date.now },
  acceptedAt:  { type: Date },
});

VendorStaffSchema.index({ ownerEmail: 1, staffEmail: 1 }, { unique: true });

export const VendorStaff: Model<IVendorStaff> =
  mongoose.models.VendorStaff || mongoose.model<IVendorStaff>('VendorStaff', VendorStaffSchema);
