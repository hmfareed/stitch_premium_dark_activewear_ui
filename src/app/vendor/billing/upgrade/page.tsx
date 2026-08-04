'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorBillingUpgradePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter Free Tier',
      price: 'GH₵ 0',
      period: 'forever free',
      description: 'Ideal for small pop-up stores and boutique sellers.',
      features: ['Max 25 Catalog Products', '1 Staff Account', '1 POS Register', 'Standard Support', '5.0% Commission Fee'],
      current: false,
    },
    {
      id: 'gold',
      name: 'Gold Merchant Tier',
      price: 'GH₵ 199',
      period: 'per month',
      popular: true,
      description: 'Built for scaling retail brands and active multi-branch stores.',
      features: ['Unlimited Catalog Products', '10 Staff Accounts', '5 POS Registers', 'Low 3.5% Commission Fee', 'Priority Courier Dispatch', 'Custom Receipt Branding'],
      current: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise Tier',
      price: 'GH₵ 499',
      period: 'per month',
      description: 'Designed for large multi-location enterprises & high-volume merchants.',
      features: ['Unlimited Everything', 'Custom 0% Commission option', 'Unlimited POS Registers', 'Dedicated Account Manager', 'Custom ERP & Webhook Integrations', 'Custom Domain Name'],
      current: false,
    },
  ];

  const handleSelectPlan = async (planName: string) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_plan', planName }),
      });

      if (res.ok) {
        showToast(`Subscription plan updated to ${planName}!`, 'success');
      }
    } catch (err) {
      console.error('Error changing plan:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 17 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Current Plan', path: '/vendor/billing', active: false, icon: 'workspace_premium' },
          { label: 'Upgrade Plan', path: '/vendor/billing/upgrade', active: true, icon: 'rocket_launch' },
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

      {/* Main Plan Selection Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 32px' }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Choose the Right Plan for Your Store Growth
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 6, margin: 0 }}>
            Upgrade or downgrade anytime. Flexible billing with Mobile Money & Card support.
          </p>
        </div>

        {/* 3 Tier Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {plans.map(p => (
            <div
              key={p.id}
              style={{
                backgroundColor: p.popular ? '#061d13' : '#f8fafc',
                color: p.popular ? '#ffffff' : '#0f172a',
                borderRadius: 20,
                padding: 24,
                border: p.popular ? '2px solid #10b981' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {p.popular && (
                <div style={{ position: 'absolute', top: -12, right: 20, backgroundColor: '#10b981', color: '#ffffff', fontSize: 10, fontWeight: 900, padding: '3px 10px', borderRadius: 10 }}>
                  POPULAR
                </div>
              )}

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: p.popular ? '#a3e635' : '#0f172a' }}>{p.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '12px 0 6px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>{p.price}</span>
                  <span style={{ fontSize: 12, color: p.popular ? '#cbd5e1' : '#64748b' }}>/ {p.period}</span>
                </div>
                <p style={{ fontSize: 12, color: p.popular ? '#cbd5e1' : '#64748b', margin: '0 0 16px', minHeight: 36 }}>{p.description}</p>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  {p.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>check_circle</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(p.name)}
                disabled={submitting || p.current}
                style={{
                  marginTop: 24,
                  width: '100%',
                  padding: '10px',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: p.current ? 'default' : 'pointer',
                  backgroundColor: p.current ? '#e2e8f0' : (p.popular ? '#10b981' : '#0f172a'),
                  color: p.current ? '#64748b' : '#ffffff',
                }}
              >
                {p.current ? 'CURRENT PLAN' : 'SELECT PLAN'}
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
