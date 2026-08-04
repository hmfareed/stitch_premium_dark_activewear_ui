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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
    let vendorOrders = allOrders.filter((o: any) =>
      Array.isArray(o.products) &&
      o.products.some((p: any) => p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString()))
    );

    if (status && status !== 'all') {
      vendorOrders = vendorOrders.filter((o: any) => (o.status || 'Pending').toLowerCase() === status.toLowerCase());
    }

    if (search) {
      vendorOrders = vendorOrders.filter((o: any) =>
        (o.id || o.orderId || o._id.toString()).toLowerCase().includes(search) ||
        (o.customerName || '').toLowerCase().includes(search) ||
        (o.customerEmail || '').toLowerCase().includes(search) ||
        (o.customerPhone || '').includes(search)
      );
    }

    // Format orders for vendor UI
    const formattedOrders = vendorOrders.map((o: any) => {
      const vendorItems = (o.products || []).filter((p: any) =>
        p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString())
      );
      const vendorTotal = vendorItems.reduce((s: number, p: any) => s + ((p.price || 0) * (p.quantity || 1)), 0);

      return {
        _id: o._id.toString(),
        orderId: `#${o.id || o.orderId || o._id.toString().slice(-6)}`,
        customerName: o.customerName || 'Customer',
        customerEmail: o.customerEmail || 'customer@africart.com',
        customerPhone: o.customerPhone || '+233 24 000 0000',
        shippingAddress: o.shippingAddress || 'Osu Oxford Street, Accra, Ghana',
        products: vendorItems.map((p: any) => ({
          name: p.title || p.name || 'Product',
          price: p.price || 0,
          quantity: p.quantity || 1,
          image: p.image || p.img || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
        })),
        totalAmount: vendorTotal,
        status: o.status || 'Pending',
        courier: o.courier || 'AfriCart Dedicated Rider',
        trackingNumber: o.trackingNumber || `AFR-TRK-${o._id.toString().slice(-6).toUpperCase()}`,
        date: new Date(o.createdAt || o.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        notes: o.vendorNotes || '',
        returnStatus: o.returnStatus || null,
        refundStatus: o.refundStatus || null,
      };
    });

    return NextResponse.json({ success: true, orders: formattedOrders });
  } catch (error: any) {
    console.error('GET /api/vendor/orders error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, action, status, courier, vendorNotes, returnStatus, refundAmount } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'accept') {
      order.status = 'Processing';
    } else if (action === 'reject') {
      order.status = 'Cancelled';
    } else if (status) {
      order.status = status;
    }

    if (courier) order.set('courier', courier);
    if (vendorNotes !== undefined) order.set('vendorNotes', vendorNotes);
    if (returnStatus) order.set('returnStatus', returnStatus);
    if (refundAmount) {
      order.set('refundStatus', 'Refunded');
      order.set('refundAmount', Number(refundAmount));
    }

    await order.save();

    return NextResponse.json({
      success: true,
      order,
      message: `Order ${order.id || order._id} updated successfully!`,
    });
  } catch (error: any) {
    console.error('PUT /api/vendor/orders error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
