import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';

/** GET — Fetch saved addresses for a user */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const user = await User.findOne({ email: email.toLowerCase() }).select('savedAddresses');
    return NextResponse.json({ success: true, addresses: user?.savedAddresses || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** POST — Add or update a saved address */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, address } = await req.json();
    if (!email || !address) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    // If this is marked as default, unset other defaults first
    if (address.isDefault) {
      await User.updateOne(
        { email: email.toLowerCase() },
        { $set: { 'savedAddresses.$[].isDefault': false } }
      );
    }

    if (address._id) {
      // Update existing address
      await User.updateOne(
        { email: email.toLowerCase(), 'savedAddresses._id': address._id },
        { $set: { 'savedAddresses.$': address } }
      );
    } else {
      // Add new address (max 5)
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user && (user.savedAddresses?.length || 0) >= 5) {
        return NextResponse.json({ error: 'Maximum 5 addresses allowed' }, { status: 400 });
      }
      await User.updateOne(
        { email: email.toLowerCase() },
        { $push: { savedAddresses: address } }
      );
    }

    const updated = await User.findOne({ email: email.toLowerCase() }).select('savedAddresses');
    return NextResponse.json({ success: true, addresses: updated?.savedAddresses || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** DELETE — Remove a saved address */
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, addressId } = await req.json();
    if (!email || !addressId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    await User.updateOne(
      { email: email.toLowerCase() },
      { $pull: { savedAddresses: { _id: addressId } } }
    );

    const updated = await User.findOne({ email: email.toLowerCase() }).select('savedAddresses');
    return NextResponse.json({ success: true, addresses: updated?.savedAddresses || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
