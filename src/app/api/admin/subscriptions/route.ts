import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SubscriptionPlan, ensureDefaultPlans } from '@/models/SubscriptionPlan';
import { VendorSubscription } from '@/models/VendorSubscription';
import { VendorProfile } from '@/models/VendorProfile';
import { Coupon } from '@/models/Coupon';

export async function GET() {
  try {
    await connectToDatabase();
    await ensureDefaultPlans();

    const [plans, subscriptions, coupons] = await Promise.all([
      SubscriptionPlan.find({}).sort({ annualPrice: 1 }).lean(),
      VendorSubscription.find({}).sort({ createdAt: -1 }).lean(),
      Coupon.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      plans,
      subscriptions: subscriptions.map(s => ({
        id: s._id.toString(),
        vendorEmail: s.vendorEmail,
        planTier: s.planTier,
        planName: s.planName,
        status: s.status,
        autoRenew: !!s.autoRenew,
        startDate: s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A',
        endDate: s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A',
        amountPaid: s.amountPaid || 0,
      })),
      coupons: coupons.map(c => ({
        id: c._id.toString(),
        code: c.code,
        discountPercent: c.discountPercent,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        expiryDate: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'No expiry',
        isActive: c.isActive !== false,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching admin subscriptions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // Action 1: Update existing plan
    if (action === 'update_plan') {
      const { tier, monthlyPrice, annualPrice, maxProducts, maxStaff } = body;
      const updatedPlan = await SubscriptionPlan.findOneAndUpdate(
        { tier },
        {
          monthlyPrice: Number(monthlyPrice),
          annualPrice: Number(annualPrice),
          price: Number(annualPrice),
          maxProducts: maxProducts === 'unlimited' || maxProducts === null || maxProducts === '' ? null : Number(maxProducts),
          maxStaff: maxStaff === 'unlimited' || maxStaff === null || maxStaff === '' ? null : Number(maxStaff),
        },
        { new: true }
      );
      return NextResponse.json({ success: true, message: `Plan ${tier.toUpperCase()} updated!`, plan: updatedPlan });
    }

    // Action 2: Create new plan
    if (action === 'create_plan') {
      const { name, tier, monthlyPrice, annualPrice, maxProducts, maxStaff } = body;
      if (!name || !tier) {
        return NextResponse.json({ success: false, message: 'Plan name and tier key are required' }, { status: 400 });
      }

      const newPlan = await SubscriptionPlan.create({
        name,
        tier: tier.toLowerCase().replace(/\s+/g, '_'),
        monthlyPrice: parseFloat(monthlyPrice || 0),
        annualPrice: parseFloat(annualPrice || 0),
        price: parseFloat(annualPrice || 0),
        maxProducts: maxProducts ? parseInt(maxProducts, 10) : null,
        maxStaff: maxStaff ? parseInt(maxStaff, 10) : null,
        isActive: true,
      });

      return NextResponse.json({ success: true, message: `Subscription plan "${name}" created!`, plan: newPlan });
    }

    // Action 3: Create discount coupon
    if (action === 'create_coupon') {
      const { code, discountPercent, maxUses } = body;
      if (!code || !discountPercent) {
        return NextResponse.json({ success: false, message: 'Coupon code and discount % are required' }, { status: 400 });
      }

      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        discountPercent: parseFloat(discountPercent),
        maxUses: parseInt(maxUses || 100, 10),
        usedCount: 0,
        isActive: true,
      });

      return NextResponse.json({ success: true, message: `Coupon code "${coupon.code}" created!`, coupon });
    }

    // Action 4: Override / assign vendor subscription
    if (action === 'override_vendor') {
      const { vendorEmail, planTier, extendDays = 365 } = body;
      if (!vendorEmail) {
        return NextResponse.json({ success: false, message: 'vendorEmail is required' }, { status: 400 });
      }

      const plan = await SubscriptionPlan.findOne({ tier: planTier });
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);

      const sub = await VendorSubscription.findOneAndUpdate(
        { vendorEmail: vendorEmail.toLowerCase() },
        {
          vendorEmail: vendorEmail.toLowerCase(),
          planTier,
          planName: plan?.name || planTier.toUpperCase(),
          status: 'active',
          startDate,
          endDate,
          paymentReference: `MANUAL-ADMIN-ASSIGN-${Date.now()}`,
          amountPaid: plan?.monthlyPrice || 0,
          currency: 'GHS',
          autoRenew: true,
        },
        { upsert: true, new: true }
      );

      await VendorProfile.findOneAndUpdate(
        { vendorEmail: vendorEmail.toLowerCase() },
        { subscriptionTier: planTier }
      );

      return NextResponse.json({ success: true, message: `Assigned ${planTier.toUpperCase()} plan to ${vendorEmail}!`, subscription: sub });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/subscriptions:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
