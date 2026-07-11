import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Referral } from '@/models/Referral';
import { User } from '@/models/User';

/**
 * GET  /api/referrals?email=xxx   — fetch referral code + stats
 * POST /api/referrals             — register a referral (called on signup)
 */

function generateCode(email: string): string {
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 5);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}-${suffix}`;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    // Find or auto-create user's referral code
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = generateCode(email);
      await User.updateOne({ email }, { referralCode });
    }

    // Stats
    const referrals = await Referral.find({ referrerEmail: email }).lean();
    const rewarded  = referrals.filter(r => r.status === 'rewarded').length;
    const totalPts  = referrals.filter(r => r.status === 'rewarded').reduce((s, r) => s + r.rewardPoints, 0);

    return NextResponse.json({ success: true, referralCode, referrals, rewarded, totalPoints: totalPts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { referralCode, referreeEmail, referreeName } = await req.json();

    if (!referralCode || !referreeEmail) {
      return NextResponse.json({ success: false, error: 'referralCode and referreeEmail are required' }, { status: 400 });
    }

    // Find referrer
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 400 });
    }

    // Avoid self-referral
    if (referrer.email === referreeEmail) {
      return NextResponse.json({ success: false, error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check already referred
    const existing = await Referral.findOne({ referrerEmail: referrer.email, referreeEmail });
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already tracked' });
    }

    const doc = await Referral.create({
      referrerEmail: referrer.email,
      referrerName: referrer.name,
      referralCode,
      referreeEmail,
      referreeName,
      status: 'completed',
    });

    // Award 500 points to referrer
    await User.updateOne({ email: referrer.email }, { $inc: { points: 500 } });
    await doc.updateOne({ status: 'rewarded' });

    // Tag referree with referredBy
    await User.updateOne({ email: referreeEmail }, { referredBy: referrer.email });

    return NextResponse.json({ success: true, referral: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
