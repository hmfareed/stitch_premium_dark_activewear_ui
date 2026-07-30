import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Promotion } from '@/models/Promotion';

/**
 * Platform-run flash sales & promotions API per spec §8.1.
 * Separate from individual vendor discounts — superadmin-curated,
 * cross-vendor promotional events (e.g. "Weekend Deals" homepage rail).
 */

// GET list promotions (platform-run or vendor-run)
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'platform' | 'vendor'
    const status = searchParams.get('status'); // 'active' | 'scheduled' | 'ended'

    const query: Record<string, any> = {};
    if (type) query.type = type;

    const now = new Date();
    if (status === 'active') {
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (status === 'scheduled') {
      query.startDate = { $gt: now };
    } else if (status === 'ended') {
      query.endDate = { $lt: now };
    }

    const promotions = await Promotion.find(query).sort({ startDate: -1 });
    return NextResponse.json({ success: true, promotions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create a platform-run flash sale / promotion
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      name,
      description,
      type = 'platform',
      discountType = 'percentage',
      discountValue,
      startDate,
      endDate,
      featuredProductIds,
      featuredStoreIds,
      couponCode,
      maxUsesTotal,
      maxUsesPerCustomer,
      vendorEmail,
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Name, start date, and end date are required' }, { status: 400 });
    }

    const promotion = await Promotion.create({
      name,
      description,
      type,
      discountType,
      discountValue: discountValue || 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      featuredProductIds: featuredProductIds || [],
      featuredStoreIds: featuredStoreIds || [],
      couponCode: couponCode || undefined,
      maxUsesTotal: maxUsesTotal || null,
      maxUsesPerCustomer: maxUsesPerCustomer || 1,
      usedCount: 0,
      vendorEmail: vendorEmail || undefined,
      isActive: true,
    });

    return NextResponse.json({ success: true, promotion });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
