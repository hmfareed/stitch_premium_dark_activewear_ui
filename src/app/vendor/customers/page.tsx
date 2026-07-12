'use client';

import React, { useState, useMemo } from 'react';
import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

export default function VendorCustomersPage() {
  const { user } = useAuth();
  const { allOrders } = useAdmin();
  const { followers } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;

  // Find all orders containing this vendor's products
  const vendorOrders = allOrders.filter(o => o.products.some(p => p.vendorEmail === user.email)).map(o => {
    const vendorItemsTotal = o.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((sum, p) => sum + (p.price * p.quantity), 0);
    return { ...o, vendorItemsTotal };
  });

  // Calculate customer stats
  const customerMap = new Map<string, { name: string; email: string; orders: number; spent: number; lastOrder: string; isFollower: boolean }>();

  vendorOrders.forEach(o => {
    if (!customerMap.has(o.customerEmail)) {
      customerMap.set(o.customerEmail, { name: o.customerName, email: o.customerEmail, orders: 0, spent: 0, lastOrder: '', isFollower: false });
    }
    const c = customerMap.get(o.customerEmail)!;
    c.orders += 1;
    c.spent += o.vendorItemsTotal;
    c.lastOrder = o.date;
  });

  // Add followers who haven't bought anything yet — they auto-appear here
  const myFollowers = followers.filter(f => f.vendorEmail === user.email);
  myFollowers.forEach(f => {
    if (!customerMap.has(f.userEmail)) {
      customerMap.set(f.userEmail, { 
        name: f.userName || f.userEmail.split('@')[0], 
        email: f.userEmail, 
        orders: 0, 
        spent: 0, 
        lastOrder: 'Follower', 
        isFollower: true 
      });
    } else {
      customerMap.get(f.userEmail)!.isFollower = true;
    }
  });

  let customers = Array.from(customerMap.values()).sort((a, b) => b.spent - a.spent);

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    customers = customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }

  const totalCustomers = customers.length;
  const followersCount = myFollowers.length;
  const repeatCustomers = customers.filter(c => c.orders > 1).length;
  const repeatPercentage = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
  const totalSpent = customers.reduce((sum, c) => sum + c.spent, 0);
  const avgValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>My Customers & Followers</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Customers who follow your store automatically appear here</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Customers', val: totalCustomers.toString(), color: '#00e5ff', icon: 'group' }, 
          { label: 'Followers', val: followersCount.toString(), color: 'var(--lime-400)', icon: 'person_add' },
          { label: 'Repeat', val: `${repeatPercentage}%`, color: 'var(--secondary)', icon: 'replay' }, 
          { label: 'Avg Value', val: `GH₵${avgValue.toFixed(2)}`, color: '#ffc107', icon: 'payments' }
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 140px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{s.label}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: s.color }}>{s.icon}</span>
            </div>
            <div className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 600, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '22px' }}>search</span>
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search customers by name or email..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.95rem', fontFamily: 'inherit' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        )}
      </div>

      {/* Customers Table */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Orders</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Spent</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Last Activity</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', marginBottom: '8px', display: 'block', opacity: 0.5 }}>group</span>
                  {searchQuery ? 'No customers match your search.' : 'No customers or followers yet.'}
                </td></tr>
              ) : customers.map((c, idx) => (
                <tr key={c.email} style={{ borderBottom: idx !== customers.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                  <td data-label="Customer" style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'color-mix(in srgb, #00e5ff 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#00e5ff', flexShrink: 0 }}>{c.name.charAt(0).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 500, display: 'block' }}>{c.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Status" style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {c.isFollower && (
                        <span style={{ 
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
                          backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)'
                        }}>Follower</span>
                      )}
                      {c.orders > 0 && (
                        <span style={{ 
                          padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600,
                          backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)', color: '#00e5ff'
                        }}>Buyer</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Orders" style={{ padding: '16px 24px', fontWeight: 600 }}>{c.orders}</td>
                  <td data-label="Spent" style={{ padding: '16px 24px', fontWeight: 600 }}>${c.spent.toFixed(2)}</td>
                  <td data-label="Last Activity" style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{c.lastOrder || 'N/A'}</td>
                  <td data-label="Action" style={{ padding: '16px 24px' }}>
                    <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Message">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                    </button>
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
