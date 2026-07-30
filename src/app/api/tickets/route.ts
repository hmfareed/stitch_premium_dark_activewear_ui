import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { SupportTicket } from '@/models/SupportTicket';

// GET list of support tickets
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');
    const status = searchParams.get('status');
    const subOrderId = searchParams.get('subOrderId');

    const query: Record<string, any> = {};
    if (userEmail) query.userEmail = userEmail.toLowerCase();
    if (status) query.status = status;
    if (subOrderId) query.subOrderId = subOrderId;

    const tickets = await SupportTicket.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, tickets });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST create new support ticket
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userEmail, userName, userRole = 'customer', subOrderId, orderId, subject, category = 'order_issue', initialMessage } = body;

    if (!userEmail || !subject || !initialMessage) {
      return NextResponse.json({ success: false, error: 'User email, subject, and message content are required' }, { status: 400 });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TCK-${Date.now().toString().substring(7)}-${randomSuffix}`;

    const newTicket = await SupportTicket.create({
      ticketId,
      userEmail: userEmail.toLowerCase(),
      userName: userName || 'Customer',
      userRole,
      subOrderId,
      orderId,
      subject,
      category,
      status: 'open',
      priority: 'medium',
      messages: [
        {
          senderRole: userRole,
          senderName: userName || 'Customer',
          senderEmail: userEmail.toLowerCase(),
          content: initialMessage,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH update status & reply to ticket
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { ticketId, status, replyContent, senderRole, senderName, senderEmail } = body;

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await SupportTicket.findOne({
      $or: [{ ticketId }, { _id: ticketId.match(/^[0-9a-fA-F]{24}$/) ? ticketId : null }],
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (status) {
      ticket.status = status;
      if (status === 'resolved') {
        ticket.resolvedAt = new Date();
      }
    }

    if (replyContent) {
      ticket.messages.push({
        senderRole: senderRole || 'superadmin',
        senderName: senderName || 'Support Agent',
        senderEmail: senderEmail || 'support@africart.com',
        content: replyContent,
        timestamp: new Date(),
      });
    }

    await ticket.save();
    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
