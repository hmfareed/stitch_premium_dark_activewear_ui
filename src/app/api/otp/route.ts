import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { OTP } from '@/models/OTP';
import { sendSMS } from '@/lib/sms';

/**
 * POST /api/otp  — generate & send OTP
 * Body: { phone, purpose? }
 *
 * GET  /api/otp  — verify OTP
 * Query: ?phone=xxx&code=xxx
 */

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { phone, purpose = 'checkout' } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    // Invalidate any existing unused OTPs for this phone
    await OTP.deleteMany({ phone, used: false });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min TTL

    await OTP.create({ phone, code, purpose, expiresAt });

    const message = `Your AfriCart verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
    const smsResult = await sendSMS(phone, message);

    return NextResponse.json({
      success: true,
      simulated: smsResult.simulated ?? false,
      message: smsResult.simulated
        ? `[DEV] OTP sent (simulated). Code: ${code}`
        : 'OTP sent successfully',
    });
  } catch (error: any) {
    console.error('OTP send error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const code  = searchParams.get('code');

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'phone and code are required' }, { status: 400 });
    }

    const otpDoc = await OTP.findOne({
      phone,
      code,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 });
    }

    otpDoc.used = true;
    await otpDoc.save();

    return NextResponse.json({ success: true, message: 'OTP verified' });
  } catch (error: any) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
