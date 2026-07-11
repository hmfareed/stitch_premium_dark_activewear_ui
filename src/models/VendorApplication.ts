import mongoose, { Schema, Document, Model } from 'mongoose';

export type BusinessType = 'sole_trader' | 'registered_business' | 'informal';
export type TrustTier    = 'unverified' | 'verified' | 'featured';
export type PayoutMethod = 'momo' | 'bank';

export interface IVendorApplication extends Document {
  // Step 1 — Personal
  name: string;
  email: string;
  phone: string;
  role: string;

  // Step 2 — Business Type
  businessType?: BusinessType;
  businessRegNumber?: string; // Registrar-General's Dept. reg. number

  // Step 3 — Store Branding
  storeName?: string;
  storeHandle?: string;         // URL-safe slug e.g. "premium-sports-gear"
  storeLogo?: string;           // base64 / cloudinary URL
  storeBanner?: string;         // base64 / cloudinary URL
  storeBio?: string;
  storeCategories?: string[];
  returnPolicy?: string;

  // Step 4 — ID Verification
  documentUrl?: string;         // Ghana Card or business certificate
  proofOfAddress?: string;      // utility bill / bank statement

  // Step 5 — Payout
  payoutMethod?: PayoutMethod;
  payoutDetails?: {
    momoNumber?: string;
    momoNetwork?: string;       // MTN | TELECEL | AIRTELTIGO
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    branchCode?: string;
  };

  // Admin fields
  reason?: string;              // "Why should your store be approved?"
  status: 'pending' | 'approved' | 'rejected';
  trustTier?: TrustTier;
  rejectionReason?: string;
  commissionRate?: number;      // override from platform default
  appliedAt: Date;
  reviewedAt?: Date;
}

const VendorApplicationSchema: Schema<IVendorApplication> = new Schema({
  name:             { type: String, required: true },
  email:            { type: String, required: true },
  phone:            { type: String, required: true },
  role:             { type: String, required: true },

  businessType:     { type: String, enum: ['sole_trader', 'registered_business', 'informal'] },
  businessRegNumber:{ type: String },

  storeName:        { type: String },
  storeHandle:      { type: String },
  storeLogo:        { type: String },
  storeBanner:      { type: String },
  storeBio:         { type: String },
  storeCategories:  [{ type: String }],
  returnPolicy:     { type: String },

  documentUrl:      { type: String },
  proofOfAddress:   { type: String },

  payoutMethod:     { type: String, enum: ['momo', 'bank'] },
  payoutDetails:    { type: Schema.Types.Mixed },

  reason:           { type: String },
  status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  trustTier:        { type: String, enum: ['unverified', 'verified', 'featured'], default: 'unverified' },
  rejectionReason:  { type: String },
  commissionRate:   { type: Number },
  appliedAt:        { type: Date, default: Date.now },
  reviewedAt:       { type: Date },
});

export const VendorApplication: Model<IVendorApplication> =
  mongoose.models.VendorApplication ||
  mongoose.model<IVendorApplication>('VendorApplication', VendorApplicationSchema);
