import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Review } from '@/models/Review';
import { Product } from '@/models/Product';
import { Order } from '@/models/Order';

/** GET /api/reviews — fetch all reviews for a product */
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

/** POST /api/reviews — add a review with verified purchase check */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const existing = await Review.findOne({
      productId: data.productId,
      orderId: data.orderId,
      customerEmail: data.customerEmail
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product for this order.' }, { status: 400 });
    }

    // Auto-detect if it is a verified purchase
    const orderMatch = await Order.findOne({
      customerEmail: data.customerEmail.toLowerCase(),
      'products.id': data.productId
    });
    const isVerifiedPurchase = !!orderMatch;

    const review = await Review.create({
      ...data,
      isVerifiedPurchase,
      helpfulVotes: 0
    });

    // Update product average rating
    const allReviews = await Review.find({ productId: data.productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    // Cache the reviews list in the product document
    const productReviewsCached = allReviews.map(r => ({
      id: r._id.toString(),
      userName: r.customerName,
      userEmail: r.customerEmail,
      rating: r.rating,
      comment: r.comment || '',
      images: r.images || [],
      date: r.createdAt.toISOString(),
      vendorReply: r.vendorReply || '',
    }));

    await Product.findOneAndUpdate(
      { id: data.productId },
      {
        rating: Number(avgRating.toFixed(1)),
        reviews: productReviewsCached
      }
    );

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** PATCH /api/reviews — support incrementing helpful votes or adding a vendor reply */
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const { reviewId, action, vendorReply } = data;

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (action === 'voteHelpful') {
      review.helpfulVotes = (review.helpfulVotes || 0) + 1;
    } else if (action === 'reply' && vendorReply !== undefined) {
      review.vendorReply = vendorReply;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await review.save();

    // Re-sync cached reviews in the product document
    const allReviews = await Review.find({ productId: review.productId });
    const productReviewsCached = allReviews.map(r => ({
      id: r._id.toString(),
      userName: r.customerName,
      userEmail: r.customerEmail,
      rating: r.rating,
      comment: r.comment || '',
      images: r.images || [],
      date: r.createdAt.toISOString(),
      vendorReply: r.vendorReply || '',
    }));

    await Product.findOneAndUpdate(
      { id: review.productId },
      { reviews: productReviewsCached }
    );

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
