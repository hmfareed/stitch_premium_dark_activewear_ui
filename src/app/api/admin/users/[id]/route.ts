import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, UserRole } from '@/models/User';
import { Session } from '@/models/Session';
import { AuditLog } from '@/models/AuditLog';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const email = user.email || '';

    // Fetch active sessions & audit logs in parallel
    const [sessions, auditLogs] = await Promise.all([
      Session.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
      AuditLog.find({ $or: [{ adminEmail: email }, { targetId: id }] }).sort({ timestamp: -1 }).limit(20).lean(),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roles: user.roles || [user.role],
        isActive: user.isActive !== false,
        isVerified: !!user.isVerified,
        twoFactorEnabled: !!user.twoFactorEnabled,
        invitedBy: user.invitedBy || 'Super Admin',
        invitedAt: user.invitedAt ? new Date(user.invitedAt).toLocaleDateString() : 'N/A',
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Recent',
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      },
      sessions: sessions.map(s => ({
        id: s._id.toString(),
        sessionId: s.sessionId,
        ip: s.ip || '127.0.0.1',
        userAgent: s.userAgent || 'Chrome / Windows',
        activeRole: s.activeRole,
        expiresAt: new Date(s.expiresAt).toLocaleString(),
        createdAt: new Date(s.createdAt).toLocaleString(),
      })),
      activityHistory: auditLogs.map(l => ({
        id: l._id.toString(),
        action: l.action,
        target: l.target,
        adminName: l.adminName || 'System',
        timestamp: l.timestamp ? new Date(l.timestamp).toLocaleString() : 'Recent',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user detail:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch user details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Action 1: Assign Role
    if (action === 'assign_role') {
      const { role } = body;
      if (!role) {
        return NextResponse.json({ success: false, message: 'Role is required' }, { status: 400 });
      }

      user.role = role as UserRole;
      if (!user.roles.includes(role as UserRole)) {
        user.roles.push(role as UserRole);
      }
      user.activeRole = role as UserRole;
      await user.save();

      await AuditLog.create({
        adminEmail: 'superadmin@africart.com',
        adminName: 'Super Admin',
        role: 'super_admin',
        action: 'assign_role',
        target: `Reassigned ${user.name} role to ${role.toUpperCase()}`,
        targetId: user._id.toString(),
        timestamp: new Date(),
      });

      return NextResponse.json({ success: true, message: `Role updated to ${role.toUpperCase()} for ${user.name}!` });
    }

    // Action 2: Reset Password
    if (action === 'reset_password') {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
      }

      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      return NextResponse.json({ success: true, message: `Password reset successfully for ${user.name}.` });
    }

    // Action 3: Toggle Two-Factor Authentication (2FA)
    if (action === 'toggle_2fa') {
      const next2fa = !user.twoFactorEnabled;
      user.twoFactorEnabled = next2fa;
      await user.save();

      return NextResponse.json({
        success: true,
        message: `Two-Factor Authentication (2FA) ${next2fa ? 'Enabled' : 'Disabled'} for ${user.name}.`,
        twoFactorEnabled: next2fa,
      });
    }

    // Action 4: Toggle Status (Suspend / Activate)
    if (action === 'toggle_status') {
      const nextStatus = !user.isActive;
      user.isActive = nextStatus;
      await user.save();

      return NextResponse.json({
        success: true,
        message: `User ${user.name} status set to ${nextStatus ? 'Active' : 'Suspended'}.`,
        isActive: nextStatus,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    user.isActive = false;
    await user.save();

    // Revoke all active sessions
    await Session.deleteMany({ userId: id });

    return NextResponse.json({ success: true, message: `User ${user.name} deactivated & active sessions revoked.` });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 });
  }
}
