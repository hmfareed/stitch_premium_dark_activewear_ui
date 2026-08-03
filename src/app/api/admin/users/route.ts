import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, UserRole } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role') || 'all'; // admins | managers | support_staff | auditors | developers | all
    const q = searchParams.get('q') || '';

    const query: any = {};

    if (roleFilter === 'admins') {
      query.role = { $in: ['super_admin', 'admin'] };
    } else if (roleFilter === 'managers') {
      query.role = 'manager';
    } else if (roleFilter === 'support_staff') {
      query.role = 'support_staff';
    } else if (roleFilter === 'auditors') {
      query.role = 'auditor';
    } else if (roleFilter === 'developers') {
      query.role = 'developer';
    } else {
      // Internal staff roles
      query.role = { $in: ['super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer', 'staff'] };
    }

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email || 'N/A',
        phone: u.phone,
        role: u.role,
        isActive: u.isActive !== false,
        isVerified: !!u.isVerified,
        twoFactorEnabled: !!u.twoFactorEnabled,
        invitedBy: u.invitedBy || 'System Admin',
        invitedAt: u.invitedAt ? new Date(u.invitedAt).toLocaleDateString() : 'N/A',
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Recent',
        createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, phone, role, password } = body;

    if (!name || !phone || !role) {
      return NextResponse.json({ success: false, message: 'Name, phone, and role are required' }, { status: 400 });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return NextResponse.json({ success: false, message: 'User with this phone number already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password || 'AdminUser123!', 12);
    const validRole: UserRole = ['super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer'].includes(role)
      ? (role as UserRole)
      : 'admin';

    const newUser = await User.create({
      name,
      phone,
      email: email || undefined,
      password: hashedPassword,
      role: validRole,
      roles: [validRole],
      activeRole: validRole,
      isActive: true,
      isVerified: true,
      twoFactorEnabled: false,
      invitedBy: 'Super Admin',
      invitedAt: new Date(),
    });

    // Log user invitation audit event
    await AuditLog.create({
      adminEmail: 'superadmin@africart.com',
      adminName: 'Super Admin',
      role: 'super_admin',
      action: 'invite_user',
      target: `Invited ${name} (${email || phone}) as ${validRole.toUpperCase()}`,
      targetId: newUser._id.toString(),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `User ${name} invited successfully as ${validRole.toUpperCase()}!`,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Error inviting user:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to invite user' }, { status: 500 });
  }
}
