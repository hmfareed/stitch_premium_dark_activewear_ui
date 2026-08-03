import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuditLog } from '@/models/AuditLog';

// Helper to seed initial sample audit logs if database is empty
async function seedInitialAuditLogs() {
  const count = await AuditLog.countDocuments();
  if (count === 0) {
    const mockLogs = [
      {
        userEmail: 'admin@africart.com',
        userName: 'Super Admin',
        role: 'Super Admin',
        ip: '192.168.1.104',
        browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        module: 'Vendors',
        action: 'APPROVE',
        target: 'GymShark Pro Store',
        targetId: 'VND-88291',
        oldValue: '{"status": "pending_verification", "kycVerified": false}',
        newValue: '{"status": "approved", "kycVerified": true, "approvedBy": "admin@africart.com"}',
        timestamp: new Date(Date.now() - 5 * 60000),
      },
      {
        userEmail: 'finance@africart.com',
        userName: 'Finance Manager',
        role: 'Finance Admin',
        ip: '10.0.4.12',
        browser: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
        module: 'Finance',
        action: 'RELEASE_FUNDS',
        target: 'Vendor Payout #PAY-99021',
        targetId: 'PAY-99021',
        oldValue: '{"payoutStatus": "queued", "amount": 4200.00}',
        newValue: '{"payoutStatus": "disbursed", "gatewayRef": "TXN-8821094"}',
        timestamp: new Date(Date.now() - 22 * 60000),
      },
      {
        userEmail: 'support@africart.com',
        userName: 'Support Lead',
        role: 'Support Staff',
        ip: '192.168.1.118',
        browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/123.0',
        module: 'Support',
        action: 'UPDATE_STATUS',
        target: 'Support Ticket #TCK-4821',
        targetId: 'TCK-4821',
        oldValue: '{"ticketStatus": "open", "assignedTo": null}',
        newValue: '{"ticketStatus": "in_progress", "assignedTo": "support@africart.com"}',
        timestamp: new Date(Date.now() - 45 * 60000),
      },
      {
        userEmail: 'inventory@africart.com',
        userName: 'Stock Auditor',
        role: 'Inventory Manager',
        ip: '172.16.0.44',
        browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/122.0',
        module: 'Inventory',
        action: 'UPDATE',
        target: 'Product #PRD-1029 (Kente Cloth Hoodie)',
        targetId: 'PRD-1029',
        oldValue: '{"stockQuantity": 12, "reserved": 2}',
        newValue: '{"stockQuantity": 150, "restockedBy": "inventory@africart.com"}',
        timestamp: new Date(Date.now() - 120 * 60000),
      },
      {
        userEmail: 'admin@africart.com',
        userName: 'Super Admin',
        role: 'Super Admin',
        ip: '192.168.1.104',
        browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        module: 'Settings',
        action: 'UPDATE',
        target: 'Platform Commission Fee Rule',
        targetId: 'CFG-FEES-01',
        oldValue: '{"commissionRatePercentage": 5.0}',
        newValue: '{"commissionRatePercentage": 4.5, "updatedReason": "Q3 Promo Campaign"}',
        timestamp: new Date(Date.now() - 300 * 60000),
      },
      {
        userEmail: 'admin@africart.com',
        userName: 'Super Admin',
        role: 'Super Admin',
        ip: '192.168.1.104',
        browser: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        module: 'Users',
        action: 'DELETE',
        target: 'Spam Account #USR-9921',
        targetId: 'USR-9921',
        oldValue: '{"userEmail": "bot@spamnet.org", "isBanned": false}',
        newValue: '{"userEmail": "bot@spamnet.org", "isDeleted": true}',
        timestamp: new Date(Date.now() - 86400000),
      },
    ];
    await AuditLog.insertMany(mockLogs);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await seedInitialAuditLogs();

    const { searchParams } = new URL(req.url);
    const userFilter = searchParams.get('user') || '';
    const moduleFilter = searchParams.get('module') || 'all';
    const actionFilter = searchParams.get('action') || 'all';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const q = searchParams.get('q') || '';

    const query: any = {};

    if (moduleFilter && moduleFilter !== 'all') {
      query.module = moduleFilter;
    }

    if (actionFilter && actionFilter !== 'all') {
      query.action = actionFilter;
    }

    if (userFilter) {
      query.$or = [
        { userEmail: { $regex: userFilter, $options: 'i' } },
        { userName: { $regex: userFilter, $options: 'i' } },
      ];
    }

    if (q) {
      const regex = { $regex: q, $options: 'i' };
      query.$or = [
        { userEmail: regex },
        { userName: regex },
        { target: regex },
        { action: regex },
        { module: regex },
        { ip: regex },
      ];
    }

    if (dateFrom || dateTo) {
      query.timestamp = {};
      if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query.timestamp.$lte = endOfDay;
      }
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(200).lean();

    // Distinct filter values for UI dropdowns
    const [allModules, allActions, allUsers] = await Promise.all([
      AuditLog.distinct('module'),
      AuditLog.distinct('action'),
      AuditLog.distinct('userEmail'),
    ]);

    return NextResponse.json({
      success: true,
      logs: logs.map((l: any) => ({
        id: l._id.toString(),
        userEmail: l.userEmail,
        userName: l.userName,
        role: l.role || 'Admin',
        ip: l.ip || '127.0.0.1',
        browser: l.browser || 'Web Browser',
        module: l.module || 'System',
        action: l.action,
        target: l.target,
        targetId: l.targetId,
        oldValue: l.oldValue || null,
        newValue: l.newValue || null,
        timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString(),
      })),
      filterOptions: {
        modules: ['all', ...allModules],
        actions: ['all', ...allActions],
        users: ['all', ...allUsers],
      },
    });
  } catch (error: any) {
    console.error('Error in /api/admin/audit-logs GET:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      userEmail,
      userName,
      role,
      ip,
      browser,
      module,
      action,
      target,
      targetId,
      oldValue,
      newValue,
      metadata,
    } = body;

    if (!userEmail || !action || !target) {
      return NextResponse.json({ success: false, message: 'User email, action, and target description are required' }, { status: 400 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ip || '127.0.0.1';
    const clientBrowser = req.headers.get('user-agent') || browser || 'Chrome Browser';

    const log = await AuditLog.create({
      userEmail,
      userName: userName || userEmail.split('@')[0],
      role: role || 'Admin',
      ip: clientIp,
      browser: clientBrowser,
      module: module || 'System',
      action: action.toUpperCase(),
      target,
      targetId,
      oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue, null, 2) : oldValue,
      newValue: typeof newValue === 'object' ? JSON.stringify(newValue, null, 2) : newValue,
      metadata,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: 'Audit entry recorded successfully', log });
  } catch (error: any) {
    console.error('Error in /api/admin/audit-logs POST:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to record audit entry' }, { status: 500 });
  }
}
