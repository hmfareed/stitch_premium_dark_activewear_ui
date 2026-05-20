import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendEmail, getEmailTemplate } from '@/lib/email';

/**
 * POST — Send a verification email to the user
 * Generates a 6-digit OTP code stored on the user record.
 */
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true, message: 'Email is already verified' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP using resetToken field (repurposed)
    await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { resetToken: otp, resetTokenExpiry: expiry } }
    );

    // Send verification email
    const html = getEmailTemplate(
      'Verify Your Email ✉️',
      `Hi ${user.name},<br><br>Your verification code is:<br><br>
      <div style="text-align:center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #c3f400; font-family: monospace;">${otp}</span>
      </div>
      <br>This code expires in <b>15 minutes</b>. If you didn't request this, you can safely ignore this email.`
    );

    await sendEmail(email.toLowerCase(), 'AfriCart: Verify Your Email', html);

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (error: any) {
    console.error('Email Verification Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * PUT — Verify OTP code
 */
export async function PUT(req: Request) {
  try {
    await connectToDatabase();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetToken: code,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Mark as verified and clear the OTP
    await User.updateOne(
      { email: email.toLowerCase() },
      {
        $set: { isVerified: true },
        $unset: { resetToken: '', resetTokenExpiry: '' },
      }
    );

    return NextResponse.json({ success: true, message: 'Email verified successfully!' });
  } catch (error: any) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
