import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Order } from '@/models/Order';
import { sendSMS } from '@/lib/sms';

/**
 * GET /api/compliance?email=xxx  — export buyer data (Ghana DPA 2012)
 * DELETE /api/compliance?email=xxx — anonymise / right to be forgotten
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const format = searchParams.get('format') || 'json'; // 'json' | 'csv'

    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const orders = await Order.find({ customerEmail: email }).lean();

    const exportData = {
      exportDate: new Date().toISOString(),
      regulatoryBasis: 'Ghana Data Protection Act 2012',
      profile: {
        name: (user as any).name,
        email: (user as any).email,
        phone: (user as any).phone,
        role: (user as any).role,
        isVerified: (user as any).isVerified,
        points: (user as any).points,
        referralCode: (user as any).referralCode,
        createdAt: (user as any).createdAt,
      },
      savedAddresses: (user as any).savedAddresses || [],
      orderHistory: orders.map((o: any) => ({
        orderId: o.orderId,
        date: o.date,
        status: o.status,
        total: o.total,
        products: o.products?.map((p: any) => ({ name: p.name, quantity: p.quantity, price: p.price })),
        shippingAddress: o.shippingAddress,
        paymentMethod: o.paymentInfo?.method,
      })),
    };

    if (format === 'csv') {
      // Build flat CSV for orders
      const headers = ['Order ID', 'Date', 'Status', 'Total (GHS)', 'Payment Method'].join(',');
      const rows = orders.map((o: any) =>
        [o.orderId, new Date(o.date).toLocaleDateString(), o.status, o.total, o.paymentInfo?.method || ''].join(',')
      );
      const csv = [headers, ...rows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="africart-data-${email}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: exportData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    // Anonymise — replace PII with placeholder, keep order records for accounting
    await User.updateOne({ email }, {
      name: '[Deleted User]',
      phone: '',
      profilePic: '',
      password: '',
      resetToken: '',
      savedAddresses: [],
      referralCode: '',
      referredBy: '',
    });

    // Anonymise order customer name/email
    await Order.updateMany(
      { customerEmail: email },
      { customerName: '[Deleted User]', customerEmail: `deleted_${Date.now()}@africart.com` }
    );

    return NextResponse.json({ success: true, message: 'User data anonymised per Ghana DPA 2012 right to erasure' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
