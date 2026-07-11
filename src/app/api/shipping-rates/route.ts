import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ShippingRate } from '@/models/ShippingRate';

/** Default zone-based delivery rates for Ghana */
const DEFAULT_RATES = [
  // ── Accra Metro ──────────────────────────────────────────────────────────
  { region: 'Greater Accra',  zone: 'accra_metro',  fee: 15, estimatedDays: 'Same day – 1 business day', coversCOD: true  },
  // ── Kumasi Metro ─────────────────────────────────────────────────────────
  { region: 'Ashanti',        zone: 'kumasi_metro', fee: 20, estimatedDays: '1-2 business days',          coversCOD: true  },
  // ── Tamale Metro ─────────────────────────────────────────────────────────
  { region: 'Northern',       zone: 'tamale_metro', fee: 20, estimatedDays: '2-3 business days',          coversCOD: true  },
  // ── Regional ─────────────────────────────────────────────────────────────
  { region: 'Central',        zone: 'regional',     fee: 30, estimatedDays: '2-4 business days',          coversCOD: false },
  { region: 'Western',        zone: 'regional',     fee: 35, estimatedDays: '3-5 business days',          coversCOD: false },
  { region: 'Eastern',        zone: 'regional',     fee: 25, estimatedDays: '2-3 business days',          coversCOD: false },
  { region: 'Brong-Ahafo',    zone: 'regional',     fee: 35, estimatedDays: '3-5 business days',          coversCOD: false },
  { region: 'Volta',          zone: 'regional',     fee: 30, estimatedDays: '3-5 business days',          coversCOD: false },
  { region: 'Bono',           zone: 'regional',     fee: 35, estimatedDays: '3-5 business days',          coversCOD: false },
  { region: 'Bono East',      zone: 'regional',     fee: 40, estimatedDays: '4-6 business days',          coversCOD: false },
  { region: 'Ahafo',          zone: 'regional',     fee: 40, estimatedDays: '4-6 business days',          coversCOD: false },
  { region: 'Western North',  zone: 'regional',     fee: 45, estimatedDays: '4-7 business days',          coversCOD: false },
  { region: 'Oti',            zone: 'regional',     fee: 45, estimatedDays: '4-7 business days',          coversCOD: false },
  // ── Rural / Remote ───────────────────────────────────────────────────────
  { region: 'Upper East',     zone: 'rural',        fee: 50, estimatedDays: '5-7 business days',          coversCOD: false },
  { region: 'Upper West',     zone: 'rural',        fee: 50, estimatedDays: '5-7 business days',          coversCOD: false },
  { region: 'North East',     zone: 'rural',        fee: 55, estimatedDays: '5-8 business days',          coversCOD: false },
  { region: 'Savannah',       zone: 'rural',        fee: 55, estimatedDays: '5-8 business days',          coversCOD: false },
];

export async function GET() {
  try {
    await connectToDatabase();
    let rates = await ShippingRate.find({ isActive: true }).sort({ fee: 1 });

    // Seed defaults if none exist
    if (rates.length === 0) {
      await ShippingRate.insertMany(DEFAULT_RATES.map(r => ({ ...r, isActive: true })));
      rates = await ShippingRate.find({ isActive: true }).sort({ fee: 1 });
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

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { region } = await req.json();
    await ShippingRate.findOneAndUpdate({ region }, { isActive: false });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
