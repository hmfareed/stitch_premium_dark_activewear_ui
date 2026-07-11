import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

/**
 * Loyalty Points System
 * Rate: 1000 points = GH₵1
 *
 * GET  /api/loyalty?email=xxx          — get points balance
 * POST /api/loyalty                    — award or deduct points
 *   body: { email, action: 'award'|'redeem', points, reason }
 */

export const POINTS_PER_CEDI = 1000;

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email }).select('points email name').lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const points = (user as any).points || 0;
    const cedisValue = points / POINTS_PER_CEDI;

    return NextResponse.json({ success: true, points, cedisValue: parseFloat(cedisValue.toFixed(2)) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, action, points, reason } = await req.json();

    if (!email || !action || !points) {
      return NextResponse.json({ success: false, error: 'email, action and points are required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (action === 'redeem') {
      const currentPoints = user.points || 0;
      if (currentPoints < points) {
        return NextResponse.json({ success: false, error: 'Insufficient points' }, { status: 400 });
      }
      user.points = currentPoints - points;
    } else {
      // award
      user.points = (user.points || 0) + points;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      newBalance: user.points,
      cedisValue: parseFloat(((user.points || 0) / POINTS_PER_CEDI).toFixed(2)),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
