import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
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
    const filter = searchParams.get('filter') || 'all'; // all, unread, orders, payments, stock, reviews, messages, subscription, system

    const defaultNotifs = [
      { id: 'vnotif-1', title: 'New Customer Order #ORD-8942', message: 'Kofi Mensah placed an order for GH₵ 350.00 (2 items).', category: 'orders', link: '/vendor/orders', read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 'vnotif-2', title: 'Payout Deposit Verified', message: 'Payout request #PO-402 of GH₵ 2,400.00 transferred to Mobile Money.', category: 'payments', link: '/vendor/payments/payouts', read: false, createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: 'vnotif-3', title: 'Low Stock Alert: Pro Compression Leggings', message: 'Only 3 units remaining in Accra Warehouse. Reorder stock soon.', category: 'stock', link: '/vendor/inventory', read: false, createdAt: new Date(Date.now() - 180 * 60000).toISOString() },
      { id: 'vnotif-4', title: 'New 5-Star Customer Review', message: 'Ama Serwaa left a 5-star review on Performance Running Top.', category: 'reviews', link: '/vendor/reviews', read: true, createdAt: new Date(Date.now() - 360 * 60000).toISOString() },
      { id: 'vnotif-5', title: 'New Buyer Inquiry Message', message: 'Customer asked: "Does the medium size fit true to size?"', category: 'messages', link: '/vendor/messages', read: true, createdAt: new Date(Date.now() - 720 * 60000).toISOString() },
      { id: 'vnotif-6', title: 'Subscription Renewal Notice', message: 'Your Gold Tier Vendor Plan will auto-renew on Aug 28, 2026.', category: 'subscription', link: '/vendor/billing', read: true, createdAt: new Date(Date.now() - 1440 * 60000).toISOString() },
      { id: 'vnotif-7', title: 'System Announcement: GRA Tax Updates', message: 'Updated GRA tax schedule active for August 2026 transactions.', category: 'system', link: '/vendor/analytics/taxes', read: true, createdAt: new Date(Date.now() - 2880 * 60000).toISOString() },
    ];

    const notifications = store?.vendorNotifications || defaultNotifs;
    const preferences = store?.vendorNotificationPreferences || {
      orders: { email: true, sms: true, push: true, inApp: true },
      payments: { email: true, sms: true, push: true, inApp: true },
      stock: { email: true, sms: false, push: true, inApp: true },
      reviews: { email: false, sms: false, push: true, inApp: true },
      messages: { email: true, sms: true, push: true, inApp: true },
      subscription: { email: true, sms: false, push: true, inApp: true },
      system: { email: true, sms: false, push: true, inApp: true },
    };

    let filtered = notifications;
    if (filter === 'unread') filtered = notifications.filter((n: any) => !n.read);
    else if (filter !== 'all') filtered = notifications.filter((n: any) => n.category === filter);

    const counts = {
      total: notifications.length,
      unread: notifications.filter((n: any) => !n.read).length,
      orders: notifications.filter((n: any) => n.category === 'orders').length,
      payments: notifications.filter((n: any) => n.category === 'payments').length,
      stock: notifications.filter((n: any) => n.category === 'stock').length,
      reviews: notifications.filter((n: any) => n.category === 'reviews').length,
      messages: notifications.filter((n: any) => n.category === 'messages').length,
      subscription: notifications.filter((n: any) => n.category === 'subscription').length,
      system: notifications.filter((n: any) => n.category === 'system').length,
    };

    return NextResponse.json({
      success: true,
      notifications: filtered,
      counts,
      preferences,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/notifications error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { action, id, preferences } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const defaultNotifs = [
      { id: 'vnotif-1', title: 'New Customer Order #ORD-8942', message: 'Kofi Mensah placed an order for GH₵ 350.00 (2 items).', category: 'orders', link: '/vendor/orders', read: false, createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 'vnotif-2', title: 'Payout Deposit Verified', message: 'Payout request #PO-402 of GH₵ 2,400.00 transferred to Mobile Money.', category: 'payments', link: '/vendor/payments/payouts', read: false, createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
      { id: 'vnotif-3', title: 'Low Stock Alert: Pro Compression Leggings', message: 'Only 3 units remaining in Accra Warehouse. Reorder stock soon.', category: 'stock', link: '/vendor/inventory', read: false, createdAt: new Date(Date.now() - 180 * 60000).toISOString() },
    ];

    let currentNotifs = (store.get('vendorNotifications') as any[]) || defaultNotifs;

    if (action === 'mark_read' && id) {
      currentNotifs = currentNotifs.map(n => n.id === id ? { ...n, read: true } : n);
      store.set('vendorNotifications', currentNotifs);
      await store.save();
      return NextResponse.json({ success: true, message: 'Notification marked read' });
    }

    if (action === 'mark_all_read') {
      currentNotifs = currentNotifs.map(n => ({ ...n, read: true }));
      store.set('vendorNotifications', currentNotifs);
      await store.save();
      return NextResponse.json({ success: true, message: 'All notifications marked read' });
    }

    if (action === 'update_preferences' && preferences) {
      store.set('vendorNotificationPreferences', preferences);
      await store.save();
      return NextResponse.json({ success: true, message: 'Notification channel preferences saved!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/notifications error:', error);
    return NextResponse.json({ error: error.message || 'Notification update failed' }, { status: 500 });
  }
}
