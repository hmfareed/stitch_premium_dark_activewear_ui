import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SubOrder, SubOrderStatus } from '@/models/SubOrder';

// GET sub-orders list with optional filters
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const vendorEmail = searchParams.get('vendorEmail');
    const customerEmail = searchParams.get('customerEmail');
    const riderId = searchParams.get('riderId');
    const status = searchParams.get('status');
    const fulfillmentMethod = searchParams.get('fulfillmentMethod');
    const orderId = searchParams.get('orderId');

    const query: Record<string, any> = {};
    if (orderId) query.orderId = orderId;
    if (storeId) query.storeId = storeId;
    if (vendorEmail) query.vendorEmail = vendorEmail;
    if (customerEmail) query.customerEmail = customerEmail;
    if (riderId) query.riderId = riderId;
    if (status) query.status = status;
    if (fulfillmentMethod) query.fulfillmentMethod = fulfillmentMethod;

    const subOrdersRaw = await SubOrder.find(query).sort({ createdAt: -1 });

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const subOrders = subOrdersRaw.map(sub => {
      const doc = sub.toObject();
      const isTerminal = ['completed', 'delivered', 'customer_picked_up', 'cancelled', 'refunded'].includes(doc.status);
      const slaBreached = !isTerminal && new Date(doc.createdAt) < threeHoursAgo;
      return { ...doc, slaBreached };
    });

    return NextResponse.json({ success: true, subOrders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create sub-orders (used during checkout split)
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      orderId,
      storeId,
      vendorEmail,
      vendorStoreName,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      deliveryFee = 0,
      total,
      fulfillmentMethod = 'home_delivery',
      fulfillmentSource = 'vendor_dropoff_pending',
      shippingAddress,
    } = body;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const subOrderId = `SUB-${orderId}-${storeId.substring(0, 4)}-${randomSuffix}`;
    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const newSubOrder = await SubOrder.create({
      subOrderId,
      orderId,
      storeId,
      vendorEmail,
      vendorStoreName,
      customerName,
      customerEmail,
      customerPhone,
      items,
      subtotal,
      deliveryFee,
      total,
      fulfillmentMethod,
      fulfillmentSource,
      status: 'paid',
      shippingAddress,
      pickupOtp,
      deliveryOtp,
      timeline: [
        {
          status: 'paid',
          description: 'Payment confirmed and sub-order created.',
          timestamp: new Date(),
          updatedByRole: 'customer',
        },
      ],
    });

    return NextResponse.json({ success: true, subOrder: newSubOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
