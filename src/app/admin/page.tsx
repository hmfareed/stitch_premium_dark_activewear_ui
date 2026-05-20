'use client';

import React from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

/* ─── Status Badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    Delivered: 'var(--lime-400)',
    Processing: '#00e5ff',
    Shipped: '#a855f7',
    Pending: '#fbbf24',
    Cancelled: 'var(--error)',
    Ongoing: '#00e5ff',
  };
  const c = colorMap[status] || 'var(--on-surface-variant)';
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: `color-mix(in srgb, ${c} 15%, transparent)`,
      color: c,
    }}>{status}</span>
  );
};

/* ─── Metric Card ─── */
const MetricCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div style={{
    backgroundColor: 'var(--surface)',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid var(--outline)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: '1 1 220px',
    minWidth: '200px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <h2 className="font-lexend" style={{ fontSize: '1.8rem', margin: 0 }}>{value}</h2>
  </div>
);

export default function AdminDashboard() {
  const {
    allOrders, allCustomers, allAdmins,
    totalRevenue, totalOrderCount,
    pendingOrders, shippedOrders, deliveredOrders, cancelledOrders,
    totalCustomers, totalAdmins,
  } = useAdmin();

  // Compute 14 days of revenue and orders for analytics
  const analyticsData = React.useMemo(() => {
    const dailySales = Array(14).fill(0);
    const dailyOrders = Array(14).fill(0);
    const today = new Date();

    allOrders.forEach(o => {
      if (o.status === 'Cancelled') return;
      const orderDate = new Date(o.date);
      const diffTime = Math.abs(today.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 14) {
        const index = 14 - diffDays;
        dailySales[index] += o.total || 0;
        dailyOrders[index] += 1;
      }
    });

    return {
      dailySales,
      dailyOrders,
      maxDailySales: Math.max(...dailySales, 100),
      maxDailyOrders: Math.max(...dailyOrders, 5),
    };
  }, [allOrders]);

  // Compute order status distribution
  const statusData = [
    { label: 'Delivered', val: deliveredOrders, color: 'var(--lime-400)' },
    { label: 'Shipped', val: shippedOrders, color: 'var(--secondary)' },
    { label: 'Processing', val: pendingOrders, color: '#00e5ff' },
    { label: 'Cancelled', val: cancelledOrders, color: 'var(--error)' },
  ];
  const totalForDonut = statusData.reduce((s, x) => s + x.val, 0);

  // Top selling products
  const productSalesMap: Record<string, { name: string; count: number; revenue: number; image: string }> = {};
  allOrders.forEach(order => {
    (order.products || []).forEach(p => {
      if (!productSalesMap[p.id]) {
        productSalesMap[p.id] = { name: p.name, count: 0, revenue: 0, image: p.image };
      }
      productSalesMap[p.id].count += p.quantity || 1;
      productSalesMap[p.id].revenue += (p.price || 0) * (p.quantity || 1);
    });
  });
  const topProducts = Object.values(productSalesMap).sort((a, b) => b.count - a.count).slice(0, 5);

  // Recent 5 orders
  const recentOrders = allOrders.slice(0, 5);

  // Empty state helper
  const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.4 }}>{icon}</span>
      <p style={{ fontSize: '0.9rem' }}>{text}</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Real-time platform metrics from live data</p>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        <MetricCard title="Total Revenue" value={`GH₵${totalRevenue.toFixed(2)}`} icon="payments" color="var(--lime-400)" />
        <MetricCard title="Total Orders" value={totalOrderCount} icon="shopping_cart" color="#00e5ff" />
        <MetricCard title="Registered Customers" value={totalCustomers} icon="group" color="var(--secondary)" />
        <MetricCard title="Total Vendors" value={totalAdmins} icon="shield_person" color="#a855f7" />
      </div>

      {/* Quick Stats Strip */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Processing', val: pendingOrders, icon: 'pending', color: '#ff9800' },
          { label: 'Shipped', val: shippedOrders, icon: 'local_shipping', color: '#a855f7' },
          { label: 'Delivered', val: deliveredOrders, icon: 'check_circle', color: 'var(--lime-400)' },
          { label: 'Cancelled', val: cancelledOrders, icon: 'cancel', color: 'var(--error)' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: '1 1 160px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '16px 20px',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--outline)',
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color
            }}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <div className="font-lexend" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stat.val}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Revenue Growth Chart */}
        <div style={{
          flex: '1 1 450px',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--outline)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Revenue Flow</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Last 14 days</p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--lime-400)', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)' }}>LIVE</span>
          </div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '8px' }}>
            {analyticsData.dailySales.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${(v / analyticsData.maxDailySales) * 160}px`,
                    backgroundColor: i === analyticsData.dailySales.length - 1 ? 'var(--lime-400)' : 'color-mix(in srgb, var(--lime-400) 30%, transparent)',
                    borderRadius: '4px 4px 2px 2px',
                    transition: 'all 0.5s ease',
                    minHeight: v > 0 ? '4px' : '1px',
                  }}
                  title={`GH₵${v.toFixed(2)}`}
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>
                  {new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Volume Chart */}
        <div style={{
          flex: '1 1 450px',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--outline)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Order Volume</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Daily orders count</p>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#00e5ff', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)' }}>ORDERS</span>
          </div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '8px' }}>
            {analyticsData.dailyOrders.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${(v / analyticsData.maxDailyOrders) * 160}px`,
                    backgroundColor: i === analyticsData.dailyOrders.length - 1 ? '#00e5ff' : 'color-mix(in srgb, #00e5ff 30%, transparent)',
                    borderRadius: '4px 4px 2px 2px',
                    transition: 'all 0.5s ease',
                    minHeight: v > 0 ? '4px' : '1px',
                  }}
                  title={`${v} orders`}
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>
                  {new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products + Status Row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Top Selling Products */}
        <div style={{
          flex: '2 1 500px',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--outline)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Top Selling Products</h3>
            <Link href="/admin/products" style={{ color: 'var(--lime-400)', fontSize: '0.85rem', fontWeight: 600 }}>View All</Link>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState icon="inventory_2" text="No products sold yet. Orders will appear here." />
          ) : (
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topProducts.map((p, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--surface-container)',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <span className="font-lexend" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--lime-400)', width: '24px' }}>#{idx + 1}</span>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--surface-container-highest)', flexShrink: 0 }}>
                      {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{p.count} units sold</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--lime-400)', fontSize: '0.95rem' }}>GH₵{p.revenue.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div style={{
          flex: '1 1 300px',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--outline)',
        }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0, marginBottom: '24px' }}>Order Status</h3>
          {totalForDonut === 0 ? (
            <EmptyState icon="pie_chart" text="No orders yet. Status breakdown will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {statusData.map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.val} ({totalForDonut > 0 ? Math.round((item.val / totalForDonut) * 100) : 0}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--surface-container)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{
                      width: totalForDonut > 0 ? `${(item.val / totalForDonut) * 100}%` : '0%',
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: '5px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--outline)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Recent Orders</h3>
          <Link href="/admin/orders" style={{ color: 'var(--lime-400)', fontSize: '0.85rem', fontWeight: 600 }}>View All Orders</Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState icon="receipt_long" text="No orders placed yet. When customers place orders, they will appear here." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Order ID</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Items</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Amount</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: idx !== recentOrders.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, fontFamily: 'var(--font-lexend)' }}>#{row.id.substring(0, 8)}...</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          backgroundColor: 'color-mix(in srgb, var(--lime-400) 20%, transparent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--lime-400)', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0
                        }}>
                          {(row.customerName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 500 }}>{row.customerName || 'Unknown'}</span>
                          <br /><span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{row.customerEmail || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{row.items} items</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>GH₵{(row.total || 0).toFixed(2)}</td>
                    <td style={{ padding: '16px 24px' }}><StatusBadge status={row.status} /></td>
                    <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>{new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
