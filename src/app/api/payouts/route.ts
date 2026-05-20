import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payout } from '@/models/Payout';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const vendorEmail = searchParams.get('vendorEmail');

    const query = vendorEmail ? { vendorEmail } : {};
    const payouts = await Payout.find(query).sort({ requestDate: -1 });

    return NextResponse.json({ success: true, payouts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    // Basic validation
    if (!data.vendorEmail || !data.amount || !data.paymentMethod || !data.accountDetails) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (data.amount <= 0) {
      return NextResponse.json({ success: false, error: 'Amount must be greater than zero' }, { status: 400 });
    }

    // Create the payout request with specific fields to avoid injection
    const payout = await Payout.create({
      vendorEmail: data.vendorEmail,
      vendorName: data.vendorName,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      accountDetails: data.accountDetails,
      notes: data.notes || '',
      status: 'Pending',
      requestDate: new Date()
    });

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
