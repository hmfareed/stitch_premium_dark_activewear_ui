import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { VendorSubscription } from '@/models/VendorSubscription';
import { SubscriptionPlan, ensureDefaultPlans } from '@/models/SubscriptionPlan';

// GET current vendor subscription + available plans
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultPlans();

    const { searchParams } = new URL(req.url);
    const vendorEmail = searchParams.get('vendorEmail');

    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });

    let currentSubscription = null;
    if (vendorEmail) {
      currentSubscription = await VendorSubscription.findOne({
        vendorEmail: vendorEmail.toLowerCase(),
        status: { $in: ['active', 'grace'] },
      }).sort({ endDate: -1 });
    }

    return NextResponse.json({ success: true, plans, currentSubscription });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST select/upgrade/renew plan
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureDefaultPlans();

    const body = await req.json();
    const { vendorEmail, vendorId, storeId, planTier, paymentReference, paymentMethod } = body;

    if (!vendorEmail || !planTier) {
      return NextResponse.json({ success: false, error: 'Vendor email and plan tier are required' }, { status: 400 });
    }

    const plan = await SubscriptionPlan.findOne({ tier: planTier, isActive: true });
    if (!plan) {
      return NextResponse.json({ success: false, error: `Plan tier "${planTier}" not found` }, { status: 404 });
    }

    // For paid tiers, payment reference is required
    if (plan.price > 0 && !paymentReference) {
      return NextResponse.json({ success: false, error: 'Payment reference is required for paid plans' }, { status: 400 });
    }

    // Check for existing active subscription
    const existing = await VendorSubscription.findOne({
      vendorEmail: vendorEmail.toLowerCase(),
      status: { $in: ['active', 'grace'] },
    });

    const now = new Date();
    const durationDays = planTier === 'trial' ? plan.trialDurationDays : 365;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const gracePeriodEndDate = new Date(endDate.getTime() + plan.gracePeriodDays * 24 * 60 * 60 * 1000);

    if (existing) {
      // Upgrade: immediate per spec §7.4 — reset endDate to 365 days out
      const isUpgrade = ['trial', 'basic', 'plus', 'pro'].indexOf(planTier) >
        ['trial', 'basic', 'plus', 'pro'].indexOf(existing.planTier);

      if (isUpgrade) {
        existing.previousTier = existing.planTier;
        existing.planTier = planTier;
        existing.planName = plan.name;
        existing.startDate = now;
        existing.endDate = endDate;
        existing.gracePeriodEndDate = gracePeriodEndDate;
        existing.upgradeDate = now;
        existing.paymentReference = paymentReference;
        existing.paymentMethod = paymentMethod;
        existing.amountPaid = plan.price;
        existing.status = 'active';
        existing.downgradeScheduledTier = undefined;
        await existing.save();
        return NextResponse.json({ success: true, message: `Upgraded to ${plan.name}!`, subscription: existing });
      } else {
        // Downgrade: takes effect at next renewal per spec §7.4
        existing.downgradeScheduledTier = planTier;
        await existing.save();
        return NextResponse.json({ success: true, message: `Downgrade to ${plan.name} scheduled at next renewal.`, subscription: existing });
      }
    }

    // New subscription
    const subscription = await VendorSubscription.create({
      vendorId: vendorId || undefined,
      vendorEmail: vendorEmail.toLowerCase(),
      storeId: storeId || undefined,
      planTier,
      planName: plan.name,
      status: 'active',
      startDate: now,
      endDate,
      gracePeriodEndDate,
      paymentReference: paymentReference || `TRIAL-${Date.now()}`,
      paymentMethod: paymentMethod || undefined,
      amountPaid: plan.price,
    });

    return NextResponse.json({ success: true, subscription });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
