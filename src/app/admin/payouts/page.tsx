'use client';

import React, { useState, useEffect, useCallback } from 'react';

type WorkflowTab = 'all' | 'pending' | 'approved' | 'paid' | 'rejected';

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<WorkflowTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Payout Modal States
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'reject' | 'receipt' | 'create' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formNotes, setFormNotes] = useState('');
  const [formVendorEmail, setFormVendorEmail] = useState('');
  const [formVendorName, setFormVendorName] = useState('');
  const [formAmount, setFormAmount] = useState('250.00');
  const [formMethod, setFormMethod] = useState('MTN Mobile Money');
  const [formAccountDetails, setFormAccountDetails] = useState('0245550192');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Payouts List by Workflow Tab
  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payouts?status=${activeTab}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setPayoutsList(data.payouts || []);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Action: Approve Payout
  const handleApprovePayout = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchPayouts();
      }
    } catch (err) {
      console.error('Approve payout error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Mark Paid
  const handleMarkPaid = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchPayouts();
      }
    } catch (err) {
      console.error('Mark paid error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reject Payout
  const handleRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payouts/${selectedPayout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes: formNotes }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormNotes('');
        fetchPayouts();
      }
    } catch (err) {
      console.error('Reject payout error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Send Receipt
  const handleSendReceipt = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_receipt' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchPayouts();
      }
    } catch (err) {
      console.error('Send receipt error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Manual Payout Request
  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorEmail: formVendorEmail,
          vendorName: formVendorName,
          amount: formAmount,
          paymentMethod: formMethod,
          accountDetails: formAccountDetails,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchPayouts();
      }
    } catch (err) {
      console.error('Create payout error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Export Payouts CSV
  const handleExportPayouts = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/payouts/export', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.csvContent) {
        const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', data.filename || 'africart_payouts.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Payout records exported to CSV!');
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormVendorEmail(''); setFormVendorName(''); setFormAmount('250.00'); setFormNotes('');
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={toastStyle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Vendor Payout Settlement Workflow
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Vendor net earnings approval workflow (Pending → Approved → Paid / Rejected) & receipt generation
          </p>
        </div>

        {/* Global Action Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { resetForm(); setModalType('create'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_task</span>
            <span>+ Request Payout</span>
          </button>
          <button onClick={handleExportPayouts} disabled={actionLoading} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            <span>Export Payouts CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Workflow Navigation Sub-View Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'pending', label: 'Pending Requests', icon: 'hourglass_top' },
            { id: 'approved', label: 'Approved Payouts', icon: 'verified' },
            { id: 'paid', label: 'Paid Settlements', icon: 'task_alt' },
            { id: 'rejected', label: 'Rejected Payouts', icon: 'cancel' },
            { id: 'all', label: 'All Payouts', icon: 'format_list_bulleted' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as WorkflowTab)}
              style={{
                border: 'none',
                background: activeTab === tab.id ? '#0f172a' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: 12,
                padding: '8px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: 240 }}>
          <input
            type="text"
            placeholder="Search payout ref, vendor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: 9, fontSize: 18, color: '#94a3b8' }}>
            search
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading payout workflow telemetry...</p>
        </div>
      ) : (

        /* Master Payouts Data Table */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Vendor Payouts ({payoutsList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Payout Ref & Date</th>
                  <th style={{ padding: 10 }}>Vendor Partner</th>
                  <th style={{ padding: 10 }}>Amount (GH₵)</th>
                  <th style={{ padding: 10 }}>Payment Channel</th>
                  <th style={{ padding: 10 }}>Workflow Status</th>
                  <th style={{ padding: 10 }}>Receipt Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Workflow Functions</th>
                </tr>
              </thead>
              <tbody>
                {payoutsList.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.payoutRef}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Req: {p.requestDate}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{p.vendorName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{p.vendorEmail}</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a', fontSize: 14 }}>
                      {formatGhs(p.amount)}
                    </td>
                    <td style={{ padding: 12, color: '#475569' }}>
                      <div style={{ fontWeight: 700 }}>{p.paymentMethod}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Acc: {p.accountDetails}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(getStatusColor(p.status), getStatusBg(p.status))}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      {p.receiptSent ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '2px 6px', borderRadius: 4 }}>
                          SENT ({p.receiptSentAt})
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>Not Sent</span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Function 1: Approve */}
                        {p.status === 'Pending' && (
                          <button onClick={() => handleApprovePayout(p.id)} style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Approve
                          </button>
                        )}
                        {/* Mark Paid */}
                        {p.status === 'Approved' && (
                          <button onClick={() => handleMarkPaid(p.id)} style={{ border: 'none', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Mark Paid
                          </button>
                        )}
                        {/* Function 2: Reject */}
                        {(p.status === 'Pending' || p.status === 'Approved') && (
                          <button onClick={() => { setSelectedPayout(p); setModalType('reject'); }} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Reject
                          </button>
                        )}
                        {/* Function 3: Send Receipt */}
                        <button onClick={() => { setSelectedPayout(p); setModalType('receipt'); handleSendReceipt(p.id); }} style={{ border: 'none', background: '#f3e8ff', color: '#7c3aed', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Send Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS FOR PAYOUT ACTIONS ─────────────────────────────────── */}

      {/* Modal: Create Payout Request */}
      {modalType === 'create' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Request Vendor Payout</h3>
            <form onSubmit={handleCreatePayout} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Vendor Email Address *</label>
                <input type="email" value={formVendorEmail} onChange={e => setFormVendorEmail(e.target.value)} required placeholder="ashanti@africart.com" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Vendor Store Name</label>
                  <input type="text" value={formVendorName} onChange={e => setFormVendorName(e.target.value)} placeholder="Ashanti Store" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Payout Amount (GH₵) *</label>
                  <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <input type="text" value={formMethod} onChange={e => setFormMethod(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Account / Phone Details</label>
                  <input type="text" value={formAccountDetails} onChange={e => setFormAccountDetails(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Create Payout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reject Payout */}
      {modalType === 'reject' && selectedPayout && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Reject Payout Request</h3>
            <form onSubmit={handleRejectPayout} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#64748b' }}>Rejecting payout <strong>{selectedPayout.payoutRef}</strong> for {selectedPayout.vendorEmail}</p>
              <div>
                <label style={labelStyle}>Rejection Audit Reason *</label>
                <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="e.g. Account details mismatch / pending order resolution" required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ ...btnPrimaryStyle, background: '#dc2626' }}>Confirm Rejection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Send & View Digital Receipt */}
      {modalType === 'receipt' && selectedPayout && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={{ ...modalContentStyle, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Vendor Payout Settlement Receipt</h3>
              <button onClick={() => window.print()} style={btnPrimaryStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                <span>Print Receipt</span>
              </button>
            </div>

            <div style={{ background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: 16, padding: 24, fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: 12, marginBottom: 14 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#16a34a' }}>AfriCart Vendor Settlement</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Receipt Ref #: {selectedPayout.payoutRef}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Settlement Date: {selectedPayout.processedDate || selectedPayout.requestDate}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Vendor Partner</span>
                  <span style={{ fontWeight: 800 }}>{selectedPayout.vendorName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Vendor Email</span>
                  <span style={{ fontWeight: 700 }}>{selectedPayout.vendorEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Displacement Channel</span>
                  <span style={{ fontWeight: 700 }}>{selectedPayout.paymentMethod}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Account Details</span>
                  <span style={{ fontWeight: 700 }}>{selectedPayout.accountDetails}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Workflow Status</span>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', color: getStatusColor(selectedPayout.status) }}>{selectedPayout.status}</span>
                </div>
              </div>

              <div style={{ borderTop: '2px solid #0f172a', marginTop: 14, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900 }}>
                <span>Net Disbursed Amount</span>
                <span style={{ color: '#16a34a' }}>{formatGhs(selectedPayout.amount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={btnSecondaryStyle}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers
const getStatusColor = (status: string) => {
  const map: Record<string, string> = { Pending: '#b45309', Approved: '#2563eb', Paid: '#166534', Rejected: '#991b1b' };
  return map[status] || '#475569';
};

const getStatusBg = (status: string) => {
  const map: Record<string, string> = { Pending: '#fef3c7', Approved: '#dbeafe', Paid: '#dcfce7', Rejected: '#fee2e2' };
  return map[status] || '#f1f5f9';
};

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  background: '#0f172a',
  color: '#38bdf8',
  padding: '12px 20px',
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  fontSize: 13,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #0284c7',
};

const btnPrimaryStyle: React.CSSProperties = {
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondaryStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#475569',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 6,
  textTransform: 'uppercase',
});

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 20,
  padding: 24,
  width: '100%',
  maxWidth: 520,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  outline: 'none',
};
