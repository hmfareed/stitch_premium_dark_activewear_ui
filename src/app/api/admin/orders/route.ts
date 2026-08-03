import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all'; // all | pending | confirmed | processing | packed | shipped | delivered | cancelled | returned | refunded
    const q = searchParams.get('q') || '';

    const query: any = {};

    if (statusFilter !== 'all') {
      // Case-insensitive status matching
      query.status = { $regex: `^${statusFilter}$`, $options: 'i' };
    }

    if (q) {
      query.$or = [
        { orderId: { $regex: q, $options: 'i' } },
        { customerName: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: q, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query).sort({ date: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders: orders.map(o => ({
        id: o._id.toString(),
        orderId: o.orderId,
        date: o.date ? new Date(o.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent',
        status: o.status || 'Pending',
        total: o.total || 0,
        itemsCount: o.itemsCount || o.products?.length || 0,
        customerName: o.customerName || 'Customer',
        customerEmail: o.customerEmail || 'n/a',
        shippingAddress: o.shippingAddress || {},
        paymentInfo: o.paymentInfo || { paymentStatus: 'Pending', escrowStatus: 'Locked' },
        assignedRiderName: o.assignedRiderName || null,
        assignedRiderPhone: o.assignedRiderPhone || null,
        trackingNumber: o.trackingNumber || null,
        invoiceNumber: o.invoiceNumber || `INV-${o.orderId.replace(/[^0-9]/g, '')}`,
        timeline: o.timeline || [],
        products: o.products || [],
      })),
    });
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { customerName, customerEmail, total, products } = body;

    const orderId = `AFR-ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = await Order.create({
      orderId,
      date: new Date(),
      status: 'Pending',
      total: parseFloat(total || '150.00'),
      itemsCount: products?.length || 1,
      products: products || [
        {
          id: 'PROD-01',
          name: 'Authentic Ghanaian Kente Wear',
          price: parseFloat(total || '150.00'),
          image: '/images/placeholder.png',
          quantity: 1,
          vendorStoreName: 'Ashanti Heritage Store',
          vendorEmail: 'ashanti@africart.com',
        },
      ],
      customerName: customerName || 'Kofi Mensah',
      customerEmail: customerEmail || 'kofi.mensah@gmail.com',
      shippingAddress: {
        fullName: customerName || 'Kofi Mensah',
        email: customerEmail || 'kofi.mensah@gmail.com',
        phone: '+233 24 555 0192',
        address: 'House No 42, Independence Avenue',
        city: 'Accra',
        region: 'Greater Accra',
      },
      paymentInfo: {
        method: 'Mobile Money',
        network: 'MTN Mobile Money',
        momoPhone: '0245550192',
        paystackRef: `PAY-MOMO-${Date.now().toString().slice(-8)}`,
        paymentStatus: 'Paid',
        escrowStatus: 'Locked',
      },
      invoiceNumber: `INV-${Date.now().toString().slice(-8)}`,
      timeline: [
        {
          status: 'Pending',
          description: 'Order placed by customer via MTN Mobile Money',
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Order #${orderId} created successfully!`,
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create order' }, { status: 500 });
  }
}
