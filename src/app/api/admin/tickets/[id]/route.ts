import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SupportTicket } from '@/models/SupportTicket';
import { KnowledgeBase } from '@/models/KnowledgeBase';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action, assignedAdminEmail, status, priority } = body;

    let ticket = await SupportTicket.findById(id);
    if (!ticket) {
      ticket = await SupportTicket.findOne({ ticketId: id });
    }

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Support ticket not found' }, { status: 404 });
    }

    // Action 1: Assign Staff Member
    if (action === 'assign_staff') {
      ticket.assignedAdminEmail = assignedAdminEmail;
      ticket.status = 'in_progress';
      await ticket.save();

      return NextResponse.json({
        success: true,
        message: `Ticket ${ticket.ticketId} assigned to ${assignedAdminEmail}!`,
        ticket,
      });
    }

    // Action 2: Update Ticket Status & Priority
    if (action === 'update_status') {
      if (status) {
        ticket.status = status as any;
        if (status === 'resolved') {
          ticket.resolvedAt = new Date();
        }
      }
      if (priority) ticket.priority = priority as any;
      await ticket.save();

      return NextResponse.json({
        success: true,
        message: `Ticket ${ticket.ticketId} updated. Status: ${ticket.status.toUpperCase()}.`,
        ticket,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid ticket action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update ticket' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const [ticketRes, kbRes] = await Promise.all([
      SupportTicket.deleteOne({ $or: [{ _id: id }, { ticketId: id }] }),
      KnowledgeBase.deleteOne({ $or: [{ _id: id }, { articleId: id }] }),
    ]);

    if (ticketRes.deletedCount === 0 && kbRes.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Support record deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting support record:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete record' }, { status: 500 });
  }
}
