import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Promotion } from '@/models/Promotion';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { code, vendorEmails } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Promo code required' }, { status: 400 });
    }

    const promotion = await Promotion.findOne({ code: code.toUpperCase() });

    if (!promotion) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 404 });
    }

    if (promotion.status !== 'Active') {
      return NextResponse.json({ error: 'This promo code has expired or is inactive' }, { status: 400 });
    }

    if (new Date(promotion.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This promo code has expired' }, { status: 400 });
    }

    if (promotion.uses >= promotion.limit) {
      return NextResponse.json({ error: 'This promo code has reached its usage limit' }, { status: 400 });
    }

    // Check if the cart contains products from the vendor who created the promo code
    // If vendorEmails array is provided, ensure the promo vendor is in it
    if (vendorEmails && vendorEmails.length > 0 && !vendorEmails.includes(promotion.vendorEmail)) {
      return NextResponse.json({ error: 'This promo code is not valid for the items in your cart' }, { status: 400 });
    }

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
