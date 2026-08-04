import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean() as any;

    const { searchParams } = new URL(req.url);
    const starFilter = searchParams.get('stars') || 'all';

    const defaultReviews = [
      {
        id: 'rev-101',
        customerName: 'Ama Serwaa',
        productTitle: 'Pro Performance Compression Leggings',
        rating: 5,
        title: 'Outstanding quality and fit!',
        comment: 'These compression leggings are incredible. Super breathable for workout sessions in Accra heat.',
        verifiedPurchase: true,
        date: 'Aug 2, 2026',
        vendorReply: 'Thank you so much Ama! We are glad you love the compression fit.',
        isAbusiveReported: false,
      },
      {
        id: 'rev-102',
        customerName: 'Kojo Mensah',
        productTitle: 'Breathable Training Tank Top',
        rating: 4,
        title: 'Very comfortable material',
        comment: 'Great fabric, fits nicely. Delivery was faster than expected.',
        verifiedPurchase: true,
        date: 'Jul 30, 2026',
        vendorReply: '',
        isAbusiveReported: false,
      },
      {
        id: 'rev-103',
        customerName: 'Abena Osei',
        productTitle: 'High-Impact Sports Bra',
        rating: 5,
        title: 'Best sports bra I own!',
        comment: 'Provides maximum support during intense cardio workouts. 10/10 recommendation.',
        verifiedPurchase: true,
        date: 'Jul 28, 2026',
        vendorReply: 'Thanks Abena! Your feedback keeps our team motivated.',
        isAbusiveReported: false,
      },
      {
        id: 'rev-104',
        customerName: 'Yaw Addo',
        productTitle: 'Ergonomic Fitness Shorts',
        rating: 3,
        title: 'Sizing runs slightly small',
        comment: 'Quality is good but recommend ordering one size up.',
        verifiedPurchase: true,
        date: 'Jul 20, 2026',
        vendorReply: '',
        isAbusiveReported: false,
      },
    ];

    const reviews = store?.vendorReviews || defaultReviews;

    let filtered = reviews;
    if (starFilter !== 'all') {
      filtered = reviews.filter((r: any) => r.rating === Number(starFilter));
    }

    const totalCount = reviews.length;
    const avgRating = totalCount > 0 ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / totalCount) : 4.8;
    
    const distribution = {
      fiveStar: reviews.filter((r: any) => r.rating === 5).length,
      fourStar: reviews.filter((r: any) => r.rating === 4).length,
      threeStar: reviews.filter((r: any) => r.rating === 3).length,
      twoStar: reviews.filter((r: any) => r.rating === 2).length,
      oneStar: reviews.filter((r: any) => r.rating === 1).length,
    };

    const responseRate = totalCount > 0
      ? (reviews.filter((r: any) => Boolean(r.vendorReply)).length / totalCount) * 100
      : 100;

    return NextResponse.json({
      success: true,
      reviews: filtered,
      analytics: {
        avgRating,
        totalCount,
        distribution,
        responseRate,
      },
    });
  } catch (error: any) {
    console.error('GET /api/vendor/reviews error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { action, reviewId, replyText } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const defaultReviews = [
      { id: 'rev-101', customerName: 'Ama Serwaa', productTitle: 'Pro Performance Compression Leggings', rating: 5, title: 'Outstanding quality and fit!', comment: 'These compression leggings are incredible.', verifiedPurchase: true, date: 'Aug 2, 2026', vendorReply: '', isAbusiveReported: false },
      { id: 'rev-102', customerName: 'Kojo Mensah', productTitle: 'Breathable Training Tank Top', rating: 4, title: 'Very comfortable material', comment: 'Great fabric, fits nicely.', verifiedPurchase: true, date: 'Jul 30, 2026', vendorReply: '', isAbusiveReported: false },
    ];

    let currentReviews = (store.get('vendorReviews') as any[]) || defaultReviews;

    // Action 1: Submit Official Vendor Reply
    if (action === 'reply' && reviewId && replyText) {
      currentReviews = currentReviews.map(r => r.id === reviewId ? { ...r, vendorReply: replyText } : r);
      store.set('vendorReviews', currentReviews);
      await store.save();
      return NextResponse.json({ success: true, reviews: currentReviews, message: 'Vendor reply published!' });
    }

    // Action 2: Report Abusive Review
    if (action === 'report_abusive' && reviewId) {
      currentReviews = currentReviews.map(r => r.id === reviewId ? { ...r, isAbusiveReported: true } : r);
      store.set('vendorReviews', currentReviews);
      await store.save();
      return NextResponse.json({ success: true, reviews: currentReviews, message: 'Review flagged for moderation!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/reviews error:', error);
    return NextResponse.json({ error: error.message || 'Review action failed' }, { status: 500 });
  }
}
