import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendEmail, getEmailTemplate } from '@/lib/email';

/**
 * POST — Request a password reset email
 * Generates a random token, stores it on the user, and emails a reset link.
 */
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to user
    await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { resetToken, resetTokenExpiry } }
    );

    // Build reset URL
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://africart.vercel.app';
    const resetUrl = `${origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    // Send email
    const html = getEmailTemplate(
      'Reset Your Password 🔐',
      `Hi ${user.name},<br><br>We received a request to reset your password. Click the button below to choose a new password.<br><br>This link expires in <b>1 hour</b>. If you didn't request this, you can safely ignore this email.`,
      'Reset Password',
      resetUrl
    );

    await sendEmail(email.toLowerCase(), 'AfriCart: Password Reset Request', html);

    return NextResponse.json({ success: true, message: 'If an account exists, a reset email has been sent.' });
  } catch (error: any) {
    console.error('Password Reset Request Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
