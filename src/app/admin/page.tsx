'use client';

import React from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

/* ─── Status Badge ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    Delivered: 'var(--lime-400)', Processing: '#00e5ff', Shipped: 'var(--secondary)',
    Pending: 'var(--on-surface-variant)', Cancelled: 'var(--error)', Ongoing: '#00e5ff',
  };
  const c = colorMap[status] || 'var(--on-surface-variant)';
  return (
    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
      backgroundColor: `color-mix(in srgb, ${c} 20%, transparent)`, color: c
    }}>{status}</span>
  );
};

/* ─── Live Indicator ─── */
const LiveDot = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <div className="animate-pulse-glow" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--lime-400)' }} />
    <span style={{ fontSize: '0.8rem', color: 'var(--lime-400)', fontWeight: 600 }}>LIVE</span>
  </div>
);

/* ─── Metric Card ─── */
const MetricCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: string, color: string }) => (
  <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '16px', flex: '1 1 240px', minWidth: '200px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${color}15`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <h2 className="font-lexend" style={{ fontSize: '2rem', margin: 0 }}>{value}</h2>
  </div>
);

export default function AdminDashboard() {
  const {
    allOrders, allCustomers, allAdmins,
    totalRevenue, totalOrderCount,
    pendingOrders, shippedOrders, deliveredOrders, cancelledOrders,
    totalCustomers, totalAdmins,
  } = useAdmin();

  // Compute order status distribution for donut
  const statusData = [
    { label: 'Delivered', val: deliveredOrders, color: 'var(--lime-400)' },
    { label: 'Shipped', val: shippedOrders, color: 'var(--secondary)' },
    { label: 'Processing', val: pendingOrders, color: '#00e5ff' },
    { label: 'Cancelled', val: cancelledOrders, color: 'var(--error)' },
  ];
  const totalForDonut = statusData.reduce((s, x) => s + x.val, 0);

  // Top selling products — aggregate from all orders
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="font-lexend" style={{ fontSize: '2rem', margin: 0 }}>Global Overview</h1>
            <LiveDot />
          </div>
          <p style={{ color: 'var(--on-surface-variant)' }}>Real-time platform data synced from your store</p>
        </div>
      </div>

      {/* Metric Cards — all from real data, 0 when empty */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <MetricCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon="payments" color="var(--lime-400)" />
        <MetricCard title="Total Orders" value={totalOrderCount} icon="shopping_cart" color="var(--secondary)" />
        <MetricCard title="Registered Customers" value={totalCustomers} icon="group" color="#00e5ff" />
        <MetricCard title="Admins / Vendors" value={totalAdmins} icon="shield_person" color="#ff4081" />
      </div>

      {/* Quick Stats Strip */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Processing', val: pendingOrders, icon: 'pending', color: '#ff9800' },
          { label: 'Shipped', val: shippedOrders, icon: 'local_shipping', color: 'var(--secondary)' },
          { label: 'Delivered', val: deliveredOrders, icon: 'check_circle', color: 'var(--lime-400)' },
          { label: 'Cancelled', val: cancelledOrders, icon: 'cancel', color: 'var(--error)' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: '1 1 160px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
            <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '22px' }}>{stat.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stat.val}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Top Selling Products */}
        <div style={{ flex: '2 1 500px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Top Selling Products</h3>
            <Link href="/admin/products" style={{ color: 'var(--lime-400)', fontSize: '0.9rem', fontWeight: 500 }}>View All</Link>
          </div>
          {topProducts.length === 0 ? (
            <EmptyState icon="inventory_2" text="No products sold yet. Orders will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {topProducts.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--surface-container-highest)' }}>
                      {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{p.count} sold</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>${p.revenue.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div style={{ flex: '1 1 300px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Order Status</h3>
          {totalForDonut === 0 ? (
            <EmptyState icon="pie_chart" text="No orders yet. Status breakdown will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {statusData.map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.val} ({totalForDonut > 0 ? Math.round((item.val / totalForDonut) * 100) : 0}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-container)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: totalForDonut > 0 ? `${(item.val / totalForDonut) * 100}%` : '0%', height: '100%', backgroundColor: item.color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Platform Activity */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Recent Orders</h3>
          <Link href="/admin/orders" style={{ color: 'var(--lime-400)', fontSize: '0.9rem', fontWeight: 500 }}>View All Orders</Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState icon="receipt_long" text="No orders placed yet. When customers place orders, they will appear here in real time." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '12px', fontWeight: 500 }}>Order ID</th>
                  <th style={{ padding: '12px', fontWeight: 500 }}>Customer</th>
                  <th style={{ padding: '12px', fontWeight: 500 }}>Items</th>
                  <th style={{ padding: '12px', fontWeight: 500 }}>Amount</th>
                  <th style={{ padding: '12px', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '12px', fontWeight: 500 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row, idx) => (
                  <tr key={row.id} style={{ borderBottom: idx !== recentOrders.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <td style={{ padding: '16px 12px', fontWeight: 600 }}>{row.id}</td>
                    <td style={{ padding: '16px 12px' }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{row.customerName || 'Unknown'}</span>
                        <br /><span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{row.customerEmail || ''}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px' }}>{row.items}</td>
                    <td style={{ padding: '16px 12px', fontWeight: 600 }}>${(row.total || 0).toFixed(2)}</td>
                    <td style={{ padding: '16px 12px' }}><StatusBadge status={row.status} /></td>
                    <td style={{ padding: '16px 12px', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>{row.date}</td>
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
