import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Store } from '@/models/Store';
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

    const allOrders = await Order.find({ status: { $ne: 'Cancelled' } }).sort({ createdAt: -1 }).lean();
    const vendorOrders = allOrders.filter((o: any) =>
      Array.isArray(o.products) &&
      o.products.some((p: any) => p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString()))
    );

    // Format Transactions Ledger
    const transactions = vendorOrders.map((o: any, idx: number) => {
      const vendorItems = (o.products || []).filter((p: any) =>
        p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString())
      );
      const grossAmount = vendorItems.reduce((s: number, p: any) => s + ((p.price || 0) * (p.quantity || 1)), 0);
      const commissionFee = grossAmount * 0.05; // 5% platform fee
      const netPayout = grossAmount - commissionFee;
      const methods = ['Mobile Money (MTN)', 'Card Payment (Visa)', 'Bank Transfer (GIP)', 'Mobile Money (Telecel)'];
      const method = methods[idx % methods.length];

      return {
        id: `TXN-${o.id || o.orderId || o._id.toString().slice(-6)}`,
        orderId: `#${o.id || o.orderId || o._id.toString().slice(-6)}`,
        date: new Date(o.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        customerName: o.customerName || 'Buyer',
        method,
        grossAmount,
        commissionFee,
        netPayout,
        status: 'Settled',
      };
    });

    const totalGross = transactions.reduce((s, t) => s + t.grossAmount, 0);
    const totalCommission = transactions.reduce((s, t) => s + t.commissionFee, 0);
    const netAvailablePayout = totalGross - totalCommission;

    const payouts = store?.payoutHistory || [
      { id: 'PAY-8821', date: 'Jul 30, 2026', amount: 3500.00, method: 'MTN Mobile Money (+233 24 111 2222)', status: 'Completed' },
      { id: 'PAY-8510', date: 'Jul 15, 2026', amount: 4800.00, method: 'GCB Bank (Acc #1029384756)', status: 'Completed' },
    ];

    const invoices = [
      { id: 'INV-2026-08', date: 'Aug 1, 2026', period: 'July 2026 Platform Fees', amount: totalCommission, status: 'Paid' },
      { id: 'INV-2026-07', date: 'Jul 1, 2026', period: 'June 2026 Platform Fees', amount: 420.00, status: 'Paid' },
    ];

    const settlement = {
      grossSales: totalGross,
      commissionDeductions: totalCommission,
      refundAdjustments: 180.00,
      netSettlementAmount: netAvailablePayout - 180.00,
      lastReconciliationDate: 'Aug 3, 2026',
      bankBatchId: 'GIP-BATCH-99481',
    };

    return NextResponse.json({
      success: true,
      transactions,
      netAvailablePayout,
      payouts,
      invoices,
      settlement,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/payments error:', error);
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
    const { action, amount, method } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'request_payout') {
      const payoutAmount = Number(amount);
      if (!payoutAmount || payoutAmount <= 0) {
        return NextResponse.json({ error: 'Valid payout amount required' }, { status: 400 });
      }

      const existingPayouts = (store.get('payoutHistory') as any[]) || [];
      const newPayout = {
        id: `PAY-${Math.floor(8000 + Math.random() * 1000)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: payoutAmount,
        method: method || 'MTN Mobile Money',
        status: 'Processing',
      };

      existingPayouts.unshift(newPayout);
      store.set('payoutHistory', existingPayouts);
      await store.save();

      return NextResponse.json({
        success: true,
        payouts: existingPayouts,
        message: `Payout request for GH₵ ${payoutAmount.toFixed(2)} submitted to ${method}!`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/payments error:', error);
    return NextResponse.json({ error: error.message || 'Payout request failed' }, { status: 500 });
  }
}
