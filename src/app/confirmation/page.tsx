'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [orderNumber] = useState(() => Math.floor(Math.random() * 900000) + 100000);
  const [showCheck, setShowCheck] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');

  // Handle Paystack redirect callback (when user is redirected back from hosted checkout)
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (reference) {
      setVerifyStatus('verifying');
      fetch(`/api/paystack/verify?reference=${reference}`)
        .then(res => res.json())
        .then(async (data) => {
          if (data.success) {
            setVerifyStatus('verified');
            // Save the pending order if we have one from checkout redirect
            try {
              const pendingOrder = localStorage.getItem('africart-pending-order');
              if (pendingOrder) {
                const orderData = JSON.parse(pendingOrder);
                orderData.status = 'Confirmed';
                orderData.paymentInfo = { ...orderData.paymentInfo, paystackRef: reference, verified: true };
                await fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(orderData),
                });
                // Clear pending order and cart
                localStorage.removeItem('africart-pending-order');
                localStorage.removeItem('africart-pending-ref');
                localStorage.removeItem('africart-cart');
              }
            } catch (err) {
              console.error('Error saving order after payment:', err);
            }
          } else {
            setVerifyStatus('failed');
          }
        })
        .catch(() => setVerifyStatus('failed'));
    }
  }, [searchParams]);

  useEffect(() => {
    setTimeout(() => setShowCheck(true), 300);
    setTimeout(() => setShowContent(true), 800);
  }, []);

  // Show verifying state
  if (verifyStatus === 'verifying') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '0 24px', textAlign: 'center' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--lime-400)', marginBottom: 24 }}>progress_activity</span>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Verifying Payment...</h1>
        <p style={{ fontFamily: 'var(--font-inter)', color: '#666', fontSize: 14 }}>Please wait while we confirm your payment.</p>
      </div>
    );
  }

  // Show failed state
  if (verifyStatus === 'failed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#fff' }}>close</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>Payment Failed</h1>
        <p style={{ fontFamily: 'var(--font-inter)', color: '#666', marginBottom: 32, maxWidth: 300, lineHeight: 1.6, fontSize: 14 }}>
          We couldn&apos;t verify your payment. Please try again or contact support.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <Link href="/checkout" style={{
            display: 'block', padding: '16px', background: 'var(--lime-400)', color: 'var(--on-lime-400)',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10, textAlign: 'center',
          }}>
            Try Again
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
    );
  }

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
              {verifyStatus === 'verified' ? 'Payment Verified' : 'Processing'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <Link href="/shop" style={{
            display: 'block', padding: '16px', background: 'var(--lime-400)', color: 'var(--on-lime-400)',
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

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '75vh' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'var(--lime-400)' }}>progress_activity</span>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
