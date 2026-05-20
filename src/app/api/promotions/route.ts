import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Promotion } from '@/models/Promotion';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const vendorEmail = searchParams.get('vendorEmail');

    if (!vendorEmail) {
      return NextResponse.json({ error: 'vendorEmail is required' }, { status: 400 });
    }

    const promotions = await Promotion.find({ vendorEmail }).sort({ createdAt: -1 });

    // Auto-update expired status
    const now = new Date();
    let updated = false;
    for (const promo of promotions) {
      if (promo.status === 'Active' && (new Date(promo.expiresAt) < now || promo.uses >= promo.limit)) {
        promo.status = 'Expired';
        await promo.save();
        updated = true;
      }
    }

    return NextResponse.json({ success: true, promotions: updated ? await Promotion.find({ vendorEmail }).sort({ createdAt: -1 }) : promotions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const existing = await Promotion.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: 'Promo code already exists globally. Please choose a different code.' }, { status: 400 });
    }

    const promotion = await Promotion.create({
      ...data,
      code: data.code.toUpperCase()
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
