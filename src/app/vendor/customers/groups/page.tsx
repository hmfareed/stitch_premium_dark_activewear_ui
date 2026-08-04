'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorCustomerGroupsPage() {
  const { user } = useAuth();

  const groups = [
    { title: 'VIP Tier Buyers', memberCount: 14, criteria: 'Lifetime spend > GH₵ 2,000.00', perk: '1.5x Loyalty points & free shipping', color: '#d97706', bg: '#fef3c7' },
    { title: 'Regular Buyers', memberCount: 42, criteria: 'Placed 3+ completed orders', perk: 'Standard catalog discounts', color: '#2563eb', bg: '#dbeafe' },
    { title: 'New Customers', memberCount: 28, criteria: 'Joined in past 30 days', perk: '10% Welcome Coupon', color: '#16a34a', bg: '#dcfce7' },
    { title: 'High Risk / Blacklist', memberCount: 2, criteria: 'Flagged for fraudulent returns', perk: 'Restricted from COD payment', color: '#dc2626', bg: '#fee2e2' },
  ];

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 7 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Customers Base', path: '/vendor/customers', active: false, icon: 'group' },
          { label: 'Customer Groups', path: '/vendor/customers/groups', active: true, icon: 'groups' },
          { label: 'Loyalty & Rewards', path: '/vendor/customers/loyalty', active: false, icon: 'military_tech' },
          { label: 'Wallets & Credit', path: '/vendor/customers/wallets', active: false, icon: 'account_balance_wallet' },
          { label: 'Delivery Addresses', path: '/vendor/customers/addresses', active: false, icon: 'pin_drop' },
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

      {/* Main Groups Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Customer Segmentation Groups
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Segment buyers into VIP, regular, new, and high-risk groups for targeted promotional campaigns.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {groups.map(g => (
            <div key={g.title} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, padding: '3px 8px', borderRadius: 6, backgroundColor: g.bg, color: g.color }}>
                    {g.memberCount} MEMBERS
                  </span>
                  <span className="material-symbols-outlined" style={{ color: g.color, fontSize: 24 }}>groups</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>{g.title}</h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>{g.criteria}</p>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                🎁 Perk: {g.perk}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
