import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const productId = searchParams.get('productId');

    const query: any = {};
    if (productId) query.productId = productId;
    if (q) {
      query.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { customerEmail: { $regex: q, $options: 'i' } },
        { comment: { $regex: q, $options: 'i' } },
        { productId: { $regex: q, $options: 'i' } },
      ];
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean();

    // Enrich reviews with product name
    const productIds = reviews.map(r => r.productId).filter(Boolean);
    const products = await Product.find({ id: { $in: productIds } }).select('id name image').lean();
    const productMap = new Map(products.map(p => [p.id, p]));

    return NextResponse.json({
      success: true,
      count: reviews.length,
      reviews: reviews.map(r => {
        const prod = productMap.get(r.productId);
        return {
          id: r._id.toString(),
          productId: r.productId,
          productName: prod?.name || `Product #${r.productId}`,
          productImage: prod?.image || '/images/placeholder.png',
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          rating: r.rating,
          comment: r.comment || 'No written comment provided.',
          vendorReply: r.vendorReply || null,
          isVerifiedPurchase: !!r.isVerifiedPurchase,
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
        };
      }),
    });
  } catch (error: any) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { reviewId, vendorReply, action } = body;

    if (!reviewId) {
      return NextResponse.json({ success: false, message: 'reviewId is required' }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    if (action === 'reply') {
      review.vendorReply = vendorReply || 'Thank you for your review!';
      await review.save();
      return NextResponse.json({ success: true, message: 'Vendor reply saved successfully!' });
    }

    if (action === 'delete') {
      await Review.deleteOne({ _id: reviewId });
      return NextResponse.json({ success: true, message: 'Review deleted successfully.' });
    }

    return NextResponse.json({ success: false, message: 'Invalid review action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ success: false, message: 'Failed to update review' }, { status: 500 });
  }
}
