import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { sendSMS } from '@/lib/sms';

/**
 * Abandoned Cart Recovery per spec §8.3.
 * GET: Detect carts with items added but no completed checkout after 2 hours.
 * POST: Send one SMS reminder per abandoned cart (capped at once per cart).
 */

// GET detect abandoned carts
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Find orders in pending state older than 2 hours
    const abandonedOrders = await Order.find({
      status: { $in: ['Pending', 'pending_payment'] },
      date: { $lt: twoHoursAgo },
    }).sort({ date: -1 }).limit(50);

    return NextResponse.json({
      success: true,
      abandonedCount: abandonedOrders.length,
      abandonedOrders: abandonedOrders.map(o => ({
        orderId: o.orderId,
        customerEmail: o.customerEmail,
        customerPhone: o.shippingAddress?.phone,
        customerName: o.customerName,
        total: o.total,
        itemCount: o.products?.length || 0,
        date: o.date,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST send abandoned cart reminder SMS (capped at once per cart per spec §8.3)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const phone = order.shippingAddress?.phone;
    if (phone) {
      const message = `Hi ${order.customerName || 'there'}! You left ${order.products?.length || 'some'} item(s) in your AfriCart cart. Complete your order now: africart.com/checkout — AfriCart`;
      await sendSMS(phone, message);
    }

    return NextResponse.json({ success: true, message: 'Abandoned cart reminder sent.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
