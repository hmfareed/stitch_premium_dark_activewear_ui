'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorBannersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('New Season Activewear Collection');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=1200');
  const [linkUrl, setLinkUrl] = useState('/shop?category=activewear');
  const [ctaText, setCtaText] = useState('Shop 20% Off');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/promotions');
      const data = await res.json();
      if (res.ok) setBanners(data.banners || []);
    } catch (err) {
      console.error('Failed to load banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_banner',
          banner: { title, imageUrl, linkUrl, ctaText },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Banner added to storefront homepage!', 'success');
      setBanners(data.banners || []);
      setShowAddModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error adding banner', 'error');
    } finally {
      setSubmitting(false);
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
          { label: 'Storefront Banners', path: '/vendor/promotions/banners', active: true, icon: 'view_carousel' },
          { label: 'Featured Products', path: '/vendor/promotions/featured', active: false, icon: 'star' },
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

      {/* Main Banners Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Storefront Hero Banners Manager
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Upload promotional banners to display on your vendor storefront hero carousel.
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
            Add Hero Banner
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading banners...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {banners.map(b => (
              <div key={b.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ position: 'relative', width: '100%', height: 140, backgroundColor: '#e2e8f0' }}>
                  <Image src={b.imageUrl} alt={b.title} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Link: {b.linkUrl}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 6 }}>
                      CTA: {b.ctaText}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#16a34a' }}>ACTIVE</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Banner Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Add Storefront Hero Banner</h3>
            <form onSubmit={handleAddBanner} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Banner Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Image URL</label>
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Target Link URL</label>
                <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>CTA Button Text</label>
                <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Publish Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
