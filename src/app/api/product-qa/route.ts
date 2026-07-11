import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ProductQA } from '@/models/ProductQA';

/**
 * GET  /api/product-qa?productId=xxx  — list Q&A for a product
 * POST /api/product-qa               — ask a question
 * PATCH /api/product-qa              — answer a question (vendor/admin)
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    const items = await ProductQA.find({ productId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { productId, question, questionerEmail, questionerName } = await req.json();

    if (!productId || !question || !questionerEmail || !questionerName) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const doc = await ProductQA.create({ productId, question, questionerEmail, questionerName });
    return NextResponse.json({ success: true, item: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const { qaId, answer, answeredByEmail, answeredByName, action } = await req.json();

    if (!qaId) {
      return NextResponse.json({ success: false, error: 'qaId is required' }, { status: 400 });
    }

    if (action === 'helpful') {
      await ProductQA.findByIdAndUpdate(qaId, { $inc: { helpful: 1 } });
      return NextResponse.json({ success: true });
    }

    if (!answer || !answeredByEmail) {
      return NextResponse.json({ success: false, error: 'answer and answeredByEmail are required' }, { status: 400 });
    }

    const doc = await ProductQA.findByIdAndUpdate(
      qaId,
      { answer, answeredByEmail, answeredByName: answeredByName || answeredByEmail, answeredAt: new Date() },
      { new: true }
    );

    return NextResponse.json({ success: true, item: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
