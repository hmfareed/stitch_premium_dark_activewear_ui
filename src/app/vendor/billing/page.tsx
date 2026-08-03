'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorBillingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchBillingData();
    }
  }, [user]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/billing/select-plan?vendorEmail=${encodeURIComponent(user?.email || '')}`);
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
        setCurrentSub(data.currentSubscription);
      }
    } catch (err) {
      console.error('Fetch billing data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (tier: string) => {
    if (tier === 'trial') return;
    setSubscribingTier(tier);
    try {
      const res = await fetch('/api/vendor/billing/select-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorEmail: user?.email,
          planTier: tier,
          billingCycle,
        }),
      });
      const data = await res.json();
      if (data.success && data.authorization_url) {
        showToast('Redirecting to Paystack checkout...', 'info');
        window.location.href = data.authorization_url;
      } else {
        showToast(data.error || 'Failed to initialize plan payment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing plan selection', 'error');
    } finally {
      setSubscribingTier(null);
    }
  };

  if (loading) {
    return <div style={{ color: '#888', padding: 24 }}>Loading subscription & billing details...</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
          Subscription & Store Monetization
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginTop: 6 }}>
          0% Platform Commission across all tiers. Choose the plan that best fits your business growth.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div style={{ display: 'inline-flex', background: '#0d0f0b', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', marginTop: 16 }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: billingCycle === 'monthly' ? '#c3f400' : 'transparent',
              color: billingCycle === 'monthly' ? '#000' : '#aaa',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: billingCycle === 'annual' ? '#c3f400' : 'transparent',
              color: billingCycle === 'annual' ? '#000' : '#aaa',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Annual Billing <span style={{ fontSize: 10, color: billingCycle === 'annual' ? '#000' : '#c3f400', fontWeight: 900 }}>(Save ~25%)</span>
          </button>
        </div>
      </div>

      {/* Current Subscription Banner */}
      {currentSub && (
        <div style={{ background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.3)', borderRadius: 16, padding: 20, marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#c3f400', textTransform: 'uppercase' }}>Active Subscription</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 2 }}>{currentSub.planName} Tier</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
              Expires on {new Date(currentSub.endDate).toLocaleDateString('en-GB')} ({currentSub.daysRemaining} days remaining)
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ padding: '6px 14px', borderRadius: 20, background: '#c3f400', color: '#000', fontWeight: 900, fontSize: 12, textTransform: 'uppercase' }}>
              {currentSub.status}
            </span>
          </div>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {plans.map((p) => {
          const isCurrent = currentSub?.planTier === p.tier;
          const price = billingCycle === 'monthly' ? p.monthlyPrice : p.annualPrice;

          return (
            <div
              key={p.tier}
              style={{
                background: '#0d0f0b',
                border: isCurrent ? '2px solid #c3f400' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {isCurrent && (
                <div style={{ position: 'absolute', top: -12, right: 16, background: '#c3f400', color: '#000', fontSize: 10, fontWeight: 900, padding: '2px 10px', borderRadius: 10, textTransform: 'uppercase' }}>
                  Current Plan
                </div>
              )}

              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0, textTransform: 'uppercase' }}>{p.name}</h3>
                
                <div style={{ margin: '16px 0 12px' }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#c3f400' }}>
                    GH₵{price}
                  </span>
                  <span style={{ fontSize: 12, color: '#888' }}>
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#ccc', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>📦 Listings: <strong>{p.maxProducts === null ? 'Unlimited' : `${p.maxProducts} active`}</strong></div>
                  <div>👤 Staff Seats: <strong>{p.maxStaff === null ? 'Unlimited' : p.maxStaff}</strong></div>
                  <div>⚡ Commission: <strong>0% (Growth Phase)</strong></div>
                  <div>🎨 Storefront: <strong>{p.features?.storefrontCustomization || 'Standard'}</strong></div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(p.tier)}
                disabled={isCurrent || p.tier === 'trial' || subscribingTier === p.tier}
                style={{
                  marginTop: 24,
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: isCurrent ? 'rgba(255,255,255,0.1)' : '#c3f400',
                  color: isCurrent ? '#888' : '#000',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: isCurrent || p.tier === 'trial' ? 'default' : 'pointer',
                }}
              >
                {isCurrent
                  ? 'Active Plan'
                  : p.tier === 'trial'
                  ? 'Auto-Enrolled'
                  : subscribingTier === p.tier
                  ? 'Redirecting...'
                  : `Select ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
