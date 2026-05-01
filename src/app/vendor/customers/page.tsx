'use client';

import React from 'react';

import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

export default function VendorCustomersPage() {
  const { user } = useAuth();
  const { allOrders } = useAdmin();
  const { followers } = useStore();

  if (!user) return null;

  // Find all orders containing this vendor's products
  const vendorOrders = allOrders.filter(o => o.products.some(p => p.vendorEmail === user.email)).map(o => {
    const vendorItemsTotal = o.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((sum, p) => sum + (p.price * p.quantity), 0);
    return { ...o, vendorItemsTotal };
  });

  // Calculate customer stats
  const customerMap = new Map<string, { name: string; email: string; orders: number; spent: number; lastOrder: string }>();

  vendorOrders.forEach(o => {
    if (!customerMap.has(o.customerEmail)) {
      customerMap.set(o.customerEmail, { name: o.customerName, email: o.customerEmail, orders: 0, spent: 0, lastOrder: '' });
    }
    const c = customerMap.get(o.customerEmail)!;
    c.orders += 1;
    c.spent += o.vendorItemsTotal;
    // Assuming dates are sortable or just keeping the latest we encounter
    c.lastOrder = o.date;
  });

  // Add followers who haven't bought anything yet
  const myFollowers = followers.filter(f => f.vendorEmail === user.email);
  myFollowers.forEach(f => {
    if (!customerMap.has(f.userEmail)) {
      customerMap.set(f.userEmail, { name: f.userEmail.split('@')[0], email: f.userEmail, orders: 0, spent: 0, lastOrder: 'Never (Follower)' });
    }
  });

  const customers = Array.from(customerMap.values()).sort((a, b) => b.spent - a.spent);

  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(c => c.orders > 1).length;
  const repeatPercentage = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const totalSpent = customers.reduce((sum, c) => sum + c.spent, 0);
  const avgValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>My Customers & Followers</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>People who purchased your products or follow your store</p>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', val: totalCustomers.toString(), color: '#00e5ff' }, 
          { label: 'Repeat', val: `${repeatPercentage}%`, color: 'var(--lime-400)' }, 
          { label: 'Avg Value', val: `$${avgValue.toFixed(2)}`, color: 'var(--secondary)' }
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 150px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>{s.label}</div>
            <div className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 600, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Orders</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Spent</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Last Order</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>No customers or followers yet.</td></tr>
            ) : customers.map((c, idx) => (
              <tr key={c.email} style={{ borderBottom: idx !== customers.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'color-mix(in srgb, #00e5ff 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#00e5ff' }}>{c.name.charAt(0).toUpperCase()}</div>
                    <div><span style={{ fontWeight: 500 }}>{c.name}</span><br /><span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{c.email}</span></div>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>{c.orders}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600 }}>${c.spent.toFixed(2)}</td>
                <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{c.lastOrder}</td>
                <td style={{ padding: '16px 24px' }}>
                  <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Message"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
