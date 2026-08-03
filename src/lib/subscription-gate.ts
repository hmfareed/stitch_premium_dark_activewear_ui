/**
 * Subscription cap enforcement (Phase 9.8 step 4).
 *
 * Called before product creation or staff invite to verify the vendor hasn't
 * exceeded their plan's limits. Uses null to mean "unlimited" per spec:
 *   "store limits as null/-1 = unlimited on the SubscriptionPlan record
 *    and have the gating logic skip the check when it sees that value"
 */

import connectToDatabase from './mongodb';
import { VendorSubscription } from '@/models/VendorSubscription';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { Product } from '@/models/Product';
import { VendorStaff } from '@/models/VendorStaff';

export type GateResult =
  | { allowed: true }
  | { allowed: false; reason: string; tier: string; limit: number | null; current: number };

/**
 * Returns the active VendorSubscription + its SubscriptionPlan for a vendor.
 * Returns null if the vendor has no active subscription.
 */
async function getActivePlan(vendorEmail: string) {
  await connectToDatabase();

  const sub = await VendorSubscription.findOne({
    vendorEmail: vendorEmail.toLowerCase(),
    status: { $in: ['active', 'grace'] }, // grace period: store still live
  }).sort({ startDate: -1 });

  if (!sub) return null;

  const plan = await SubscriptionPlan.findOne({ tier: sub.planTier });
  return { sub, plan };
}

/**
 * Checks whether a vendor can add another active product listing.
 *
 * @param vendorEmail The vendor's email (used to look up subscription)
 * @param storeId     The vendor's store _id (used to count current listings)
 */
export async function checkProductCap(
  vendorEmail: string,
  storeId?: string
): Promise<GateResult> {
  const record = await getActivePlan(vendorEmail);

  if (!record) {
    return {
      allowed: false,
      reason: 'No active subscription found. Please subscribe to a plan to list products.',
      tier: 'none',
      limit: 0,
      current: 0,
    };
  }

  const { plan } = record;

  // null = unlimited (Pro tier)
  if (!plan || plan.maxProducts === null || plan.maxProducts === undefined) {
    return { allowed: true };
  }

  // Count active products for this vendor
  const query: Record<string, any> = { vendorEmail: vendorEmail.toLowerCase() };
  if (storeId) query.storeId = storeId;
  const currentCount = await Product.countDocuments(query);

  if (currentCount >= plan.maxProducts) {
    return {
      allowed: false,
      reason: `Your ${plan.name} plan allows up to ${plan.maxProducts} active product listings. You currently have ${currentCount}. Upgrade to add more products.`,
      tier: plan.tier,
      limit: plan.maxProducts,
      current: currentCount,
    };
  }

  return { allowed: true };
}

/**
 * Checks whether a vendor can add another staff member.
 *
 * @param ownerEmail The vendor owner's email
 */
export async function checkStaffCap(ownerEmail: string): Promise<GateResult> {
  const record = await getActivePlan(ownerEmail);

  if (!record) {
    return {
      allowed: false,
      reason: 'No active subscription found. Please subscribe to a plan to invite staff.',
      tier: 'none',
      limit: 0,
      current: 0,
    };
  }

  const { plan } = record;

  // null = unlimited (Pro tier)
  if (!plan || plan.maxStaff === null || plan.maxStaff === undefined) {
    return { allowed: true };
  }

  const currentCount = await VendorStaff.countDocuments({
    ownerEmail: ownerEmail.toLowerCase(),
    status: { $nin: ['revoked'] },
  });

  if (currentCount >= plan.maxStaff) {
    return {
      allowed: false,
      reason: `Your ${plan.name} plan allows up to ${plan.maxStaff} staff seat${plan.maxStaff === 1 ? '' : 's'}. You currently have ${currentCount}. Upgrade to invite more staff.`,
      tier: plan.tier,
      limit: plan.maxStaff,
      current: currentCount,
    };
  }

  return { allowed: true };
}
