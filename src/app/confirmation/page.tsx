'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* ─── Confetti Particle ─────────────────────────────── */
function Confetti() {
  const pieces = Array.from({ length: 22 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.2}s`,
    dur: `${1.2 + Math.random() * 0.8}s`,
    color: i % 3 === 0 ? '#c3f400' : i % 3 === 1 ? '#fff' : '#D4AF37',
    size: `${4 + Math.random() * 5}px`,
    rotate: `${Math.random() * 360}deg`,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10px',
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px',
            transform: `rotate(${p.rotate})`,
            animation: `confettiFall ${p.dur} ${p.delay} ease-in forwards`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%  { transform: translateY(0) rotate(0deg); opacity: 1; }
          100%{ transform: translateY(340px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Animated Success Circle ───────────────────────── */
function SuccessCircle({ visible }: { visible: boolean }) {
  return (
    <div style={{
      position: 'relative',
      width: 88,
      height: 88,
      marginBottom: 20,
    }}>
      {/* Outer glow ring */}
      <div style={{
        position: 'absolute',
        inset: -10,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(195,244,0,0.18) 0%, transparent 70%)',
        animation: visible ? 'pulseRing 2s ease-in-out infinite' : 'none',
      }} />
      {/* Circle */}
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        {/* Background circle */}
        <circle cx="44" cy="44" r="42" fill="rgba(195,244,0,0.08)" stroke="rgba(195,244,0,0.3)" strokeWidth="1.5" />
        {/* Animated progress ring */}
        <circle
          cx="44" cy="44" r="40"
          fill="none"
          stroke="#c3f400"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="251.2"
          style={{
            strokeDashoffset: visible ? 0 : 251.2,
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)',
            transformOrigin: 'center',
            transform: 'rotate(-90deg)',
          }}
        />
        {/* Check mark */}
        <path
          d="M28 44l12 12 20-22"
          stroke="#c3f400"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="60"
          style={{
            strokeDashoffset: visible ? 0 : 60,
            transition: 'stroke-dashoffset 0.55s ease 0.5s',
          }}
        />
      </svg>
      <style>{`
        @keyframes pulseRing {
          0%,100%{ transform: scale(1); opacity: 0.7; }
          50%    { transform: scale(1.12); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─── Payment Method Icon ───────────────────────────── */
function PaymentMethodIcon({ method }: { method: string }) {
  const m = (method || '').toLowerCase();
  if (m.includes('mtn') || m.includes('momo') || m.includes('mobile money')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 26, height: 18, borderRadius: 4, background: '#ffcc00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#000', letterSpacing: '0.02em', flexShrink: 0 }}>
          MTN
        </div>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>MTN Mobile Money</span>
      </div>
    );
  }
  if (m.includes('telecel') || m.includes('voda')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 26, height: 18, borderRadius: 4, background: '#e32a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', flexShrink: 0 }}>TC</div>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>Telecel Cash</span>
      </div>
    );
  }
  if (m.includes('airteltigo') || m.includes('airtel')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 26, height: 18, borderRadius: 4, background: '#e8201f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', flexShrink: 0 }}>AT</div>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>AirtelTigo Cash</span>
      </div>
    );
  }
  if (m.includes('cash') || m.includes('cod')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#c3f400' }}>payments</span>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>Cash on Delivery</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#c3f400' }}>credit_card</span>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>{method || 'Online Payment'}</span>
    </div>
  );
}

