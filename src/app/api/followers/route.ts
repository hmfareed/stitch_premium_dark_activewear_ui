import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Follower } from '@/models/Follower';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const vendorEmail = searchParams.get('vendorEmail');
    const userEmail = searchParams.get('userEmail');

    let query = {};
    if (vendorEmail) query = { vendorEmail };
    else if (userEmail) query = { userEmail };

    const followers = await Follower.find(query);
    return NextResponse.json({ success: true, followers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { vendorEmail, userEmail, userName } = await req.json();

    const follower = await Follower.findOneAndUpdate(
      { vendorEmail, userEmail },
      { vendorEmail, userEmail, userName },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, follower });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const vendorEmail = searchParams.get('vendorEmail');
    const userEmail = searchParams.get('userEmail');

    await Follower.findOneAndDelete({ vendorEmail, userEmail });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
