import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Message } from '@/models/Message';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email'); // Can be 'from' or 'to'
    
    if (!email) {
      // If no email provided, maybe return all for super admin (though should be protected)
      const messages = await Message.find({}).sort({ timestamp: -1 });
      return NextResponse.json({ success: true, messages });
    }

    const messages = await Message.find({
      $or: [
        { from: email },
        { to: email },
        { to: 'broadcast_all' },
        { to: 'broadcast_admins' } // Should filter this based on user role in real app
      ]
    }).sort({ timestamp: -1 });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    const message = await Message.create({
      ...data,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const read = searchParams.get('read') === 'true';

    if (id) {
      await Message.findByIdAndUpdate(id, { read });
    } else {
      // Mark all as read for a recipient
      const to = searchParams.get('to');
      if (to) {
        await Message.updateMany({ to }, { read: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
