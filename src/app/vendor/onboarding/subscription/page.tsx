'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';
import VendorOnboardingProgress from '@/components/VendorOnboardingProgress';

export default function SubscriptionSelectionStepPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<'Starter' | 'Growth' | 'Premium'>('Growth');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/onboarding/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionPlan: selectedPlan,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save subscription choice');

      showToast(`Selected ${selectedPlan} Plan! Moving to Step 4.`, 'success');
      router.push('/vendor/onboarding/payment-setup');
    } catch (err: any) {
      showToast(err.message || 'Subscription selection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const plans = [
    {
      name: 'Starter',
      monthly: 99,
      annual: 79,
      commission: '5% per order',
      features: ['Up to 50 Product Listings', 'Standard Storefront Theme', 'Basic Sales Analytics', 'Standard Support'],
      highlight: false,
    },
    {
      name: 'Growth',
      monthly: 249,
      annual: 199,
      commission: '3% per order',
      features: ['Up to 500 Product Listings', 'Featured Storefront Placement', 'Advanced Analytics & Reports', 'Coupons & Promotions Engine', 'Priority Support'],
      highlight: true,
    },
    {
      name: 'Premium',
      monthly: 499,
      annual: 399,
      commission: '1.5% per order',
      features: ['Unlimited Product Listings', 'Multi-Branch Store Management', 'Dedicated Account Manager', 'Custom Store Domain', 'Lowest Processing Fees'],
      highlight: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#061d13', color: '#ffffff', fontFamily: 'var(--font-inter, sans-serif)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Step Progress Header Bar */}
        <VendorOnboardingProgress currentStep={3} />

        <div style={{
          backgroundColor: '#0a291b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Step 3: Choose Vendor Subscription Plan
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Select the plan that best fits your business volume. Upgrade or downgrade anytime.
            </p>

            {/* Monthly vs Annual Toggle */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#061d13', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: billingCycle === 'monthly' ? '#10b981' : 'transparent',
                  color: billingCycle === 'monthly' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: billingCycle === 'annual' ? '#10b981' : 'transparent',
                  color: billingCycle === 'annual' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>Annual Billing</span>
                <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: '#a3e635', color: '#000', padding: '1px 5px', borderRadius: 4 }}>SAVE 20%</span>
              </button>
            </div>
          </div>

          {/* 3 Tier Plan Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>
            {plans.map(p => {
              const isSelected = selectedPlan === p.name;
              const price = billingCycle === 'annual' ? p.annual : p.monthly;

              return (
                <div
                  key={p.name}
                  onClick={() => setSelectedPlan(p.name as any)}
                  style={{
                    backgroundColor: isSelected ? '#0b3824' : '#061d13',
                    border: isSelected ? '2px solid #a3e635' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 18,
                    padding: 24,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {p.highlight && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#a3e635', color: '#000000', fontWeight: 900, fontSize: 10, padding: '3px 10px', borderRadius: 10, letterSpacing: '0.05em' }}>
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#a3e635', fontWeight: 700, marginBottom: 16 }}>{p.commission}</div>
                    
                    <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', marginBottom: 16 }}>
                      GHC {price}
                      <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>/mo</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#cbd5e1' }}>
                      {p.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>check_circle</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 20 }}>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: 10,
                        backgroundColor: isSelected ? '#10b981' : 'rgba(255,255,255,0.05)',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: 12,
                        textAlign: 'center',
                      }}
                    >
                      {isSelected ? 'SELECTED PLAN' : 'SELECT PLAN'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/vendor/onboarding/verification" style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              ← Back to Step 2
            </Link>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '14px 28px',
                borderRadius: 12,
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'var(--font-lexend, sans-serif)',
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{loading ? 'SAVING...' : 'NEXT: PAYMENT SETUP'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
