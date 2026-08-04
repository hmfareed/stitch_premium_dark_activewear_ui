'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorPromotionsHubPage() {
  const { user } = useAuth();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/promotions');
      const data = await res.json();
      if (res.ok) {
        setCoupons(data.coupons || []);
        setFlashSales(data.flashSales || []);
      }
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 13 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Marketing Hub', path: '/vendor/promotions', active: true, icon: 'campaign' },
          { label: 'Coupons Manager', path: '/vendor/promotions/coupons', active: false, icon: 'confirmation_number' },
          { label: 'Catalog Discounts', path: '/vendor/promotions/discounts', active: false, icon: 'percent' },
          { label: 'Flash Sales', path: '/vendor/promotions/flash-sales', active: false, icon: 'bolt' },
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

      {/* Main Promotions Hub Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Marketing & Promotional Campaigns Hub
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Boost conversion rates with custom promo coupons, category discounts, flash deals, and hero banners.
            </p>
          </div>

          <Link
            href="/vendor/promotions/coupons"
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Create Coupon Code
          </Link>
        </div>

        {/* Quick Campaign Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#166534' }}>ACTIVE COUPONS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', marginTop: 4 }}>{coupons.length} Promo Codes</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>Total Redemptions: 60</div>
          </div>

          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: 20, borderRadius: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#92400e' }}>SCHEDULED FLASH SALES</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#b45309', marginTop: 4 }}>{flashSales.length} Events</div>
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>Upcoming weekend sale</div>
          </div>
        </div>

        {/* Active Campaigns Table */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>Active Promotional Coupons</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading promotions...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Coupon Code</th>
                <th style={{ padding: '10px 8px' }}>Discount Value</th>
                <th style={{ padding: '10px 8px' }}>Min Order Spend</th>
                <th style={{ padding: '10px 8px' }}>Redemptions</th>
                <th style={{ padding: '10px 8px' }}>Expiry Date</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#0f172a' }}>🎟️ {c.code}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>
                    {c.type === 'Percentage' ? `${c.value}% OFF` : `GH₵ ${c.value.toFixed(2)} OFF`}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>GH₵ {c.minSpend.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800 }}>{c.usedCount} / {c.usageLimit}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{c.expiryDate}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
