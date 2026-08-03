import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SupportTicket } from '@/models/SupportTicket';
import { KnowledgeBase } from '@/models/KnowledgeBase';
import { ChatMessage } from '@/models/ChatMessage';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all'; // all | open | in_progress | resolved
    const q = searchParams.get('q') || '';

    const query: any = {};
    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }

    if (q) {
      query.$or = [
        { ticketId: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { userEmail: { $regex: q, $options: 'i' } },
        { userName: { $regex: q, $options: 'i' } },
      ];
    }

    const [tickets, articles, staff, chatMessages] = await Promise.all([
      SupportTicket.find(query).sort({ updatedAt: -1 }).lean(),
      KnowledgeBase.find({}).sort({ views: -1 }).lean(),
      User.find({ role: { $in: ['super_admin', 'admin', 'manager', 'support_staff', 'auditor', 'developer'] } }).select('name email role').lean(),
      ChatMessage.find({}).sort({ timestamp: -1 }).limit(50).lean(),
    ]);

    const totalCount = tickets.length;
    const openCount = tickets.filter(t => t.status === 'open').length;
    const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
    const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 100;

    return NextResponse.json({
      success: true,
      analytics: {
        totalCount,
        openCount,
        inProgressCount,
        resolvedCount,
        resolutionRate,
        avgResponseTimeHours: '1.4 Hours',
      },
      tickets: tickets.map((t: any) => ({
        id: t._id.toString(),
        ticketId: t.ticketId,
        userEmail: t.userEmail,
        userName: t.userName,
        userRole: t.userRole || 'customer',
        subject: t.subject,
        category: t.category || 'order_issue',
        status: t.status || 'open',
        priority: t.priority || 'medium',
        assignedAdminEmail: t.assignedAdminEmail || 'Unassigned',
        messages: t.messages || [],
        createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Recent',
        updatedAt: t.updatedAt ? new Date(t.updatedAt).toLocaleString() : 'Recent',
      })),
      articles: articles.map((a: any) => ({
        id: a._id.toString(),
        articleId: a.articleId,
        title: a.title,
        category: a.category,
        content: a.content,
        views: a.views || 0,
        helpfulCount: a.helpfulCount || 0,
        isPublished: a.isPublished !== false,
      })),
      staffList: staff.map((s: any) => ({
        name: s.name,
        email: s.email,
        role: s.role,
      })),
      chatStreams: chatMessages.map((c: any) => ({
        id: c._id.toString(),
        orderId: c.orderId,
        sender: c.sender,
        receiver: c.receiver,
        message: c.message,
        timestamp: c.timestamp ? new Date(c.timestamp).toLocaleString() : 'Recent',
        read: c.read || false,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching support data:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch helpdesk telemetry' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // Action 1: Create Knowledge Base Article
    if (action === 'create_kb') {
      const { title, category, content } = body;
      if (!title || !content) {
        return NextResponse.json({ success: false, message: 'Article title and content body are required' }, { status: 400 });
      }

      const articleId = `KB-${Date.now().toString().slice(-5)}`;
      const article = await KnowledgeBase.create({
        articleId,
        title,
        category: category || 'General',
        content,
        views: 0,
        helpfulCount: 0,
        isPublished: true,
      });

      return NextResponse.json({ success: true, message: `Knowledge Base article "${title}" published!`, article });
    }

    // Action 2: Add Reply Message to Ticket Thread
    if (action === 'add_reply') {
      const { ticketId, replyContent, senderName, senderEmail, newStatus } = body;
      if (!ticketId || !replyContent) {
        return NextResponse.json({ success: false, message: 'Ticket ID and reply content are required' }, { status: 400 });
      }

      let ticket = await SupportTicket.findOne({ ticketId });
      if (!ticket) {
        ticket = await SupportTicket.findById(ticketId);
      }

      if (!ticket) {
        return NextResponse.json({ success: false, message: 'Support ticket not found' }, { status: 404 });
      }

      ticket.messages.push({
        senderRole: 'superadmin',
        senderName: senderName || 'Support Agent',
        senderEmail: senderEmail || 'support@africart.com',
        content: replyContent,
        timestamp: new Date(),
      });

      if (newStatus) {
        ticket.status = newStatus as any;
        if (newStatus === 'resolved') {
          ticket.resolvedAt = new Date();
        }
      }

      await ticket.save();

      return NextResponse.json({ success: true, message: 'Support reply added to ticket thread!', ticket });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/tickets:', error);
    return NextResponse.json({ success: false, message: error.message || 'Helpdesk operation failed' }, { status: 500 });
  }
}
