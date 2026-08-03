import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey12345';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const vendor = await User.findById(id);
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    // Generate impersonation token
    const tokenPayload = {
      userId: vendor._id.toString(),
      email: vendor.email,
      phone: vendor.phone,
      role: 'vendor',
      name: vendor.name,
      isImpersonated: true,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

    return NextResponse.json({
      success: true,
      message: `Impersonation session initialized for ${vendor.name}`,
      token,
      vendor: {
        id: vendor._id.toString(),
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        role: 'vendor',
        storeName: vendor.storeName || `${vendor.name}'s Store`,
      },
      redirectUrl: '/vendor',
    });
  } catch (error: any) {
    console.error('Impersonate Vendor Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to initialize vendor impersonation' }, { status: 500 });
  }
}
