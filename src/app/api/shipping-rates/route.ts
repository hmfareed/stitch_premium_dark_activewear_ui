import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ShippingRate } from '@/models/ShippingRate';

export async function GET() {
  try {
    await connectToDatabase();
    let rates = await ShippingRate.find({ isActive: true });
    
    // Seed default rates if empty
    if (rates.length === 0) {
      const defaults = [
        { region: 'Greater Accra', fee: 35, estimatedDays: '1-2 business days' },
        { region: 'Ashanti', fee: 55, estimatedDays: '2-3 business days' },
        { region: 'Central', fee: 50, estimatedDays: '2-4 business days' },
        { region: 'Western', fee: 65, estimatedDays: '3-5 business days' },
        { region: 'Eastern', fee: 45, estimatedDays: '2-3 business days' },
        { region: 'Northern', fee: 85, estimatedDays: '4-7 business days' },
        { region: 'Volta', fee: 60, estimatedDays: '3-5 business days' },
      ];
      await ShippingRate.insertMany(defaults);
      rates = await ShippingRate.find({ isActive: true });
    }

    return NextResponse.json({ success: true, rates });
  } catch (error: any) {
    console.error('Fetch Shipping Rates Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();
    const rate = await ShippingRate.findOneAndUpdate(
      { region: data.region },
      { ...data, isActive: true },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, rate });
  } catch (error: any) {
    console.error('Save Shipping Rate Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
