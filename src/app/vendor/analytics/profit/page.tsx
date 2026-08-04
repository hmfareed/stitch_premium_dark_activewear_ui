'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorProfitReportPage() {
  const { user } = useAuth();

  const [profitData, setProfitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfit();
  }, []);

  const fetchProfit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/analytics');
      const data = await res.json();
      if (res.ok && data.profit) setProfitData(data.profit);
    } catch (err) {
      console.error('Failed to load profit:', err);
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
          { label: 'Operating Expenses', path: '/vendor/analytics/expenses', active: false, icon: 'payments' },
          { label: 'Profit & Loss P&L', path: '/vendor/analytics/profit', active: true, icon: 'trending_up' },
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

      {/* Main Profit Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Profitability & Loss (P&L) Statement
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Net profit breakdown deducting COGS, overhead expenses, and platform fees from gross revenue.
          </p>
        </div>

        {loading || !profitData ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading profit statement...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ backgroundColor: '#061d13', borderRadius: 18, padding: 24, color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#a3e635', fontWeight: 800 }}>NET PROFIT (AFTER EXPENSES & TAXES)</div>
                <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '2.2rem', fontWeight: 900, marginTop: 4 }}>
                  GH₵ {profitData.netProfit.toFixed(2)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>NET MARGIN PERCENTAGE</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a3e635', marginTop: 4 }}>
                  {profitData.profitMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* P&L Statement Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 10 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
                  <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>(+) Gross Product Sales Revenue</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 900, color: '#10b981' }}>GH₵ {profitData.grossSales.toFixed(2)}</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 12, color: '#dc2626' }}>(-) Cost of Goods Sold (COGS)</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>-GH₵ {profitData.cogs.toFixed(2)}</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 12, color: '#dc2626' }}>(-) Total Operating Overhead Expenses</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>-GH₵ {profitData.totalExpenses.toFixed(2)}</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 12, color: '#dc2626' }}>(-) Platform Commission Fees (5%)</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>-GH₵ {profitData.commissionFee.toFixed(2)}</td>
                </tr>

                <tr style={{ backgroundColor: '#f0fdf4', fontWeight: 900 }}>
                  <td style={{ padding: 14, color: '#166534', fontSize: 14 }}>(=) NET STORE PROFIT</td>
                  <td style={{ padding: 14, textAlign: 'right', color: '#166534', fontSize: 15 }}>GH₵ {profitData.netProfit.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

          </div>
        )}
      </div>

    </div>
  );
}
