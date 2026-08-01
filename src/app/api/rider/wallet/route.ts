import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Rider } from '@/models/Rider';
import { verifyToken } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();

    const rider = await Rider.findOne({ email: decoded.email });
    if (!rider) {
      return NextResponse.json({ message: 'Rider not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      walletBalance: rider.walletBalance || 0,
      totalEarnings: rider.totalEarnings || 0,
      earningsHistory: rider.earningsHistory || [],
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching rider wallet:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
