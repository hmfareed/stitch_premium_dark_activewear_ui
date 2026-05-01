'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ConfirmationPage() {
  const [orderNumber] = useState(() => Math.floor(Math.random() * 900000) + 100000);
  const [showCheck, setShowCheck] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowCheck(true), 300);
    setTimeout(() => setShowContent(true), 800);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '0 24px', textAlign: 'center' }}>
      {/* Animated Check */}
      <div className={showCheck ? 'animate-bounce-in' : ''} style={{
        width: 100, height: 100, borderRadius: '50%',
        background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, opacity: showCheck ? 1 : 0,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="48"
            style={{
              strokeDashoffset: showCheck ? 0 : 48,
              transition: 'stroke-dashoffset 0.6s ease 0.3s',
            }}
          />
        </svg>
      </div>

      <div style={{ opacity: showContent ? 1 : 0, transform: showContent ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>Order Confirmed!</h1>
        <p style={{ fontFamily: 'var(--font-inter)', color: '#666', marginBottom: 32, maxWidth: 300, lineHeight: 1.6, fontSize: 14 }}>
          Your premium performance gear is being prepared. You&apos;ll receive a confirmation shortly.
        </p>

        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: 24, width: '100%', maxWidth: 340, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order Number</span>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: '#fff' }}>#{orderNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</span>
            <span style={{
              fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700,
              color: 'var(--lime-400)', textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'rgba(195,244,0,0.1)', padding: '4px 10px', borderRadius: 6,
            }}>
              Processing
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <Link href="/shop" style={{
            display: 'block', padding: '16px', background: 'var(--lime-400)', color: '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10, textAlign: 'center',
          }}>
            Continue Shopping
          </Link>
          <Link href="/" style={{
            display: 'block', padding: '16px', background: 'transparent',
            border: '1px solid #222', color: '#888',
            fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10, textAlign: 'center',
          }}>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
