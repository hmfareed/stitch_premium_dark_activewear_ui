import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import { sendEmail, getEmailTemplate } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

/* ── POST /api/stores/[id]/activate — Admin go-live approval ── */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body; // action: 'approve' | 'reject'

    if (!action) {
      return NextResponse.json({ error: 'action is required (approve | reject)' }, { status: 400 });
    }

    const store = await Store.findById(id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.status !== 'under_review') {
      return NextResponse.json({ error: `Store is not under_review (current: ${store.status})` }, { status: 409 });
    }

    const vendor = await User.findOne({ email: store.vendorEmail }).lean() as any;

    if (action === 'approve') {
      store.status = 'active';
      store.goLiveAt = new Date();
      store.contentReviewed = true;
      await store.save();

      // SMS & email to vendor
      if (vendor?.phone) {
        await sendSMS(
          vendor.phone,
          `🎉 Congrats! Your AfriCart store "${store.name}" is now LIVE! Visit africart-one.vercel.app/vendor to start selling.`
        );
      }

      try {
        const html = getEmailTemplate(
          'Your Store is Live! 🎉',
          `Hi ${vendor?.name || 'there'}, your AfriCart store <strong>${store.name}</strong> has been approved and is now live! Your customers can now find you on AfriCart. Head to your vendor dashboard to customise your store and add products.`,
          'Go to My Dashboard',
          'https://africart-one.vercel.app/vendor'
        );
        await sendEmail(store.vendorEmail, 'AfriCart — Your Store is Live! 🎉', html);
      } catch (e) { /* best-effort */ }

      return NextResponse.json({ success: true, store, message: 'Store activated' });
    }

    if (action === 'reject') {
      store.status = 'setup'; // Send back to beginning so they can fix issues
      store.rejectionReason = rejectionReason || 'Your store did not meet AfriCart requirements.';
      await store.save();

      if (vendor?.phone) {
        await sendSMS(
          vendor.phone,
          `AfriCart: Your store "${store.name}" was not approved. Reason: ${store.rejectionReason} Please update and resubmit.`
        );
      }

      try {
        const html = getEmailTemplate(
          'Store Review Update',
          `Hi ${vendor?.name || 'there'}, unfortunately your AfriCart store <strong>${store.name}</strong> was not approved at this time. <br><br><strong>Reason:</strong> ${store.rejectionReason}<br><br>Please update your store details and resubmit for review.`,
          'Update My Store',
          'https://africart-one.vercel.app/vendor/onboarding'
        );
        await sendEmail(store.vendorEmail, 'AfriCart — Store Review Update', html);
      } catch (e) { /* best-effort */ }

      return NextResponse.json({ success: true, store, message: 'Store rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/stores/[id]/activate error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
