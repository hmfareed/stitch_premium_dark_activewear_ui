import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Order } from '@/models/Order';
import { Review } from '@/models/Review';
import { SupportTicket } from '@/models/SupportTicket';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let customer = await User.findById(id).lean();
    if (!customer) {
      customer = await User.findOne({ email: id.toLowerCase() }).lean();
    }

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    const email = customer.email || '';
    const phone = customer.phone || '';

    // Fetch related items for feature tabs
    const [orders, reviews, tickets] = await Promise.all([
      Order.find({ $or: [{ customerEmail: email }, { customerPhone: phone }] }).sort({ date: -1 }).lean(),
      Review.find({ userEmail: email }).sort({ createdAt: -1 }).lean(),
      SupportTicket.find({ $or: [{ customerEmail: email }, { userPhone: phone }] }).sort({ createdAt: -1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email || 'N/A',
        phone: customer.phone,
        role: customer.role || 'customer',
        isActive: customer.isActive !== false,
        isBlacklisted: !!customer.isBlacklisted,
        blacklistReason: customer.blacklistReason || null,
        twoFactorEnabled: !!customer.twoFactorEnabled,
        points: customer.points || 0,
        walletBalance: customer.walletBalance || 0,
        savedAddresses: customer.savedAddresses || [],
        createdAt: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A',
      },
      orders: orders.map((o: any) => ({
        id: o._id.toString(),
        orderId: o.orderId,
        total: o.total,
        status: o.status,
        date: o.date ? new Date(o.date).toLocaleDateString() : 'N/A',
        itemCount: o.items ? o.items.length : 0,
      })),
      reviews: reviews.map((r: any) => ({
        id: r._id.toString(),
        productName: r.productName || 'Product Item',
        rating: r.rating || 5,
        comment: r.comment || '',
        status: r.isApproved ? 'Approved' : 'Pending',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A',
      })),
      tickets: tickets.map((t: any) => ({
        id: t._id.toString(),
        ticketNumber: t.ticketNumber || `TKT-${t._id.toString().slice(-6)}`,
        subject: t.subject,
        category: t.category || 'General Inquiry',
        status: t.status,
        createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch customer detail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, name, email, phone, pointsDelta, walletDelta, blacklistReason } = body;

    let customer = await User.findById(id);
    if (!customer) {
      customer = await User.findOne({ email: id.toLowerCase() });
    }

    if (!customer) {
      return NextResponse.json({ success: false, message: 'Customer profile not found' }, { status: 404 });
    }

    // Action 1: Update Profile
    if (action === 'update_profile') {
      if (name) customer.name = name;
      if (email) customer.email = email.toLowerCase();
      if (phone) customer.phone = phone;
      await customer.save();

      return NextResponse.json({
        success: true,
        message: `Updated profile details for ${customer.name}!`,
        customer,
      });
    }

    // Action 2: Adjust Loyalty Points
    if (action === 'adjust_points') {
      const delta = parseInt(pointsDelta || 0, 10);
      customer.points = Math.max(0, (customer.points || 0) + delta);
      await customer.save();

      return NextResponse.json({
        success: true,
        message: `Loyalty points for ${customer.name} adjusted by ${delta > 0 ? '+' : ''}${delta}. New total: ${customer.points} points.`,
        points: customer.points,
      });
    }

    // Action 3: Adjust Wallet Balance
    if (action === 'adjust_wallet') {
      const delta = parseFloat(walletDelta || 0);
      customer.walletBalance = Math.max(0, (customer.walletBalance || 0) + delta);
      await customer.save();

      return NextResponse.json({
        success: true,
        message: `Wallet balance for ${customer.name} adjusted by ${delta > 0 ? '+' : ''}GH₵ ${delta.toFixed(2)}. New total: GH₵ ${customer.walletBalance.toFixed(2)}.`,
        walletBalance: customer.walletBalance,
      });
    }

    // Action 4: Toggle Blacklist / Ban Status
    if (action === 'toggle_blacklist') {
      const nextState = !customer.isBlacklisted;
      customer.isBlacklisted = nextState;
      if (nextState) {
        customer.blacklistReason = blacklistReason || 'Account suspended by super admin';
        customer.isActive = false;
      } else {
        customer.isActive = true;
        customer.blacklistReason = undefined;
      }
      await customer.save();

      return NextResponse.json({
        success: true,
        message: `Customer "${customer.name}" ${nextState ? 'Blacklisted & Suspended' : 'Restored & Activated'}.`,
        isBlacklisted: nextState,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid customer action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await User.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Customer account deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete customer' }, { status: 500 });
  }
}
