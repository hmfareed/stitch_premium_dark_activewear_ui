'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorWalletsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/customers');
      const data = await res.json();
      if (res.ok) setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to load wallets:', err);
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
          { label: 'Loyalty & Rewards', path: '/vendor/customers/loyalty', active: false, icon: 'military_tech' },
          { label: 'Wallets & Credit', path: '/vendor/customers/wallets', active: true, icon: 'account_balance_wallet' },
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

      {/* Main Wallets Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Customer Store Credit Wallets
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Issue store credit refunds, promotional wallet balances, and track buyer credit utilization.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading customer wallets...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Customer Name</th>
                <th style={{ padding: '10px 8px' }}>Email & Phone</th>
                <th style={{ padding: '10px 8px' }}>Active Store Credit Balance</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.email} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{c.name}</td>
                  <td style={{ padding: '10px 8px', color: '#475569', fontWeight: 600 }}>{c.email} ({c.phone})</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: (c.walletCredit || 0) > 0 ? '#10b981' : '#94a3b8' }}>
                    GH₵ {(c.walletCredit || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, backgroundColor: (c.walletCredit || 0) > 0 ? '#dcfce7' : '#f1f5f9', color: (c.walletCredit || 0) > 0 ? '#16a34a' : '#64748b', padding: '2px 6px', borderRadius: 4 }}>
                      {(c.walletCredit || 0) > 0 ? 'CREDIT ACTIVE' : 'ZERO BALANCE'}
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
