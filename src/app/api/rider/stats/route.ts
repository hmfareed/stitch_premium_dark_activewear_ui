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
    const todayEntries = rider.earningsHistory.filter((e: { date: Date }) => new Date(e.date) >= today);
    const todayDeliveries = todayEntries.length;

    // Breakdown
    const baseFare = todayEntries.reduce((sum: number, e: any) => sum + (e.baseFare || e.amount * 0.7), 0);
    const incentives = todayEntries.reduce((sum: number, e: any) => sum + (e.incentives || e.amount * 0.2), 0);
    const tips = todayEntries.reduce((sum: number, e: any) => sum + (e.tips || e.amount * 0.1), 0);

    // Hourly distribution (12AM, 4AM, 8AM, 12PM, 4PM, 8PM, 11PM)
    const hourlyDistribution = [0, 0, 0, 0, 0, 0, 0];
    todayEntries.forEach((e: any) => {
      const hour = new Date(e.date).getHours();
      if (hour < 4) hourlyDistribution[0] += e.amount;
      else if (hour < 8) hourlyDistribution[1] += e.amount;
      else if (hour < 12) hourlyDistribution[2] += e.amount;
      else if (hour < 16) hourlyDistribution[3] += e.amount;
      else if (hour < 20) hourlyDistribution[4] += e.amount;
      else if (hour < 23) hourlyDistribution[5] += e.amount;
      else hourlyDistribution[6] += e.amount;
    });

    return NextResponse.json({
      todayEarnings,
      weekEarnings,
      monthEarnings,
      totalDeliveries: rider.totalDeliveries || 0,
      todayDeliveries,
      rating: rider.averageRating || 0,
      onTimeRate: rider.onTimeDeliveryRate || 0,
      avgDeliveryTime: rider.avgDeliveryTime || 0,
      baseFare,
      incentives,
      tips,
      hourlyDistribution,
      walletBalance: rider.walletBalance || 0,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching rider stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

