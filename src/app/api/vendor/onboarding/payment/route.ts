import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionPlan, billingCycle, momoNetwork, momoNumber, momoName, bankName, accountNumber, accountName } = body;

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail });

    if (!store) {
      return NextResponse.json({ error: 'Store document not found' }, { status: 404 });
    }

    if (subscriptionPlan) store.subscriptionPlan = subscriptionPlan;
    if (billingCycle) store.billingCycle = billingCycle;
    
    // Save Payout Details
    if (momoNetwork || momoNumber) {
      store.momoPayout = {
        network: momoNetwork || 'MTN',
        phone: momoNumber || session.user.phone,
        name: momoName || store.name,
      };
    }

    if (bankName || accountNumber) {
      store.bankPayout = {
        bankName: bankName || 'GCB Bank',
        accountNumber: accountNumber || '',
        accountName: accountName || store.name,
      };
    }

    store.status = 'active';
    await store.save();

    return NextResponse.json({
      success: true,
      store,
      message: 'Payment & Subscription details saved successfully!',
    });
  } catch (error: any) {
    console.error('POST /api/vendor/onboarding/payment error:', error);
    return NextResponse.json({ error: error.message || 'Payment setup failed' }, { status: 500 });
  }
}
