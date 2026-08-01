import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Order } from '@/models/Order';
import { Rider } from '@/models/Rider';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const [
      totalCustomers,
      totalVendors,
      totalRiders,
      totalAdmins,
      orders,
    ] = await Promise.all([
      User.countDocuments({ role: { $in: ['customer', undefined, ''] } }),
      User.countDocuments({ role: 'vendor' }),
      Rider.countDocuments(),
      User.countDocuments({ role: 'super_admin' }),
      Order.find({}),
    ]);

    const totalOrdersCount = orders.length;

    // Filter valid revenue non-cancelled orders
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const platformCommission = totalRevenue * 0.14;

    // Growth comparison calculation based on last 30 days vs previous 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentOrders = validOrders.filter(o => new Date(o.date) >= thirtyDaysAgo);
    const prevOrders = validOrders.filter(o => new Date(o.date) >= sixtyDaysAgo && new Date(o.date) < thirtyDaysAgo);

    const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    const revenueGrowthPct = prevRevenue > 0
      ? (((recentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
      : recentRevenue > 0 ? '+100' : '0';

    const orderGrowthPct = prevOrders.length > 0
      ? (((recentOrders.length - prevOrders.length) / prevOrders.length) * 100).toFixed(1)
      : recentOrders.length > 0 ? '+100' : '0';

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        totalVendors,
        totalRiders,
        totalAdmins,
        totalOrdersCount,
        totalRevenue,
        platformCommission,
        revenueGrowthPct,
        orderGrowthPct,
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
