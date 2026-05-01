'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useStore } from '@/context/AppContext';

export default function AdminProductsPage() {
  const { allOrders } = useAdmin();
  const { allProducts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Compute sales data from real orders
  const salesMap: Record<string, number> = {};
  allOrders.forEach(order => {
    (order.products || []).forEach(p => {
      salesMap[p.id] = (salesMap[p.id] || 0) + (p.quantity || 1);
    });
  });

  const categories = ['All', ...Array.from(new Set(allProducts.map(p => p.category)))];

  const filtered = allProducts.filter(p => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalProducts = allProducts.length;
  const totalSold = Object.values(salesMap).reduce((s, v) => s + v, 0);

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Product Catalog</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>All products available in your store</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Products', val: totalProducts, color: 'var(--lime-400)' },
          { label: 'Categories', val: categories.length - 1, color: '#00e5ff' },
          { label: 'Total Units Sold', val: totalSold, color: 'var(--secondary)' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 160px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>{s.label}</div>
            <div className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 600, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: categoryFilter === cat ? 600 : 400, fontSize: '0.85rem', cursor: 'pointer', backgroundColor: categoryFilter === cat ? 'var(--lime-400)' : 'var(--surface-container)', color: categoryFilter === cat ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: '20px' }}>search</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Product</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Price</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Original</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Rating</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Units Sold</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--surface-container-highest)', flexShrink: 0 }}>
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        <br /><span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>ID: {p.id} · {p.subCategory}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{p.category}</span>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>${p.price.toFixed(2)}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)', textDecoration: p.originalPrice ? 'line-through' : 'none' }}>{p.originalPrice ? `$${p.originalPrice.toFixed(2)}` : '—'}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ffc107' }}>star</span>
                      <span style={{ fontWeight: 600 }}>{p.rating}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: salesMap[p.id] ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>{salesMap[p.id] || 0}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {p.isNew && <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, #00e5ff 20%, transparent)', color: '#00e5ff' }}>NEW</span>}
                      {p.isLimited && <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, #ff4081 20%, transparent)', color: '#ff4081' }}>LIMITED</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--outline)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
          Showing {filtered.length} of {totalProducts} products
        </div>
      </div>
    </div>
  );
}
