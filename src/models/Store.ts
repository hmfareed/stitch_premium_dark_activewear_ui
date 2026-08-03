import mongoose, { Schema, Document, Model } from 'mongoose';

export type StoreStatus = 'setup' | 'payment_pending' | 'under_review' | 'active' | 'suspended';
export type PaystackSubaccountStatus = 'none' | 'pending' | 'active' | 'failed';
export type VerificationTier = 'baseline' | 'verified';
export type BusinessType = 'individual' | 'registered_business';
export type PayoutMethod = 'momo' | 'bank';

export interface IPickupAddress {
  street: string;
  city: string;
  region: string;
  country: string;
}

export interface IPayoutDetails {
  method: PayoutMethod;
  momoNumber?: string;
  momoNetwork?: string; // MTN | TELECEL | AIRTELTIGO
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  branchCode?: string;
}

export interface IStore extends Document {
  vendorId: mongoose.Types.ObjectId;
  vendorEmail: string;

  // Store identity
  name: string;
  slug: string; // URL-safe unique handle e.g. "kente-village"
  category: string;
  businessType: BusinessType;
  businessRegNumber?: string;

  // Contact & logistics
  contactPhone?: string;
  contactEmail?: string;
  pickupAddress?: IPickupAddress;

  // Paystack payout
  payoutDetails?: IPayoutDetails;
  paystackSubaccountCode?: string;
  paystackSubaccountStatus: PaystackSubaccountStatus;

  // Verification
  verificationTier: VerificationTier;
  phoneVerified: boolean;
  contentReviewed: boolean;

  // Status machine
  status: StoreStatus;
  rejectionReason?: string;

  // Store Status — Pause / Vacation Mode (Spec §1.4)
  isPaused: boolean;
  pauseReason?: string;
  expectedReturnDate?: Date;

  // Branding
  storeLogo?: string;
  storeBanner?: string;
  storeBio?: string;
  returnPolicy?: string;

  // Storefront Builder (Spec §8.0a)
  templateId?: string;
  themeAccentColor?: string;
  aboutText?: string;
  featuredProductIds?: string[];
  storefrontDraft?: Record<string, any>; // staged preview before publish

  /** Vendor store coordinates — required for vendor_direct_pickup delivery fee calc (Phase 11) */
  latitude?: number;
  longitude?: number;

  createdAt: Date;
  goLiveAt?: Date;
}

const PickupAddressSchema = new Schema({
  street:  { type: String, default: '' },
  city:    { type: String, default: '' },
  region:  { type: String, default: '' },
  country: { type: String, default: 'Ghana' },
}, { _id: false });

const PayoutDetailsSchema = new Schema({
  method:        { type: String, enum: ['momo', 'bank'] },
  momoNumber:    { type: String },
  momoNetwork:   { type: String },
  bankName:      { type: String },
  accountNumber: { type: String },
  accountName:   { type: String },
  branchCode:    { type: String },
}, { _id: false });

const StoreSchema: Schema<IStore> = new Schema({
  vendorId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  vendorEmail: { type: String, required: true, lowercase: true },

  name:               { type: String, required: true, trim: true },
  slug:               { type: String, required: true, unique: true, lowercase: true, trim: true },
  category:           { type: String, required: true },
  businessType:       { type: String, enum: ['individual', 'registered_business'], required: true },
  businessRegNumber:  { type: String },

  contactPhone:  { type: String },
  contactEmail:  { type: String },
  pickupAddress: { type: PickupAddressSchema },

  payoutDetails:             { type: PayoutDetailsSchema },
  paystackSubaccountCode:    { type: String },
  paystackSubaccountStatus:  { type: String, enum: ['none', 'pending', 'active', 'failed'], default: 'none' },

  verificationTier: { type: String, enum: ['baseline', 'verified'], default: 'baseline' },
  phoneVerified:    { type: Boolean, default: false },
  contentReviewed:  { type: Boolean, default: false },

  status:          { type: String, enum: ['setup', 'payment_pending', 'under_review', 'active', 'suspended'], default: 'setup' },
  rejectionReason: { type: String },

  // Store Pause / Vacation Mode (Spec §1.4)
  isPaused:           { type: Boolean, default: false },
  pauseReason:        { type: String },
  expectedReturnDate: { type: Date },

  storeLogo:    { type: String },
  storeBanner:  { type: String },
  storeBio:     { type: String },
  returnPolicy: { type: String },

  // Storefront Builder (Spec §8.0a)
  templateId:         { type: String, default: 'classic_grid' },
  themeAccentColor:   { type: String, default: '#2563EB' },
  aboutText:          { type: String, maxlength: 300 },
  featuredProductIds: { type: [String], default: [] },
  storefrontDraft:    { type: Schema.Types.Mixed, default: null },

  latitude:  { type: Number },
  longitude: { type: Number },

  createdAt: { type: Date, default: Date.now },
  goLiveAt:  { type: Date },
});

StoreSchema.index({ vendorEmail: 1 });
StoreSchema.index({ status: 1 });
StoreSchema.index({ slug: 1 });

export const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema);
