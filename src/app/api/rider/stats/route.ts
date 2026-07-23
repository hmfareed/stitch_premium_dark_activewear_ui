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

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = rider.earningsHistory
      .filter((e: { date: Date }) => new Date(e.date) >= today)
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);

    // Calculate week's earnings
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekEarnings = rider.earningsHistory
      .filter((e: { date: Date }) => new Date(e.date) >= weekAgo)
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);

    // Calculate month's earnings
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthEarnings = rider.earningsHistory
      .filter((e: { date: Date }) => new Date(e.date) >= monthAgo)
      .reduce((sum: number, e: { amount: number }) => sum + e.amount, 0);

    // Calculate today's deliveries
    const todayDeliveries = rider.earningsHistory.filter((e: { date: Date }) => new Date(e.date) >= today).length;

    return NextResponse.json({
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalDeliveries: rider.totalDeliveries,
      todayDeliveries,
      rating: rider.averageRating,
      onTimeRate: rider.onTimeDeliveryRate,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching rider stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
