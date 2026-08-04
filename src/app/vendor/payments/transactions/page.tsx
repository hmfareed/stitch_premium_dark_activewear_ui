'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorTransactionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/payments');
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) { showToast('No transactions to export', 'error'); return; }
    const headers = ['TxnID', 'OrderID', 'Date', 'Customer', 'PaymentMethod', 'GrossAmount', 'CommissionFee', 'NetPayout', 'Status'];
    const rows = transactions.map(t => [
      t.id,
      t.orderId,
      t.date,
      `"${t.customerName.replace(/"/g, '""')}"`,
      t.method,
      t.grossAmount.toFixed(2),
      t.commissionFee.toFixed(2),
      t.netPayout.toFixed(2),
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payment-transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Payment transactions exported to CSV!', 'success');
  };

  const filteredTxns = transactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(search.toLowerCase()) ||
                          t.orderId.toLowerCase().includes(search.toLowerCase()) ||
                          t.customerName.toLowerCase().includes(search.toLowerCase());

    if (methodFilter === 'all') return matchesSearch;
    if (methodFilter === 'momo') return matchesSearch && t.method.includes('Mobile Money');
    if (methodFilter === 'card') return matchesSearch && t.method.includes('Card');
    if (methodFilter === 'bank') return matchesSearch && t.method.includes('Bank');
    return matchesSearch;
  });

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 10 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Transactions Ledger', path: '/vendor/payments/transactions', active: true, icon: 'receipt' },
          { label: 'Payouts & Withdrawals', path: '/vendor/payments/payouts', active: false, icon: 'account_balance' },
          { label: 'Invoices & Billing', path: '/vendor/payments/invoices', active: false, icon: 'description' },
          { label: 'Settlement & Bank Rec', path: '/vendor/payments/settlement', active: false, icon: 'account_balance_wallet' },
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

      {/* Main Transactions Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Payment Transactions & Revenue Ledger
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Real-time audit log of customer Mobile Money, Card, and Bank Transfer payments.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export Ledger CSV
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, fontSize: 18, color: '#94a3b8' }}>search</span>
            <input
              type="text"
              placeholder="Search reference ID, order ID, or customer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
            />
          </div>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none' }}
          >
            <option value="all">All Payment Tenders</option>
            <option value="momo">Mobile Money (MTN / Telecel)</option>
            <option value="card">Card Payments (Visa / Mastercard)</option>
            <option value="bank">Bank Transfer (GIP)</option>
          </select>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading transaction ledger...</div>
        ) : filteredTxns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>No payment records found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Reference Txn ID</th>
                  <th style={{ padding: '10px 8px' }}>Order ID</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Payment Method</th>
                  <th style={{ padding: '10px 8px' }}>Gross Amount</th>
                  <th style={{ padding: '10px 8px' }}>Platform Fee (5%)</th>
                  <th style={{ padding: '10px 8px' }}>Net Payout</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: '#0f172a' }}>{t.id}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#475569' }}>{t.orderId}</td>
                    <td style={{ padding: '10px 8px', color: '#334155', fontWeight: 600 }}>{t.customerName}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: t.method.includes('Mobile Money') ? '#d97706' : t.method.includes('Card') ? '#2563eb' : '#16a34a' }}>
                      {t.method}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 800 }}>GH₵ {t.grossAmount.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', color: '#dc2626', fontWeight: 700 }}>-GH₵ {t.commissionFee.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {t.netPayout.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedTxn(t)}
                        style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                      >
                        Download Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Transaction Receipt Modal */}
      {selectedTxn && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Payment Receipt: {selectedTxn.id}</h3>
              <button onClick={() => setSelectedTxn(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#475569', marginBottom: 20 }}>
              <div><strong>Order Reference:</strong> {selectedTxn.orderId}</div>
              <div><strong>Transaction Date:</strong> {selectedTxn.date}</div>
              <div><strong>Customer Name:</strong> {selectedTxn.customerName}</div>
              <div><strong>Tender Method:</strong> {selectedTxn.method}</div>
              <div><strong>Gross Charge:</strong> GH₵ {selectedTxn.grossAmount.toFixed(2)}</div>
              <div><strong>Platform Commission (5%):</strong> -GH₵ {selectedTxn.commissionFee.toFixed(2)}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981', paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                Net Vendor Payout: GH₵ {selectedTxn.netPayout.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelectedTxn(null)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12 }}>Close</button>
              <button onClick={() => window.print()} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12 }}>Print PDF Receipt</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
