import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { getSessionFromRequest, revokeAllUserSessions } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const sessionData = await getSessionFromRequest(req.headers);

    if (!sessionData) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const { user, session } = sessionData;

    // Verify current password per spec §0.1d
    if (!user.password || !(await bcrypt.compare(currentPassword, user.password))) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 });
    }

    // Set new bcrypt hash
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Revoke all OTHER sessions except the current one per spec §0.1d
    await revokeAllUserSessions((user._id as unknown as string).toString(), session.token);

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated. All other active sessions have been logged out.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
