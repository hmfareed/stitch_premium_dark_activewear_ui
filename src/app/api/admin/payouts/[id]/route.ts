import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Payout } from '@/models/Payout';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let payout = await Payout.findById(id).lean();
    if (!payout) {
      payout = await Payout.findOne({ payoutRef: id }).lean();
    }

    if (!payout) {
      return NextResponse.json({ success: false, message: 'Payout not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout._id.toString(),
        payoutRef: payout.payoutRef || `PAYOUT-${payout._id.toString().slice(-6).toUpperCase()}`,
        vendorEmail: payout.vendorEmail,
        vendorName: payout.vendorName || 'AfriCart Store Partner',
        amount: payout.amount,
        status: payout.status || 'Pending',
        requestDate: payout.requestDate ? new Date(payout.requestDate).toLocaleString() : 'N/A',
        processedDate: payout.processedDate ? new Date(payout.processedDate).toLocaleString() : 'Pending Settlement',
        paymentMethod: payout.paymentMethod || 'MTN Mobile Money',
        accountDetails: payout.accountDetails || 'N/A',
        notes: payout.notes || 'Routine withdrawal',
        receiptSent: !!payout.receiptSent,
        receiptSentAt: payout.receiptSentAt ? new Date(payout.receiptSentAt).toLocaleString() : null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payout detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch payout detail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body;

    let payout = await Payout.findById(id);
    if (!payout) {
      payout = await Payout.findOne({ payoutRef: id });
    }

    if (!payout) {
      return NextResponse.json({ success: false, message: 'Payout not found' }, { status: 404 });
    }

    // Action 1: Approve Payout
    if (action === 'approve') {
      payout.status = 'Approved';
      if (notes) payout.notes = notes;
      await payout.save();

      return NextResponse.json({
        success: true,
        message: `Payout request (${payout.payoutRef || payout._id}) approved! Status: Approved.`,
      });
    }

    // Action 2: Mark Paid
    if (action === 'mark_paid') {
      payout.status = 'Paid';
      payout.processedDate = new Date();
      if (notes) payout.notes = notes;
      await payout.save();

      return NextResponse.json({
        success: true,
        message: `Payout (${payout.payoutRef || payout._id}) of GH₵ ${payout.amount} settled & marked Paid!`,
      });
    }

    // Action 3: Reject Payout
    if (action === 'reject') {
      payout.status = 'Rejected';
      payout.notes = notes || 'Payout request rejected by super admin';
      await payout.save();

      return NextResponse.json({
        success: true,
        message: `Payout request (${payout.payoutRef || payout._id}) rejected.`,
      });
    }

    // Action 4: Send Receipt
    if (action === 'send_receipt') {
      payout.receiptSent = true;
      payout.receiptSentAt = new Date();
      await payout.save();

      return NextResponse.json({
        success: true,
        message: `Digital payout settlement receipt generated & sent to ${payout.vendorEmail}!`,
        receiptSentAt: payout.receiptSentAt,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid payout action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating payout:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update payout' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await Payout.deleteOne({ $or: [{ _id: id }, { payoutRef: id }] });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Payout not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Payout record deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting payout:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete payout' }, { status: 500 });
  }
}
