'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [showCheck, setShowCheck] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [orderData, setOrderData] = useState<any>(null);

  const orderIdParam = searchParams.get('orderId');
  const referenceParam = searchParams.get('reference') || searchParams.get('trxref');
  const verifiedParam = searchParams.get('verified') === 'true';

  // Handle Paystack redirect callback (when user is redirected back from hosted checkout)
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
            // Save the pending order if we have one from checkout redirect
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
    } else {
      setVerifyStatus('verified');
    }
  }, [searchParams, referenceParam, verifiedParam]);

  // Load order data from local storage or API
  useEffect(() => {
    // 1. Try local storage first
    try {
      const pending = localStorage.getItem('africart-pending-order');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed.orderId === orderIdParam || parsed.orderId === referenceParam) {
          setOrderData(parsed);
        }
      }
    } catch {}

    // 2. Fetch from DB
    const lookupId = orderIdParam || referenceParam;
    if (lookupId) {
      fetch(`/api/orders/${lookupId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.order) {
            setOrderData(data.order);
            // If we found it in DB and details exist, clear localStorage since checkout is complete
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

  const finalOrderId = orderData?.orderId || orderIdParam || referenceParam || 'ORD-Recurrent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh', padding: '40px 16px', paddingBottom: 120 }}>
      {/* Animated Check */}
      <div className={showCheck ? 'animate-bounce-in' : ''} style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, opacity: showCheck ? 1 : 0,
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="48"
            style={{
              strokeDashoffset: showCheck ? 0 : 48,
              transition: 'stroke-dashoffset 0.6s ease 0.3s',
            }}
          />
        </svg>
      </div>

      <div style={{ opacity: showContent ? 1 : 0, transform: showContent ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease', width: '100%', maxWidth: 480, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8, textTransform: 'uppercase' }}>Order Confirmed!</h1>
        <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--on-surface-variant)', marginBottom: 28, fontSize: 13, lineHeight: 1.6 }}>
          Thank you for your purchase. Your activewear is on its way.
        </p>

        {/* Order Details Card */}
        <div style={{ background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 16, padding: 20, textAlign: 'left', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--outline)' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Order Number</p>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: '#fff' }}>#{finalOrderId}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Status</p>
              <span style={{
                fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700,
                color: 'var(--lime-400)', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'rgba(195,244,0,0.08)', padding: '4px 10px', borderRadius: 6,
              }}>
                Payment Verified
              </span>
            </div>
          </div>

          {/* Delivery Recap */}
          {orderData?.shippingAddress && (
            <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--outline)' }}>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Delivery Address</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{orderData.shippingAddress.fullName}</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                {orderData.shippingAddress.address}, {orderData.shippingAddress.city}, {orderData.shippingAddress.region}
              </p>
              <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4 }}>Phone: {orderData.shippingAddress.phone}</p>
            </div>
          )}

          {/* Items Recap */}
          {orderData?.products && orderData.products.length > 0 && (
            <div style={{ paddingBottom: 12, borderBottom: '1px solid var(--outline)' }}>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Items Ordered</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orderData.products.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-container-high)', flexShrink: 0 }}>
                        <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} src={item.image} />
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Qty: {item.quantity}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</p>
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: '#fff' }}>GH₵{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method / Summary */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Payment Method</span>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>
                {orderData?.paymentInfo?.method || 'Paystack'} 
                {orderData?.paymentInfo?.network ? ` (${orderData.paymentInfo.network})` : ''}
              </span>
            </div>
            {referenceParam && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Transaction Ref</span>
                <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontFamily: 'monospace' }}>{referenceParam}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: '#fff' }}>Total Paid</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: 'var(--lime-400)' }}>
                GH₵{orderData?.total ? orderData.total.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <Link href="/shop" style={{
            display: 'block', padding: '16px', background: 'var(--lime-400)', color: 'var(--on-lime-400)',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10, textAlign: 'center',
            transition: 'opacity 0.2s',
          }}>
            Continue Shopping
          </Link>
          <Link href="/" style={{
            display: 'block', padding: '16px', background: 'transparent',
            border: '1px solid var(--outline)', color: 'var(--on-surface-variant)',
            fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13,
            textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10, textAlign: 'center',
            transition: 'all 0.2s',
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
