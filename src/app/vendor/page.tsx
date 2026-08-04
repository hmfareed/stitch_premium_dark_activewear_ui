'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useStore } from '@/context/AppContext';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { vendorStore } = useStore();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState('Today');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000); // 15s live real-time auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/vendor/dashboard');
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch live dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const storeName = vendorStore?.name || user.name || "Vendor Store";
  const userDisplayName = user.name || storeName;

  const kpis = data?.kpis || {
    todaysSales: 0,
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0,
    lowStock: 0,
    pendingOrders: 0,
    returns: 0,
    expenses: 0,
    profit: 0,
  };

  const widgets = data?.widgets || {
    salesChartData: [],
    revenueChartData: [],
    recentOrders: [],
    lowStockList: [],
    topSellingProducts: [],
    bestCustomers: [],
    recentNotifications: [],
    subscriptionStatus: { plan: 'Growth Plan', status: 'ACTIVE', expiry: 'Dec 31, 2026', commissionRate: '3.0%' },
  };

  // 10 Live KPI Cards
  const kpiCards = [
    { title: "Today's Sales", value: `GH₵ ${kpis.todaysSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'today', bg: '#dcfce7', color: '#16a34a' },
    { title: 'Gross Revenue', value: `GH₵ ${kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'payments', bg: '#dbeafe', color: '#2563eb' },
    { title: 'Total Orders', value: kpis.orders, icon: 'shopping_bag', bg: '#f3e8ff', color: '#9333ea' },
    { title: 'Total Customers', value: kpis.customers, icon: 'group', bg: '#ccfbf1', color: '#0d9488' },
    { title: 'Catalog Products', value: kpis.products, icon: 'inventory_2', bg: '#ffedd5', color: '#ea580c' },
    { title: 'Low Stock Alert', value: kpis.lowStock, icon: 'warning', bg: kpis.lowStock > 0 ? '#fee2e2' : '#dcfce7', color: kpis.lowStock > 0 ? '#dc2626' : '#16a34a' },
    { title: 'Pending Orders', value: kpis.pendingOrders, icon: 'hourglass_top', bg: '#fef3c7', color: '#d97706' },
    { title: 'Returned Orders', value: kpis.returns, icon: 'replay', bg: '#f1f5f9', color: '#475569' },
    { title: 'Platform Expenses', value: `GH₵ ${kpis.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'receipt_long', bg: '#fee2e2', color: '#dc2626' },
    { title: 'Net Gross Profit', value: `GH₵ ${kpis.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'savings', bg: '#dcfce7', color: '#15803d' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1440, margin: '0 auto' }}>
      
      {/* Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Welcome back, {userDisplayName}!</span>
            <span>👋</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Live real-time business telemetry</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>REAL-TIME UPDATES ACTIVE</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#64748b' }}>calendar_today</span>
            <span>{dateRange}</span>
          </div>

          <button
            onClick={fetchDashboardData}
            style={{ padding: '8px 14px', borderRadius: 10, backgroundColor: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            Refresh Live Data
          </button>
        </div>
      </div>

      {/* 10 Live KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 14,
              padding: '14px 16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{card.title}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{card.icon}</span>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Widgets Row 1: Sales & Revenue Charts + Subscription Status Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        
        {/* Widget 1 & 2: Sales & Revenue Trends Chart (8 cols) */}
        <div style={{ gridColumn: 'span 8', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }} className="col-span-12 lg:col-span-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Sales & Revenue Performance Trends</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: 6 }}>Last 7 Days</span>
          </div>

          <div style={{ flex: 1, minHeight: 180, position: 'relative' }}>
            <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="liveRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {[30, 70, 110].map((y, i) => (
                <line key={i} x1="20" y1={y} x2="390" y2={y} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              <path d="M 30,120 C 80,60 140,90 200,40 C 260,70 320,30 380,20 L 380,140 L 30,140 Z" fill="url(#liveRevGrad)" />
              <path d="M 30,120 C 80,60 140,90 200,40 C 260,70 320,30 380,20" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
            </svg>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 20, fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 8 }}>
              {widgets.salesChartData.map((d: any, idx: number) => (
                <span key={idx}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 8: Subscription Status Widget (4 cols) */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="col-span-12 lg:col-span-4">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Subscription Status</h3>
              <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6, backgroundColor: '#dcfce7', color: '#16a34a' }}>
                {widgets.subscriptionStatus.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Active Plan:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{widgets.subscriptionStatus.plan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Commission Rate:</span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>{widgets.subscriptionStatus.commissionRate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: 8 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Next Renewal:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{widgets.subscriptionStatus.expiry}</span>
              </div>
            </div>
          </div>

          <Link
            href="/vendor/settings"
            style={{
              marginTop: 16,
              display: 'block',
              textAlign: 'center',
              padding: '10px',
              borderRadius: 10,
              border: '1px solid #10b981',
              color: '#10b981',
              fontWeight: 800,
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            Manage Subscription & Billing
          </Link>
        </div>

      </div>

      {/* Widgets Row 2: Recent Orders + Low Stock List + Top Selling Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        
        {/* Widget 3: Recent Orders Table (5 cols) */}
        <div style={{ gridColumn: 'span 5', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }} className="col-span-12 lg:col-span-5">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Live Orders</h3>
            <Link href="/vendor/orders" style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>View All →</Link>
          </div>

          {widgets.recentOrders.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No orders placed yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#94a3b8', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '6px 4px' }}>Order ID</th>
                  <th style={{ padding: '6px 4px' }}>Customer</th>
                  <th style={{ padding: '6px 4px' }}>Amount</th>
                  <th style={{ padding: '6px 4px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {widgets.recentOrders.map((ord: any) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 800, color: '#0f172a' }}>{ord.id}</td>
                    <td style={{ padding: '8px 4px', color: '#475569', fontWeight: 600 }}>{ord.customer}</td>
                    <td style={{ padding: '8px 4px', fontWeight: 800, color: '#0f172a' }}>GH₵ {ord.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px 4px' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 6,
                        backgroundColor: ord.status === 'Delivered' ? '#dcfce7' : ord.status === 'Processing' ? '#dbeafe' : '#fef3c7',
                        color: ord.status === 'Delivered' ? '#16a34a' : ord.status === 'Processing' ? '#2563eb' : '#d97706',
                      }}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Widget 4: Low Stock Restock List (3 cols) */}
        <div style={{ gridColumn: 'span 3', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }} className="col-span-12 lg:col-span-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Low Stock List</h3>
            <Link href="/vendor/products" style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>Restock</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {widgets.lowStockList.length === 0 ? (
              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>All products healthy!</div>
            ) : (
              widgets.lowStockList.map((item: any) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      <Image src={item.img} alt={item.name} fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#dc2626', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: 4 }}>
                    {item.stock} left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 5: Top-Selling Products (4 cols) */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }} className="col-span-12 lg:col-span-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Top Selling Products</h3>
            <Link href="/vendor/analytics" style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>View All</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {widgets.topSellingProducts.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>No sales data calculated yet.</div>
            ) : (
              widgets.topSellingProducts.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      <Image src={p.img} alt={p.name} fill style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.sold} units sold</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#10b981' }}>
                    GH₵ {p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Widgets Row 3: Best Customers + Recent Notifications + Quick Actions Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }}>
        
        {/* Widget 6: Best Customers Leaderboard (4 cols) */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }} className="col-span-12 lg:col-span-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Best Customers</h3>
            <Link href="/vendor/customers" style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textDecoration: 'none' }}>View Base</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {widgets.bestCustomers.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>No customer purchase records.</div>
            ) : (
              widgets.bestCustomers.map((c: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#061d13', color: '#a3e635', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.orderCount} orders</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>
                    GH₵ {c.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 7: Recent Notifications Feed (4 cols) */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }} className="col-span-12 lg:col-span-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recent Notifications</h3>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Live Feed</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {widgets.recentNotifications.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8' }}>No new notifications.</div>
            ) : (
              widgets.recentNotifications.map((n: any) => (
                <div key={n.id} style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: '#f8fafc', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{n.title}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget 9: Quick Actions Hub (4 cols) */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }} className="col-span-12 lg:col-span-4">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>Quick Actions Hub</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { title: 'Add Product', icon: 'add_box', path: '/vendor/products', color: '#10b981', bg: '#dcfce7' },
              { title: 'Dispatch Courier', icon: 'local_shipping', path: '/vendor/orders', color: '#2563eb', bg: '#dbeafe' },
              { title: 'Request Payout', icon: 'payments', path: '/vendor/payouts', color: '#9333ea', bg: '#f3e8ff' },
              { title: 'Store Settings', icon: 'settings', path: '/vendor/settings', color: '#ea580c', bg: '#ffedd5' },
            ].map(a => (
              <Link
                key={a.title}
                href={a.path}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: a.bg, color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{a.icon}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{a.title}</div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
        <div>© 2025 AfriCart. Live Vendor Intelligence.</div>
        <div>Made with ❤️ in Africa</div>
      </footer>

    </div>
  );
}