/* ─── Main Confirmation Content ─────────────────────── */
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [showCheck, setShowCheck] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [orderData, setOrderData] = useState<any>(null);

  const orderIdParam = searchParams.get('orderId');
  const referenceParam = searchParams.get('reference') || searchParams.get('trxref');
  const verifiedParam = searchParams.get('verified') === 'true';

  // Handle Paystack redirect callback
  useEffect(() => {
    if (verifiedParam) {
      setVerifyStatus('verified');
      return;
    }
    if (referenceParam) {
      setVerifyStatus('verifying');
      fetch(`/api/paystack/verify?reference=${referenceParam}`)
        .then(res => res.json())
        .then(async (data) => {
          if (data.success) {
            setVerifyStatus('verified');
            try {
              const pendingOrder = localStorage.getItem('africart-pending-order');
              if (pendingOrder) {
                const parsedData = JSON.parse(pendingOrder);
                parsedData.status = 'Confirmed';
                parsedData.paymentInfo = { ...parsedData.paymentInfo, paystackRef: referenceParam, verified: true };
                await fetch('/api/orders', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(parsedData),
                });
                setOrderData(parsedData);
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
    } else {
      setVerifyStatus('verified');
    }
  }, [searchParams, referenceParam, verifiedParam]);

  // Load order data from local storage or API
  useEffect(() => {
    try {
      const pending = localStorage.getItem('africart-pending-order');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed.orderId === orderIdParam || parsed.orderId === referenceParam) {
          setOrderData(parsed);
        }
      }
    } catch {}

    const lookupId = orderIdParam || referenceParam;
    if (lookupId) {
      fetch(`/api/orders/${lookupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.order) {
            setOrderData(data.order);
            localStorage.removeItem('africart-pending-order');
            localStorage.removeItem('africart-pending-ref');
            localStorage.removeItem('africart-cart');
          }
        })
        .catch(err => console.error('Failed to fetch order details:', err));
    }
  }, [orderIdParam, referenceParam]);

  useEffect(() => {
    setTimeout(() => setShowCheck(true), 300);
    setTimeout(() => setShowContent(true), 700);
  }, []);

  // ── Verifying State ─────────────────────────────────
  if (verifyStatus === 'verifying') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '0 24px', textAlign: 'center', background: '#050505' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(195,244,0,0.3)', borderTopColor: '#c3f400', animation: 'spin 0.9s linear infinite', marginBottom: 24 }} />
        <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Verifying Payment...</h1>
        <p style={{ fontFamily: 'var(--font-inter, sans-serif)', color: '#666', fontSize: 13 }}>Please wait while we confirm your payment.</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Failed State ────────────────────────────────────
  if (verifyStatus === 'failed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '0 24px', textAlign: 'center', background: '#050505' }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#ef4444' }}>close</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>Payment Failed</h1>
        <p style={{ fontFamily: 'var(--font-inter, sans-serif)', color: '#888', marginBottom: 32, maxWidth: 300, lineHeight: 1.6, fontSize: 13 }}>
          We couldn&apos;t verify your payment. Please try again or contact support.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          <Link href="/checkout" style={{ display: 'block', padding: '16px', background: '#c3f400', color: '#000', fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 12, textAlign: 'center', textDecoration: 'none' }}>
            Try Again
          </Link>
          <Link href="/" style={{ display: 'block', padding: '16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#888', fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 12, textAlign: 'center', textDecoration: 'none' }}>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // ── Resolved Values ─────────────────────────────────
  const finalOrderId = orderData?.orderId || orderIdParam || referenceParam || 'ACR0000000';
  const paymentMethod = orderData?.paymentInfo?.method || (referenceParam ? 'Online Payment' : 'MoMo');
  const amountPaid = orderData?.total ?? 0;
  const transactionId = orderData?.paymentInfo?.paystackRef || referenceParam || orderData?.paymentInfo?.momoRef || '—';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GH', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'var(--font-inter, sans-serif)' }}>
      {/* ── Header ─────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 38,15 C 48,13 62,11 72,18 C 76,21 75,27 79,31 C 82,34 86,36 86,41 C 86,47 80,51 77,55 C 73,60 70,66 65,72 C 60,78 57,85 52,91 C 51,93 49,93 48,91 C 45,84 44,77 42,71 C 40,66 38,62 33,59 C 28,56 22,55 18,50 C 13,44 11,36 15,29 C 18,22 27,17 38,15 Z" stroke="#c3f400" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 33,40 L 39,46 L 68,46" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 39,46 L 43,62 L 63,62 L 68,46 Z" fill="rgba(212,175,55,0.12)" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="43" cy="74" r="4.5" fill="#D4AF37" />
            <circle cx="59" cy="74" r="4.5" fill="#D4AF37" />
            <circle cx="43" cy="74" r="1.5" fill="#000" />
            <circle cx="59" cy="74" r="1.5" fill="#000" />
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, fontSize: 17, lineHeight: 1 }}>
              <span style={{ color: '#c3f400' }}>Afri</span><span style={{ color: '#fff' }}>cart</span>
            </div>
            <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>Multi-vendor Marketplace</div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#c3f400' }}>shield</span>
          Secure Payment
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 16px 60px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* ── Hero Success Card ─────────────────────── */}
          <div style={{
            marginTop: 24,
            background: '#0d0f0b',
            border: '1px solid rgba(195,244,0,0.2)',
            borderRadius: 20,
            padding: '32px 20px 24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 40px rgba(195,244,0,0.06)',
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease',
          }}>
            <Confetti />

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SuccessCircle visible={showCheck} />
            </div>

            <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-lexend, sans-serif)', fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
              PAYMENT <span style={{ color: '#c3f400' }}>SUCCESSFUL!</span>
            </h1>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888', lineHeight: 1.55 }}>
              Your payment has been confirmed.<br />
              Thank you for shopping with <span style={{ color: '#c3f400', fontWeight: 700 }}>Africart</span>.
            </p>

            {/* Payment Completed Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.25)', borderRadius: 24, padding: '6px 16px', fontSize: 12, color: '#c3f400', fontWeight: 700, fontFamily: 'var(--font-lexend, sans-serif)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c3f400', flexShrink: 0, boxShadow: '0 0 6px #c3f400' }} />
              Payment Completed
            </div>
          </div>

          {/* ── Payment Summary Card ────────────────────── */}
          <div style={{
            marginTop: 14,
            background: '#0d0f0b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: '18px 18px',
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.1s',
          }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c3f400' }}>credit_card</span>
              <span style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: '#c3f400', textTransform: 'uppercase' }}>PAYMENT SUMMARY</span>
            </div>

            {/* Row: Order ID */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 13, color: '#888' }}>Order ID</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-lexend, sans-serif)' }}>#{String(finalOrderId).toUpperCase()}</span>
            </div>

            {/* Row: Payment Method */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 13, color: '#888' }}>Payment Method</span>
              <PaymentMethodIcon method={paymentMethod} />
            </div>

            {/* Row: Amount Paid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 13, color: '#888' }}>Amount Paid</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#c3f400', fontFamily: 'var(--font-lexend, sans-serif)' }}>
                GH₵ {amountPaid > 0 ? amountPaid.toFixed(2) : '—'}
              </span>
            </div>

            {/* Row: Transaction ID */}
            {transactionId && transactionId !== '—' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, color: '#888' }}>Transaction ID</span>
                <span style={{ fontSize: 12, color: '#ccc', fontFamily: 'monospace', maxWidth: '55%', textAlign: 'right', wordBreak: 'break-all' }}>{transactionId}</span>
              </div>
            )}

            {/* Row: Date & Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#888' }}>Date &amp; Time</span>
              <span style={{ fontSize: 13, color: '#ccc' }}>{dateStr} &nbsp;•&nbsp; {timeStr}</span>
            </div>
          </div>

          {/* ── What Happens Next Card ───────────────────── */}
          <div style={{
            marginTop: 14,
            background: '#0d0f0b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: '18px 18px',
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.18s',
          }}>
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c3f400' }}>local_shipping</span>
              <span style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: '#c3f400', textTransform: 'uppercase' }}>WHAT HAPPENS NEXT?</span>
            </div>

            {/* Steps */}
            {[
              { icon: 'receipt_long', title: 'Order Received', desc: "We've received your order and it's being processed." },
              { icon: 'inventory_2', title: 'Preparing Order', desc: 'Your items will be packed and prepared for delivery.' },
              { icon: 'two_wheeler', title: 'Out for Delivery', desc: 'Your rider will deliver your order to you.' },
            ].map((step, idx, arr) => (
              <div key={step.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Icon + vertical line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 36 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(195,244,0,0.1)', border: '1px solid rgba(195,244,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c3f400' }}>{step.icon}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div style={{ width: 1, height: 28, background: 'rgba(195,244,0,0.15)', margin: '4px 0' }} />
                  )}
                </div>
                {/* Text */}
                <div style={{ paddingTop: 6, paddingBottom: idx < arr.length - 1 ? 0 : 0 }}>
                  <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.45, marginBottom: idx < arr.length - 1 ? 0 : 0 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Action Buttons ──────────────────────────── */}
          <div style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.24s',
          }}>
            <Link href="/shop" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px', background: '#c3f400', color: '#000',
              fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, fontSize: 13,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              borderRadius: 14, textDecoration: 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shopping_bag</span>
              CONTINUE SHOPPING
            </Link>

            <Link href="/account/orders" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '15px', background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.18)', color: '#fff',
              fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 800, fontSize: 13,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              borderRadius: 14, textDecoration: 'none',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>list_alt</span>
              VIEW MY ORDERS
            </Link>
          </div>

          {/* ── Need Help Banner ─────────────────────────── */}
          <div style={{
            marginTop: 14,
            background: '#0d0f0b',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            opacity: showContent ? 1 : 0,
            transform: showContent ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.5s ease 0.3s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(195,244,0,0.1)', border: '1px solid rgba(195,244,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c3f400' }}>headset_mic</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-lexend, sans-serif)' }}>Need Help?</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Our support team is here for you.</div>
              </div>
            </div>
            <Link href="/chat" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '8px 12px', background: 'rgba(195,244,0,0.08)',
              border: '1px solid rgba(195,244,0,0.3)',
              borderRadius: 8, color: '#c3f400',
              fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 800, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              CONTACT SUPPORT
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chevron_right</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Page Export ───────────────────────────────────── */
export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050505' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(195,244,0,0.3)', borderTopColor: '#c3f400', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
