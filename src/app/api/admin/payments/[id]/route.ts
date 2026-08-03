import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PaymentTransaction } from '@/models/PaymentTransaction';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let txn = await PaymentTransaction.findOne({ transactionId: id }).lean();
    if (!txn) {
      txn = await PaymentTransaction.findById(id).lean();
    }

    if (!txn) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    const subtotal = txn.amount;
    const vat = subtotal * 0.05;
    const grandTotal = subtotal + vat;

    return NextResponse.json({
      success: true,
      transaction: {
        id: txn._id.toString(),
        transactionId: txn.transactionId,
        orderId: txn.orderId,
        customerName: txn.customerName,
        customerEmail: txn.customerEmail,
        customerPhone: txn.customerPhone || '+233 24 000 0000',
        amount: txn.amount,
        subtotal,
        vat,
        grandTotal,
        channel: txn.channel,
        channelDetails: txn.channelDetails || {},
        status: txn.status,
        verifiedBy: txn.verifiedBy || 'Paystack Gateway',
        verifiedAt: txn.verifiedAt ? new Date(txn.verifiedAt).toLocaleString() : 'Pending',
        refundReference: txn.refundReference || null,
        refundReason: txn.refundReason || null,
        createdAt: txn.createdAt ? new Date(txn.createdAt).toLocaleString() : 'Recent',
      },
    });
  } catch (error: any) {
    console.error('Error fetching transaction detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch transaction detail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, refundReason } = body;

    let txn = await PaymentTransaction.findOne({ transactionId: id });
    if (!txn) {
      txn = await PaymentTransaction.findById(id);
    }

    if (!txn) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    // Action 1: Verify Payment
    if (action === 'verify_payment') {
      txn.status = 'verified';
      txn.verifiedBy = 'Super Admin (Manual Verification)';
      txn.verifiedAt = new Date();
      await txn.save();

      return NextResponse.json({
        success: true,
        message: `Transaction ${txn.transactionId} verified successfully!`,
      });
    }

    // Action 2: Refund Transaction
    if (action === 'refund') {
      txn.status = 'refunded';
      txn.refundReference = `REF-${Date.now().toString().slice(-8)}`;
      txn.refundReason = refundReason || 'Customer requested transaction refund / verified by admin';
      await txn.save();

      return NextResponse.json({
        success: true,
        message: `Transaction ${txn.transactionId} marked as Refunded (${txn.refundReference}).`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid payment action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await PaymentTransaction.deleteOne({ $or: [{ transactionId: id }, { _id: id }] });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete transaction' }, { status: 500 });
  }
}
