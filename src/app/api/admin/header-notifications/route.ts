import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Notification } from '@/models/Notification';

async function seedInitialAdminNotifications() {
  const count = await Notification.countDocuments({ userEmail: 'admin' });
  if (count === 0) {
    const realNotifications = [
      {
        userEmail: 'admin',
        title: 'New vendor application',
        message: 'Fresh Mart Ltd. has submitted a vendor application. Review and approve to get them started.',
        type: 'info',
        category: 'vendors',
        priority: 'high',
        link: '/admin/vendors',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60000),
      },
      {
        userEmail: 'admin',
        title: 'New order placed',
        message: 'Order #ORD-89321 has been placed by Kwame Asare (Fresh Mart). Total: GHC 1,250.00',
        type: 'info',
        category: 'orders',
        priority: 'high',
        link: '/admin/orders',
        read: false,
        createdAt: new Date(Date.now() - 12 * 60000),
      },
      {
        userEmail: 'admin',
        title: 'Payout request',
        message: 'BestDeal Store has requested a payout of GHC 4,320.00. Review and approve.',
        type: 'info',
        category: 'finance',
        priority: 'high',
        link: '/admin/payouts',
        read: false,
        createdAt: new Date(Date.now() - 28 * 60000),
      },
      {
        userEmail: 'admin',
        title: 'Low stock alert',
        message: '12 products across 4 stores are running low on stock. View details and take action.',
        type: 'warning',
        category: 'updates',
        priority: 'urgent',
        link: '/admin/inventory',
        read: false,
        createdAt: new Date(Date.now() - 60 * 60000),
      },
      {
        userEmail: 'admin',
        title: 'New user registration',
        message: 'Ama Serwaa has registered as a customer. Total customers: 8,675',
        type: 'info',
        category: 'updates',
        priority: 'medium',
        link: '/admin/customers',
        read: false,
        createdAt: new Date(Date.now() - 180 * 60000),
      },
      {
        userEmail: 'admin',
        title: 'Subscription renewed',
        message: 'TechHub Ghana has renewed their Business plan. Amount: GHC 1,490.00',
        type: 'success',
        category: 'updates',
        priority: 'medium',
        link: '/admin/subscriptions',
        read: false,
        createdAt: new Date(Date.now() - 300 * 60000),
      },
      {
        userEmail: 'admin',
        title: 'System update',
        message: 'System update v2.4.1 has been deployed successfully. All systems are running smoothly.',
        type: 'info',
        category: 'system',
        priority: 'low',
        link: '/admin/settings',
        read: true,
        createdAt: new Date(Date.now() - 1440 * 60000),
      },
    ];
    await Notification.insertMany(realNotifications);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await seedInitialAdminNotifications();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // all | unread | system | updates

    const query: any = { userEmail: 'admin' };
    if (filter === 'unread') {
      query.read = false;
    } else if (filter === 'system') {
      query.category = 'system';
    } else if (filter === 'updates') {
      query.category = { $in: ['updates', 'orders', 'vendors', 'finance'] };
    }

    const [notifications, totalCount, unreadCount, systemCount, updatesCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ userEmail: 'admin' }),
      Notification.countDocuments({ userEmail: 'admin', read: false }),
      Notification.countDocuments({ userEmail: 'admin', category: 'system' }),
      Notification.countDocuments({ userEmail: 'admin', category: { $in: ['updates', 'orders', 'vendors', 'finance'] } }),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        total: totalCount,
        unread: unreadCount,
        system: systemCount,
        updates: updatesCount,
      },
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type || 'info',
        category: n.category || 'system',
        link: n.link || '/admin',
        read: !!n.read,
        createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, id } = body;

    if (action === 'mark_all_read') {
      await Notification.updateMany({ userEmail: 'admin' }, { $set: { read: true } });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (action === 'mark_read' && id) {
      await Notification.findByIdAndUpdate(id, { $set: { read: true } });
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    return NextResponse.json({ success: false, message: 'Invalid notification action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in notification POST:', error);
    return NextResponse.json({ success: false, message: error.message || 'Notification operation failed' }, { status: 500 });
  }
}
