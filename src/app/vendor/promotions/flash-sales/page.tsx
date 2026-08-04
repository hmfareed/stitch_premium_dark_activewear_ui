'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorFlashSalesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [title, setTitle] = useState('Weekend Activewear Flash Sale');
  const [discountPct, setDiscountPct] = useState('25');
  const [startDate, setStartDate] = useState('Aug 8, 2026');
  const [endDate, setEndDate] = useState('Aug 10, 2026');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFlash();
  }, []);

  const fetchFlash = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/promotions');
      const data = await res.json();
      if (res.ok) setFlashSales(data.flashSales || []);
    } catch (err) {
      console.error('Failed to load flash sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlash = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_flash_sale',
          flashSale: { title, discountPct: Number(discountPct), startDate, endDate },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Flash sale scheduled with live countdown timer!', 'success');
      setFlashSales(data.flashSales || []);
      setShowAddModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error creating flash sale', 'error');
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
          { label: 'Flash Sales', path: '/vendor/promotions/flash-sales', active: true, icon: 'bolt' },
          { label: 'Storefront Banners', path: '/vendor/promotions/banners', active: false, icon: 'view_carousel' },
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

      {/* Main Flash Sales Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Scheduled Flash Sales & Countdown Timers
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Run time-sensitive flash sales with automatic countdown timers on storefront product cards.
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
            Schedule Flash Sale
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading flash sales...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Flash Event Title</th>
                <th style={{ padding: '10px 8px' }}>Discount Rate</th>
                <th style={{ padding: '10px 8px' }}>Start Date</th>
                <th style={{ padding: '10px 8px' }}>End Date</th>
                <th style={{ padding: '10px 8px' }}>Items Count</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {flashSales.map(f => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>⚡ {f.title}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>{f.discountPct}% OFF</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{f.startDate}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{f.endDate}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800 }}>{f.itemsCount} items</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 6 }}>
                      {f.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Schedule Flash Sale Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Schedule Flash Sale Event</h3>
            <form onSubmit={handleCreateFlash} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Flash Event Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Discount Percentage (%)</label>
                <input type="number" min={1} max={90} value={discountPct} onChange={e => setDiscountPct(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Start Date</label>
                  <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>End Date</label>
                  <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Schedule Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
