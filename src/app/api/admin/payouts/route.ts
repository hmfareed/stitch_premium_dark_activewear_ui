import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Payout } from '@/models/Payout';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all'; // all | pending | approved | paid | rejected
    const q = searchParams.get('q') || '';

    const query: any = {};

    if (statusFilter !== 'all') {
      query.status = { $regex: `^${statusFilter}$`, $options: 'i' };
    }

    if (q) {
      query.$or = [
        { vendorEmail: { $regex: q, $options: 'i' } },
        { vendorName: { $regex: q, $options: 'i' } },
        { payoutRef: { $regex: q, $options: 'i' } },
        { accountDetails: { $regex: q, $options: 'i' } },
      ];
    }

    const payouts = await Payout.find(query).sort({ requestDate: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: payouts.length,
      payouts: payouts.map(p => ({
        id: p._id.toString(),
        payoutRef: p.payoutRef || `PAYOUT-${p._id.toString().slice(-6).toUpperCase()}`,
        vendorEmail: p.vendorEmail,
        vendorName: p.vendorName || 'AfriCart Store Partner',
        amount: p.amount,
        status: p.status || 'Pending',
        requestDate: p.requestDate ? new Date(p.requestDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
        processedDate: p.processedDate ? new Date(p.processedDate).toLocaleString() : 'N/A',
        paymentMethod: p.paymentMethod || 'MTN Mobile Money',
        accountDetails: p.accountDetails || '0245550192',
        notes: p.notes || 'Routine vendor net sales withdrawal',
        receiptSent: !!p.receiptSent,
        receiptSentAt: p.receiptSentAt ? new Date(p.receiptSentAt).toLocaleString() : null,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { vendorEmail, vendorName, amount, paymentMethod, accountDetails, notes } = body;

    if (!vendorEmail || !amount) {
      return NextResponse.json({ success: false, message: 'Vendor email and amount are required' }, { status: 400 });
    }

    const payoutRef = `PAYOUT-${Date.now().toString().slice(-6)}`;
    const newPayout = await Payout.create({
      payoutRef,
      vendorEmail: vendorEmail.toLowerCase(),
      vendorName: vendorName || 'AfriCart Store Partner',
      amount: parseFloat(amount),
      status: 'Pending',
      requestDate: new Date(),
      paymentMethod: paymentMethod || 'MTN Mobile Money',
      accountDetails: accountDetails || '0245550192',
      notes: notes || 'Manual payout request by admin',
      receiptSent: false,
    });

    return NextResponse.json({
      success: true,
      message: `Payout request (${payoutRef}) of GH₵ ${newPayout.amount} created for ${vendorEmail}!`,
      payout: newPayout,
    });
  } catch (error: any) {
    console.error('Error creating payout request:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create payout' }, { status: 500 });
  }
}
