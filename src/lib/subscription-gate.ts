import connectToDatabase from '@/lib/mongodb';
import { VendorProfile } from '@/models/VendorProfile';

export interface TierLimits {
  activeListingsLimit: number | null; // null or -1 = unlimited
  staffSeatsLimit: number | null;
  imagesPerListingLimit: number | null;
  hasVideoListings: boolean;
  hasBulkUpload: boolean;
  hasCustomStorefront: boolean;
  searchPriority: 'standard' | 'boost' | 'top';
  commissionRate: number; // percentage, e.g. 0
}

export const TIER_DEFINITIONS: Record<string, TierLimits> = {
  trial: {
    activeListingsLimit: 50,
    staffSeatsLimit: 1,
    imagesPerListingLimit: 3,
    hasVideoListings: false,
    hasBulkUpload: false,
    hasCustomStorefront: false,
    searchPriority: 'standard',
    commissionRate: 0,
  },
  basic: {
    activeListingsLimit: 50,
    staffSeatsLimit: 1,
    imagesPerListingLimit: 3,
    hasVideoListings: false,
    hasBulkUpload: false,
    hasCustomStorefront: false,
    searchPriority: 'standard',
    commissionRate: 0,
  },
  plus: {
    activeListingsLimit: 200,
    staffSeatsLimit: 4,
    imagesPerListingLimit: 6,
    hasVideoListings: true,
    hasBulkUpload: true,
    hasCustomStorefront: true,
    searchPriority: 'boost',
    commissionRate: 0,
  },
  pro: {
    activeListingsLimit: null, // Unlimited
    staffSeatsLimit: null,
    imagesPerListingLimit: null,
    hasVideoListings: true,
    hasBulkUpload: true,
    hasCustomStorefront: true,
    searchPriority: 'top',
    commissionRate: 0,
  },
};

export async function getVendorTier(vendorEmail: string): Promise<string> {
  await connectToDatabase();
  const profile = await VendorProfile.findOne({ email: vendorEmail });
  if (!profile) return 'basic';
  return profile.subscriptionTier || 'trial';
}

export async function getVendorLimits(vendorEmail: string): Promise<TierLimits> {
  const tier = await getVendorTier(vendorEmail);
  return TIER_DEFINITIONS[tier] || TIER_DEFINITIONS.basic;
}

export function isLimitReached(currentCount: number, limit: number | null): boolean {
  if (limit === null || limit < 0) return false; // null or -1 = unlimited
  return currentCount >= limit;
}
