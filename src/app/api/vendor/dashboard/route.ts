import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { Store } from '@/models/Store';
import { Notification } from '@/models/Notification';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean();

    // 1. Fetch Products for this Vendor
    const products = await Product.find({
      $or: [{ vendorEmail }, { storeId: store?._id }],
    }).lean();

    // 2. Fetch Orders containing products from this Vendor
    const allOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const vendorOrders = allOrders.filter((o: any) =>
      Array.isArray(o.products) &&
      o.products.some((p: any) => p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString()))
    );

    // Date calculations for Today's Sales
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    let todaysSalesVal = 0;
    let totalRevenueVal = 0;
    let pendingCount = 0;
    let returnsCount = 0;

    const customerSpendMap: Record<string, { name: string; email: string; totalSpend: number; orderCount: number }> = {};
    const productSalesMap: Record<string, { name: string; sold: number; revenue: number; img: string }> = {};

    vendorOrders.forEach((order: any) => {
      const isToday = new Date(order.createdAt || order.date || Date.now()) >= startOfToday;
      const isCancelled = order.status === 'Cancelled';
      const isReturned = order.status === 'Returned';
      const isPending = order.status === 'Pending';

      if (isPending) pendingCount++;
      if (isReturned) returnsCount++;

      // Compute vendor item total in order
      const vendorItems = (order.products || []).filter((p: any) =>
        p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString())
      );

      const vendorOrderTotal = vendorItems.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.quantity || 1)), 0);

      if (!isCancelled) {
        totalRevenueVal += vendorOrderTotal;
        if (isToday) todaysSalesVal += vendorOrderTotal;

        // Customer aggregation
        const custKey = (order.customerEmail || order.customerPhone || order.customerName || 'Guest Customer').toLowerCase();
        if (!customerSpendMap[custKey]) {
          customerSpendMap[custKey] = {
            name: order.customerName || 'Customer',
            email: order.customerEmail || order.customerPhone || 'N/A',
            totalSpend: 0,
            orderCount: 0,
          };
        }
        customerSpendMap[custKey].totalSpend += vendorOrderTotal;
        customerSpendMap[custKey].orderCount += 1;

        // Product sales aggregation
        vendorItems.forEach((p: any) => {
          const prodKey = p.title || p.name || 'Product';
          if (!productSalesMap[prodKey]) {
            productSalesMap[prodKey] = {
              name: prodKey,
              sold: 0,
              revenue: 0,
              img: p.image || p.img || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
            };
          }
          productSalesMap[prodKey].sold += (p.quantity || 1);
          productSalesMap[prodKey].revenue += (p.price || 0) * (p.quantity || 1);
        });
      }
    });

    // 10 KPI Cards
    const totalOrders = vendorOrders.length;
    const totalCustomers = Object.keys(customerSpendMap).length;
    const totalProducts = products.length;
    const lowStockItems = products.filter((p: any) => (p.stock || 0) <= 5);
    const lowStockCount = lowStockItems.length;

    // Platform Expenses (5% commission estimate or plan cost)
    const commissionPct = store?.subscriptionPlan === 'Premium' ? 0.015 : store?.subscriptionPlan === 'Growth' ? 0.03 : 0.05;
    const expenses = totalRevenueVal * commissionPct;
    const profit = totalRevenueVal - expenses;

    // 9 Widgets Data
    // 1. Sales & Revenue Daily Trend Chart (Last 7 Days)
    const salesChartData = [];
    const revenueChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);

      const dayOrders = vendorOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt || o.date || Date.now());
        return orderDate >= dayStart && orderDate <= dayEnd && o.status !== 'Cancelled';
      });

      const dayRevenue = dayOrders.reduce((sum: number, o: any) => {
        const vendorItems = (o.products || []).filter((p: any) => p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString()));
        return sum + vendorItems.reduce((s: number, p: any) => s + ((p.price || 0) * (p.quantity || 1)), 0);
      }, 0);

      salesChartData.push({ date: dateStr, count: dayOrders.length });
      revenueChartData.push({ date: dateStr, amount: dayRevenue });
    }

    // 2. Recent Orders List
    const recentOrders = vendorOrders.slice(0, 6).map((o: any) => ({
      id: `#${o.id || o.orderId || o._id.toString().slice(-6)}`,
      customer: o.customerName || 'Customer',
      amount: (o.products || []).filter((p: any) => p && (p.vendorEmail === vendorEmail || p.storeId?.toString() === store?._id?.toString())).reduce((s: number, p: any) => s + ((p.price || 0) * (p.quantity || 1)), 0),
      status: o.status || 'Pending',
      date: new Date(o.createdAt || o.date || Date.now()).toLocaleDateString(),
    }));

    // 3. Low Stock List
    const lowStockList = lowStockItems.slice(0, 5).map((p: any) => ({
      id: p._id.toString(),
      name: p.title || p.name,
      stock: p.stock || 0,
      img: p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
    }));

    // 4. Top-Selling Products
    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 5. Best Customers
    const bestCustomers = Object.values(customerSpendMap)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    // 6. Recent Notifications
    const rawNotifications = await Notification.find({
      $or: [{ userId: session.userId }, { targetRole: 'vendor' }, { targetRole: 'all' }],
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentNotifications = rawNotifications.map((n: any) => ({
      id: n._id.toString(),
      title: n.title || 'Store Update',
      message: n.message || n.content || '',
      date: new Date(n.createdAt || Date.now()).toLocaleDateString(),
    }));

    // 7. Subscription Status
    const subscriptionStatus = {
      plan: store?.subscriptionPlan || 'Growth Plan',
      status: store?.status === 'active' ? 'ACTIVE' : 'PENDING',
      expiry: 'Dec 31, 2026',
      commissionRate: `${(commissionPct * 100).toFixed(1)}%`,
    };

    return NextResponse.json({
      success: true,
      kpis: {
        todaysSales: todaysSalesVal,
        revenue: totalRevenueVal,
        orders: totalOrders,
        customers: totalCustomers,
        products: totalProducts,
        lowStock: lowStockCount,
        pendingOrders: pendingCount,
        returns: returnsCount,
        expenses,
        profit,
      },
      widgets: {
        salesChartData,
        revenueChartData,
        recentOrders,
        lowStockList,
        topSellingProducts,
        bestCustomers,
        recentNotifications,
        subscriptionStatus,
      },
    });
  } catch (error: any) {
    console.error('GET /api/vendor/dashboard error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch vendor dashboard data' }, { status: 500 });
  }
}
