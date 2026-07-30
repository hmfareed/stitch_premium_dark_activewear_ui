'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface Tier {
  id: string;
  name: string;
  priceGhs: number;
  period: string;
  listings: string;
  seats: string;
  commission: string;
  storefront: string;
  support: string;
  badge?: string;
  popular?: boolean;
}

const TIERS: Tier[] = [
  {
    id: 'trial',
    name: 'Free Trial',
    priceGhs: 0,
    period: '1 Month',
    listings: '50 Listings',
    seats: '1 Staff Seat',
    commission: '0% Platform Commission',
    storefront: 'Standard Layout',
    support: 'Standard Support',
    badge: 'Auto-Activated',
  },
  {
    id: 'basic',
    name: 'Basic Tier',
    priceGhs: 299,
    period: 'Annual',
    listings: '50 Listings',
    seats: '1 Staff Seat',
    commission: '0% Platform Commission',
    storefront: 'Standard Layout',
    support: 'Standard Support',
  },
  {
    id: 'plus',
    name: 'Plus Tier',
    priceGhs: 699,
    period: 'Annual',
    listings: '200 Listings',
    seats: '4 Staff Seats',
    commission: '0% Platform Commission',
    storefront: 'Custom Theme & Banner',
    support: 'Priority Support',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Verified Pro',
    priceGhs: 1299,
    period: 'Annual',
    listings: 'Unlimited Listings',
    seats: 'Unlimited Staff Seats',
    commission: '0% Platform Commission',
    storefront: 'Full Custom Storefront',
    support: '100% Priority Support',
    badge: 'Pro Verified Badge',
  },
];

export default function VendorBillingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentTier, setCurrentTier] = useState<string>('trial');
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const res = await fetch('/api/vendor/subscription');
      if (res.ok) {
        const data = await res.json();
        if (data.tier) setCurrentTier(data.tier);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    setIsSubscribing(tierId);
    try {
      const res = await fetch('/api/vendor/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully upgraded to ${tierId.toUpperCase()} tier!`, 'success');
        setCurrentTier(tierId);
      } else {
        showToast(data.error || 'Failed to update subscription', 'error');
      }
    } catch (err) {
      showToast('Error processing subscription payment', 'error');
    } finally {
      setIsSubscribing(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--font-inter)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/vendor" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Vendor Panel</Link>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>Store Subscription & Billing</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem' }}>Manage your subscription plan, tier benefits, and billing preferences</p>
      </div>

      {/* Active Subscription Banner */}
      <div style={{ padding: '24px', backgroundColor: 'var(--surface-container)', borderRadius: '16px', border: '1px solid var(--outline-variant)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>Current Active Plan</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentTier.toUpperCase()} TIER
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(74, 222, 128, 0.15)', color: 'var(--lime-400)' }}>
              Active
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginTop: '6px' }}>
            {currentTier === 'trial' ? 'Your 1-Month Free Trial auto-started on verification approval.' : 'Your annual subscription is active with 0% platform commission.'}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Commission Rate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--lime-400)' }}>0%</div>
        </div>
      </div>

      {/* Subscription Tier Cards Grid */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Select Subscription Tier</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {TIERS.map(tier => {
          const isCurrent = currentTier === tier.id;
          return (
            <div
              key={tier.id}
              style={{
                padding: '24px',
                backgroundColor: tier.popular ? 'var(--surface-container-high)' : 'var(--surface-container)',
                borderRadius: '16px',
                border: tier.popular ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {tier.popular && (
                <div style={{ position: 'absolute', top: '-12px', right: '20px', backgroundColor: 'var(--primary)', color: '#FFF', fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '12px' }}>
                  MOST POPULAR
                </div>
              )}

              <div>
                {tier.badge && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>{tier.badge}</div>
                )}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{tier.name}</h3>
                <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 900 }}>GHS {tier.priceGhs}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>/ {tier.period}</span>
                </div>

                <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem', color: 'var(--on-surface)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ {tier.listings}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ {tier.seats}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--lime-400)', fontWeight: 700 }}>✓ {tier.commission}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ {tier.storefront}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>✓ {tier.support}</div>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={isCurrent || isSubscribing === tier.id}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: isCurrent ? 'var(--surface-container-highest)' : 'var(--primary)',
                  color: isCurrent ? 'var(--on-surface-variant)' : '#FFFFFF',
                  cursor: isCurrent ? 'default' : 'pointer',
                }}
              >
                {isCurrent ? 'Current Active Tier' : isSubscribing === tier.id ? 'Upgrading...' : `Select ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
