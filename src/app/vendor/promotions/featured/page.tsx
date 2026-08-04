'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorFeaturedProductsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/promotions');
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (product: any) => {
    const newStatus = !product.isFeatured;
    try {
      const res = await fetch('/api/vendor/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_featured',
          productId: product._id,
          isFeatured: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isFeatured: newStatus } : p));
      showToast(`Product ${newStatus ? 'marked as Featured' : 'removed from Featured'}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error updating featured status', 'error');
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 13 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Marketing Hub', path: '/vendor/promotions', active: false, icon: 'campaign' },
          { label: 'Coupons Manager', path: '/vendor/promotions/coupons', active: false, icon: 'confirmation_number' },
          { label: 'Catalog Discounts', path: '/vendor/promotions/discounts', active: false, icon: 'percent' },
          { label: 'Flash Sales', path: '/vendor/promotions/flash-sales', active: false, icon: 'bolt' },
          { label: 'Storefront Banners', path: '/vendor/promotions/banners', active: false, icon: 'view_carousel' },
          { label: 'Featured Products', path: '/vendor/promotions/featured', active: true, icon: 'star' },
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

      {/* Main Featured Products Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Featured & Hero Product Spotlights
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Select catalog products to feature in prime spotlight positions on your storefront homepage.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading products...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {products.map(p => (
              <div key={p._id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 10, overflow: 'hidden', backgroundColor: '#e2e8f0', flexShrink: 0 }}>
                  <Image
                    src={(p.images && p.images[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'}
                    alt={p.name || 'Product'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{p.title || p.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#10b981', marginTop: 2 }}>GH₵ {p.price?.toFixed(2)}</div>
                  <button
                    onClick={() => handleToggleFeatured(p)}
                    style={{
                      marginTop: 6,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 10,
                      fontWeight: 900,
                      cursor: 'pointer',
                      backgroundColor: p.isFeatured ? '#fef3c7' : '#f1f5f9',
                      color: p.isFeatured ? '#d97706' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{p.isFeatured ? 'star' : 'star_outline'}</span>
                    {p.isFeatured ? 'FEATURED' : 'PIN TO FEATURED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
