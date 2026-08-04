import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const body = await req.json();
    const { taxId, ghanaCardId, registrationDocUrl, ghanaCardDocUrl } = body;

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail });

    if (!store) {
      return NextResponse.json({ error: 'Store document not found. Please complete Step 1 first.' }, { status: 404 });
    }

    if (taxId) store.taxId = taxId.trim();
    if (ghanaCardId) store.ghanaCardId = ghanaCardId.trim();
    if (registrationDocUrl) store.registrationDocUrl = registrationDocUrl;
    if (ghanaCardDocUrl) store.ghanaCardDocUrl = ghanaCardDocUrl;
    store.verificationTier = 'Tier 2';

    await store.save();

    return NextResponse.json({
      success: true,
      store,
      message: 'Business verification documents submitted successfully!',
    });
  } catch (error: any) {
    console.error('POST /api/vendor/onboarding/verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification submission failed' }, { status: 500 });
  }
}
