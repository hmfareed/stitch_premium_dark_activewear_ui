'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

function PendingContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Animated ring */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 32 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#00e5ff', animation: 'spin 2s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--lime-400)', animation: 'spin 3s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#00e5ff' }}>storefront</span>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ textAlign: 'center', maxWidth: 520 }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: '2rem', fontWeight: 800, margin: '0 0 12px 0' }}>
          Store submitted for review!
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', margin: '0 0 40px 0', lineHeight: 1.7 }}>
          Your store is in our review queue. Our team typically approves stores within <strong style={{ color: 'var(--on-surface)' }}>a few hours</strong>. We'll send you an SMS and email the moment it's live.
        </p>

        {/* Status timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 40, textAlign: 'left', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', overflow: 'hidden' }}>
          {[
            { icon: 'check_circle', label: 'Store Setup Complete', done: true },
            { icon: 'check_circle', label: 'Payout Account Connected', done: true },
            { icon: 'check_circle', label: 'Verification Checks Passed', done: true },
            { icon: 'pending', label: 'AfriCart Review', done: false, active: true },
            { icon: 'rocket_launch', label: 'Store Goes Live!', done: false },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: i < arr.length - 1 ? '1px solid var(--outline)' : 'none', background: item.active ? 'rgba(0,229,255,0.04)' : 'transparent' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: item.done ? 'var(--lime-400)' : item.active ? '#00e5ff' : 'var(--on-surface-variant)', flexShrink: 0, animation: item.active ? 'pulse-glow 2s ease-in-out infinite' : 'none' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: item.active ? 700 : item.done ? 600 : 400, color: item.active ? '#00e5ff' : item.done ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                {item.label}
              </span>
              {item.active && (
                <span style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, background: 'rgba(0,229,255,0.1)', color: '#00e5ff', fontSize: '0.72rem', fontWeight: 700 }}>IN REVIEW</span>
              )}
            </div>
          ))}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '0 0 24px 0' }}>
          While you wait, you can explore your vendor dashboard — your store controls will be unlocked as soon as you go live.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/vendor"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', color: '#000', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', fontFamily: 'var(--font-lexend)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dashboard</span>
            Go to Dashboard
          </Link>
          <Link
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', fontFamily: 'var(--font-lexend)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_bag</span>
            Browse AfriCart
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime-400)' }} />
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
