import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const existing = await Review.findOne({ productId: data.productId, orderId: data.orderId, customerEmail: data.customerEmail });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product for this order.' }, { status: 400 });
    }

    const review = await Review.create(data);

    // Update product average rating
    const allReviews = await Review.find({ productId: data.productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await Product.findOneAndUpdate(
      { id: data.productId },
      { rating: Number(avgRating.toFixed(1)) }
    );

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
