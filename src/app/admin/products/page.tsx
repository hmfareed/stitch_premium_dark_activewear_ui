'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useStore, useAuth, useToast } from '@/context/AppContext';

export default function AdminProductsPage() {
  const { allOrders } = useAdmin();
  const { allProducts, deleteProduct, deleteAllProducts } = useStore();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isSuperAdmin = user?.role === 'super_admin';
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
          <div className="responsive-tabs-row" style={{ backgroundColor: 'transparent', padding: '4px 0', gap: '8px' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: categoryFilter === cat ? 600 : 400, fontSize: '0.85rem', cursor: 'pointer', backgroundColor: categoryFilter === cat ? 'var(--lime-400)' : 'var(--surface-container)', color: categoryFilter === cat ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '260px' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: '20px' }}>search</span>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
            </div>
            {isSuperAdmin && allProducts.length > 0 && (
              <button
                onClick={() => {
                  if (confirm("⚠️ WARNING: This will permanently delete ALL products in the catalog! Are you absolutely sure you want to proceed?")) {
                    if (confirm("🚨 DOUBLE CONFIRMATION: This action is irreversible. All customers' viewing lists, vendor inventory references, and listings will be completely wiped out. Proceed?")) {
                      deleteAllProducts();
                      showToast("All products successfully purged from the store!", "error");
                    }
                  }
                }}
                style={{
                  background: 'rgba(255, 68, 68, 0.12)',
                  color: '#ff4444',
                  border: '1.5px solid rgba(255, 68, 68, 0.35)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-lexend)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff4444';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(255,68,68,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 68, 68, 0.12)';
                  e.currentTarget.style.color = '#ff4444';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_forever</span>
                PURGE CATALOG
              </button>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Product</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Price</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Original</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Rating</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Units Sold</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Tags</th>
                {isSuperAdmin && <th style={{ padding: '14px 24px', fontWeight: 500, textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                  <td data-label="Product" style={{ padding: '16px 24px' }}>
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
                  <td data-label="Category" style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{p.category}</span>
                  </td>
                  <td data-label="Price" style={{ padding: '16px 24px', fontWeight: 600 }}>${p.price.toFixed(2)}</td>
                  <td data-label="Original" style={{ padding: '16px 24px', color: 'var(--on-surface-variant)', textDecoration: p.originalPrice ? 'line-through' : 'none' }}>{p.originalPrice ? `GH₵${p.originalPrice.toFixed(2)}` : '—'}</td>
                  <td data-label="Rating" style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ffc107' }}>star</span>
                      <span style={{ fontWeight: 600 }}>{p.rating}</span>
                    </div>
                  </td>
                  <td data-label="Units Sold" style={{ padding: '16px 24px', fontWeight: 600, color: salesMap[p.id] ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>{salesMap[p.id] || 0}</td>
                  <td data-label="Tags" style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {p.isNew && <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, #00e5ff 20%, transparent)', color: '#00e5ff' }}>NEW</span>}
                      {p.isLimited && <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, #ff4081 20%, transparent)', color: '#ff4081' }}>LIMITED</span>}
                    </div>
                  </td>
                  {isSuperAdmin && (
                    <td data-label="Actions" style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
                            deleteProduct(p.id);
                            showToast(`Product "${p.name}" deleted successfully`, 'error');
                          }
                        }}
                        style={{
                          background: 'rgba(255, 68, 68, 0.1)',
                          color: '#ff4444',
                          border: '1px solid rgba(255, 68, 68, 0.3)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-lexend)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#ff4444';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                          e.currentTarget.style.color = '#ff4444';
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                        Delete
                      </button>
                    </td>
                  )}
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
