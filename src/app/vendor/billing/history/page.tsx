'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorBillingHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/billing');
      const data = await res.json();
      if (res.ok) setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 17 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Current Plan', path: '/vendor/billing', active: false, icon: 'workspace_premium' },
          { label: 'Upgrade Plan', path: '/vendor/billing/upgrade', active: false, icon: 'rocket_launch' },
          { label: 'Billing History', path: '/vendor/billing/history', active: true, icon: 'history' },
          { label: 'Invoices', path: '/vendor/billing/invoices', active: false, icon: 'receipt' },
          { label: 'Usage Quotas', path: '/vendor/billing/usage', active: false, icon: 'data_usage' },
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

      {/* Main History Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Subscription Payment History
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Audit past subscription renewal charges, Mobile Money transactions, and payment receipts.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading billing history...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Payment Date</th>
                <th style={{ padding: '10px 8px' }}>Subscription Plan</th>
                <th style={{ padding: '10px 8px' }}>Billing Coverage Period</th>
                <th style={{ padding: '10px 8px' }}>Amount Paid</th>
                <th style={{ padding: '10px 8px' }}>Payment Method</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{h.date}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{h.plan}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{h.period}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {h.amount.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', color: '#475569', fontWeight: 600 }}>{h.method}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                      {h.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
