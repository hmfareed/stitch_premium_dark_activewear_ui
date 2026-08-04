'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorSupportTicketsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Payouts & Banking');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/support');
      const data = await res.json();
      if (res.ok) setTickets(data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast('Subject and description are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_ticket',
          ticket: { subject: subject.trim(), category, priority, description: description.trim(), attachmentUrl },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Support ticket submitted successfully!', 'success');
      setTickets(data.tickets || []);
      setShowAddModal(false);
      setSubject('');
      setDescription('');
      setAttachmentUrl('');
    } catch (err: any) {
      showToast(err.message || 'Error submitting ticket', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 19 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Support Tickets', path: '/vendor/support/tickets', active: true, icon: 'confirmation_number' },
          { label: 'Live Chat', path: '/vendor/support/chat', active: false, icon: 'chat' },
          { label: 'Knowledge Base', path: '/vendor/support/kb', active: false, icon: 'help' },
          { label: 'Contact Support', path: '/vendor/support/contact', active: false, icon: 'contact_support' },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#ffffff' : '#475569',
              backgroundColor: tab.active ? '#10b981' : '#ffffff',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Tickets Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Vendor Support Tickets & Issue Tracker
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Submit technical, payment, or logistics support tickets and track resolution status.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Create Ticket
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading support tickets...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Ticket ID</th>
                <th style={{ padding: '10px 8px' }}>Subject</th>
                <th style={{ padding: '10px 8px' }}>Category</th>
                <th style={{ padding: '10px 8px' }}>Priority</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Attachment</th>
                <th style={{ padding: '10px 8px' }}>Date Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>🎫 #{t.id}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{t.subject}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#475569' }}>{t.category}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: t.priority === 'High' || t.priority === 'Urgent' ? '#fee2e2' : '#f1f5f9',
                      color: t.priority === 'High' || t.priority === 'Urgent' ? '#dc2626' : '#475569',
                    }}>
                      {t.priority.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: t.status === 'Resolved' ? '#dcfce7' : (t.status === 'In Progress' ? '#fef3c7' : '#dbeafe'),
                      color: t.status === 'Resolved' ? '#16a34a' : (t.status === 'In Progress' ? '#d97706' : '#2563eb'),
                    }}>
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    {t.attachmentUrl ? (
                      <a href={t.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textDecoration: 'none' }}>
                        📎 Attachment
                      </a>
                    ) : (
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Create Support Ticket</h3>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Subject *</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mobile Money payout delayed by 24h" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
                    <option value="Payouts & Banking">Payouts & Banking</option>
                    <option value="POS Hardware">POS Hardware</option>
                    <option value="Inventory Sync">Inventory Sync</option>
                    <option value="Order Logistics">Order Logistics</option>
                    <option value="Account Settings">Account Settings</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Description / Issue Details *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the issue or error in detail..." style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Attach File / Screenshot Image URL</label>
                <input type="text" value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
