import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Admin-configurable subscription plan definitions per spec §7.6.
 * Store "unlimited" as null and have gating logic skip the check.
 */
export interface ISubscriptionPlan extends Document {
  tier: 'trial' | 'basic' | 'plus' | 'pro';
  name: string;
  price: number; // annual price in GHS, 0 for trial
  currency: string;
  maxProducts: number | null; // null = unlimited
  maxStaff: number | null;
  maxImagesPerProduct: number | null;
  maxDiscounts: number | null;
  features: {
    videoOnListings: boolean;
    bulkUpload: boolean;
    storefrontCustomization: 'none' | 'basic' | 'full';
    searchBoost: 'standard' | 'slight' | 'top_priority';
    homepagePromotion: 'none' | 'occasional' | 'guaranteed';
    verifiedBadge: boolean;
    analyticsDepth: 'basic' | 'trends' | 'full';
    multiStore: boolean;
    payoutSpeed: 'standard' | 'priority';
    supportPriority: 'standard' | 'priority';
    consignmentAccess: boolean;
    earlyFeatureAccess: boolean;
  };
  trialDurationDays: number; // only relevant for trial tier
  gracePeriodDays: number;
  commissionRate: number; // currently 0% per spec §7.2
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema: Schema<ISubscriptionPlan> = new Schema({
  tier: { type: String, enum: ['trial', 'basic', 'plus', 'pro'], required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'GHS' },
  maxProducts: { type: Number, default: null },
  maxStaff: { type: Number, default: null },
  maxImagesPerProduct: { type: Number, default: null },
  maxDiscounts: { type: Number, default: null },
  features: {
    videoOnListings: { type: Boolean, default: false },
    bulkUpload: { type: Boolean, default: false },
    storefrontCustomization: { type: String, enum: ['none', 'basic', 'full'], default: 'none' },
    searchBoost: { type: String, enum: ['standard', 'slight', 'top_priority'], default: 'standard' },
    homepagePromotion: { type: String, enum: ['none', 'occasional', 'guaranteed'], default: 'none' },
    verifiedBadge: { type: Boolean, default: false },
    analyticsDepth: { type: String, enum: ['basic', 'trends', 'full'], default: 'basic' },
    multiStore: { type: Boolean, default: false },
    payoutSpeed: { type: String, enum: ['standard', 'priority'], default: 'standard' },
    supportPriority: { type: String, enum: ['standard', 'priority'], default: 'standard' },
    consignmentAccess: { type: Boolean, default: false },
    earlyFeatureAccess: { type: Boolean, default: false },
  },
  trialDurationDays: { type: Number, default: 30 },
  gracePeriodDays: { type: Number, default: 3 },
  commissionRate: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

/**
 * Seed default subscription plans matching spec §7.2 tier benefits table.
 */
export async function ensureDefaultPlans() {
  const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
  const count = await SubscriptionPlan.countDocuments();
  if (count > 0) return;

  await SubscriptionPlan.insertMany([
    {
      tier: 'trial', name: 'Free Trial', price: 0, maxProducts: 50, maxStaff: 1, maxImagesPerProduct: 3, maxDiscounts: 0,
      features: { videoOnListings: false, bulkUpload: false, storefrontCustomization: 'none', searchBoost: 'standard', homepagePromotion: 'none', verifiedBadge: false, analyticsDepth: 'basic', multiStore: false, payoutSpeed: 'standard', supportPriority: 'standard', consignmentAccess: false, earlyFeatureAccess: false },
      trialDurationDays: 30, gracePeriodDays: 3, commissionRate: 0,
    },
    {
      tier: 'basic', name: 'Basic', price: 199, maxProducts: 50, maxStaff: 1, maxImagesPerProduct: 3, maxDiscounts: 1,
      features: { videoOnListings: false, bulkUpload: false, storefrontCustomization: 'none', searchBoost: 'standard', homepagePromotion: 'none', verifiedBadge: false, analyticsDepth: 'basic', multiStore: false, payoutSpeed: 'standard', supportPriority: 'standard', consignmentAccess: false, earlyFeatureAccess: false },
      trialDurationDays: 0, gracePeriodDays: 7, commissionRate: 0,
    },
    {
      tier: 'plus', name: 'Plus', price: 499, maxProducts: 200, maxStaff: 4, maxImagesPerProduct: 6, maxDiscounts: 5,
      features: { videoOnListings: true, bulkUpload: true, storefrontCustomization: 'basic', searchBoost: 'slight', homepagePromotion: 'occasional', verifiedBadge: false, analyticsDepth: 'trends', multiStore: false, payoutSpeed: 'standard', supportPriority: 'standard', consignmentAccess: true, earlyFeatureAccess: false },
      trialDurationDays: 0, gracePeriodDays: 7, commissionRate: 0,
    },
    {
      tier: 'pro', name: 'Pro', price: 999, maxProducts: null, maxStaff: null, maxImagesPerProduct: null, maxDiscounts: null,
      features: { videoOnListings: true, bulkUpload: true, storefrontCustomization: 'full', searchBoost: 'top_priority', homepagePromotion: 'guaranteed', verifiedBadge: true, analyticsDepth: 'full', multiStore: true, payoutSpeed: 'priority', supportPriority: 'priority', consignmentAccess: true, earlyFeatureAccess: true },
      trialDurationDays: 0, gracePeriodDays: 7, commissionRate: 0,
    },
  ]);
}

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
