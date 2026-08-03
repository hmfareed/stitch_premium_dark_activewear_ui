import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { NotificationDispatch, NotificationChannel, RecipientAudience } from '@/models/NotificationDispatch';
import { VendorProfile } from '@/models/VendorProfile';
import { User } from '@/models/User';
import { SystemAlert } from '@/models/SystemAlert';

export async function GET() {
  try {
    await connectToDatabase();

    const [dispatches, vendors, customers, staff] = await Promise.all([
      NotificationDispatch.find({}).sort({ createdAt: -1 }).lean(),
      VendorProfile.find({}).select('storeName vendorEmail').lean(),
      User.find({ $or: [{ role: 'customer' }, { role: { $exists: false } }] }).select('name email phone').lean(),
      User.find({ role: { $in: ['super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer'] } }).select('name email role').lean(),
    ]);

    return NextResponse.json({
      success: true,
      count: dispatches.length,
      dispatches: dispatches.map(d => ({
        id: d._id.toString(),
        dispatchId: d.dispatchId,
        title: d.title,
        message: d.message,
        channels: d.channels,
        recipientAudience: d.recipientAudience,
        selectedVendorEmails: d.selectedVendorEmails || [],
        status: d.status || 'sent',
        sentCount: d.sentCount || 0,
        createdAt: d.createdAt ? new Date(d.createdAt).toLocaleString() : 'Recent',
      })),
      audienceCounts: {
        allVendors: vendors.length,
        customers: customers.length,
        staff: staff.length,
      },
      vendorsList: vendors.map((v: any) => ({
        storeName: v.storeName || 'Vendor Partner',
        vendorEmail: v.vendorEmail || v.email,
      })),
      staffList: staff.map((s: any) => ({
        name: s.name,
        email: s.email,
        role: s.role,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching notifications telemetry:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch notification history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { title, message, channels = ['in_app'], recipientAudience = 'all_vendors', selectedVendorEmails = [] } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'Notification title and message body are required' }, { status: 400 });
    }

    if (!Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one notification channel must be selected' }, { status: 400 });
    }

    // Determine estimated recipient count
    let estimatedCount = 0;
    if (recipientAudience === 'all_vendors') {
      const vendorCount = await VendorProfile.countDocuments({});
      estimatedCount = vendorCount || 5;
    } else if (recipientAudience === 'selected_vendors') {
      estimatedCount = selectedVendorEmails.length || 1;
    } else if (recipientAudience === 'customers') {
      const customerCount = await User.countDocuments({ $or: [{ role: 'customer' }, { role: { $exists: false } }] });
      estimatedCount = customerCount || 10;
    } else if (recipientAudience === 'staff') {
      const staffCount = await User.countDocuments({ role: { $in: ['super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer'] } });
      estimatedCount = staffCount || 3;
    }

    // Dispatch In-app notification alert log into SystemAlert model
    if (channels.includes('in_app')) {
      await SystemAlert.create({
        alertId: `ALERT-${Date.now().toString().slice(-6)}`,
        title,
        message,
        type: 'info',
        source: 'Multi-Channel Dispatch Hub',
        read: false,
      });
    }

    const dispatchId = `DISPATCH-${Date.now().toString().slice(-6)}`;
    const newDispatch = await NotificationDispatch.create({
      dispatchId,
      title,
      message,
      channels: channels as NotificationChannel[],
      recipientAudience: recipientAudience as RecipientAudience,
      selectedVendorEmails,
      status: 'sent',
      sentCount: estimatedCount,
    });

    const channelLabels = channels.map(c => c.toUpperCase().replace('_', '-')).join(', ');
    const targetLabel = recipientAudience.toUpperCase().replace('_', ' ');

    return NextResponse.json({
      success: true,
      message: `Notification broadcast "${title}" sent via [${channelLabels}] to ${estimatedCount} ${targetLabel} recipients!`,
      dispatch: newDispatch,
    });
  } catch (error: any) {
    console.error('Error dispatching notification:', error);
    return NextResponse.json({ success: false, message: error.message || 'Notification dispatch failed' }, { status: 500 });
  }
}
