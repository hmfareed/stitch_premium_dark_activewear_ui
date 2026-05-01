'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    Delivered: 'var(--lime-400)', Processing: '#00e5ff', Shipped: 'var(--secondary)',
    Pending: '#ff9800', Cancelled: 'var(--error)', Ongoing: '#00e5ff',
  };
  const c = colorMap[status] || 'var(--on-surface-variant)';
  return (
    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
      backgroundColor: `color-mix(in srgb, ${c} 20%, transparent)`, color: c
    }}>{status}</span>
  );
};

export default function AdminOrdersPage() {
  const { allOrders, pendingOrders, shippedOrders, deliveredOrders, cancelledOrders, totalOrderCount, updateOrderStatus } = useAdmin();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = ['all', 'processing', 'shipped', 'delivered', 'cancelled'];

  const filtered = allOrders.filter(o => {
    const matchesTab = activeTab === 'all' || o.status.toLowerCase() === activeTab || (activeTab === 'processing' && o.status === 'Ongoing');
    const matchesSearch = !searchQuery ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Order Control Center</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Real-time orders from customers across the platform</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Orders', val: totalOrderCount, icon: 'receipt_long', color: 'var(--lime-400)' },
          { label: 'Processing', val: pendingOrders, icon: 'pending', color: '#ff9800' },
          { label: 'Shipped', val: shippedOrders, icon: 'local_shipping', color: 'var(--secondary)' },
          { label: 'Delivered', val: deliveredOrders, icon: 'check_circle', color: 'var(--lime-400)' },
          { label: 'Cancelled', val: cancelledOrders, icon: 'cancel', color: 'var(--error)' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: '1 1 160px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <div className="font-lexend" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stat.val}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: activeTab === tab ? 600 : 400, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'capitalize',
                  backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface-container)',
                  color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s ease',
                }}>
                {tab}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: '20px' }}>search</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.4 }}>receipt_long</span>
            <p style={{ fontSize: '1rem', marginBottom: '4px', fontWeight: 500 }}>No orders found</p>
            <p style={{ fontSize: '0.85rem' }}>Orders placed by customers will appear here in real time.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Order ID</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Products</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Items</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Amount</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, idx) => (
                    <tr key={order.id + idx} style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>{order.id}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div><span style={{ fontWeight: 500 }}>{order.customerName || 'Unknown'}</span><br /><span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{order.customerEmail || ''}</span></div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {(order.products || []).slice(0, 3).map((p, i) => (
                            <div key={i} style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--surface-container-highest)' }}>
                              {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                          ))}
                          {(order.products || []).length > 3 && <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>+{order.products.length - 3}</div>}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>{order.items}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 600 }}>${(order.total || 0).toFixed(2)}</td>
                      <td style={{ padding: '16px 24px' }}><StatusBadge status={order.status} /></td>
                      <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>{order.date}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <select value={order.status} onChange={e => handleStatusUpdate(order.id, e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--outline)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
              Showing {filtered.length} of {totalOrderCount} orders
            </div>
          </>
        )}
      </div>
    </div>
  );
}
