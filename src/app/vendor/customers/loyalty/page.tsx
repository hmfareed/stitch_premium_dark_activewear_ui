'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorLoyaltyPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/customers');
      const data = await res.json();
      if (res.ok) setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to load loyalty:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 7 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Customers Base', path: '/vendor/customers', active: false, icon: 'group' },
          { label: 'Customer Groups', path: '/vendor/customers/groups', active: false, icon: 'groups' },
          { label: 'Loyalty & Rewards', path: '/vendor/customers/loyalty', active: true, icon: 'military_tech' },
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

      {/* Main Loyalty Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Loyalty & Rewards Program
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Track customer reward points, tier status (Bronze, Silver, Gold, Platinum), and redemption logs.
            </p>
          </div>

          <div style={{ padding: '8px 14px', backgroundColor: '#fef3c7', borderRadius: 10, border: '1px solid #fde68a', fontSize: 12, fontWeight: 700, color: '#d97706' }}>
            ⚡ Rate: 1 Point per GH₵ 10.00 Spent
          </div>
        </div>

        {/* Tiers Legend */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { tier: 'Bronze Tier', range: '0 - 99 pts', color: '#b45309', bg: '#fef3c7' },
            { tier: 'Silver Tier', range: '100 - 249 pts', color: '#475569', bg: '#f1f5f9' },
            { tier: 'Gold Tier', range: '250 - 499 pts', color: '#d97706', bg: '#fffbeb' },
            { tier: 'Platinum Tier', range: '500+ pts', color: '#16a34a', bg: '#dcfce7' },
          ].map(t => (
            <div key={t.tier} style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: t.bg, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: t.color }}>{t.tier}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{t.range}</div>
            </div>
          ))}
        </div>

        {/* Customer Loyalty Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading loyalty points...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Customer</th>
                <th style={{ padding: '10px 8px' }}>Lifetime Spend</th>
                <th style={{ padding: '10px 8px' }}>Loyalty Points</th>
                <th style={{ padding: '10px 8px' }}>Reward Tier</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => {
                const pts = c.loyaltyPoints || 0;
                const tier = pts >= 500 ? 'Platinum Tier' : pts >= 250 ? 'Gold Tier' : pts >= 100 ? 'Silver Tier' : 'Bronze Tier';
                const tierColor = pts >= 500 ? '#16a34a' : pts >= 250 ? '#d97706' : pts >= 100 ? '#475569' : '#b45309';

                return (
                  <tr key={c.email} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{c.name} ({c.email})</td>
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: '#10b981' }}>GH₵ {c.totalSpend.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: '#d97706' }}>⭐ {pts} pts</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: tierColor, padding: '3px 8px', borderRadius: 6, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        {tier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
