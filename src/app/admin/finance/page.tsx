'use client';

import React, { useState, useEffect, useCallback } from 'react';

type ChannelTab = 'all' | 'momo' | 'card' | 'bank' | 'wallet' | 'cash';

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<ChannelTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Transaction Modal States
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [txnDetailData, setTxnDetailData] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'verify' | 'refund' | 'receipt' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formRefundReason, setFormRefundReason] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Transactions List by Channel Tab
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?channel=${activeTab}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setTransactionsList(data.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch Full Transaction Detail & Digital Receipt Payload
  const fetchTxnDetail = async (id: string, triggerModal: 'receipt' | 'verify' | 'refund') => {
    setSelectedTxnId(id);
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}`);
      const data = await res.json();
      if (data.success) {
        setTxnDetailData(data.transaction);
        setModalType(triggerModal);
      }
    } catch (err) {
      console.error('Error fetching transaction detail:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Verify Payment
  const handleVerifyPayment = async () => {
    if (!selectedTxnId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${selectedTxnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_payment' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchTransactions();
      }
    } catch (err) {
      console.error('Verify payment error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Issue Refund
  const handleRefundTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxnId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${selectedTxnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refund', refundReason: formRefundReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormRefundReason('');
        fetchTransactions();
      }
    } catch (err) {
      console.error('Refund transaction error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Export Transactions CSV
  const handleExportTransactions = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/payments/export', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.csvContent) {
        const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', data.filename || 'africart_payments.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Payment transactions exported to CSV!');
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalVolume = transactionsList.reduce((sum, t) => sum + (t.amount || 0), 0);
  const verifiedCount = transactionsList.filter(t => t.status === 'verified').length;

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
            Payments & Finance Gateway Panel
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Multi-channel payment verification, digital receipts, gateway reconciliation & refunds
          </p>
        </div>

        {/* Global Export Trigger Button */}
        <button onClick={handleExportTransactions} disabled={actionLoading} style={btnSecondaryStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
          <span>Export Transactions CSV</span>
        </button>
      </div>

      {/* Telemetry Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Total Processed Volume</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{formatGhs(totalVolume)}</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Verified Transactions</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{verifiedCount} transactions</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Supported Channels</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 6 }}>
            Cash • Card • MoMo • Bank • Wallet
          </div>
        </div>
      </div>

      {/* 5 Supported Payment Method Sub-View Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Payments', icon: 'payments' },
            { id: 'momo', label: 'Mobile Money (MoMo)', icon: 'smartphone' },
            { id: 'card', label: 'Card Payments', icon: 'credit_card' },
            { id: 'bank', label: 'Bank Transfers', icon: 'account_balance' },
            { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
            { id: 'cash', label: 'Cash (COD)', icon: 'local_atm' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ChannelTab)}
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

        {/* Search Bar */}
        <div style={{ position: 'relative', width: 240 }}>
          <input
            type="text"
            placeholder="Search txn ID, reference..."
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

      {/* Main Table Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading payment transactions...</p>
        </div>
      ) : (

        /* Payment Transactions Data Table */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Transactions ({transactionsList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Txn ID & Order ID</th>
                  <th style={{ padding: 10 }}>Customer</th>
                  <th style={{ padding: 10 }}>Channel</th>
                  <th style={{ padding: 10 }}>Amount (GH₵)</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Verification Info</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactionsList.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.transactionId}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Order: #{t.orderId}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{t.customerName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{t.customerEmail}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(getChannelColor(t.channel), getChannelBg(t.channel))}>
                        {t.channel.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a', fontSize: 13 }}>
                      {formatGhs(t.amount)}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(t.status === 'verified' ? '#166534' : t.status === 'refunded' ? '#ea580c' : '#b45309', t.status === 'verified' ? '#dcfce7' : t.status === 'refunded' ? '#ffedd5' : '#fef3c7')}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: 11, color: '#64748b' }}>
                      <div>By: {t.verifiedBy}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.createdAt}</div>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Verify Payment */}
                        {t.status !== 'verified' && (
                          <button onClick={() => fetchTxnDetail(t.transactionId, 'verify')} style={{ border: 'none', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Verify Payment
                          </button>
                        )}
                        {/* View Receipt */}
                        <button onClick={() => fetchTxnDetail(t.transactionId, 'receipt')} style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          View Receipt
                        </button>
                        {/* Refund */}
                        {t.status === 'verified' && (
                          <button onClick={() => fetchTxnDetail(t.transactionId, 'refund')} style={{ border: 'none', background: '#ffedd5', color: '#ea580c', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS FOR PAYMENT ACTIONS ────────────────────────────────── */}

      {/* Modal: Verify Payment Confirmation */}
      {modalType === 'verify' && txnDetailData && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Verify Payment Transaction</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Confirm manual payment receipt for <strong>{txnDetailData.transactionId}</strong></p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, fontSize: 12, marginBottom: 16 }}>
              <div><strong>Amount:</strong> {formatGhs(txnDetailData.amount)}</div>
              <div><strong>Channel:</strong> {txnDetailData.channel.toUpperCase()}</div>
              <div><strong>Customer:</strong> {txnDetailData.customerName} ({txnDetailData.customerEmail})</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
              <button onClick={handleVerifyPayment} disabled={actionLoading} style={btnPrimaryStyle}>Verify & Release</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Digital Printable Receipt */}
      {modalType === 'receipt' && txnDetailData && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={{ ...modalContentStyle, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Digital Payment Receipt</h3>
              <button onClick={() => window.print()} style={btnPrimaryStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                <span>Print Receipt</span>
              </button>
            </div>

            <div style={{ background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: 16, padding: 24, fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #e2e8f0', paddingBottom: 12, marginBottom: 14 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#16a34a' }}>AfriCart Payments Hub</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Receipt #: RCT-{txnDetailData.transactionId}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Date: {txnDetailData.createdAt}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer Name</span>
                  <span style={{ fontWeight: 800 }}>{txnDetailData.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Customer Email</span>
                  <span style={{ fontWeight: 700 }}>{txnDetailData.customerEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Order Identifier</span>
                  <span style={{ fontWeight: 700 }}>#{txnDetailData.orderId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Payment Channel</span>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', color: '#2563eb' }}>{txnDetailData.channel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Gateway Status</span>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', color: '#16a34a' }}>{txnDetailData.status}</span>
                </div>
              </div>

              <div style={{ borderTop: '2px solid #0f172a', marginTop: 14, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900 }}>
                <span>Total Amount Paid</span>
                <span style={{ color: '#16a34a' }}>{formatGhs(txnDetailData.amount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={btnSecondaryStyle}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Refund Transaction */}
      {modalType === 'refund' && txnDetailData && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Issue Transaction Refund</h3>
            <form onSubmit={handleRefundTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#64748b' }}>Refunding transaction <strong>{txnDetailData.transactionId}</strong> ({formatGhs(txnDetailData.amount)})</p>
              <div>
                <label style={labelStyle}>Refund Reason *</label>
                <input type="text" value={formRefundReason} onChange={e => setFormRefundReason(e.target.value)} placeholder="e.g. Order cancellation / duplicate charge" required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ ...btnPrimaryStyle, background: '#ea580c' }}>Process Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Helpers
const getChannelColor = (ch: string) => {
  const map: Record<string, string> = { momo: '#7c3aed', card: '#2563eb', bank: '#0284c7', wallet: '#166534', cash: '#b45309' };
  return map[ch] || '#475569';
};

const getChannelBg = (ch: string) => {
  const map: Record<string, string> = { momo: '#f3e8ff', card: '#dbeafe', bank: '#e0f2fe', wallet: '#dcfce7', cash: '#fef3c7' };
  return map[ch] || '#f1f5f9';
};

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 18,
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
