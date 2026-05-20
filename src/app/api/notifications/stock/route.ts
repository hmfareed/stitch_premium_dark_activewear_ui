import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { StockNotification } from '@/models/StockNotification';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { productId, userEmail } = await req.json();

    if (!productId || !userEmail) {
      return NextResponse.json({ error: 'Missing productId or userEmail' }, { status: 400 });
    }

    const notification = await StockNotification.findOneAndUpdate(
      { productId, userEmail },
      { isNotified: false, createdAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
