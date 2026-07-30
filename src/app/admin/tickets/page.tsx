'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface SupportTicket {
  _id: string;
  ticketId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  subOrderId?: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: string;
  messages: Array<{ senderRole: string; senderName: string; content: string; timestamp: string }>;
  createdAt: string;
}

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'open' | 'in_progress' | 'resolved'>('open');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets?status=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (err) {
      showToast('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  const handleSendReply = async (newStatus?: 'in_progress' | 'resolved') => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId,
          status: newStatus || selectedTicket.status,
          replyContent: replyText,
          senderRole: 'superadmin',
          senderName: user?.name || 'Superadmin Support Agent',
          senderEmail: user?.email || 'admin@africart.com',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Reply sent successfully!', 'success');
        setReplyText('');
        setSelectedTicket(data.ticket);
        fetchTickets();
      } else {
        showToast(data.error || 'Failed to send reply', 'error');
      }
    } catch (err) {
      showToast('Error replying to ticket', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--font-inter)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>← Admin Dashboard</Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>Customer & Vendor Support Helpdesk</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem' }}>Track, mediate, and resolve customer and vendor platform disputes</p>
        </div>

        <button
          onClick={fetchTickets}
          style={{ padding: '10px 18px', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh Queue
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--outline-variant)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('open')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'open' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'open' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Open Tickets
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'in_progress' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'in_progress' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'resolved' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'resolved' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Resolved Tickets
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.2fr' : '1fr', gap: '24px' }}>
        {/* Ticket List */}
        <div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Loading helpdesk tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface-container)', borderRadius: '14px', color: 'var(--on-surface-variant)' }}>
              No {activeTab} tickets found.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {tickets.map(t => {
                const isSelected = selectedTicket?.ticketId === t.ticketId;
                return (
                  <div
                    key={t._id}
                    onClick={() => setSelectedTicket(t)}
                    style={{
                      padding: '16px',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-container)',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>#{t.ticketId}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{t.subject}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>From: {t.userName} ({t.userEmail})</div>
                    {t.subOrderId && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--lime-400)', marginTop: '4px', fontWeight: 600 }}>Linked Sub-Order: #{t.subOrderId}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Ticket Detail Thread */}
        {selectedTicket && (
          <div style={{ padding: '24px', backgroundColor: 'var(--surface-container-high)', borderRadius: '16px', border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            <div style={{ borderBottom: '1px solid var(--outline-variant)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, color: 'var(--primary)' }}>#{selectedTicket.ticketId}</span>
                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(37, 99, 235, 0.15)', color: 'var(--primary)' }}>
                  {selectedTicket.status.toUpperCase()}
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '8px 0 4px 0' }}>{selectedTicket.subject}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
                User: <strong>{selectedTicket.userName}</strong> ({selectedTicket.userEmail})
              </div>
            </div>

            {/* Conversation Thread */}
            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px', maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
              {selectedTicket.messages.map((msg, idx) => {
                const isAdmin = msg.senderRole === 'superadmin';
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: isAdmin ? 'rgba(37, 99, 235, 0.15)' : 'var(--surface)',
                      border: isAdmin ? '1px solid var(--primary)' : '1px solid var(--outline-variant)',
                      alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isAdmin ? 'var(--primary)' : 'var(--on-surface-variant)', marginBottom: '4px' }}>
                      {msg.senderName} ({msg.senderRole})
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--on-surface)' }}>{msg.content}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: '4px', textAlign: 'right' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Box */}
            <div>
              <textarea
                rows={3}
                placeholder="Type response to user..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-variant)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--on-surface)',
                  fontSize: '0.9rem',
                  marginBottom: '12px',
                }}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleSendReply('in_progress')}
                  disabled={isSubmitting || !replyText.trim()}
                  style={{ padding: '10px 16px', backgroundColor: 'var(--surface-container-highest)', color: 'var(--on-surface)', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Reply & Keep Open
                </button>
                <button
                  onClick={() => handleSendReply('resolved')}
                  disabled={isSubmitting || !replyText.trim()}
                  style={{ padding: '10px 18px', backgroundColor: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reply & Resolve Ticket ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
