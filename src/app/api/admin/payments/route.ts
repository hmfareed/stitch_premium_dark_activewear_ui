import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { PaymentTransaction, PaymentChannel } from '@/models/PaymentTransaction';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel') || 'all'; // all | cash | card | momo | bank | wallet
    const status = searchParams.get('status') || '';
    const q = searchParams.get('q') || '';

    const query: any = {};

    if (channel !== 'all') {
      query.channel = channel as PaymentChannel;
    }

    if (status) {
      query.status = status;
    }

    if (q) {
      query.$or = [
        { transactionId: { $regex: q, $options: 'i' } },
        { orderId: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { 'channelDetails.reference': { $regex: q, $options: 'i' } },
      ];
    }

    const transactions = await PaymentTransaction.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: transactions.length,
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        transactionId: t.transactionId,
        orderId: t.orderId,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        customerPhone: t.customerPhone || '+233 24 000 0000',
        amount: t.amount,
        channel: t.channel,
        channelDetails: t.channelDetails || {},
        status: t.status,
        verifiedBy: t.verifiedBy || 'Paystack Gateway',
        verifiedAt: t.verifiedAt ? new Date(t.verifiedAt).toLocaleString() : 'N/A',
        refundReference: t.refundReference || null,
        refundReason: t.refundReason || null,
        createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching payment transactions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { orderId, customerName, customerEmail, amount, channel, channelDetails } = body;

    if (!orderId || !customerName || !amount || !channel) {
      return NextResponse.json({ success: false, message: 'OrderId, customerName, amount, and channel are required' }, { status: 400 });
    }

    const txnId = `TXN-${Date.now().toString().slice(-8)}`;

    const newTxn = await PaymentTransaction.create({
      transactionId: txnId,
      orderId,
      customerName,
      customerEmail: customerEmail || 'customer@gmail.com',
      customerPhone: '+233 24 555 0192',
      amount: parseFloat(amount),
      channel: channel as PaymentChannel,
      channelDetails: channelDetails || { reference: `PAY-${Date.now().toString().slice(-6)}` },
      status: channel === 'cash' || channel === 'bank' ? 'pending' : 'verified',
      verifiedBy: channel === 'cash' || channel === 'bank' ? undefined : 'Automatic Webhook',
      verifiedAt: channel === 'cash' || channel === 'bank' ? undefined : new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Payment transaction ${txnId} created successfully!`,
      transaction: newTxn,
    });
  } catch (error: any) {
    console.error('Error creating payment transaction:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create transaction' }, { status: 500 });
  }
}
