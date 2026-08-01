import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { VendorApplication } from '@/models/VendorApplication';
import { User } from '@/models/User';
import { VendorProfile } from '@/models/VendorProfile';
import { sendSMS } from '@/lib/sms';
import { sendEmail } from '@/lib/email';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const status = url.searchParams.get('status'); // pending | approved | rejected
    const email  = url.searchParams.get('email');

    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (email)  query.email  = email;

    const applications = await VendorApplication.find(query).sort({ appliedAt: -1 });
    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error('Fetch Applications Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();

    // Check for existing pending application
    const existing = await VendorApplication.findOne({ email: data.email, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'You already have a pending application.' }, { status: 400 });
    }

    const application = await VendorApplication.create({
      ...data,
      appliedAt: new Date(),
      status: 'pending',
      trustTier: 'unverified',
    });

    // Send submission confirmation SMS
    if (data.phone) {
      await sendSMS(data.phone,
        `AfriCart: Your ${data.role} application has been submitted successfully. ` +
        `We will review and respond within 24-48 hours. Ref: ${application._id}`
      );
    }

    // Send submission confirmation email
    try {
      await sendEmail(
        data.email,
        'AfriCart — Application Received',
        `<div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2>Application Received ✅</h2>
          <p>Hi ${data.name}, thanks for applying to join AfriCart as a <strong>${data.role}</strong>.</p>
          <p>Our team will review your application and respond within <strong>24–48 hours</strong>.</p>
          <p>Application reference: <code>${application._id}</code></p>
          <p>Check your status at: <a href="https://africart-one.vercel.app/apply/status">africart-one.vercel.app/apply/status</a></p>
        </div>`
      );
    } catch (e) { /* email is best-effort */ }

    return NextResponse.json({ success: true, application, applicationId: application._id });
  } catch (error: any) {
    console.error('Create Application Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { id, status, rejectionReason, trustTier, commissionRate } = await req.json();

    const application = await VendorApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    application.status      = status;
    application.reviewedAt  = new Date();
    if (rejectionReason) application.rejectionReason = rejectionReason;
    if (trustTier)       application.trustTier       = trustTier;
    if (commissionRate !== undefined) application.commissionRate = commissionRate;
    await application.save();

    if (status === 'approved') {
      // Promote user role to vendor with trust tier + store name
      const user = await User.findOneAndUpdate(
        { email: application.email },
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
        await VendorProfile.findOneAndUpdate(
          { userId: user._id },
          {
            status: 'approved',
            businessName: application.storeName || user.name,
            businessCategory: application.storeCategories?.[0] || 'Fashion',
            momoNumber: application.payoutDetails?.momoNumber || '',
          },
          { upsert: true, new: true }
        );
      }

      // SMS approval notification
      if (application.phone) {
        await sendSMS(application.phone,
          `Congratulations ${application.name}! Your AfriCart vendor application has been APPROVED. ` +
          `Log in to set up your store: africart-one.vercel.app/vendor`
        );
      }

      // Email approval
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
      const user = await User.findOne({ email: application.email });
      if (user) {
        await VendorProfile.findOneAndUpdate(
          { userId: user._id },
          { status: 'rejected' }
        );
      }

      // SMS rejection notification
      if (application.phone) {
        await sendSMS(application.phone,
          `AfriCart: Your vendor application was not approved at this time. ` +
          `Reason: ${rejectionReason || 'See email for details'}. ` +
          `You may reapply after 30 days.`
        );
      }

      // Email rejection
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
    console.error('Update Application Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
