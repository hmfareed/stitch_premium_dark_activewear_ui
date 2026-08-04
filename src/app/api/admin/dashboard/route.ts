import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { VendorApplication } from '@/models/VendorApplication';
import { VendorSubscription } from '@/models/VendorSubscription';
import { ReturnRequest } from '@/models/ReturnRequest';
import { SupportTicket } from '@/models/SupportTicket';
import { CommissionLog } from '@/models/CommissionLog';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'weekly'; // daily | weekly | monthly | yearly

    // Execute queries in parallel
    const [
      totalVendors,
      activeVendors,
      suspendedVendors,
      pendingApprovalsCount,
      pendingApplications,
      totalStores,
      totalProducts,
      totalCustomers,
      allOrders,
      vendorSubscriptions,
      returnRequests,
      openTicketsCount,
      recentVendorsRaw,
      allVendorUsers,
    ] = await Promise.all([
      User.countDocuments({ $or: [{ role: 'vendor' }, { roles: 'vendor' }] }),
      User.countDocuments({ $or: [{ role: 'vendor' }, { roles: 'vendor' }], isActive: { $ne: false } }),
      User.countDocuments({ $or: [{ role: 'vendor' }, { roles: 'vendor' }], isActive: false }),
      VendorApplication.countDocuments({ status: 'pending' }),
      VendorApplication.find({ status: 'pending' }).sort({ appliedAt: -1 }).limit(10).lean(),
      Store.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ role: { $in: ['customer', undefined, ''] } }),
      Order.find({}).sort({ date: -1 }).lean(),
      VendorSubscription.find({}).lean(),
      ReturnRequest.find({}).lean(),
      SupportTicket.countDocuments({ status: { $ne: 'resolved' } }),
      User.find({ $or: [{ role: 'vendor' }, { roles: 'vendor' }] }).sort({ createdAt: -1 }).limit(5).lean(),
      User.find({ $or: [{ role: 'vendor' }, { roles: 'vendor' }] }).lean(),
    ]);

    const totalOrdersCount = allOrders.length;
    const validOrders = allOrders.filter(o => o.status !== 'Cancelled');
    const grossSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Live Commissions Calculation
    const commissionLogs = await CommissionLog.find({}).lean();
    const logCommissions = commissionLogs.reduce((sum: number, l: any) => sum + (l.commissionAmount || 0), 0);
    const totalCommissions = logCommissions > 0 ? logCommissions : grossSales * 0.14; // 14% platform commission

    // Subscription Revenue
    const subscriptionRevenue = vendorSubscriptions.reduce((sum, sub) => sum + (sub.amountPaid || 0), 0);

    // Refunds total
    const refundsTotal = returnRequests
      .filter(r => r.status === 'refunded')
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0) +
      allOrders
        .filter(o => o.status === 'Refunded')
        .reduce((sum, o) => sum + (o.total || 0), 0);

    // Order Status Breakdown
    const completedCount = allOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
    const processingCount = allOrders.filter(o => o.status === 'Processing' || o.status === 'Pending' || o.status === 'Shipped').length;
    const cancelledCount = allOrders.filter(o => o.status === 'Cancelled').length;
    const refundedCount = allOrders.filter(o => o.status === 'Refunded').length;

    const denominator = totalOrdersCount > 0 ? totalOrdersCount : 1;
    const orderBreakdown = {
      total: totalOrdersCount,
      completed: { count: completedCount, pct: ((completedCount / denominator) * 100).toFixed(1) },
      processing: { count: processingCount, pct: ((processingCount / denominator) * 100).toFixed(1) },
      cancelled: { count: cancelledCount, pct: ((cancelledCount / denominator) * 100).toFixed(1) },
      refunded: { count: refundedCount, pct: ((refundedCount / denominator) * 100).toFixed(1) },
    };

    // Timeframe Data Series (Daily, Weekly, Monthly, Yearly) aggregated from real DB dates
    const timeframeData = generateTimeframeData(timeframe, validOrders, allVendorUsers);

    // Recent Orders (Top 5)
    const recentOrders = allOrders.slice(0, 5).map(o => ({
      id: o.orderId || `#ORD-${o._id.toString().substring(0, 6)}`,
      vendor: o.products?.[0]?.vendorStoreName || 'AfriCart Vendor',
      customer: o.customerName || 'Customer',
      amount: o.total || 0,
      status: o.status || 'Pending',
      date: new Date(o.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }));

    // Recent Vendors (Top 5)
    const recentVendors = recentVendorsRaw.map(v => ({
      id: v._id.toString(),
      name: v.name || 'Vendor',
      email: v.email || v.phone || 'vendor@africart.com',
      store: v.storeName || `${v.name}'s Store`,
      plan: 'Standard',
      status: v.isActive !== false ? 'Active' : 'Suspended',
      date: new Date(v.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      avatarBg: stringToColor(v.name || 'Vendor'),
    }));

    // System Alerts
    const systemAlerts = [];
    if (pendingApprovalsCount > 0) {
      systemAlerts.push({
        id: 'alert-pending-vendors',
        type: 'warning',
        title: 'Pending Vendor Approvals',
        message: `${pendingApprovalsCount} vendor application(s) awaiting KYC approval.`,
        actionLabel: 'Review Now',
        actionType: 'review_vendors',
        count: pendingApprovalsCount,
      });
    }

    const expiringSubsCount = vendorSubscriptions.filter(s => {
      if (!s.endDate) return false;
      const diffDays = (new Date(s.endDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    if (expiringSubsCount > 0) {
      systemAlerts.push({
        id: 'alert-expiring-subs',
        type: 'info',
        title: 'Expiring Subscriptions',
        message: `${expiringSubsCount} vendor subscription(s) expire within 7 days.`,
        actionLabel: 'View Subscriptions',
        actionType: 'view_subscriptions',
        count: expiringSubsCount,
      });
    }

    if (openTicketsCount > 0) {
      systemAlerts.push({
        id: 'alert-open-tickets',
        type: 'alert',
        title: 'Open Support Tickets',
        message: `${openTicketsCount} support ticket(s) require super admin response.`,
        actionLabel: 'View Tickets',
        actionType: 'view_tickets',
        count: openTicketsCount,
      });
    }

    if (systemAlerts.length === 0) {
      systemAlerts.push({
        id: 'alert-system-healthy',
        type: 'success',
        title: 'All Systems Operational',
        message: 'No pending critical alerts across payments, verification, or tickets.',
        actionLabel: 'System Status',
        actionType: 'system_status',
        count: 0,
      });
    }

    return NextResponse.json({
      success: true,
      timeframe,
      stats: {
        totalVendors: totalVendors ?? 0,
        activeVendors: activeVendors ?? 0,
        suspendedVendors: suspendedVendors ?? 0,
        pendingApprovals: pendingApprovalsCount ?? 0,
        totalStores: totalStores ?? 0,
        totalProducts: totalProducts ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalOrders: totalOrdersCount ?? 0,
        grossSales: Math.round(grossSales * 100) / 100,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
        refundsTotal: Math.round(refundsTotal * 100) / 100,
        orderBreakdown,
      },
      timeframeData,
      recentOrders,
      recentVendors,
      pendingApplications: pendingApplications.map(p => ({
        id: p._id.toString(),
        name: p.name,
        email: p.email,
        phone: p.phone,
        storeName: p.storeName || `${p.name}'s Shop`,
        businessType: p.businessType || 'sole_trader',
        appliedAt: p.appliedAt ? new Date(p.appliedAt).toLocaleDateString() : 'Recent',
      })),
      systemAlerts,
    });
  } catch (error: any) {
    console.error('Error in /api/admin/dashboard:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// ── Helper: Timeframe Data Series Generator from Live System Data ───────────
function generateTimeframeData(timeframe: string, validOrders: any[], vendorUsers: any[]) {
  const now = new Date();

  if (timeframe === 'daily') {
    const labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
    const salesSeries = [0, 0, 0, 0, 0, 0, 0, 0];
    const vendorGrowthSeries = [0, 0, 0, 0, 0, 0, 0, 0];
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    validOrders.forEach(o => {
      const d = new Date(o.date || o.createdAt);
      if (d >= startOfDay) {
        const bucket = Math.floor(d.getHours() / 3);
        if (bucket >= 0 && bucket < 8) {
          salesSeries[bucket] += (o.total || 0);
        }
      }
    });

    vendorUsers.forEach(v => {
      const d = new Date(v.createdAt || v.appliedAt);
      if (d >= startOfDay) {
        const bucket = Math.floor(d.getHours() / 3);
        if (bucket >= 0 && bucket < 8) {
          vendorGrowthSeries[bucket] += 1;
        }
      }
    });

    return {
      labels,
      salesSeries: salesSeries.map(s => Math.round(s * 100) / 100),
      vendorGrowthSeries,
    };
  }

  if (timeframe === 'monthly') {
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const salesSeries = [0, 0, 0, 0];
    const vendorGrowthSeries = [0, 0, 0, 0];
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    validOrders.forEach(o => {
      const d = new Date(o.date || o.createdAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        let bucket = Math.floor((day - 1) / 7);
        if (bucket > 3) bucket = 3;
        salesSeries[bucket] += (o.total || 0);
      }
    });

    vendorUsers.forEach(v => {
      const d = new Date(v.createdAt || v.appliedAt);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        let bucket = Math.floor((day - 1) / 7);
        if (bucket > 3) bucket = 3;
        vendorGrowthSeries[bucket] += 1;
      }
    });

    return {
      labels,
      salesSeries: salesSeries.map(s => Math.round(s * 100) / 100),
      vendorGrowthSeries,
    };
  }

  if (timeframe === 'yearly') {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesSeries = new Array(12).fill(0);
    const vendorGrowthSeries = new Array(12).fill(0);
    const currentYear = now.getFullYear();

    validOrders.forEach(o => {
      const d = new Date(o.date || o.createdAt);
      if (d.getFullYear() === currentYear) {
        const month = d.getMonth();
        salesSeries[month] += (o.total || 0);
      }
    });

    vendorUsers.forEach(v => {
      const d = new Date(v.createdAt || v.appliedAt);
      if (d.getFullYear() === currentYear) {
        const month = d.getMonth();
        vendorGrowthSeries[month] += 1;
      }
    });

    return {
      labels,
      salesSeries: salesSeries.map(s => Math.round(s * 100) / 100),
      vendorGrowthSeries,
    };
  }

  // Default: Weekly (Past 7 Days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const labels: string[] = [];
  const salesSeries = [0, 0, 0, 0, 0, 0, 0];
  const vendorGrowthSeries = [0, 0, 0, 0, 0, 0, 0];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    labels.push(dayNames[d.getDay()]);
  }

  const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  validOrders.forEach(o => {
    const d = new Date(o.date || o.createdAt);
    if (d >= sevenDaysAgo) {
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
      const idx = 6 - diffDays;
      if (idx >= 0 && idx < 7) {
        salesSeries[idx] += (o.total || 0);
      }
    }
  });

  vendorUsers.forEach(v => {
    const d = new Date(v.createdAt || v.appliedAt);
    if (d >= sevenDaysAgo) {
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
      const idx = 6 - diffDays;
      if (idx >= 0 && idx < 7) {
        vendorGrowthSeries[idx] += 1;
      }
    }
  });

  return {
    labels,
    salesSeries: salesSeries.map(s => Math.round(s * 100) / 100),
    vendorGrowthSeries,
  };
}

function stringToColor(str: string) {
  const colors = ['#818cf8', '#f43f5e', '#fbbf24', '#34d399', '#fb7185', '#2563eb', '#16a34a', '#9333ea'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
