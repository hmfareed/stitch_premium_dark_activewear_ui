import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Payout } from '@/models/Payout';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const payouts = await Payout.find({}).sort({ requestDate: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: payouts.length,
      payouts: payouts.map(p => ({
        id: p._id.toString(),
        vendorEmail: p.vendorEmail,
        vendorName: p.vendorName || 'Vendor',
        amount: p.amount,
        status: p.status,
        requestDate: p.requestDate ? new Date(p.requestDate).toLocaleDateString() : 'Recent',
        processedDate: p.processedDate ? new Date(p.processedDate).toLocaleDateString() : 'N/A',
        paymentMethod: p.paymentMethod || 'Mobile Money',
        accountDetails: p.accountDetails || 'N/A',
        notes: p.notes || 'Routine payout request',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch payout queue' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { payoutId, status, notes } = body;

    if (!payoutId || !status) {
      return NextResponse.json({ success: false, message: 'Payout ID and status are required' }, { status: 400 });
    }

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return NextResponse.json({ success: false, message: 'Payout request not found' }, { status: 404 });
    }

    payout.status = status as any;
    if (status === 'Paid') {
      payout.processedDate = new Date();
    }
    if (notes) payout.notes = notes;

    await payout.save();

    return NextResponse.json({
      success: true,
      message: `Payout request for ${payout.vendorEmail} (GH₵ ${payout.amount}) marked as ${status}!`,
      payout,
    });
  } catch (error: any) {
    console.error('Error updating payout:', error);
    return NextResponse.json({ success: false, message: 'Failed to process payout' }, { status: 500 });
  }
}
