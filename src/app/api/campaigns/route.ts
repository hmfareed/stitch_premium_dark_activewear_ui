import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Campaign } from '@/models/Campaign';

export async function GET() {
  try {
    await connectToDatabase();
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    console.error('Fetch Campaigns Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, description, discountValue, bannerGradient, startDate, endDate } = body;

    if (!name || !description || !discountValue || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const campaign = await Campaign.create({
      id: `CAMP-${Date.now()}`,
      name,
      description,
      discountValue: Number(discountValue),
      bannerGradient: bannerGradient || 'linear-gradient(135deg, #FF416C, #FF4B2B)',
      status: 'upcoming',
      startDate,
      endDate
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error('Create Campaign Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
