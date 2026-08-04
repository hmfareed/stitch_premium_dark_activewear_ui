'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorCashbookPage() {
  const { user } = useAuth();
  const [cashbook, setCashbook] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashbook();
  }, []);

  const fetchCashbook = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/accounting');
      const data = await res.json();
      if (res.ok) setCashbook(data.cashbook || []);
    } catch (err) {
      console.error('Failed to load cashbook:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 14 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Expenses Ledger', path: '/vendor/accounting/expenses', active: false, icon: 'receipt_long' },
          { label: 'Income & Revenue', path: '/vendor/accounting/income', active: false, icon: 'attach_money' },
          { label: 'Daily Cashbook', path: '/vendor/accounting/cashbook', active: true, icon: 'menu_book' },
          { label: 'Account Categories', path: '/vendor/accounting/categories', active: false, icon: 'category' },
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

      {/* Main Cashbook Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Daily Register Cashbook Journal
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Daily cash in & out balancing journal (Opening Float + Cash Receipts - Petty Cash Out = Closing Balance).
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading cashbook journal...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Journal Date</th>
                <th style={{ padding: '10px 8px' }}>Opening Float</th>
                <th style={{ padding: '10px 8px' }}>Total Cash In</th>
                <th style={{ padding: '10px 8px' }}>Petty Cash Out</th>
                <th style={{ padding: '10px 8px' }}>Closing Cash Balance</th>
                <th style={{ padding: '10px 8px' }}>Audit Note</th>
              </tr>
            </thead>
            <tbody>
              {cashbook.map(cb => (
                <tr key={cb.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{cb.date}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>GH₵ {cb.openingBalance.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>+GH₵ {cb.cashIn.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#dc2626' }}>-GH₵ {cb.cashOut.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#2563eb' }}>GH₵ {cb.closingBalance.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{cb.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
