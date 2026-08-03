import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all'; // all | active | blacklisted
    const q = searchParams.get('q') || '';

    const query: any = {
      $or: [{ role: 'customer' }, { role: { $exists: false } }],
    };

    if (statusFilter === 'active') {
      query.isActive = true;
      query.isBlacklisted = { $ne: true };
    } else if (statusFilter === 'blacklisted') {
      query.isBlacklisted = true;
    }

    if (q) {
      query.$and = [
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
          ],
        },
      ];
    }

    const customers = await User.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers: customers.map(c => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email || 'N/A',
        phone: c.phone,
        role: c.role || 'customer',
        isActive: c.isActive !== false,
        isBlacklisted: !!c.isBlacklisted,
        blacklistReason: c.blacklistReason || null,
        points: c.points || 0,
        walletBalance: c.walletBalance || 0,
        savedAddressesCount: c.savedAddresses ? c.savedAddresses.length : 0,
        createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch customer directory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, phone, email, password } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, message: 'Customer name and phone number are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Phone number already registered' }, { status: 400 });
    }

    const customer = await User.create({
      name,
      phone,
      email: email ? email.toLowerCase() : undefined,
      password: password || 'Customer123!',
      role: 'customer',
      roles: ['customer'],
      isActive: true,
      points: 50, // Welcome signup bonus points
      walletBalance: 0,
      isBlacklisted: false,
    });

    return NextResponse.json({
      success: true,
      message: `Customer profile for "${customer.name}" created successfully!`,
      customer,
    });
  } catch (error: any) {
    console.error('Error creating customer profile:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
