'use client';

import React, { useState } from 'react';

import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

export default function VendorOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const { allOrders } = useAdmin();

  if (!user) return null;

  // Filter orders to only those containing this vendor's products
  const vendorOrders = allOrders.filter(o => o.products.some(p => p.vendorEmail === user.email)).map(o => {
    // Recalculate total for just this vendor's items in the order
    const vendorItemsTotal = o.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    const vendorItemsCount = o.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((sum, p) => sum + p.quantity, 0);

    return {
      ...o,
      vendorItemsTotal,
      vendorItemsCount
    };
  });

  const tabs = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const filtered = activeTab === 'all' ? vendorOrders : vendorOrders.filter(o => o.status.toLowerCase() === activeTab);
  const statusColors: Record<string, string> = { Pending: '#ff9800', Processing: '#00e5ff', Ongoing: '#00e5ff', Shipped: 'var(--secondary)', Delivered: 'var(--lime-400)', Cancelled: 'var(--error)' };

  const totalRevenue = vendorOrders.reduce((sum, o) => sum + o.vendorItemsTotal, 0);
  const pendingCount = vendorOrders.filter(o => o.status === 'Pending').length;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Store Orders</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Manage your store's orders and fulfillment</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Orders', val: vendorOrders.length.toString(), color: '#00e5ff' },
          { label: 'Pending', val: pendingCount.toString(), color: '#ff9800' },
          { label: 'Revenue', val: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--lime-400)' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 150px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>{s.label}</div>
            <div className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 600, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: activeTab === tab ? 600 : 400, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'capitalize', backgroundColor: activeTab === tab ? '#00e5ff' : 'var(--surface-container)', color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>{tab}</button>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Order ID</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Items</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Total</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>No orders found.</td></tr>
              ) : filtered.map((o, idx) => (
                <tr key={o.id} style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{o.id}</td>
                  <td style={{ padding: '16px 24px' }}><div>{o.customerName}<br /><span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{o.customerEmail}</span></div></td>
                  <td style={{ padding: '16px 24px' }}>{o.vendorItemsCount}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>${o.vendorItemsTotal.toFixed(2)}</td>
                  <td style={{ padding: '16px 24px' }}><span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: `color-mix(in srgb, ${statusColors[o.status] || '#888'} 20%, transparent)`, color: statusColors[o.status] || '#888' }}>{o.status}</span></td>
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>{o.date}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="View"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span></button>
                      {o.status === 'Pending' && <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)', color: '#00e5ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Process"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
