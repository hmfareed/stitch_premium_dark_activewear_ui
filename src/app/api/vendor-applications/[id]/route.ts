import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { VendorApplication } from '@/models/VendorApplication';
import { User } from '@/models/User';
import { VendorProfile } from '@/models/VendorProfile';
import { VendorSubscription } from '@/models/VendorSubscription';
import { sendSMS } from '@/lib/sms';
import { sendEmail } from '@/lib/email';

/** GET /api/vendor-applications/[id] — fetch a single application */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const application = await VendorApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('Fetch Application Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/** PATCH /api/vendor-applications/[id] — approve or reject a single application */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { status, rejectionReason, trustTier, commissionRate } = await req.json();

    const application = await VendorApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    application.status     = status;
    application.reviewedAt = new Date();
    if (rejectionReason)             application.rejectionReason = rejectionReason;
    if (trustTier)                   application.trustTier       = trustTier;
    if (commissionRate !== undefined) application.commissionRate  = commissionRate;
    await application.save();

    if (status === 'approved') {
      // Promote user to vendor role and mark active
      const user = await User.findOneAndUpdate(
        { email: application.email.toLowerCase() },
        {
          role: 'vendor',
          isActive: true,
          isVerified: trustTier !== 'unverified',
          storeName: application.storeName || '',
        },
        { new: true }
      );

      // Synchronize VendorProfile status to approved
      if (user) {
        const vendorProfile = await VendorProfile.findOneAndUpdate(
          { userId: user._id },
          {
            status: 'approved',
            subscriptionTier: 'trial',
            businessName: application.storeName || user.name,
            businessCategory: application.storeCategories?.[0] || 'Fashion',
            momoNumber: application.payoutDetails?.momoNumber || '',
          },
          { upsert: true, new: true }
        );

        // ── Auto-enroll in 30-day free trial (Phase 9.2 step 4) ─────────────
        // Check no active subscription already exists
        const existingSub = await VendorSubscription.findOne({
          vendorId: user._id,
          status: 'active',
        });
        if (!existingSub) {
          const trialStart = new Date();
          const trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000);
          const gracePeriodEnd = new Date(trialEnd.getTime() + 3 * 24 * 60 * 60 * 1000);
          await VendorSubscription.create({
            vendorId: user._id,
            vendorEmail: user.email?.toLowerCase() || application.email.toLowerCase(),
            storeId: vendorProfile?._id, // may be null until store is created
            planTier: 'trial',
            planName: 'Free Trial',
            status: 'active',
            startDate: trialStart,
            endDate: trialEnd,
            gracePeriodEndDate: gracePeriodEnd,
            amountPaid: 0,
            currency: 'GHS',
            autoRenew: false,
            remindersSent: [],
          });
          console.log(`[vendor-approval] Trial subscription auto-created for ${user.email} — expires ${trialEnd.toISOString()}`);
        }
      }

      // SMS
      if (application.phone) {
        await sendSMS(
          application.phone,
          `Congratulations ${application.name}! Your AfriCart vendor application has been APPROVED. ` +
          `Log in to set up your store: africart-one.vercel.app/vendor`
        );
      }

      // Email
      try {
        await sendEmail(
          application.email,
          'AfriCart — Your Store is Approved! 🎉',
          `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2>🎉 You're Approved!</h2>
            <p>Hi ${application.name}, your AfriCart vendor application has been <strong>approved</strong>.</p>
            <p>Trust tier: <strong>${trustTier || 'Unverified'}</strong></p>
            <p>Log in and set up your store: <a href="https://africart-one.vercel.app/vendor">africart-one.vercel.app/vendor</a></p>
          </div>`
        );
      } catch (e) { /* best-effort */ }
    }

    if (status === 'rejected') {
      const user = await User.findOneAndUpdate(
        { email: application.email.toLowerCase() },
        { isActive: false }
      );
      if (user) {
        await VendorProfile.findOneAndUpdate(
          { userId: user._id },
          { status: 'rejected' }
        );
      }

      // SMS
      if (application.phone) {
        await sendSMS(
          application.phone,
          `AfriCart: Your vendor application was not approved at this time. ` +
          `Reason: ${rejectionReason || 'See email for details'}. ` +
          `You may reapply after 30 days.`
        );
      }

      // Email
      try {
        await sendEmail(
          application.email,
          'AfriCart — Application Update',
          `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2>Application Update</h2>
            <p>Hi ${application.name}, unfortunately your AfriCart vendor application was not approved at this time.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            <p>You are welcome to reapply after 30 days with updated documentation.</p>
          </div>`
        );
      } catch (e) { /* best-effort */ }
    }

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('PATCH Application Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/** DELETE /api/vendor-applications/[id] — hard delete (super admin only) */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await VendorApplication.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Application Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
