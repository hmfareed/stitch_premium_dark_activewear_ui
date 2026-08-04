'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorExpensesReportPage() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/analytics');
      const data = await res.json();
      if (res.ok && data.expenses) {
        setExpenses(data.expenses.list || []);
        setTotal(data.expenses.total || 0);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 12 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Analytics Dashboard', path: '/vendor/analytics', active: false, icon: 'analytics' },
          { label: 'Operating Expenses', path: '/vendor/analytics/expenses', active: true, icon: 'payments' },
          { label: 'Profit & Loss P&L', path: '/vendor/analytics/profit', active: false, icon: 'trending_up' },
          { label: 'GRA Tax & VAT', path: '/vendor/analytics/taxes', active: false, icon: 'account_balance' },
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

      {/* Main Expenses Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Store Operating Expenses Report
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Track store overhead costs: facility rent, utilities, packaging, courier subsidies, and staff payroll.
            </p>
          </div>

          <div style={{ backgroundColor: '#fee2e2', padding: '10px 18px', borderRadius: 12, border: '1px solid #fca5a5' }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: '#dc2626' }}>TOTAL OPERATING OVERHEAD</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#b91c1c', marginTop: 2 }}>
              GH₵ {total.toFixed(2)}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading expenses...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Expense Category</th>
                <th style={{ padding: '10px 8px' }}>Total Amount</th>
                <th style={{ padding: '10px 8px' }}>Share of Total Overhead</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((ex, idx) => {
                const sharePct = total > 0 ? (ex.amount / total) * 100 : 0;
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{ex.category}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: '#dc2626' }}>GH₵ {ex.amount.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{ width: `${sharePct}%`, height: '100%', backgroundColor: '#dc2626' }}></div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', width: 45 }}>{sharePct.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
