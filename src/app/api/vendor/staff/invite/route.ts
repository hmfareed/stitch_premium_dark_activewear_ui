import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { OTP } from '@/models/OTP';
import { Store } from '@/models/Store';
import { sendSMS } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { phone, fullName, role = 'order_staff', storeId, vendorEmail } = body;

    if (!phone || !fullName || !storeId) {
      return NextResponse.json({ success: false, error: 'Phone, Full Name, and Store ID are required' }, { status: 400 });
    }

    const store = await Store.findById(storeId);
    const storeName = store?.name || 'Africart Store';

    // Generate 6-digit invite code
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 day invite link

    // Invalidate existing unused staff invites for this phone
    await OTP.deleteMany({ phone, purpose: 'signup_verify', used: false });

    await OTP.create({
      phone,
      code: inviteCode,
      purpose: 'signup_verify',
      orderId: storeId, // attach storeId context
      expiresAt,
    });

    const smsMessage = `You've been invited by ${vendorEmail || 'Store Owner'} to join ${storeName} as ${role.toUpperCase()} on AfriCart! Enter code ${inviteCode} at registration to accept.`;
    const smsResult = await sendSMS(phone, smsMessage);

    return NextResponse.json({
      success: true,
      inviteCode,
      simulated: smsResult.simulated ?? false,
      message: smsResult.simulated
        ? `[DEV] Staff invite SMS sent (simulated). Code: ${inviteCode}`
        : 'Staff invite code sent via SMS.',
    });
  } catch (err: any) {
    console.error('Staff invite error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
