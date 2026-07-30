import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { OTP } from '@/models/OTP';
import { sendSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { identifier, phone, email } = await req.json();
    const searchId = (identifier || phone || email || '').trim();

    if (!searchId) {
      return NextResponse.json({ success: false, error: 'Phone number or email is required' }, { status: 400 });
    }

    const user = await User.findOne({
      $or: [
        { phone: searchId },
        { email: searchId.toLowerCase() },
      ],
    });

    if (!user) {
      // Don't reveal if account exists to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this phone/email, an OTP reset code has been sent.',
      });
    }

    // Generate 6-digit OTP for password reset
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Delete existing unused password_reset OTPs for this user's phone
    await OTP.deleteMany({ phone: user.phone, purpose: 'password_reset', used: false });

    await OTP.create({
      phone: user.phone,
      code,
      purpose: 'password_reset',
      expiresAt,
    });

    const smsMessage = `Your AfriCart password reset verification code is: ${code}. Valid for 10 minutes.`;
    const smsResult = await sendSMS(user.phone, smsMessage);

    return NextResponse.json({
      success: true,
      phone: user.phone,
      simulated: smsResult.simulated ?? false,
      message: smsResult.simulated
        ? `[DEV] Password reset OTP sent (simulated). Code: ${code}`
        : 'Password reset OTP code sent successfully via SMS.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
