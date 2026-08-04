'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorAnalyticsDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('sales');

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/analytics?range=${range}`);
      const resData = await res.json();
      if (res.ok) setData(resData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: string) => {
    showToast(`Exporting analytics report as ${format.toUpperCase()}...`, 'success');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 12 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Analytics Dashboard', path: '/vendor/analytics', active: true, icon: 'analytics' },
          { label: 'Operating Expenses', path: '/vendor/analytics/expenses', active: false, icon: 'payments' },
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

      {/* Top Header & Range Pickers */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Reports & Business Analytics
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Real-time intelligence across sales, orders, products, inventory valuation, and employee performance.
            </p>
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => handleExport('csv')} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              📄 CSV
            </button>
            <button onClick={() => handleExport('excel')} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              📊 Excel
            </button>
            <button onClick={() => handleExport('pdf')} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
              📕 Download PDF
            </button>
          </div>
        </div>

        {/* Date Range Selector & Period Comparison Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'ytd', label: 'Year to Date' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  fontWeight: range === r.id ? 800 : 600,
                  cursor: 'pointer',
                  backgroundColor: range === r.id ? '#061d13' : '#ffffff',
                  color: range === r.id ? '#a3e635' : '#475569',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', backgroundColor: '#dcfce7', padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_up</span>
            {data?.metrics?.periodComparison || '+18.4% vs previous period'}
          </div>
        </div>

        {/* Core KPI Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading analytics metrics...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>TOTAL SALES REVENUE</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                GH₵ {(data?.metrics?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>COMPLETED ORDERS</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                {data?.metrics?.orderCount || 0} orders
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>AVERAGE ORDER VALUE</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                GH₵ {(data?.metrics?.averageOrderValue || 0).toFixed(2)}
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>INVENTORY VALUATION</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                GH₵ {(data?.metrics?.inventoryValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Interactive SVG Bar/Area Sales Trend Chart */}
        <div style={{ backgroundColor: '#061d13', borderRadius: 16, padding: 24, color: '#ffffff', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a3e635', margin: 0 }}>Sales & Revenue Velocity Trend</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Daily Aggregate</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, gap: 12, paddingTop: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {(data?.chartData || []).map((c: any) => {
              const heightPct = Math.min(100, Math.max(20, (c.sales / 3000) * 100));
              return (
                <div key={c.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#a3e635', fontWeight: 800 }}>GH₵ {c.sales}</span>
                  <div style={{ width: '100%', maxWidth: 36, height: `${heightPct}%`, backgroundColor: '#10b981', borderRadius: '6px 6px 0 0', transition: 'all 0.3s ease' }}></div>
                  <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 700 }}>{c.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Category Breakdown Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 20, overflowX: 'auto' }}>
          {[
            { id: 'sales', label: 'Bestseller Products' },
            { id: 'staff', label: 'Employee Performance' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveReportTab(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 12,
                fontWeight: activeReportTab === t.id ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: activeReportTab === t.id ? '#10b981' : '#f1f5f9',
                color: activeReportTab === t.id ? '#ffffff' : '#475569',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content Table */}
        {activeReportTab === 'sales' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Product Title</th>
                <th style={{ padding: '10px 8px' }}>Units Sold</th>
                <th style={{ padding: '10px 8px' }}>Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.bestsellers || []).map((b: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{b.name}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{b.unitsSold} units</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {b.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Employee Name</th>
                <th style={{ padding: '10px 8px' }}>Orders Processed</th>
                <th style={{ padding: '10px 8px' }}>Sales Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {(data?.employeeSales || []).map((e: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{e.name}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{e.orders} orders</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {e.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>

    </div>
  );
}
