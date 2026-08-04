import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
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

    const { searchParams } = new URL(req.url);
    const moduleFilter = searchParams.get('module') || 'all';
    const searchQuery = (searchParams.get('search') || '').toLowerCase();

    const defaultLogs = [
      {
        id: 'log-101',
        userName: 'Mohammed Fareed',
        userEmail: vendorEmail,
        userRole: 'Store Owner',
        action: 'Updated Product Price',
        module: 'Products',
        date: 'Aug 4, 2026 12:24 PM',
        ipAddress: '102.176.54.21 (Accra, GH)',
        device: 'Chrome 124 (Windows 11)',
        oldValue: 'Price: GH₵ 150.00 | Stock: 45',
        newValue: 'Price: GH₵ 180.00 | Stock: 45',
      },
      {
        id: 'log-102',
        userName: 'Kofi Mensah',
        userEmail: 'kofi.cashier@store.com',
        userRole: 'POS Cashier',
        action: 'Processed POS Sale (Split Payment)',
        module: 'POS',
        date: 'Aug 4, 2026 11:45 AM',
        ipAddress: '102.176.54.22 (Accra, GH)',
        device: 'POS Terminal 01 (Android POS)',
        oldValue: 'Cart Total: GH₵ 240.00',
        newValue: 'Payment Collected: Cash (GH₵ 100) + MoMo (GH₵ 140)',
      },
      {
        id: 'log-103',
        userName: 'Ama Serwaa',
        userEmail: 'ama.manager@store.com',
        userRole: 'Branch Manager',
        action: 'Created Discount Coupon',
        module: 'Promotions',
        date: 'Aug 3, 2026 04:15 PM',
        ipAddress: '102.176.54.30 (Kumasi, GH)',
        device: 'Firefox 125 (macOS)',
        oldValue: 'None (New Coupon)',
        newValue: 'Code: SUMMER20 | Discount: 20% OFF',
      },
      {
        id: 'log-104',
        userName: 'Mohammed Fareed',
        userEmail: vendorEmail,
        userRole: 'Store Owner',
        action: 'Updated Tax Rates & GRA VAT',
        module: 'Settings',
        date: 'Aug 2, 2026 02:10 PM',
        ipAddress: '102.176.54.21 (Accra, GH)',
        device: 'Chrome 124 (Windows 11)',
        oldValue: 'VAT Withholding: Disabled',
        newValue: 'VAT Withholding: Enabled (15% VAT + 2.5% NHIL)',
      },
      {
        id: 'log-105',
        userName: 'Yaw Osei',
        userEmail: 'yaw.inventory@store.com',
        userRole: 'Inventory Clerk',
        action: 'Stock Adjustment (Restock)',
        module: 'Inventory',
        date: 'Aug 1, 2026 09:30 AM',
        ipAddress: '102.176.54.44 (Accra, GH)',
        device: 'Safari (iOS 17)',
        oldValue: 'Stock: 12 units',
        newValue: 'Stock: 50 units (+38 restocked)',
      },
    ];

    const logs = store?.activityLogs || defaultLogs;

    let filtered = logs;

    if (moduleFilter !== 'all') {
      filtered = filtered.filter((l: any) => l.module.toLowerCase() === moduleFilter.toLowerCase());
    }

    if (searchQuery) {
      filtered = filtered.filter((l: any) =>
        l.userName.toLowerCase().includes(searchQuery) ||
        l.action.toLowerCase().includes(searchQuery) ||
        l.ipAddress.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      success: true,
      logs: filtered,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/activity-logs error:', error);
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
    const { action, module: modName, oldValue, newValue, ipAddress, device } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const defaultLogs = [
      { id: 'log-101', userName: session.user.name || 'Store User', userEmail: vendorEmail, userRole: 'Store Owner', action: 'Updated Product Price', module: 'Products', date: 'Aug 4, 2026 12:24 PM', ipAddress: '102.176.54.21', device: 'Chrome 124', oldValue: '150', newValue: '180' },
    ];

    const currentLogs = (store.get('activityLogs') as any[]) || defaultLogs;

    const newLog = {
      id: `log-${Date.now()}`,
      userName: session.user.name || 'Store Owner',
      userEmail: vendorEmail,
      userRole: session.user.role || 'Store Owner',
      action: action || 'System Action',
      module: modName || 'General',
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      ipAddress: ipAddress || '102.176.54.21 (Accra, GH)',
      device: device || 'Chrome 124 (Windows 11)',
      oldValue: oldValue || 'N/A',
      newValue: newValue || 'N/A',
    };

    currentLogs.unshift(newLog);
    store.set('activityLogs', currentLogs);
    await store.save();

    return NextResponse.json({ success: true, logs: currentLogs, message: 'Activity log recorded!' });
  } catch (error: any) {
    console.error('POST /api/vendor/activity-logs error:', error);
    return NextResponse.json({ error: error.message || 'Log recording failed' }, { status: 500 });
  }
}
