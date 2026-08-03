import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { VendorSubscription } from '@/models/VendorSubscription';
import { SubscriptionPlan, ensureDefaultPlans } from '@/models/SubscriptionPlan';
import { Store } from '@/models/Store';

/**
 * POST /api/vendor/billing/select-plan
 *
 * Step 1 of Phase 9.4: Vendor selects a plan tier and billing cycle.
 * Returns a Paystack payment initialization URL for the annual/monthly charge.
 * The vendor's subscription is NOT updated here — it's updated by the webhook
 * on confirmed payment (Phase 9.4 step 4).
 *
 * Body: { vendorEmail, planTier, billingCycle }
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const { vendorEmail, planTier, billingCycle = 'annual' } = await req.json();

    if (!vendorEmail || !planTier) {
      return NextResponse.json(
        { error: 'vendorEmail and planTier are required' },
        { status: 400 }
      );
    }

    const plan = await SubscriptionPlan.findOne({ tier: planTier, isActive: true });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });
    }

    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    if (price === 0) {
      return NextResponse.json({ error: 'Cannot charge for a free plan via this endpoint' }, { status: 400 });
    }

    // Build a unique reference for this subscription payment
    const reference = `SUB-${vendorEmail.replace(/[@.]/g, '-')}-${planTier}-${billingCycle}-${Date.now()}`;

    // Initialize Paystack transaction
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Paystack is not configured' }, { status: 500 });
    }

    const paystackBody = {
      email: vendorEmail,
      amount: Math.round(price * 100), // GHS → pesewas
      currency: 'GHS',
      reference,
      callback_url: `${req.nextUrl.origin}/vendor/billing?payment=complete`,
      metadata: {
        type: 'vendor_subscription',
        planTier,
        billingCycle,
        vendorEmail,
        planName: plan.name,
        price,
        custom_fields: [
          { display_name: 'Plan', variable_name: 'plan', value: `${plan.name} (${billingCycle})` },
          { display_name: 'Vendor', variable_name: 'vendor_email', value: vendorEmail },
        ],
      },
    };

    const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackBody),
    });

    const psData = await psRes.json();

    if (!psData.status) {
      return NextResponse.json({ error: psData.message || 'Paystack initialization failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      authorization_url: psData.data.authorization_url,
      access_code: psData.data.access_code,
      reference: psData.data.reference,
      plan: {
        tier: plan.tier,
        name: plan.name,
        price,
        billingCycle,
        currency: plan.currency,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/vendor/billing/select-plan]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/vendor/billing/select-plan?vendorEmail=xxx
 * Returns current subscription status + available plans for the billing UI.
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const vendorEmail = searchParams.get('vendorEmail');

    // Ensure default plans exist in DB
    await ensureDefaultPlans();

    if (!vendorEmail) {
      return NextResponse.json({ error: 'vendorEmail is required' }, { status: 400 });
    }

    const [currentSub, allPlans] = await Promise.all([
      VendorSubscription.findOne({
        vendorEmail: vendorEmail.toLowerCase(),
        status: { $in: ['active', 'grace'] },
      }).sort({ startDate: -1 }),
      SubscriptionPlan.find({ isActive: true }).sort({ annualPrice: 1 }),
    ]);

    // Days remaining on current subscription
    const daysRemaining = currentSub
      ? Math.max(0, Math.ceil((currentSub.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;

    return NextResponse.json({
      success: true,
      currentSubscription: currentSub
        ? {
            planTier: currentSub.planTier,
            planName: currentSub.planName,
            status: currentSub.status,
            startDate: currentSub.startDate,
            endDate: currentSub.endDate,
            daysRemaining,
            amountPaid: currentSub.amountPaid,
            billingCycle: currentSub.paymentMethod === 'card' ? 'annual' : 'annual', // default
          }
        : null,
      plans: allPlans.map(p => ({
        tier: p.tier,
        name: p.name,
        monthlyPrice: p.monthlyPrice,
        annualPrice: p.annualPrice,
        currency: p.currency,
        maxProducts: p.maxProducts,
        maxStaff: p.maxStaff,
        features: p.features,
      })),
    });
  } catch (error: any) {
    console.error('[GET /api/vendor/billing/select-plan]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
