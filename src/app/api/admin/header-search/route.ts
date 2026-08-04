import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import { SupportTicket } from '@/models/SupportTicket';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [products, orders, stores, users, tickets] = await Promise.all([
      Product.find({ $or: [{ name: regex }, { category: regex }, { brand: regex }] }).limit(4).lean(),
      Order.find({ $or: [{ orderId: regex }, { customerEmail: regex }] }).limit(4).lean(),
      Store.find({ $or: [{ storeName: regex }, { email: regex }] }).limit(4).lean(),
      User.find({ $or: [{ name: regex }, { email: regex }] }).limit(4).lean(),
      SupportTicket.find({ $or: [{ ticketId: regex }, { subject: regex }, { userEmail: regex }] }).limit(4).lean(),
    ]);

    const results: Array<{ id: string; type: string; title: string; subtitle: string; link: string; icon: string; badge: string }> = [];

    products.forEach((p: any) => {
      results.push({
        id: p._id.toString(),
        type: 'product',
        title: p.name || p.title,
        subtitle: `GH₵ ${(p.price || 0).toLocaleString()} • ${p.category || 'Product'}`,
        link: `/admin/products?q=${encodeURIComponent(p.name || '')}`,
        icon: 'inventory_2',
        badge: 'Product',
      });
    });

    orders.forEach((o: any) => {
      results.push({
        id: o._id.toString(),
        type: 'order',
        title: `Order #${o.orderId}`,
        subtitle: `${o.customerEmail} • status: ${o.status}`,
        link: `/admin/orders?q=${encodeURIComponent(o.orderId)}`,
        icon: 'shopping_bag',
        badge: 'Order',
      });
    });

    stores.forEach((s: any) => {
      results.push({
        id: s._id.toString(),
        type: 'store',
        title: s.storeName || s.name || 'Vendor Store',
        subtitle: `${s.email} • rating: ${s.rating || 4.8}⭐`,
        link: `/admin/vendors?q=${encodeURIComponent(s.storeName || s.email)}`,
        icon: 'storefront',
        badge: 'Vendor Store',
      });
    });

    users.forEach((u: any) => {
      results.push({
        id: u._id.toString(),
        type: 'user',
        title: u.name,
        subtitle: `${u.email} • role: ${u.role}`,
        link: `/admin/customers?q=${encodeURIComponent(u.email)}`,
        icon: 'person',
        badge: 'User',
      });
    });

    tickets.forEach((t: any) => {
      results.push({
        id: t._id.toString(),
        type: 'ticket',
        title: `Ticket #${t.ticketId}: ${t.subject}`,
        subtitle: `${t.userEmail} • ${t.status}`,
        link: `/admin/tickets?q=${encodeURIComponent(t.ticketId)}`,
        icon: 'support_agent',
        badge: 'Support Ticket',
      });
    });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Header search API error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Search failed' }, { status: 500 });
  }
}
