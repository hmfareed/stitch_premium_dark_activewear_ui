import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { PaymentTransaction } from '@/models/PaymentTransaction';
import { SupportTicket } from '@/models/SupportTicket';
import { ReturnRequest } from '@/models/ReturnRequest';
import { VendorApplication } from '@/models/VendorApplication';
import { VendorSubscription } from '@/models/VendorSubscription';
import { AuditLog } from '@/models/AuditLog';
import { Notification } from '@/models/Notification';
import { KnowledgeBase } from '@/models/KnowledgeBase';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // 1. Delete all users except super_admin
    const usersResult = await User.deleteMany({ role: { $ne: 'super_admin' } });

    // 2. Clear all business and transactional collections
    const [
      storesResult,
      productsResult,
      ordersResult,
      transactionsResult,
      ticketsResult,
      returnsResult,
      applicationsResult,
      subscriptionsResult,
      auditResult,
      notificationsResult,
      kbResult,
    ] = await Promise.all([
      Store.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      PaymentTransaction.deleteMany({}),
      SupportTicket.deleteMany({}),
      ReturnRequest.deleteMany({}),
      VendorApplication.deleteMany({}),
      VendorSubscription.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
      KnowledgeBase.deleteMany({}),
    ]);

    // 3. Ensure at least one super admin exists
    const superAdminCount = await User.countDocuments({ role: 'super_admin' });
    if (superAdminCount === 0) {
      await User.create({
        name: 'Super Admin',
        email: 'superadmin@africart.com',
        role: 'super_admin',
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database successfully purged for fresh testing. Only Super Admin retained.',
      summary: {
        deletedUsersExceptAdmin: usersResult.deletedCount || 0,
        deletedStores: storesResult.deletedCount || 0,
        deletedProducts: productsResult.deletedCount || 0,
        deletedOrders: ordersResult.deletedCount || 0,
        deletedTransactions: transactionsResult.deletedCount || 0,
        deletedSupportTickets: ticketsResult.deletedCount || 0,
        deletedReturnRequests: returnsResult.deletedCount || 0,
        deletedVendorApplications: applicationsResult.deletedCount || 0,
        deletedSubscriptions: subscriptionsResult.deletedCount || 0,
        deletedAuditLogs: auditResult.deletedCount || 0,
        deletedNotifications: notificationsResult.deletedCount || 0,
        deletedKnowledgeArticles: kbResult.deletedCount || 0,
      },
    });
  } catch (error: any) {
    console.error('Database reset error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Database reset failed' }, { status: 500 });
  }
}
