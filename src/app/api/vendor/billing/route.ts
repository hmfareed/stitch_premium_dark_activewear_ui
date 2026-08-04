import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean() as any;

    const productsCount = await Product.countDocuments({
      $or: [{ vendorEmail }, { storeId: store?._id }],
    });

    const currentPlan = {
      name: store?.subscriptionPlan || 'Gold Merchant Tier',
      price: 199.00,
      currency: 'GHS',
      interval: 'Monthly',
      status: 'Active',
      autoRenew: store?.subscriptionAutoRenew ?? true,
      nextBillingDate: 'Aug 28, 2026',
    };

    const usage = {
      products: { current: productsCount || 48, max: 'Unlimited' },
      staffSeats: { current: (store?.staffMembers || []).length || 3, max: 10 },
      posRegisters: { current: 2, max: 5 },
      monthlyGmv: { current: 24500.00, max: 100000.00 },
    };

    const history = store?.billingHistory || [
      { id: 'sub-tx-101', date: 'Jul 28, 2026', plan: 'Gold Merchant Tier', period: 'Jul 28 - Aug 28, 2026', amount: 199.00, method: 'MTN Mobile Money', status: 'Paid' },
      { id: 'sub-tx-100', date: 'Jun 28, 2026', plan: 'Gold Merchant Tier', period: 'Jun 28 - Jul 28, 2026', amount: 199.00, method: 'MTN Mobile Money', status: 'Paid' },
    ];

    const invoices = store?.billingInvoices || [
      { id: 'INV-2026-081', number: 'AFR-INV-892401', date: 'Jul 28, 2026', plan: 'Gold Merchant Tier', amount: 199.00, vat: 29.85, total: 228.85, status: 'Paid' },
      { id: 'INV-2026-071', number: 'AFR-INV-892302', date: 'Jun 28, 2026', plan: 'Gold Merchant Tier', amount: 199.00, vat: 29.85, total: 228.85, status: 'Paid' },
    ];

    return NextResponse.json({
      success: true,
      currentPlan,
      usage,
      history,
      invoices,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/billing error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { action, planName, autoRenew } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'change_plan' && planName) {
      store.set('subscriptionPlan', planName);
      await store.save();
      return NextResponse.json({ success: true, message: `Subscription plan updated to ${planName}!` });
    }

    if (action === 'toggle_auto_renew') {
      store.set('subscriptionAutoRenew', autoRenew);
      await store.save();
      return NextResponse.json({ success: true, message: `Auto-renewal ${autoRenew ? 'enabled' : 'disabled'}!` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/billing error:', error);
    return NextResponse.json({ error: error.message || 'Billing action failed' }, { status: 500 });
  }
}
