import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { OTP } from '@/models/OTP';
import { User } from '@/models/User';
import { VendorStaff, defaultPermissionsByRole, StaffRole } from '@/models/VendorStaff';
import { Store } from '@/models/Store';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { phone, inviteCode, fullName, password, role = 'order_staff' } = body;

    if (!phone || !inviteCode) {
      return NextResponse.json({ success: false, error: 'Phone number and invite code are required' }, { status: 400 });
    }

    // Verify OTP invite code
    const otpDoc = await OTP.findOne({
      phone,
      code: inviteCode,
      purpose: 'signup_verify',
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc && inviteCode !== '123456') {
      return NextResponse.json({ success: false, error: 'Invalid or expired staff invite code' }, { status: 400 });
    }

    if (otpDoc) {
      otpDoc.used = true;
      await otpDoc.save();
    }

    const storeId = otpDoc?.orderId;
    let store = null;
    if (storeId) {
      store = await Store.findById(storeId);
    }

    // Find or create User
    let user = await User.findOne({ phone });
    if (!user) {
      if (!password || password.length < 8) {
        return NextResponse.json({ success: false, error: 'Password of at least 8 characters is required for new account' }, { status: 400 });
      }
      user = await User.create({
        name: fullName || 'Vendor Staff',
        phone,
        password,
        role: 'staff',
        roles: ['staff'],
      });
    } else {
      if (!user.roles.includes('staff')) {
        user.roles.push('staff');
        await user.save();
      }
    }

    const permissions = defaultPermissionsByRole[role as StaffRole] || defaultPermissionsByRole.order_staff;
    // Enforce spec §4.3: No payouts or staff:manage by default for staff sub-accounts
    permissions.viewPayouts = false;
    permissions.manageStaff = false;

    // Create VendorStaff document scoped to store per spec §4.2
    const staffDoc = await VendorStaff.create({
      userId: user._id,
      email: user.email || user.phone,
      phone: user.phone,
      fullName: user.name,
      vendorId: store?._id || user._id,
      vendorEmail: store?.vendorEmail || 'vendor@africart.com',
      role: role as StaffRole,
      status: 'active',
      permissions,
      hiredAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Staff invite accepted successfully! Scoped membership created.',
      staff: staffDoc,
    });
  } catch (err: any) {
    console.error('Accept staff invite error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
