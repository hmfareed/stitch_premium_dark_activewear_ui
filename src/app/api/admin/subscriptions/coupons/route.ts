import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Coupon } from '@/models/Coupon';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: coupons.length,
      coupons: coupons.map(c => ({
        id: c._id.toString(),
        code: c.code,
        discountPercent: c.discountPercent,
        maxUses: c.maxUses,
        usedCount: c.usedCount,
        expiryDate: c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'No expiry',
        isActive: c.isActive !== false,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { code, discountPercent, maxUses } = body;

    if (!code || !discountPercent) {
      return NextResponse.json({ success: false, message: 'Coupon code and discount % are required' }, { status: 400 });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountPercent: parseFloat(discountPercent),
      maxUses: parseInt(maxUses || 100, 10),
      usedCount: 0,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: `Discount coupon code "${coupon.code}" created successfully!`,
      coupon,
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to create coupon' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Coupon ID is required' }, { status: 400 });
    }

    await Coupon.deleteOne({ _id: id });
    return NextResponse.json({ success: true, message: 'Coupon code deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete coupon' }, { status: 500 });
  }
}
