'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorDiscountsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [discounts, setDiscounts] = useState([
    { id: 'disc-1', title: 'Activewear Category Markdown', target: 'Activewear Category', markdown: '15% OFF', minQty: '2 items', status: 'Active' },
    { id: 'disc-2', title: 'Footwear Bulk Discount', target: 'Footwear Category', markdown: 'GH₵ 50.00 OFF', minQty: '1 item', status: 'Active' },
  ]);

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 13 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Marketing Hub', path: '/vendor/promotions', active: false, icon: 'campaign' },
          { label: 'Coupons Manager', path: '/vendor/promotions/coupons', active: false, icon: 'confirmation_number' },
          { label: 'Catalog Discounts', path: '/vendor/promotions/discounts', active: true, icon: 'percent' },
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

      {/* Main Catalog Discounts Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Catalog Discounts & Price Markdowns
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Apply automatic price markdowns across entire product categories or bulk quantities.
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
              <th style={{ padding: '10px 8px' }}>Discount Campaign Title</th>
              <th style={{ padding: '10px 8px' }}>Target Scope</th>
              <th style={{ padding: '10px 8px' }}>Markdown Rate</th>
              <th style={{ padding: '10px 8px' }}>Min Quantity Threshold</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{d.title}</td>
                <td style={{ padding: '10px 8px', fontWeight: 700, color: '#475569' }}>{d.target}</td>
                <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>{d.markdown}</td>
                <td style={{ padding: '10px 8px', color: '#64748b' }}>{d.minQty}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                    {d.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
