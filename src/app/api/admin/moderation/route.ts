import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Product } from '@/models/Product';

// GET products pending moderation review
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending_review';

    const products = await Product.find({ moderationStatus: status }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST approve or flag a product listing
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { productId, action } = body; // action: 'approve' | 'flag'

    if (!productId || !action) {
      return NextResponse.json({ success: false, error: 'Product ID and action are required' }, { status: 400 });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    product.moderationStatus = action === 'approve' ? 'approved' : 'flagged';
    await product.save();

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
