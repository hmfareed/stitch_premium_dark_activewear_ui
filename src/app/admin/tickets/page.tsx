'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface SupportTicket {
  id: string;
  ticketId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAdminEmail?: string;
  messages: Array<{ senderRole: string; senderName: string; senderEmail: string; content: string; timestamp: string }>;
  createdAt: string;
  updatedAt: string;
}

interface KBArticle {
  id: string;
  articleId: string;
  title: string;
  category: string;
  content: string;
  views: number;
  helpfulCount: number;
  isPublished: boolean;
}

interface StaffMember {
  name: string;
  email: string;
  role: string;
}

interface ChatStream {
  id: string;
  orderId: string;
  sender: string;
  receiver: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface Analytics {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  resolutionRate: number;
  avgResponseTimeHours: string;
}

const CANNED_RESPONSES = [
  "We are currently investigating your order delivery delay with our logistics partner.",
  "Your refund request has been approved and processed to your primary payment method.",
  "Thank you for contacting support. We have updated your account verification status.",
  "Our vendor compliance team is reviewing the disputed items and will update you shortly."
];

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'tickets' | 'livechat' | 'kb' | 'assignment' | 'analytics'>('tickets');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [chatStreams, setChatStreams] = useState<ChatStream[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCount: 0,
    openCount: 0,
    inProgressCount: 0,
    resolvedCount: 0,
    resolutionRate: 100,
    avgResponseTimeHours: '1.4 Hours',
  });

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showKBModal, setShowKBModal] = useState(false);
  const [kbTitle, setKbTitle] = useState('');
  const [kbCategory, setKbCategory] = useState('Orders & Delivery');
  const [kbContent, setKbContent] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTicketTarget, setAssignTicketTarget] = useState<SupportTicket | null>(null);
  const [selectedStaffEmail, setSelectedStaffEmail] = useState('');

  // Live Chat Reply state
  const [chatReplyText, setChatReplyText] = useState<{ [key: string]: string }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tickets?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setArticles(data.articles || []);
        setStaffList(data.staffList || []);
        setChatStreams(data.chatStreams || []);
        if (data.analytics) setAnalytics(data.analytics);

        // Keep selected ticket fresh if open
        if (selectedTicket) {
          const refreshed = data.tickets.find((t: SupportTicket) => t.ticketId === selectedTicket.ticketId);
          if (refreshed) setSelectedTicket(refreshed);
        }
      } else {
        showToast(data.message || 'Failed to fetch helpdesk telemetry', 'error');
      }
    } catch (err) {
      showToast('Error connecting to support hub API', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, searchQuery]);

  const handleSendReply = async (newStatus?: 'in_progress' | 'resolved') => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_reply',
          ticketId: selectedTicket.ticketId,
          replyContent: replyText,
          senderName: user?.name || 'Super Admin Agent',
          senderEmail: user?.email || 'admin@africart.com',
          newStatus: newStatus || selectedTicket.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Support reply appended to ticket thread!', 'success');
        setReplyText('');
        fetchData();
      } else {
        showToast(data.message || 'Failed to send reply', 'error');
      }
    } catch (err) {
      showToast('Error replying to support ticket', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!assignTicketTarget || !selectedStaffEmail) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tickets/${assignTicketTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_staff',
          assignedAdminEmail: selectedStaffEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Ticket assigned successfully!', 'success');
        setShowAssignModal(false);
        setAssignTicketTarget(null);
        fetchData();
      } else {
        showToast(data.message || 'Failed to assign ticket', 'error');
      }
    } catch (err) {
      showToast('Error assigning staff member', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateKBArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbContent.trim()) {
      showToast('Please provide both article title and content body', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_kb',
          title: kbTitle,
          category: kbCategory,
          content: kbContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Knowledge Base article published!', 'success');
        setShowKBModal(false);
        setKbTitle('');
        setKbContent('');
        fetchData();
      } else {
        showToast(data.message || 'Failed to publish KB article', 'error');
      }
    } catch (err) {
      showToast('Error publishing KB article', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: string, typeName: string) => {
    if (!confirm(`Are you sure you want to delete this ${typeName}?`)) return;
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`${typeName} deleted successfully`, 'success');
        if (selectedTicket?.id === id) setSelectedTicket(null);
        fetchData();
      } else {
        showToast(data.message || 'Failed to delete item', 'error');
      }
    } catch (err) {
      showToast('Error deleting item', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-inter, sans-serif)', color: '#0f172a' }}>
      
      {/* Header Title Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>
            <Link href="/admin" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Admin Portal</Link>
            <span>/</span>
            <span>Support Governance</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: '#16a34a' }}>support_agent</span>
            Enterprise Support Governance Hub
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 4 }}>
            Manage customer & vendor disputes, monitor live chat sessions, publish helpdesk KB articles, and audit support staff SLA resolution metrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setShowKBModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_box</span>
            + New KB Article
          </button>
          <button
            onClick={fetchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#64748b' }}>refresh</span>
            Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Overview Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>TOTAL TICKETS</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#3b82f6' }}>confirmation_number</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{analytics.totalCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: 4, fontWeight: 600 }}>Lifetime ticket interactions</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>OPEN QUEUE</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f59e0b' }}>pending_actions</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{analytics.openCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 4, fontWeight: 600 }}>Awaiting agent response</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>IN PROGRESS</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#8b5cf6' }}>engineering</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>{analytics.inProgressCount}</div>
          <div style={{ fontSize: '0.78rem', color: '#6d28d9', marginTop: 4, fontWeight: 600 }}>Assigned & active investigation</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>RESOLUTION RATE</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#16a34a' }}>check_circle</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>{analytics.resolutionRate}%</div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 4, fontWeight: 600 }}>Avg Response: {analytics.avgResponseTimeHours}</div>
        </div>
      </div>

      {/* Main Feature Sub-View Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 24, overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { id: 'tickets', label: 'Helpdesk Tickets', icon: 'confirmation_number', count: tickets.length },
          { id: 'livechat', label: 'Live Chat Stream', icon: 'chat', count: chatStreams.length },
          { id: 'kb', label: 'Knowledge Base', icon: 'menu_book', count: articles.length },
          { id: 'assignment', label: 'Ticket Assignment', icon: 'assignment_ind', count: staffList.length },
          { id: 'analytics', label: 'Ticket Analytics', icon: 'monitoring', count: null },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #16a34a' : '3px solid transparent',
                color: isActive ? '#15803d' : '#64748b',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: isActive ? '#16a34a' : '#94a3b8' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span style={{
                  backgroundColor: isActive ? '#dcfce7' : '#f1f5f9',
                  color: isActive ? '#15803d' : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: HELPDESK TICKETS */}
      {activeTab === 'tickets' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: statusFilter === st ? '#16a34a' : '#cbd5e1',
                    backgroundColor: statusFilter === st ? '#ecfdf5' : '#ffffff',
                    color: statusFilter === st ? '#15803d' : '#475569',
                    fontSize: '0.82rem',
                    fontWeight: statusFilter === st ? 700 : 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 280 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8' }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search ticket ID, subject, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 20,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.2fr' : '1fr', gap: 24, alignItems: 'start' }}>
            {/* Ticket Queue List */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading ticket queue...</div>
              ) : tickets.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>inbox</span>
                  No tickets found matching your query criteria.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tickets.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    const priorityColor =
                      t.priority === 'urgent' ? '#ef4444' :
                      t.priority === 'high' ? '#f97316' :
                      t.priority === 'medium' ? '#3b82f6' : '#64748b';

                    const statusBg =
                      t.status === 'open' ? '#fef3c7' :
                      t.status === 'in_progress' ? '#f3e8ff' : '#dcfce7';

                    const statusColor =
                      t.status === 'open' ? '#b45309' :
                      t.status === 'in_progress' ? '#6d28d9' : '#15803d';

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          border: isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(22,163,74,0.08)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#16a34a', fontFamily: 'monospace' }}>#{t.ticketId}</span>
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, backgroundColor: statusBg, color: statusColor, fontWeight: 700, textTransform: 'uppercase' }}>
                              {t.status.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, backgroundColor: '#f1f5f9', color: priorityColor, fontWeight: 700, textTransform: 'uppercase' }}>
                              {t.priority}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.updatedAt}</span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#0f172a', marginBottom: 4 }}>
                          {t.subject}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                          <span>From: <strong style={{ color: '#334155' }}>{t.userName}</strong> ({t.userRole})</span>
                          <span>Assigned: <strong style={{ color: '#334155' }}>{t.assignedAdminEmail || 'Unassigned'}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Ticket Thread Panel */}
            {selectedTicket && (
              <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Header detail */}
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a', fontFamily: 'monospace' }}>#{selectedTicket.ticketId}</span>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{selectedTicket.subject}</h2>
                    </div>
                    <button
                      onClick={() => handleDeleteRecord(selectedTicket.id, 'Support Ticket')}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                      title="Delete Ticket"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.82rem', color: '#64748b' }}>
                    <div>User: <strong style={{ color: '#0f172a' }}>{selectedTicket.userName}</strong> ({selectedTicket.userEmail})</div>
                    <div>Category: <strong style={{ color: '#0f172a' }}>{selectedTicket.category}</strong></div>
                    <div>Assigned Staff: <strong style={{ color: '#16a34a' }}>{selectedTicket.assignedAdminEmail || 'Unassigned'}</strong></div>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setAssignTicketTarget(selectedTicket);
                        setShowAssignModal(true);
                      }}
                      style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                      Reassign Ticket
                    </button>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto', paddingRight: 6 }}>
                  {selectedTicket.messages.map((msg, idx) => {
                    const isAdmin = msg.senderRole === 'superadmin';
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          backgroundColor: isAdmin ? '#ecfdf5' : '#f8fafc',
                          border: isAdmin ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '90%',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isAdmin ? '#15803d' : '#475569', marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span>{msg.senderName} ({msg.senderRole})</span>
                          <span style={{ color: '#94a3b8', fontWeight: 400 }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#1e293b', whiteSpace: 'pre-line' }}>{msg.content}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Canned Quick Response Chips */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>QUICK CANNED RESPONSES</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CANNED_RESPONSES.map((resp, i) => (
                      <button
                        key={i}
                        onClick={() => setReplyText(resp)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          borderRadius: 14,
                          fontSize: '0.72rem',
                          color: '#475569',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        "{resp.substring(0, 32)}..."
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reply Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea
                    rows={3}
                    placeholder="Type official support resolution reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.88rem',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  />

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleSendReply('in_progress')}
                      disabled={isSubmitting || !replyText.trim()}
                      style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Reply & Keep In-Progress
                    </button>
                    <button
                      onClick={() => handleSendReply('resolved')}
                      disabled={isSubmitting || !replyText.trim()}
                      style={{ padding: '8px 18px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Reply & Resolve Ticket ✓
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: LIVE CHAT STREAM */}
      {activeTab === 'livechat' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Real-Time Live Chat Stream</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Monitor active order communications between customers, vendors, and support staff.</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
              Live Monitoring Active
            </span>
          </div>

          {chatStreams.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>chat_bubble_outline</span>
              No live chat sessions logged in system stream.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {chatStreams.map((chat) => (
                <div key={chat.id} style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: 6 }}>
                        Order #{chat.orderId}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{chat.timestamp}</span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 6 }}>
                      Sender: <strong style={{ color: '#0f172a' }}>{chat.sender}</strong> → Receiver: <strong style={{ color: '#0f172a' }}>{chat.receiver}</strong>
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#1e293b', backgroundColor: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                      "{chat.message}"
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        // Pre-fill ticket creation or reply
                        setActiveTab('tickets');
                        showToast(`Initiated ticket review for Order #${chat.orderId}`, 'info');
                      }}
                      style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Convert to Support Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: KNOWLEDGE BASE */}
      {activeTab === 'kb' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Self-Service Knowledge Base & FAQs</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Published articles displayed in customer and vendor helpdesk centers.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {articles.map((art) => (
              <div key={art.id} style={{ backgroundColor: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
                      {art.category}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{art.articleId}</span>
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{art.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 12 }}>
                    {art.content}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span>👁 {art.views} views</span>
                    <span>👍 {art.helpfulCount} helpful</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRecord(art.id, 'Knowledge Base Article')}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: TICKET ASSIGNMENT */}
      {activeTab === 'assignment' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Support Staff Workload & Assignment Hub</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Distribute incoming customer and vendor tickets to internal admins and support agents.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {staffList.map((st, i) => {
              const assignedCount = tickets.filter((t) => t.assignedAdminEmail === st.email).length;
              return (
                <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                      {st.name ? st.name.substring(0, 2).toUpperCase() : 'AG'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>{st.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{st.email}</div>
                      <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 600, marginTop: 2, display: 'inline-block' }}>
                        {st.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>{assignedCount}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Active Tickets</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: TICKET ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Ticket Status Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  <span>Resolved ({analytics.resolvedCount})</span>
                  <span>{analytics.resolutionRate}%</span>
                </div>
                <div style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${analytics.resolutionRate}%`, height: '100%', backgroundColor: '#16a34a' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  <span>Open Queue ({analytics.openCount})</span>
                  <span>{analytics.totalCount > 0 ? Math.round((analytics.openCount / analytics.totalCount) * 100) : 0}%</span>
                </div>
                <div style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${analytics.totalCount > 0 ? (analytics.openCount / analytics.totalCount) * 100 : 0}%`, height: '100%', backgroundColor: '#f59e0b' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: 4 }}>
                  <span>In Progress ({analytics.inProgressCount})</span>
                  <span>{analytics.totalCount > 0 ? Math.round((analytics.inProgressCount / analytics.totalCount) * 100) : 0}%</span>
                </div>
                <div style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${analytics.totalCount > 0 ? (analytics.inProgressCount / analytics.totalCount) * 100 : 0}%`, height: '100%', backgroundColor: '#8b5cf6' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Key Support SLA Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 10 }}>
                <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>First Response SLA Target</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>&lt; 2.0 Hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 10 }}>
                <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>Actual Avg Response Time</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b82f6' }}>{analytics.avgResponseTimeHours}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: 10 }}>
                <span style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>Customer Satisfaction Score</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#15803d' }}>4.8 / 5.0 ⭐</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: ADD KB ARTICLE */}
      {showKBModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 550, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Publish New KB Article</h3>
              <button onClick={() => setShowKBModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateKBArticle} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Article Title</label>
                <input
                  type="text"
                  placeholder="e.g. How to track your order shipment"
                  value={kbTitle}
                  onChange={(e) => setKbTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Category</label>
                <select
                  value={kbCategory}
                  onChange={(e) => setKbCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="Orders & Delivery">Orders & Delivery</option>
                  <option value="Payment & Refunds">Payment & Refunds</option>
                  <option value="Vendor Onboarding">Vendor Onboarding</option>
                  <option value="Account & Security">Account & Security</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Content Body</label>
                <textarea
                  rows={5}
                  placeholder="Write helpful self-service instructions..."
                  value={kbContent}
                  onChange={(e) => setKbContent(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowKBModal(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TICKET */}
      {showAssignModal && assignTicketTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Assign Support Ticket</h3>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ marginBottom: 16, fontSize: '0.88rem', color: '#475569' }}>
              Assigning ticket <strong style={{ color: '#16a34a', fontFamily: 'monospace' }}>#{assignTicketTarget.ticketId}</strong> ({assignTicketTarget.subject}) to staff:
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>Select Staff Member</label>
              <select
                value={selectedStaffEmail}
                onChange={(e) => setSelectedStaffEmail(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', backgroundColor: '#ffffff' }}
              >
                <option value="">-- Choose Support Staff --</option>
                {staffList.map((st, i) => (
                  <option key={i} value={st.email}>
                    {st.name} ({st.email}) - {st.role}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !selectedStaffEmail}
                onClick={handleAssignTicket}
                style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
