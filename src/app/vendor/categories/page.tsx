'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
  status: string;
}

export default function VendorCategoriesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('category');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/categories');
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) { showToast('Category name is required', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), icon: catIcon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('New category created!', 'success');
      setCategories(data.categories || []);
      setShowAddModal(false);
      setCatName('');
    } catch (err: any) {
      showToast(err.message || 'Error creating category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 5 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Products', path: '/vendor/products', active: false, icon: 'inventory_2' },
          { label: 'Create Product', path: '/vendor/products/create', active: false, icon: 'add_circle' },
          { label: 'Categories', path: '/vendor/categories', active: true, icon: 'category' },
          { label: 'Brands', path: '/vendor/brands', active: false, icon: 'branding_watermark' },
          { label: 'Attributes', path: '/vendor/attributes', active: false, icon: 'tune' },
          { label: 'Variants Matrix', path: '/vendor/variants', active: false, icon: 'style' },
          { label: 'Reviews & Ratings', path: '/vendor/reviews', active: false, icon: 'star' },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#ffffff' : '#475569',
              backgroundColor: tab.active ? '#10b981' : '#ffffff',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Categories Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Store Custom Categories
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Organize your catalog into custom store categories for buyer navigation.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add Category
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading categories...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {categories.map(c => (
              <div key={c.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{c.icon || 'category'}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{c.itemCount} active products</div>
                  </div>
                </div>

                <span style={{ fontSize: 10, fontWeight: 800, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 4 }}>
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Add Store Category</h3>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Category Name *</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Athleisure & Compression" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
