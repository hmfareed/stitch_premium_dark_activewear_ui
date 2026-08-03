import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Admin-configurable subscription plan definitions per spec Phase 9.
 * Store "unlimited" as null — gating logic skips the check when it sees null.
 *
 * Pricing per user confirmation:
 *   Monthly — Basic: 11 GHS | Plus: 18 GHS | Pro: 25 GHS
 *   Annual  — Basic: 100 GHS | Plus: 160 GHS | Pro: 220 GHS
 *   Trial   — Free (30 days)
 * Commission: 0% across all tiers (growth-phase decision per Phase 9.1)
 */
export interface ISubscriptionPlan extends Document {
  tier: 'trial' | 'basic' | 'plus' | 'pro';
  name: string;
  /** Monthly price in GHS (0 for trial) */
  monthlyPrice: number;
  /** Annual price in GHS (0 for trial) */
  annualPrice: number;
  /** @deprecated use monthlyPrice / annualPrice */
  price: number;
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
  commissionRate: number; // currently 0% per spec Phase 9.1
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema: Schema<ISubscriptionPlan> = new Schema({
  tier:         { type: String, enum: ['trial', 'basic', 'plus', 'pro'], required: true, unique: true },
  name:         { type: String, required: true },
  monthlyPrice: { type: Number, required: true, default: 0 },
  annualPrice:  { type: Number, required: true, default: 0 },
  price:        { type: Number, default: 0 }, // kept for backward compat
  currency:     { type: String, default: 'GHS' },
  maxProducts:          { type: Number, default: null },
  maxStaff:             { type: Number, default: null },
  maxImagesPerProduct:  { type: Number, default: null },
  maxDiscounts:         { type: Number, default: null },
  features: {
    videoOnListings:         { type: Boolean, default: false },
    bulkUpload:              { type: Boolean, default: false },
    storefrontCustomization: { type: String, enum: ['none', 'basic', 'full'], default: 'none' },
    searchBoost:             { type: String, enum: ['standard', 'slight', 'top_priority'], default: 'standard' },
    homepagePromotion:       { type: String, enum: ['none', 'occasional', 'guaranteed'], default: 'none' },
    verifiedBadge:           { type: Boolean, default: false },
    analyticsDepth:          { type: String, enum: ['basic', 'trends', 'full'], default: 'basic' },
    multiStore:              { type: Boolean, default: false },
    payoutSpeed:             { type: String, enum: ['standard', 'priority'], default: 'standard' },
    supportPriority:         { type: String, enum: ['standard', 'priority'], default: 'standard' },
    consignmentAccess:       { type: Boolean, default: false },
    earlyFeatureAccess:      { type: Boolean, default: false },
  },
  trialDurationDays: { type: Number, default: 30 },
  gracePeriodDays:   { type: Number, default: 3 },
  commissionRate:    { type: Number, default: 0 },
  isActive:          { type: Boolean, default: true },
}, { timestamps: true });

/**
 * Seed default subscription plans matching Phase 9.3 tier benefits table.
 * Updates existing records if pricing has changed (idempotent).
 */
export async function ensureDefaultPlans() {
  const Plan = mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);

  const plans = [
    {
      tier: 'trial' as const,
      name: 'Free Trial',
      monthlyPrice: 0,
      annualPrice: 0,
      price: 0,
      maxProducts: 50,
      maxStaff: 1,
      maxImagesPerProduct: 3,
      maxDiscounts: 0,
      features: {
        videoOnListings: false, bulkUpload: false, storefrontCustomization: 'none' as const,
        searchBoost: 'standard' as const, homepagePromotion: 'none' as const, verifiedBadge: false,
        analyticsDepth: 'basic' as const, multiStore: false, payoutSpeed: 'standard' as const,
        supportPriority: 'standard' as const, consignmentAccess: false, earlyFeatureAccess: false,
      },
      trialDurationDays: 30, gracePeriodDays: 3, commissionRate: 0,
    },
    {
      tier: 'basic' as const,
      name: 'Basic',
      monthlyPrice: 11,
      annualPrice: 100,
      price: 100,
      maxProducts: 50,
      maxStaff: 1,
      maxImagesPerProduct: 3,
      maxDiscounts: 1,
      features: {
        videoOnListings: false, bulkUpload: false, storefrontCustomization: 'none' as const,
        searchBoost: 'standard' as const, homepagePromotion: 'none' as const, verifiedBadge: false,
        analyticsDepth: 'basic' as const, multiStore: false, payoutSpeed: 'standard' as const,
        supportPriority: 'standard' as const, consignmentAccess: false, earlyFeatureAccess: false,
      },
      trialDurationDays: 0, gracePeriodDays: 7, commissionRate: 0,
    },
    {
      tier: 'plus' as const,
      name: 'Plus',
      monthlyPrice: 18,
      annualPrice: 160,
      price: 160,
      maxProducts: 200,
      maxStaff: 4,
      maxImagesPerProduct: 6,
      maxDiscounts: 5,
      features: {
        videoOnListings: true, bulkUpload: true, storefrontCustomization: 'basic' as const,
        searchBoost: 'slight' as const, homepagePromotion: 'occasional' as const, verifiedBadge: false,
        analyticsDepth: 'trends' as const, multiStore: false, payoutSpeed: 'standard' as const,
        supportPriority: 'standard' as const, consignmentAccess: true, earlyFeatureAccess: false,
      },
      trialDurationDays: 0, gracePeriodDays: 7, commissionRate: 0,
    },
    {
      tier: 'pro' as const,
      name: 'Pro',
      monthlyPrice: 25,
      annualPrice: 220,
      price: 220,
      maxProducts: null,
      maxStaff: null,
      maxImagesPerProduct: null,
      maxDiscounts: null,
      features: {
        videoOnListings: true, bulkUpload: true, storefrontCustomization: 'full' as const,
        searchBoost: 'top_priority' as const, homepagePromotion: 'guaranteed' as const, verifiedBadge: true,
        analyticsDepth: 'full' as const, multiStore: true, payoutSpeed: 'priority' as const,
        supportPriority: 'priority' as const, consignmentAccess: true, earlyFeatureAccess: true,
      },
      trialDurationDays: 0, gracePeriodDays: 7, commissionRate: 0,
    },
  ];

  for (const plan of plans) {
    await Plan.findOneAndUpdate(
      { tier: plan.tier },
      { $set: plan },
      { upsert: true, new: true }
    );
  }
}

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan || mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
