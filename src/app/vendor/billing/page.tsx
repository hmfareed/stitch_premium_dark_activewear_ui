'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorBillingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/billing');
      const data = await res.json();
      if (res.ok) {
        setCurrentPlan(data.currentPlan);
        setUsage(data.usage);
      }
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    const newStatus = !currentPlan.autoRenew;
    try {
      const res = await fetch('/api/vendor/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_auto_renew', autoRenew: newStatus }),
      });

      if (res.ok) {
        setCurrentPlan((prev: any) => ({ ...prev, autoRenew: newStatus }));
        showToast(`Auto-renewal ${newStatus ? 'enabled' : 'disabled'}!`, 'success');
      }
    } catch (err) {
      console.error('Error toggling auto-renew:', err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 17 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Current Plan', path: '/vendor/billing', active: true, icon: 'workspace_premium' },
          { label: 'Upgrade Plan', path: '/vendor/billing/upgrade', active: false, icon: 'rocket_launch' },
          { label: 'Billing History', path: '/vendor/billing/history', active: false, icon: 'history' },
          { label: 'Invoices', path: '/vendor/billing/invoices', active: false, icon: 'receipt' },
          { label: 'Usage Quotas', path: '/vendor/billing/usage', active: false, icon: 'data_usage' },
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

      {/* Main Current Plan Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Subscription Plan & Billing Overview
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Manage active store tier, auto-renewal preferences, resource quotas, and tax invoices.
            </p>
          </div>

          <Link
            href="/vendor/billing/upgrade"
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
            Upgrade Tier Plan
          </Link>
        </div>

        {loading || !currentPlan ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981', fontWeight: 700 }}>Loading subscription details...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Active Plan Banner */}
            <div style={{ backgroundColor: '#061d13', borderRadius: 18, padding: 24, color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#a3e635' }}>ACTIVE SUBSCRIPTION TIER</div>
                <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.8rem', fontWeight: 900, marginTop: 2 }}>
                  {currentPlan.name}
                </div>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>
                  GH₵ {currentPlan.price.toFixed(2)} / {currentPlan.interval} • Next Renewal Date: <strong>{currentPlan.nextBillingDate}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Auto-Renew</span>
                <input
                  type="checkbox"
                  checked={currentPlan.autoRenew}
                  onChange={handleToggleAutoRenew}
                  style={{ width: 20, height: 20, accentColor: '#a3e635', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Quick Quota Summary Grid */}
            {usage && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>CATALOG PRODUCTS LISTED</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                    {usage.products.current} / {usage.products.max}
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>STAFF ACCOUNTS SEATS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                    {usage.staffSeats.current} / {usage.staffSeats.max} seats
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>POS REGISTERS ACTIVE</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                    {usage.posRegisters.current} / {usage.posRegisters.max} registers
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
