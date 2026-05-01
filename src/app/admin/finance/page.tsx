'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

const FinanceMetric = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
  <div style={{ flex: '1 1 220px', padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <h2 className="font-lexend" style={{ fontSize: '1.8rem', margin: 0 }}>{value}</h2>
  </div>
);

export default function AdminFinancePage() {
  const { allOrders, totalRevenue, totalOrderCount, deliveredOrders } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');

  // Compute real finance data from orders
  const commissionRate = 0.10; // 10% platform commission
  const platformCommission = totalRevenue * commissionRate;
  const vendorPayouts = totalRevenue - platformCommission;

  // Revenue by category
  const categoryRevenue: Record<string, number> = {};
  allOrders.forEach(order => {
    (order.products || []).forEach(p => {
      const cat = p.category || 'Uncategorized';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (p.price * (p.quantity || 1));
    });
  });
  const categoryList = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1]);
  const maxCatRevenue = categoryList.length > 0 ? categoryList[0][1] : 1;

  // Revenue by customer
  const customerRevenue: Record<string, { name: string; total: number; orders: number }> = {};
  allOrders.forEach(order => {
    const key = order.customerEmail || 'unknown';
    if (!customerRevenue[key]) customerRevenue[key] = { name: order.customerName || 'Unknown', total: 0, orders: 0 };
    customerRevenue[key].total += order.total || 0;
    customerRevenue[key].orders++;
  });
  const topCustomers = Object.values(customerRevenue).sort((a, b) => b.total - a.total).slice(0, 5);

  // Cancelled orders = potential refunds
  const cancelledTotal = allOrders.filter(o => o.status === 'Cancelled').reduce((s, o) => s + (o.total || 0), 0);

  const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.4 }}>{icon}</span>
      <p style={{ fontSize: '0.9rem' }}>{text}</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Finance Panel</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Revenue and commission data calculated from real orders</p>
      </div>

      {/* Metrics — all computed from real orders */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <FinanceMetric title="Gross Revenue" value={`$${totalRevenue.toFixed(2)}`} icon="payments" color="var(--lime-400)" />
        <FinanceMetric title="Platform Commission (10%)" value={`$${platformCommission.toFixed(2)}`} icon="percent" color="#00e5ff" />
        <FinanceMetric title="Vendor Payouts (90%)" value={`$${vendorPayouts.toFixed(2)}`} icon="account_balance" color="var(--secondary)" />
        <FinanceMetric title="Cancelled/Refundable" value={`$${cancelledTotal.toFixed(2)}`} icon="undo" color="var(--error)" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['overview', 'revenue_breakdown', 'top_customers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface)', color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
            {tab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Financial Summary</h3>
            {totalOrderCount === 0 ? (
              <EmptyState icon="account_balance" text="No financial data yet. Revenue will be calculated from real orders." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Total Orders', value: totalOrderCount.toString() },
                  { label: 'Delivered Orders', value: deliveredOrders.toString() },
                  { label: 'Average Order Value', value: totalOrderCount > 0 ? `$${(totalRevenue / totalOrderCount).toFixed(2)}` : '$0.00' },
                  { label: 'Gross Revenue', value: `$${totalRevenue.toFixed(2)}` },
                  { label: 'Platform Earnings (10%)', value: `$${platformCommission.toFixed(2)}` },
                  { label: 'Vendor Share (90%)', value: `$${vendorPayouts.toFixed(2)}` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--surface-container)', borderRadius: '10px' }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue by Category */}
      {activeTab === 'revenue_breakdown' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Revenue by Product Category</h3>
          {categoryList.length === 0 ? (
            <EmptyState icon="pie_chart" text="No category data yet. As orders come in, revenue by category will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {categoryList.map(([cat, rev]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 500 }}>{cat}</span>
                    <span style={{ fontWeight: 600 }}>${rev.toFixed(2)} ({totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--surface-container)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${(rev / maxCatRevenue) * 100}%`, height: '100%', backgroundColor: 'var(--lime-400)', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Customers */}
      {activeTab === 'top_customers' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Top Spending Customers</h3>
          </div>
          {topCustomers.length === 0 ? (
            <EmptyState icon="group" text="No customer spending data yet." />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Orders</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, idx) => (
                  <tr key={c.name + idx} style={{ borderBottom: idx !== topCustomers.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '16px 24px' }}>{c.orders}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--lime-400)' }}>${c.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
