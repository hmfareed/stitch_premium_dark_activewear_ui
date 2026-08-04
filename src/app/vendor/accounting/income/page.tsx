'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorIncomeLedgerPage() {
  const { user } = useAuth();
  const [income, setIncome] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncome();
  }, []);

  const fetchIncome = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/accounting');
      const data = await res.json();
      if (res.ok) setIncome(data.income || []);
    } catch (err) {
      console.error('Failed to load income:', err);
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
          { label: 'Income & Revenue', path: '/vendor/accounting/income', active: true, icon: 'attach_money' },
          { label: 'Daily Cashbook', path: '/vendor/accounting/cashbook', active: false, icon: 'menu_book' },
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

      {/* Main Income Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Store Income & Revenue Streams
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Audit incoming revenue streams across online orders, in-store POS transactions, and wholesale sales.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading income records...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Income Stream Description</th>
                <th style={{ padding: '10px 8px' }}>Revenue Source</th>
                <th style={{ padding: '10px 8px' }}>Amount Generated</th>
                <th style={{ padding: '10px 8px' }}>Payment Method</th>
                <th style={{ padding: '10px 8px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {income.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{inc.title}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6, backgroundColor: '#dcfce7', color: '#16a34a' }}>
                      {inc.source}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {inc.amount.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', color: '#475569', fontWeight: 600 }}>{inc.method}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{inc.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
