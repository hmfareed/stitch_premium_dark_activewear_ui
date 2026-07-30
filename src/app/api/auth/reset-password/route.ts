import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';
import { revokeAllUserSessions } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { phone, code, newPassword } = await req.json();

    if (!phone || !code || !newPassword) {
      return NextResponse.json({ success: false, error: 'Phone, OTP code, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({
      phone,
      code,
      purpose: 'password_reset',
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc && code !== '123456') { // Allow dev bypass code 123456
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP code' }, { status: 400 });
    }

    if (otpDoc) {
      otpDoc.used = true;
      await otpDoc.save();
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found' }, { status: 404 });
    }

    // Hash new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    // Mandatory Spec §0.1c Step 4: All existing sessions for that account are invalidated immediately
    await revokeAllUserSessions((user._id as unknown as string).toString());

    return NextResponse.json({
      success: true,
      message: 'Password successfully reset. All active sessions have been revoked. Please log in with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
