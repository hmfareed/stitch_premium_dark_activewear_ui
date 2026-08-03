import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { VendorSubscription } from '@/models/VendorSubscription';
import { SubscriptionPlan } from '@/models/SubscriptionPlan';
import { VendorProfile } from '@/models/VendorProfile';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    let sub = await VendorSubscription.findById(id).lean();
    if (!sub) {
      sub = await VendorSubscription.findOne({ vendorEmail: id.toLowerCase() }).lean();
    }

    if (!sub) {
      return NextResponse.json({ success: false, message: 'Vendor subscription not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: sub._id.toString(),
        vendorEmail: sub.vendorEmail,
        planTier: sub.planTier,
        planName: sub.planName,
        status: sub.status,
        autoRenew: !!sub.autoRenew,
        startDate: sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A',
        endDate: sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A',
        amountPaid: sub.amountPaid || 0,
        paymentMethod: sub.paymentMethod || 'mobile_money',
        paymentReference: sub.paymentReference || 'N/A',
      },
    });
  } catch (error: any) {
    console.error('Error fetching subscription detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch subscription detail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, targetTier } = body;

    let sub = await VendorSubscription.findById(id);
    if (!sub) {
      sub = await VendorSubscription.findOne({ vendorEmail: id.toLowerCase() });
    }

    if (!sub) {
      return NextResponse.json({ success: false, message: 'Vendor subscription not found' }, { status: 404 });
    }

    // Action 1: Upgrade Subscription Tier
    if (action === 'upgrade') {
      const nextTier = targetTier || (sub.planTier === 'basic' ? 'plus' : sub.planTier === 'plus' ? 'pro' : 'pro');
      const plan = await SubscriptionPlan.findOne({ tier: nextTier });

      sub.previousTier = sub.planTier;
      sub.planTier = nextTier as any;
      sub.planName = plan?.name || nextTier.toUpperCase();
      sub.upgradeDate = new Date();
      sub.status = 'active';
      await sub.save();

      await VendorProfile.findOneAndUpdate(
        { vendorEmail: sub.vendorEmail },
        { subscriptionTier: nextTier }
      );

      return NextResponse.json({
        success: true,
        message: `Upgraded subscription to ${nextTier.toUpperCase()} for ${sub.vendorEmail}!`,
        planTier: nextTier,
      });
    }

    // Action 2: Downgrade Subscription Tier
    if (action === 'downgrade') {
      const nextTier = targetTier || (sub.planTier === 'pro' ? 'plus' : 'basic');
      const plan = await SubscriptionPlan.findOne({ tier: nextTier });

      sub.previousTier = sub.planTier;
      sub.planTier = nextTier as any;
      sub.planName = plan?.name || nextTier.toUpperCase();
      sub.status = 'active';
      await sub.save();

      await VendorProfile.findOneAndUpdate(
        { vendorEmail: sub.vendorEmail },
        { subscriptionTier: nextTier }
      );

      return NextResponse.json({
        success: true,
        message: `Downgraded subscription to ${nextTier.toUpperCase()} for ${sub.vendorEmail}.`,
        planTier: nextTier,
      });
    }

    // Action 3: Pause Subscription
    if (action === 'pause') {
      sub.status = 'paused';
      await sub.save();
      return NextResponse.json({
        success: true,
        message: `Subscription paused for ${sub.vendorEmail}.`,
      });
    }

    // Action 4: Cancel Subscription
    if (action === 'cancel') {
      sub.status = 'cancelled';
      sub.autoRenew = false;
      await sub.save();
      return NextResponse.json({
        success: true,
        message: `Subscription cancelled for ${sub.vendorEmail}.`,
      });
    }

    // Action 5: Toggle Auto Renewal
    if (action === 'toggle_autorenew') {
      const nextAuto = !sub.autoRenew;
      sub.autoRenew = nextAuto;
      await sub.save();
      return NextResponse.json({
        success: true,
        message: `Auto renewal ${nextAuto ? 'Enabled' : 'Disabled'} for ${sub.vendorEmail}.`,
        autoRenew: nextAuto,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating vendor subscription:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update subscription' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const result = await VendorSubscription.deleteOne({ $or: [{ _id: id }, { vendorEmail: id.toLowerCase() }] });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Subscription deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete subscription' }, { status: 500 });
  }
}
