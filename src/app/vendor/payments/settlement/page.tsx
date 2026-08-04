'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorSettlementPage() {
  const { user } = useAuth();

  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlement();
  }, []);

  const fetchSettlement = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/payments');
      const data = await res.json();
      if (res.ok) setSettlement(data.settlement || null);
    } catch (err) {
      console.error('Failed to load settlement:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 10 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Transactions Ledger', path: '/vendor/payments/transactions', active: false, icon: 'receipt' },
          { label: 'Payouts & Withdrawals', path: '/vendor/payments/payouts', active: false, icon: 'account_balance' },
          { label: 'Invoices & Billing', path: '/vendor/payments/invoices', active: false, icon: 'description' },
          { label: 'Settlement & Bank Rec', path: '/vendor/payments/settlement', active: true, icon: 'account_balance_wallet' },
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

      {/* Main Settlement Reconciliation Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Bank Settlement & Automated Reconciliation
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Reconcile gross sales against platform commission deductions, customer refund adjustments, and bank payouts.
          </p>
        </div>

        {loading || !settlement ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading settlement reconciliation...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Net Breakdown Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>TOTAL GROSS SALES</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>GH₵ {settlement.grossSales.toFixed(2)}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626' }}>COMMISSION DEDUCTIONS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#dc2626', marginTop: 4 }}>-GH₵ {settlement.commissionDeductions.toFixed(2)}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706' }}>REFUND ADJUSTMENTS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706', marginTop: 4 }}>-GH₵ {settlement.refundAdjustments.toFixed(2)}</div>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 18, borderRadius: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>NET RECONCILED SETTLEMENT</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>GH₵ {settlement.netSettlementAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Reconciliation Log Info */}
            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Ghana Interbank Settlement Batch</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Batch ID: {settlement.bankBatchId} • Reconciled on {settlement.lastReconciliationDate}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 12px', borderRadius: 6 }}>
                RECONCILED & BALANCED
              </span>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
