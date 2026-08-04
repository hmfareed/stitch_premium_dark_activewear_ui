import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { User } from '@/models/User';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean() as any;

    const staffMembers = store?.staffMembers || [
      { id: 'stf-1', name: 'Kojo Mensah', email: 'kojo@africart.com', role: 'Store Manager', branch: 'Accra Central Hub', shift: 'Morning Shift (8AM - 4PM)', salesPerformance: 12450.00, status: 'Active', joinedDate: 'Jan 10, 2026' },
      { id: 'stf-2', name: 'Esi Addo', email: 'esi@africart.com', role: 'POS Cashier', branch: 'Osu Branch', shift: 'Evening Shift (4PM - 10PM)', salesPerformance: 6800.00, status: 'Active', joinedDate: 'Feb 14, 2026' },
      { id: 'stf-3', name: 'Yaw Boateng', email: 'yaw@africart.com', role: 'Inventory Specialist', branch: 'East Legon Warehouse', shift: 'Morning Shift (8AM - 4PM)', salesPerformance: 0.00, status: 'Active', joinedDate: 'Mar 1, 2026' },
    ];

    const roles = [
      { name: 'Store Manager', count: 1, permissionsCount: 12, description: 'Full administrative access to store products, POS, orders, staff, and analytics.' },
      { name: 'POS Cashier', count: 1, permissionsCount: 4, description: 'Access limited to POS Terminal checkout, cart discounts, and held sales.' },
      { name: 'Inventory Specialist', count: 1, permissionsCount: 6, description: 'Manage stock adjustments, inter-branch transfers, and purchase orders.' },
      { name: 'Fulfillment Agent', count: 0, permissionsCount: 3, description: 'Manage order packing, waybill labels, and courier assignments.' },
    ];

    const attendanceRoster = store?.attendanceRoster || [
      { id: 'att-101', name: 'Kojo Mensah', date: 'Aug 4, 2026', clockIn: '07:55 AM', clockOut: '04:05 PM', hours: '8.1 hrs', status: 'Present' },
      { id: 'att-102', name: 'Esi Addo', date: 'Aug 4, 2026', clockIn: '04:12 PM', clockOut: 'In Shift', hours: 'In Progress', status: 'Late' },
      { id: 'att-103', name: 'Yaw Boateng', date: 'Aug 4, 2026', clockIn: '08:00 AM', clockOut: '04:00 PM', hours: '8.0 hrs', status: 'Present' },
    ];

    const activityLogs = store?.staffActivityLogs || [
      { id: 'log-501', name: 'Esi Addo', action: 'Processed POS Checkout #POS-9481 (GH₵ 450.00)', ip: '102.176.45.12', device: 'Chrome / Windows', timestamp: 'Today at 04:32 PM' },
      { id: 'log-502', name: 'Kojo Mensah', action: 'Approved Customer Return #RET-9812', ip: '102.176.45.10', device: 'Safari / macOS', timestamp: 'Today at 02:15 PM' },
      { id: 'log-503', name: 'Yaw Boateng', action: 'Executed Stock In (+100 units)', ip: '102.176.45.18', device: 'Firefox / Android', timestamp: 'Today at 09:30 AM' },
    ];

    return NextResponse.json({
      success: true,
      staffMembers,
      roles,
      attendanceRoster,
      activityLogs,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/staff error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { action, staff } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (action === 'add_staff') {
      const existingStaff = (store.get('staffMembers') as any[]) || [
        { id: 'stf-1', name: 'Kojo Mensah', email: 'kojo@africart.com', role: 'Store Manager', branch: 'Accra Central Hub', shift: 'Morning Shift (8AM - 4PM)', salesPerformance: 12450.00, status: 'Active', joinedDate: 'Jan 10, 2026' },
      ];

      const newMember = {
        id: `stf-${Date.now().toString(36)}`,
        name: staff.name,
        email: staff.email,
        role: staff.role || 'POS Cashier',
        branch: staff.branch || 'Accra Central Hub',
        shift: staff.shift || 'Morning Shift (8AM - 4PM)',
        salesPerformance: 0.00,
        status: 'Active',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      existingStaff.push(newMember);
      store.set('staffMembers', existingStaff);
      await store.save();

      return NextResponse.json({
        success: true,
        staffMembers: existingStaff,
        message: `Employee ${staff.name} added to staff directory!`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/staff error:', error);
    return NextResponse.json({ error: error.message || 'Staff action failed' }, { status: 500 });
  }
}
