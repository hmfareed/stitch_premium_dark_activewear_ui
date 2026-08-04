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

    const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const vendorOrders = allOrders.filter((o: any) =>
      Array.isArray(o.products) &&
      o.products.some((p: any) => p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString()))
    );

    // Aggregate customers from orders
    const customerMap: Record<string, any> = {};

    vendorOrders.forEach((o: any) => {
      const email = (o.customerEmail || o.customerPhone || 'guest@africart.com').toLowerCase().trim();
      const name = o.customerName || 'Customer';
      const phone = o.customerPhone || '+233 24 000 0000';

      const vendorItems = (o.products || []).filter((p: any) =>
        p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString())
      );

      const orderTotal = vendorItems.reduce((s: number, p: any) => s + ((p.price || 0) * (p.quantity || 1)), 0);

      if (!customerMap[email]) {
        customerMap[email] = {
          id: `cust-${Object.keys(customerMap).length + 1}`,
          name,
          email,
          phone,
          totalSpend: 0,
          orderCount: 0,
          orders: [],
          loyaltyPoints: 0,
          walletCredit: 0.00,
          segment: 'New Customer',
          notes: '',
          isBlacklisted: false,
          joinedDate: new Date(o.createdAt || Date.now()).toLocaleDateString(),
        };
      }

      if (o.status !== 'Cancelled') {
        customerMap[email].totalSpend += orderTotal;
        customerMap[email].orderCount += 1;
        customerMap[email].loyaltyPoints += Math.floor(orderTotal / 10);
      }

      customerMap[email].orders.push({
        id: `#${o.id || o.orderId || o._id.toString().slice(-6)}`,
        date: new Date(o.createdAt || Date.now()).toLocaleDateString(),
        amount: orderTotal,
        status: o.status || 'Delivered',
      });
    });

    // Provide default fallback customers if no orders yet
    if (Object.keys(customerMap).length === 0) {
      customerMap['abena@example.com'] = {
        id: 'cust-1',
        name: 'Abena Osei',
        email: 'abena@example.com',
        phone: '+233 24 123 4567',
        totalSpend: 2450.00,
        orderCount: 8,
        loyaltyPoints: 245,
        walletCredit: 50.00,
        segment: 'VIP Tier',
        notes: 'Prefers intra-city express delivery to Osu.',
        isBlacklisted: false,
        joinedDate: 'Jan 12, 2026',
        orders: [
          { id: '#ORD-9821', date: 'Aug 2, 2026', amount: 450.00, status: 'Delivered' },
          { id: '#ORD-9410', date: 'Jul 18, 2026', amount: 800.00, status: 'Delivered' },
        ],
      };

      customerMap['kwesi@example.com'] = {
        id: 'cust-2',
        name: 'Kwesi Appiah',
        email: 'kwesi@example.com',
        phone: '+233 20 999 8888',
        totalSpend: 680.00,
        orderCount: 3,
        loyaltyPoints: 68,
        walletCredit: 0.00,
        segment: 'Regular Buyer',
        notes: '',
        isBlacklisted: false,
        joinedDate: 'Mar 5, 2026',
        orders: [
          { id: '#ORD-9750', date: 'Jul 29, 2026', amount: 280.00, status: 'Delivered' },
        ],
      };
    }

    // Apply stored overrides (notes, blacklists, wallet credit)
    const storedOverrides = store?.customerOverrides || {};
    const customers = Object.values(customerMap).map((c: any) => {
      const override = storedOverrides[c.email];
      if (override) {
        if (override.notes !== undefined) c.notes = override.notes;
        if (override.isBlacklisted !== undefined) c.isBlacklisted = override.isBlacklisted;
        if (override.walletCredit !== undefined) c.walletCredit = override.walletCredit;
        if (override.segment !== undefined) c.segment = override.segment;
      }
      if (c.totalSpend >= 2000) c.segment = 'VIP Tier';
      else if (c.orderCount >= 3) c.segment = 'Regular Buyer';
      return c;
    });

    return NextResponse.json({ success: true, customers });
  } catch (error: any) {
    console.error('GET /api/vendor/customers error:', error);
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

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { email, notes, isBlacklisted, walletCredit, segment } = body;

    if (!email) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const storedOverrides = (store.get('customerOverrides') as Record<string, any>) || {};
    const key = email.toLowerCase().trim();
    storedOverrides[key] = {
      ...storedOverrides[key],
      ...(notes !== undefined && { notes }),
      ...(isBlacklisted !== undefined && { isBlacklisted }),
      ...(walletCredit !== undefined && { walletCredit }),
      ...(segment !== undefined && { segment }),
    };

    store.set('customerOverrides', storedOverrides);
    await store.save();

    return NextResponse.json({
      success: true,
      message: 'Customer record updated successfully!',
    });
  } catch (error: any) {
    console.error('PUT /api/vendor/customers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update customer record' }, { status: 500 });
  }
}
