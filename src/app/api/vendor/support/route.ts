import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Store } from '@/models/Store';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const store = await Store.findOne({ vendorEmail }).lean() as any;

    const tickets = store?.supportTickets || [
      {
        id: 'TCK-8941',
        subject: 'Mobile Money Payout Delay Investigation',
        category: 'Payouts & Banking',
        priority: 'High',
        status: 'In Progress',
        attachmentUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300',
        date: 'Aug 3, 2026',
        lastMessage: 'Support Agent Kwesi is reviewing payment gateway logs.',
      },
      {
        id: 'TCK-8920',
        subject: 'POS Thermal Printer 80mm Setup Assistance',
        category: 'POS Hardware',
        priority: 'Medium',
        status: 'Resolved',
        attachmentUrl: '',
        date: 'Jul 26, 2026',
        lastMessage: 'Issue resolved: Installed Chrome ESC/POS driver extension.',
      },
    ];

    const chatMessages = store?.supportChatMessages || [
      { id: 'msg-1', sender: 'agent', name: 'Kwesi (AfriCart Support)', text: 'Hello! Welcome to AfriCart Merchant Support. How can we assist your store today?', time: '10:00 AM' },
      { id: 'msg-2', sender: 'vendor', name: 'Store Manager', text: 'Hi Kwesi, I need help setting up custom EAN-13 barcode generation for our new activewear line.', time: '10:02 AM' },
      { id: 'msg-3', sender: 'agent', name: 'Kwesi (AfriCart Support)', text: 'Sure thing! You can generate EAN-13 barcodes directly under Products -> Add Product using the Auto-Generate button.', time: '10:04 AM' },
    ];

    const kbArticles = [
      { id: 'kb-1', title: 'How Mobile Money Payout Settlements Work', category: 'Payouts & Banking', views: 1240 },
      { id: 'kb-2', title: 'Connecting 80mm Thermal Receipt Printer to POS', category: 'POS Hardware', views: 890 },
      { id: 'kb-3', title: 'GRA Tax Withholding (VAT 15% & NHIL 2.5%) Setup', category: 'Tax & Compliance', views: 1540 },
      { id: 'kb-4', title: 'Managing Multi-Branch Staff Shifts & Permissions', category: 'Employee Management', views: 670 },
    ];

    return NextResponse.json({
      success: true,
      tickets,
      chatMessages,
      kbArticles,
    });
  } catch (error: any) {
    console.error('GET /api/vendor/support error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    const vendorEmail = (session.user.email || '').toLowerCase().trim();
    const body = await req.json();
    const { action, ticket, chatText } = body;

    let store = await Store.findOne({ vendorEmail });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Action 1: Create Ticket
    if (action === 'create_ticket') {
      const existingTickets = (store.get('supportTickets') as any[]) || [
        { id: 'TCK-8941', subject: 'Mobile Money Payout Delay Investigation', category: 'Payouts & Banking', priority: 'High', status: 'In Progress', attachmentUrl: '', date: 'Aug 3, 2026', lastMessage: 'Under review' },
      ];

      const newTicket = {
        id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: ticket.subject,
        category: ticket.category || 'General',
        priority: ticket.priority || 'Medium',
        status: 'Open',
        attachmentUrl: ticket.attachmentUrl || '',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        lastMessage: ticket.description || 'Ticket opened by vendor',
      };

      existingTickets.unshift(newTicket);
      store.set('supportTickets', existingTickets);
      await store.save();

      return NextResponse.json({ success: true, tickets: existingTickets, message: `Ticket #${newTicket.id} created!` });
    }

    // Action 2: Send Live Chat Message
    if (action === 'send_chat' && chatText) {
      const existingChat = (store.get('supportChatMessages') as any[]) || [
        { id: 'msg-1', sender: 'agent', name: 'Kwesi (AfriCart Support)', text: 'Hello! How can we assist your store today?', time: '10:00 AM' },
      ];

      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'vendor',
        name: 'Store Owner',
        text: chatText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      existingChat.push(newMsg);

      // Auto-Agent Response Simulation
      const agentReply = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        name: 'Kwesi (AfriCart Support)',
        text: `Thanks for your message! Our merchant support team has logged your inquiry regarding: "${chatText.substring(0, 30)}..." and is working on it.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      existingChat.push(agentReply);

      store.set('supportChatMessages', existingChat);
      await store.save();

      return NextResponse.json({ success: true, chatMessages: existingChat, message: 'Message sent!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/vendor/support error:', error);
    return NextResponse.json({ error: error.message || 'Support action failed' }, { status: 500 });
  }
}
