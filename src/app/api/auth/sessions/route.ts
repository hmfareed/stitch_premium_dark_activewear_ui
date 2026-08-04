import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const currentSession = await getSession();
    if (!currentSession || !currentSession.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await Session.find({
      userId: currentSession.userId,
      expiresAt: { $gt: new Date() },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      currentSessionId: currentSession.sessionId,
      sessions: sessions.map((s: any) => ({
        id: s._id.toString(),
        sessionId: s.sessionId,
        ip: s.ip || '127.0.0.1',
        userAgent: s.userAgent || 'Unknown Device',
        activeRole: s.activeRole || 'customer',
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString(),
        expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString() : new Date().toISOString(),
        isCurrent: s.sessionId === currentSession.sessionId,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const currentSession = await getSession();
    if (!currentSession || !currentSession.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetSessionId = searchParams.get('sessionId');
    const revokeAllOthers = searchParams.get('revokeAllOthers') === 'true';
    const revokeAll = searchParams.get('revokeAll') === 'true';

    if (revokeAll) {
      // Master action: Logout from all devices
      await Session.deleteMany({ userId: currentSession.userId });
      return NextResponse.json({
        success: true,
        message: 'Logged out from all devices successfully.',
      });
    }

    if (revokeAllOthers) {
      // Revoke all other active sessions except current
      await Session.deleteMany({
        userId: currentSession.userId,
        sessionId: { $ne: currentSession.sessionId },
      });
      return NextResponse.json({
        success: true,
        message: 'All other active sessions have been revoked.',
      });
    }

    if (targetSessionId) {
      // Revoke specific session ID
      await Session.deleteOne({
        userId: currentSession.userId,
        $or: [{ sessionId: targetSessionId }, { _id: targetSessionId }],
      });
      return NextResponse.json({
        success: true,
        message: 'Session revoked successfully.',
      });
    }

    return NextResponse.json({ error: 'Missing target session action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ error: error.message || 'Failed to revoke session' }, { status: 500 });
  }
}
