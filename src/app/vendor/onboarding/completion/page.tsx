'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';
import VendorOnboardingProgress from '@/components/VendorOnboardingProgress';

export default function CompletionWizardStepPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#061d13', color: '#ffffff', fontFamily: 'var(--font-inter, sans-serif)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Step Progress Header Bar */}
        <VendorOnboardingProgress currentStep={5} />

        <div style={{
          backgroundColor: '#0a291b',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 24,
          padding: 40,
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
          {/* Animated Celebration Icon */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 0 30px rgba(16,185,129,0.6)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44 }}>task_alt</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: '0 0 10px' }}>
            Congratulations! 🎉
          </h1>
          <p style={{ fontSize: 15, color: '#a3e635', fontWeight: 700, margin: '0 0 24px' }}>
            Your Vendor Store Setup is 100% Complete!
          </p>

          <p style={{ fontSize: 13, color: '#94a3b8', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Your business branding, Tax ID verification, subscription plan, and payout routing are all active. You are now ready to publish products and accept customer orders!
          </p>

          {/* 5-Step Progress Summary Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 36 }}>
            {[
              { label: 'Business Info', status: 'Configured', color: '#10b981' },
              { label: 'Verification', status: 'Tier 2 Active', color: '#10b981' },
              { label: 'Subscription', status: 'Plan Active', color: '#10b981' },
              { label: 'Payment Setup', status: 'Connected', color: '#10b981' },
              { label: 'Storefront', status: 'Live', color: '#a3e635' },
            ].map(b => (
              <div key={b.label} style={{ backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 8px' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{b.label}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: b.color, marginTop: 4 }}>{b.status}</div>
              </div>
            ))}
          </div>

          {/* Action Launcher */}
          <Link
            href="/vendor"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '16px 36px',
              borderRadius: 14,
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: 15,
              textDecoration: 'none',
              fontFamily: 'var(--font-lexend, sans-serif)',
              boxShadow: '0 6px 20px rgba(16,185,129,0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>ENTER VENDOR DASHBOARD</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
