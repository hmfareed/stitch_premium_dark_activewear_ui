import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';

/* ── POST /api/stores/[id]/verify ── 
   Runs the 3 baseline verification checks:
   1. Phone verified (from user account)
   2. Paystack subaccount active
   3. Content review (admin-approved or auto-pass for categories that aren't prohibited)
   If all pass → sets status = 'under_review' for admin go-live approval
*/
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const store = await Store.findById(id);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check 1: Phone verified
    const vendor = await User.findOne({ email: store.vendorEmail }).lean() as any;
    const phoneVerified = vendor?.isVerified === true;
    store.phoneVerified = phoneVerified;

    // Check 2: Paystack subaccount active
    const paystackActive = store.paystackSubaccountStatus === 'active';

    // Check 3: Content review — lightweight auto-pass (no prohibited keywords in name/bio)
    const PROHIBITED_KEYWORDS = ['weapon', 'drug', 'gambling', 'scam', 'fake', 'counterfeit', 'xxx', 'adult'];
    const storeText = `${store.name} ${store.storeBio || ''} ${store.category}`.toLowerCase();
    const contentClean = !PROHIBITED_KEYWORDS.some(kw => storeText.includes(kw));
    store.contentReviewed = contentClean;

    const allPassed = phoneVerified && paystackActive && contentClean;

    if (allPassed && store.status === 'payment_pending') {
      store.status = 'under_review';
    } else if (allPassed && store.status !== 'active') {
      store.status = 'under_review';
    }

    await store.save();

    return NextResponse.json({
      success: true,
      checks: {
        phoneVerified,
        paystackActive,
        contentClean,
      },
      allPassed,
      storeStatus: store.status,
    });
  } catch (error: any) {
    console.error('POST /api/stores/[id]/verify error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
