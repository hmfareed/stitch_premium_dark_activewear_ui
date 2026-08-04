'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorBillingUsagePage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/billing');
      const data = await res.json();
      if (res.ok) setUsage(data.usage);
    } catch (err) {
      console.error('Failed to load usage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 17 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Current Plan', path: '/vendor/billing', active: false, icon: 'workspace_premium' },
          { label: 'Upgrade Plan', path: '/vendor/billing/upgrade', active: false, icon: 'rocket_launch' },
          { label: 'Billing History', path: '/vendor/billing/history', active: false, icon: 'history' },
          { label: 'Invoices', path: '/vendor/billing/invoices', active: false, icon: 'receipt' },
          { label: 'Usage Quotas', path: '/vendor/billing/usage', active: true, icon: 'data_usage' },
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

      {/* Main Usage Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Real-Time Resource Usage Tracking & Quotas
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Monitor active usage meters for product listings, staff accounts, POS registers, and GMV volume.
          </p>
        </div>

        {loading || !usage ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading usage meters...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>CATALOG PRODUCTS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                {usage.products.current} / {usage.products.max}
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', backgroundColor: '#10b981' }}></div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>STAFF ACCOUNT SEATS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                {usage.staffSeats.current} / {usage.staffSeats.max} seats
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: '30%', height: '100%', backgroundColor: '#10b981' }}></div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>POS REGISTERS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                {usage.posRegisters.current} / {usage.posRegisters.max} registers
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: '40%', height: '100%', backgroundColor: '#2563eb' }}></div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>MONTHLY GMV VOLUME</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#9333ea', marginTop: 4 }}>
                GH₵ {usage.monthlyGmv.current.toLocaleString()}
              </div>
              <div style={{ height: 6, borderRadius: 3, backgroundColor: '#cbd5e1', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: `${(usage.monthlyGmv.current / usage.monthlyGmv.max) * 100}%`, height: '100%', backgroundColor: '#9333ea' }}></div>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
