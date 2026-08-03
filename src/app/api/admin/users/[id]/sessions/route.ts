import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Session } from '@/models/Session';
import { User } from '@/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const sessions = await Session.find({ userId: id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: sessions.length,
      sessions: sessions.map(s => ({
        id: s._id.toString(),
        sessionId: s.sessionId,
        ip: s.ip || '127.0.0.1',
        userAgent: s.userAgent || 'Chrome / Windows',
        activeRole: s.activeRole,
        expiresAt: new Date(s.expiresAt).toLocaleString(),
        createdAt: new Date(s.createdAt).toLocaleString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user sessions:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId, userId: id });
      return NextResponse.json({ success: true, message: `Session revoked successfully for ${user.name}.` });
    } else {
      await Session.deleteMany({ userId: id });
      return NextResponse.json({ success: true, message: `All active sessions revoked for ${user.name}.` });
    }
  } catch (error: any) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ success: false, message: 'Failed to revoke session' }, { status: 500 });
  }
}
