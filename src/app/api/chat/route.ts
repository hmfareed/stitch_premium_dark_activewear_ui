import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { ChatMessage } from '@/models/ChatMessage';
import { sendEmail, getEmailTemplate } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const messages = await ChatMessage.find({ orderId }).sort({ timestamp: 1 });
    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const newMessage = await ChatMessage.create({
      orderId: data.orderId,
      sender: data.sender,
      receiver: data.receiver,
      message: data.message,
      timestamp: new Date(),
      read: false
    });

    // --- CHAT NOTIFICATION ---
    try {
      const html = getEmailTemplate(
        'New Message! 💬',
        `You have a new message regarding order <b>${data.orderId}</b>: <br><br><i>"${data.message}"</i>`,
        'Reply to Message',
        `${req.nextUrl.origin}/account/orders` // Simple fallback, usually redirects to orders
      );
      await sendEmail(data.receiver, `AfriCart: New Message regarding #${data.orderId}`, html);
    } catch (e) {
      console.error('Chat email notification failed:', e);
    }

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
