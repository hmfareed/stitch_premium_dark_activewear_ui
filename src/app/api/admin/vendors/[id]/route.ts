import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';
import { VendorStaff } from '@/models/VendorStaff';
import { Payout } from '@/models/Payout';
import { VendorSubscription } from '@/models/VendorSubscription';
import { VendorApplication } from '@/models/VendorApplication';
import { AuditLog } from '@/models/AuditLog';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const vendor = await User.findById(id).lean();
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    const email = vendor.email || '';
    const phone = vendor.phone || '';

    // Fetch related records in parallel across all 10 tabs
    const [
      stores,
      employees,
      products,
      orders,
      payouts,
      subscription,
      application,
      logs,
    ] = await Promise.all([
      Store.find({ $or: [{ vendorId: id }, { vendorEmail: email }] }).lean(),
      VendorStaff.find({ vendorEmail: email }).lean(),
      Product.find({ vendorEmail: email }).lean(),
      Order.find({ 'products.vendorEmail': email }).sort({ date: -1 }).lean(),
      Payout.find({ vendorEmail: email }).sort({ requestDate: -1 }).lean(),
      VendorSubscription.findOne({ vendorEmail: email }).lean(),
      VendorApplication.findOne({ $or: [{ email }, { phone }] }).lean(),
      AuditLog.find({ $or: [{ adminEmail: email }, { targetId: id }] }).sort({ timestamp: -1 }).limit(20).lean(),
    ]);

    // Unique customers derived from vendor orders
    const customerMap = new Map();
    orders.forEach(o => {
      if (o.customerEmail && !customerMap.has(o.customerEmail)) {
        customerMap.set(o.customerEmail, {
          name: o.customerName || 'Customer',
          email: o.customerEmail,
          phone: o.shippingAddress?.phone || 'N/A',
          totalOrders: 1,
          totalSpent: o.total || 0,
          lastOrderDate: o.date ? new Date(o.date).toLocaleDateString() : 'Recent',
        });
      } else if (o.customerEmail && customerMap.has(o.customerEmail)) {
        const existing = customerMap.get(o.customerEmail);
        existing.totalOrders += 1;
        existing.totalSpent += (o.total || 0);
      }
    });

    const customers = Array.from(customerMap.values());
    const validOrders = orders.filter(o => o.status !== 'Cancelled');
    const totalSales = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        storeName: vendor.storeName || stores[0]?.name || `${vendor.name}'s Store`,
        isVerified: !!vendor.isVerified,
        isActive: vendor.isActive !== false,
        role: vendor.role,
        joinedAt: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      },
      // 10 Tabs Data Payload
      tabs: {
        overview: {
          totalSales,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalStores: stores.length,
          totalEmployees: employees.length,
          rating: 4.8,
          trustTier: stores[0]?.verificationTier || (vendor.isVerified ? 'verified' : 'unverified'),
          commissionRate: 14,
        },
        stores: stores.map(s => ({
          id: s._id.toString(),
          name: s.name,
          slug: s.slug,
          category: s.category,
          status: s.status,
          businessType: s.businessType,
          pickupAddress: s.pickupAddress,
          paystackStatus: s.paystackSubaccountStatus,
        })),
        employees: employees.map(e => ({
          id: e._id.toString(),
          name: e.fullName,
          email: e.email,
          phone: e.phone,
          role: e.role,
          status: e.status,
        })),
        products: products.map(p => ({
          id: p._id.toString(),
          name: p.name,
          price: p.price,
          category: p.category,
          stock: p.stock || 0,
          status: p.moderationStatus || 'Approved',
          image: p.images?.[0] || p.image || '/images/placeholder.png',
        })),
        orders: orders.map(o => ({
          id: o.orderId || `#ORD-${o._id.toString().substring(0, 6)}`,
          customerName: o.customerName,
          customerEmail: o.customerEmail,
          total: o.total,
          status: o.status,
          date: o.date ? new Date(o.date).toLocaleDateString() : 'Recent',
        })),
        customers,
        payments: payouts.map(p => ({
          id: p._id.toString(),
          amount: p.amount,
          status: p.status,
          method: p.paymentMethod,
          accountDetails: p.accountDetails,
          requestDate: p.requestDate ? new Date(p.requestDate).toLocaleDateString() : 'Recent',
        })),
        subscription: subscription ? {
          id: subscription._id.toString(),
          planTier: subscription.planTier,
          planName: subscription.planName,
          status: subscription.status,
          startDate: new Date(subscription.startDate).toLocaleDateString(),
          endDate: new Date(subscription.endDate).toLocaleDateString(),
          amountPaid: subscription.amountPaid,
          autoRenew: subscription.autoRenew,
        } : {
          planTier: 'basic',
          planName: 'Basic Tier',
          status: 'active',
          startDate: 'N/A',
          endDate: 'N/A',
          amountPaid: 0,
          autoRenew: false,
        },
        documents: {
          idDocument: application?.documentUrl || null,
          proofOfAddress: application?.proofOfAddress || null,
          businessRegNumber: application?.businessRegNumber || stores[0]?.businessRegNumber || 'N/A',
          isVerified: !!vendor.isVerified,
        },
        activity: logs.map(l => ({
          id: l._id.toString(),
          action: l.action,
          target: l.target,
          adminName: l.adminName || 'System',
          timestamp: l.timestamp ? new Date(l.timestamp).toLocaleString() : 'Recent',
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendor detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch vendor details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const vendor = await User.findById(id);
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    // Action 1: Edit Profile
    if (action === 'edit_profile') {
      const { name, phone, email, storeName } = body;
      if (name) vendor.name = name;
      if (phone) vendor.phone = phone;
      if (email) vendor.email = email;
      if (storeName) vendor.storeName = storeName;
      await vendor.save();

      return NextResponse.json({ success: true, message: 'Vendor profile updated successfully!' });
    }

    // Action 2: Toggle Status (Suspend / Activate)
    if (action === 'toggle_status') {
      const nextStatus = !vendor.isActive;
      vendor.isActive = nextStatus;
      await vendor.save();

      if (vendor.email) {
        await Store.updateMany(
          { vendorEmail: vendor.email },
          { $set: { status: nextStatus ? 'active' : 'suspended' } }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Vendor ${vendor.name} is now ${nextStatus ? 'Active' : 'Suspended'}.`,
        isActive: nextStatus,
      });
    }

    // Action 3: Reset Password
    if (action === 'reset_password') {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
      }
      vendor.password = await bcrypt.hash(newPassword, 12);
      await vendor.save();

      return NextResponse.json({ success: true, message: `Password reset successfully for ${vendor.name}.` });
    }

    // Action 4: Verify Identity
    if (action === 'verify_identity') {
      const { isVerified, trustTier } = body;
      vendor.isVerified = isVerified !== undefined ? isVerified : true;
      await vendor.save();

      if (vendor.email) {
        await Store.updateMany(
          { vendorEmail: vendor.email },
          { $set: { verificationTier: trustTier || 'verified' } }
        );
      }

      return NextResponse.json({ success: true, message: `Vendor verification updated to ${vendor.isVerified ? 'Verified' : 'Unverified'}.` });
    }

    // Action 5: Assign Subscription
    if (action === 'assign_subscription') {
      const { planTier, durationDays, autoRenew } = body;
      const days = durationDays || 30;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      let sub = await VendorSubscription.findOne({ vendorId: id });
      if (!sub && vendor.email) {
        sub = await VendorSubscription.findOne({ vendorEmail: vendor.email });
      }

      const amountPaid = planTier === 'pro' ? 250 : planTier === 'plus' ? 100 : 50;

      if (sub) {
        sub.planTier = planTier || 'basic';
        sub.planName = `${(planTier || 'basic').toUpperCase()} Plan`;
        sub.status = 'active';
        sub.startDate = new Date();
        sub.endDate = endDate;
        sub.amountPaid = amountPaid;
        sub.autoRenew = autoRenew !== undefined ? autoRenew : true;
        await sub.save();
      } else {
        await VendorSubscription.create({
          vendorId: vendor._id,
          vendorEmail: vendor.email || `${vendor.phone}@africart.local`,
          planTier: planTier || 'basic',
          planName: `${(planTier || 'basic').toUpperCase()} Plan`,
          status: 'active',
          startDate: new Date(),
          endDate,
          amountPaid,
          currency: 'GHS',
          autoRenew: autoRenew !== undefined ? autoRenew : true,
        });
      }

      return NextResponse.json({ success: true, message: `Subscription plan updated to ${planTier.toUpperCase()}!` });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update vendor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const vendor = await User.findById(id);
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    // Deactivate vendor and suspend store
    vendor.isActive = false;
    await vendor.save();

    if (vendor.email) {
      await Store.updateMany(
        { vendorEmail: vendor.email },
        { $set: { status: 'suspended' } }
      );
    }

    return NextResponse.json({ success: true, message: `Vendor ${vendor.name} has been removed/suspended.` });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete vendor' }, { status: 500 });
  }
}
