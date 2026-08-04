'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

interface BrandItem {
  id: string;
  name: string;
  logo: string;
  productCount: number;
  status: string;
}

export default function VendorBrandsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/brands');
      const data = await res.json();
      if (res.ok) setBrands(data.brands || []);
    } catch (err) {
      console.error('Failed to load brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) { showToast('Brand name is required', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: brandName.trim(), logo: brandLogo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('New brand added!', 'success');
      setBrands(data.brands || []);
      setShowAddModal(false);
      setBrandName('');
      setBrandLogo('');
    } catch (err: any) {
      showToast(err.message || 'Error creating brand', 'error');
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
          { label: 'Categories', path: '/vendor/categories', active: false, icon: 'category' },
          { label: 'Brands', path: '/vendor/brands', active: true, icon: 'branding_watermark' },
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

      {/* Main Brands Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Store & Partner Brands
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Manage brand labels associated with your store product catalog.
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
            Add Brand
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading brands...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {brands.map(b => (
              <div key={b.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', position: 'relative', border: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
                    <Image src={b.logo} alt={b.name} fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{b.productCount} products</div>
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Add Store Brand</h3>
            <form onSubmit={handleAddBrand} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Brand Name *</label>
                <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. AfriFit Premium" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Brand Logo URL</label>
                <input type="text" value={brandLogo} onChange={e => setBrandLogo(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Add Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
