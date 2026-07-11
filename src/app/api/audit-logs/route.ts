import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';

/**
 * GET  /api/audit-logs?limit=50&adminEmail=xxx&action=xxx   — fetch logs
 * POST /api/audit-logs                                        — create log entry
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit      = parseInt(searchParams.get('limit') || '100');
    const adminEmail = searchParams.get('adminEmail');
    const action     = searchParams.get('action');
    const from       = searchParams.get('from');
    const to         = searchParams.get('to');

    const query: any = {};
    if (adminEmail) query.adminEmail = adminEmail;
    if (action)     query.action     = action;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to)   query.timestamp.$lte = new Date(to);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, logs, total: logs.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { adminEmail, adminName, role, action, target, targetId, metadata, ip } = await req.json();

    if (!adminEmail || !action || !target) {
      return NextResponse.json({ success: false, error: 'adminEmail, action, target required' }, { status: 400 });
    }

    const doc = await AuditLog.create({
      adminEmail,
      adminName: adminName || adminEmail,
      role: role || 'Admin',
      action,
      target,
      targetId,
      metadata,
      ip,
    });

    return NextResponse.json({ success: true, log: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
