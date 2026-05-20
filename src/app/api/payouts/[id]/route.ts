import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/mongodb';
import { Payout } from '@/models/Payout';
import { sendEmail, getEmailTemplate } from '@/lib/email';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const updates = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    if (updates.status === 'Paid') {
      updates.processedDate = new Date();
    }

    const payout = await Payout.findByIdAndUpdate(id, updates, { new: true });
    
    if (!payout) {
      return NextResponse.json({ success: false, error: 'Payout not found' }, { status: 404 });
    }

    // --- PAYOUT STATUS EMAIL ---
    try {
      if (updates.status === 'Paid' || updates.status === 'Rejected') {
        const isPaid = updates.status === 'Paid';
        const html = getEmailTemplate(
          isPaid ? 'Payout Processed! 💳' : 'Payout Request Update',
          isPaid 
            ? `Your payout request for <b>GH₵${payout.amount.toFixed(2)}</b> has been processed successfully. Funds should arrive in your ${payout.paymentMethod} account shortly.`
            : `Your payout request for <b>GH₵${payout.amount.toFixed(2)}</b> has been rejected. Reason: ${updates.notes || 'No reason provided'}. Please contact support for details.`,
          'View Finance Panel',
          `${req.nextUrl.origin}/vendor/finance`
        );
        await sendEmail(payout.vendorEmail, `AfriCart Payout: ${updates.status}`, html);
      }
    } catch (e) {
      console.error('Payout email notification failed:', e);
    }

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    await Payout.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
