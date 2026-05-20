import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await connectToDatabase();
    const { productId } = await params;
    const { userName, userEmail, rating, comment, images } = await req.json();

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const newReview = {
      id: `REV-${Date.now()}`,
      userName,
      userEmail,
      rating,
      comment,
      images: images || [],
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    if (!product.reviews) product.reviews = [];
    product.reviews.push(newReview);

    // Update overall rating
    const totalRating = product.reviews.reduce((acc, rev) => acc + rev.rating, 0);
    product.rating = Number((totalRating / product.reviews.length).toFixed(1));

    await product.save();

    return NextResponse.json({ success: true, review: newReview, newRating: product.rating });
  } catch (error: any) {
    console.error('Add Review Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
