import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { LoginEvent } from '@/models/LoginEvent';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const events = await LoginEvent.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    // Compute stats
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = await LoginEvent.find({ timestamp: { $gte: last24h } }).lean();
    
    const failedLogins24h = recentEvents.filter(e => !e.success).length;
    const successLogins24h = recentEvents.filter(e => e.success).length;
    const uniqueDevices = [...new Set(recentEvents.map(e => `${e.device}-${e.browser}-${e.ip}`))].length;
    const blockedAttempts = recentEvents.filter(e => !e.success && e.failReason === 'User not found').length;

    return NextResponse.json({
      success: true,
      events,
      stats: {
        failedLogins24h,
        successLogins24h,
        uniqueDevices,
        blockedAttempts,
        totalEvents: events.length,
      }
    });
  } catch (error: any) {
    console.error('Login Events fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch login events' }, { status: 500 });
  }
}
