import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Store } from '@/models/Store';
import { VendorApplication } from '@/models/VendorApplication';
import { Order } from '@/models/Order';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, applicationId, vendorId, vendorEmail, title, message, targetRole, rejectionReason } = body;

    if (!action) {
      return NextResponse.json({ success: false, message: 'Action required' }, { status: 400 });
    }

    // Action 1: Approve Vendor Application
    if (action === 'approve_vendor') {
      if (!applicationId) {
        return NextResponse.json({ success: false, message: 'applicationId is required' }, { status: 400 });
      }

      const app = await VendorApplication.findById(applicationId);
      if (!app) {
        return NextResponse.json({ success: false, message: 'Vendor application not found' }, { status: 404 });
      }

      app.status = 'approved';
      app.reviewedAt = new Date();
      await app.save();

      // Ensure user role is updated to vendor and active
      let user = await User.findOne({ phone: app.phone });
      if (!user && app.email) {
        user = await User.findOne({ email: app.email });
      }

      if (user) {
        user.role = 'vendor';
        if (!user.roles.includes('vendor')) user.roles.push('vendor');
        user.isActive = true;
        await user.save();
      }

      // Activate or create store
      if (app.storeHandle || app.storeName) {
        const store = await Store.findOne({ slug: app.storeHandle });
        if (store) {
          store.status = 'active';
          await store.save();
        }
      }

      return NextResponse.json({
        success: true,
        message: `Vendor application for ${app.name} (${app.storeName || 'Store'}) approved successfully.`,
      });
    }

    // Action 2: Reject Vendor Application
    if (action === 'reject_vendor') {
      if (!applicationId) {
        return NextResponse.json({ success: false, message: 'applicationId is required' }, { status: 400 });
      }

      const app = await VendorApplication.findById(applicationId);
      if (!app) {
        return NextResponse.json({ success: false, message: 'Vendor application not found' }, { status: 404 });
      }

      app.status = 'rejected';
      app.rejectionReason = rejectionReason || 'KYC documentation insufficient';
      app.reviewedAt = new Date();
      await app.save();

      return NextResponse.json({
        success: true,
        message: `Vendor application for ${app.name} rejected.`,
      });
    }

    // Action 3: Toggle Vendor Suspension / Active Status
    if (action === 'toggle_vendor_status') {
      let user = null;
      if (vendorId) {
        user = await User.findById(vendorId);
      } else if (vendorEmail) {
        user = await User.findOne({ email: vendorEmail });
      }

      if (!user) {
        return NextResponse.json({ success: false, message: 'Vendor user not found' }, { status: 404 });
      }

      const nextStatus = !user.isActive;
      user.isActive = nextStatus;
      await user.save();

      // Also update linked store if any
      if (user.email) {
        await Store.updateMany(
          { vendorEmail: user.email },
          { $set: { status: nextStatus ? 'active' : 'suspended' } }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Vendor ${user.name} status toggled to ${nextStatus ? 'Active' : 'Suspended'}.`,
        isActive: nextStatus,
      });
    }

    // Action 4: Broadcast System Announcement / Notification
    if (action === 'broadcast_alert') {
      if (!title || !message) {
        return NextResponse.json({ success: false, message: 'Title and message are required' }, { status: 400 });
      }

      // Log notification broadcast action
      console.log(`[SYSTEM BROADCAST] Target: ${targetRole || 'all'} | Title: ${title} | Content: ${message}`);

      return NextResponse.json({
        success: true,
        message: `Broadcast message "${title}" published to ${targetRole || 'all users'}.`,
      });
    }

    // Action 5: Export CSV Report
    if (action === 'export_report') {
      const [totalVendors, totalCustomers, allOrders] = await Promise.all([
        User.countDocuments({ $or: [{ role: 'vendor' }, { roles: 'vendor' }] }),
        User.countDocuments({ role: { $in: ['customer', undefined, ''] } }),
        Order.find({}).lean(),
      ]);

      const totalOrdersCount = allOrders.length;
      const validOrders = allOrders.filter(o => o.status !== 'Cancelled');
      const grossSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      const csvHeader = 'Report Name,Generated Date,Total Revenue (GHS),Total Orders,Total Vendors,Total Customers\n';
      const csvData = `AfriCart System Executive Summary,${new Date().toISOString()},${grossSales.toFixed(2)},${totalOrdersCount},${totalVendors},${totalCustomers}\n`;
      const fullCsv = csvHeader + csvData;

      return NextResponse.json({
        success: true,
        message: 'Report exported successfully.',
        csvContent: fullCsv,
        filename: `africart_executive_report_${Date.now()}.csv`,
      });
    }

    return NextResponse.json({ success: false, message: 'Unsupported quick action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/quick-actions:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
