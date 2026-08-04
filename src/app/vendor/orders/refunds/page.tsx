'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorRefundsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [refunds, setRefunds] = useState([
    { id: 'ref-901', orderId: '#ORD-9640', customer: 'Kofi Owusu', amount: 180.00, method: 'Store Credit Wallet', status: 'Completed', date: 'Jul 29, 2026' },
    { id: 'ref-902', orderId: '#ORD-9102', customer: 'Ama Mensah', amount: 95.00, method: 'Mobile Money (MTN)', status: 'Completed', date: 'Jul 15, 2026' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [orderId, setOrderId] = useState('#ORD-9812');
  const [customer, setCustomer] = useState('Esi Mansa');
  const [amount, setAmount] = useState('150.00');
  const [method, setMethod] = useState('Store Credit Wallet');
  const [submitting, setSubmitting] = useState(false);

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { showToast('Valid amount required', 'error'); return; }

    setSubmitting(true);
    setTimeout(() => {
      const newRef = {
        id: `ref-${Math.floor(900 + Math.random() * 100)}`,
        orderId,
        customer,
        amount: Number(amount),
        method,
        status: 'Completed',
        date: new Date().toLocaleDateString(),
      };
      setRefunds([newRef, ...refunds]);
      showToast(`Refund of GH₵ ${Number(amount).toFixed(2)} processed!`, 'success');
      setShowAddModal(false);
      setSubmitting(false);
    }, 800);
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 8 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Orders', path: '/vendor/orders', active: false, icon: 'shopping_bag' },
          { label: 'Returns Management', path: '/vendor/orders/returns', active: false, icon: 'assignment_return' },
          { label: 'Refunds Processing', path: '/vendor/orders/refunds', active: true, icon: 'currency_exchange' },
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

      {/* Main Refunds Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Refunds Processing & History
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Process full or partial refunds directly to buyer Mobile Money accounts or Store Credit wallets.
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
            Process New Refund
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
              <th style={{ padding: '10px 8px' }}>Refund ID</th>
              <th style={{ padding: '10px 8px' }}>Order ID</th>
              <th style={{ padding: '10px 8px' }}>Customer Name</th>
              <th style={{ padding: '10px 8px' }}>Refund Amount</th>
              <th style={{ padding: '10px 8px' }}>Payout Method</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>#{r.id}</td>
                <td style={{ padding: '10px 8px', fontWeight: 700, color: '#475569' }}>{r.orderId}</td>
                <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0f172a' }}>{r.customer}</td>
                <td style={{ padding: '10px 8px', fontWeight: 900, color: '#dc2626' }}>-GH₵ {r.amount.toFixed(2)}</td>
                <td style={{ padding: '10px 8px', color: '#64748b' }}>{r.method}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                    COMPLETED
                  </span>
                </td>
                <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Process Refund Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Process Refund to Buyer</h3>
            <form onSubmit={handleProcessRefund} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Order Number</label>
                <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Customer Name</label>
                <input type="text" value={customer} onChange={e => setCustomer(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Refund Amount (GH₵)</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Refund Destination</label>
                <select value={method} onChange={e => setMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="Store Credit Wallet">Store Credit Wallet</option>
                  <option value="Mobile Money (MTN)">Mobile Money (MTN)</option>
                  <option value="Mobile Money (Telecel)">Mobile Money (Telecel)</option>
                  <option value="Bank Account Reversal">Bank Account Reversal</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Execute Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
