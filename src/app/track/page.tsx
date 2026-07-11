'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const STEPS = [
  { key: 'Pending',    label: 'Order Placed',        icon: 'receipt_long',     desc: 'We have received your order.' },
  { key: 'Processing', label: 'Processing',           icon: 'inventory_2',      desc: 'The vendor is preparing your items.' },
  { key: 'Shipped',    label: 'Shipped',              icon: 'local_shipping',   desc: 'Your order is on the way.' },
  { key: 'Delivered',  label: 'Delivered',            icon: 'check_circle',     desc: 'Your order has been delivered.' },
];

const CANCELLED = { key: 'Cancelled', label: 'Cancelled', icon: 'cancel', desc: 'This order was cancelled.' };

function getStepIndex(status: string) {
  const idx = STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function relTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(
        `/api/orders?orderId=${encodeURIComponent(orderId.trim())}&email=${encodeURIComponent(email.trim().toLowerCase())}`
      );
      const data = await res.json();

      if (res.ok && data.order) {
        setResult(data.order);
      } else {
        setError(data.error || 'Order not found. Please check your Order ID and email address.');
      }
    } catch {
      setError('Unable to look up order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    if (result?.id || result?.orderId) {
      navigator.clipboard?.writeText(result.id || result.orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const isCancelled = result?.status === 'Cancelled';
  const currentStep = result ? (isCancelled ? -1 : getStepIndex(result.status)) : -1;
  const displayId = result ? (result.orderId || result.id || '') : '';
  const totalAmount = result ? (result.total || result.totalAmount || result.products?.reduce((s: number, p: any) => s + (p.price * (p.quantity || 1)), 0) || 0) : 0;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 80px', minHeight: '100vh' }}>

      {/* Page Header */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, var(--lime-400)22, var(--lime-400)11)', border: '1px solid var(--lime-400)33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--lime-400)' }}>local_shipping</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--foreground)', marginBottom: 8, letterSpacing: '-0.02em' }}>
          TRACK ORDER
        </h1>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
          Enter your Order ID and email to see real-time status
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { label: 'Order ID', value: orderId, setter: setOrderId, placeholder: 'e.g. ORD-1234567890', type: 'text', icon: 'receipt_long' },
          { label: 'Email Address', value: email, setter: setEmail, placeholder: 'you@example.com', type: 'email', icon: 'mail' },
        ].map(f => (
          <div key={f.label}>
            <label style={{ display: 'block', fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{f.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 12, padding: '0 14px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)', flexShrink: 0 }}>{f.icon}</span>
              <input
                required
                type={f.type}
                value={f.value}
                onChange={e => f.setter(e.target.value)}
                placeholder={f.placeholder}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--foreground)', padding: '13px 0', fontSize: 14, fontFamily: 'var(--font-inter)' }}
              />
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px', borderRadius: 12, border: 'none',
            background: loading ? 'var(--surface-container-high)' : 'var(--lime-400)',
            color: loading ? 'var(--on-surface-variant)' : '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 14,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span> Searching...</>
          ) : (
            <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span> Track My Order</>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="animate-fade-in" style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--error)', flexShrink: 0 }}>error</span>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--error)' }}>{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="animate-fade-in-up" style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status Header Card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '20px', position: 'relative', overflow: 'hidden' }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: isCancelled ? 'rgba(255,68,68,0.06)' : 'rgba(0,229,255,0.07)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Order Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: isCancelled ? 'var(--error)' : 'var(--lime-400)', animation: isCancelled ? 'none' : 'flashDotPulse 1.5s ease-in-out infinite' }} />
                  <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, color: isCancelled ? 'var(--error)' : 'var(--lime-400)', letterSpacing: '-0.01em', margin: 0 }}>
                    {result.status?.toUpperCase()}
                  </h2>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Total</p>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, color: 'var(--foreground)' }}>GH₵{totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Order ID row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '8px 12px', background: 'var(--surface-container)', borderRadius: 10, position: 'relative', zIndex: 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>tag</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--foreground)', flex: 1 }}>{displayId}</span>
              <button
                onClick={handleCopyId}
                aria-label="Copy order ID"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: copied ? 'var(--lime-400)' : 'var(--on-surface-variant)', transition: 'color 0.2s' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{copied ? 'check' : 'content_copy'}</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700 }}>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step Timeline */}
          {!isCancelled ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '24px 20px' }}>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Shipment Progress</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {STEPS.map((step, i) => {
                  const isDone = i <= currentStep;
                  const isActive = i === currentStep;
                  const isLast = i === STEPS.length - 1;
                  return (
                    <div key={step.key} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                      {/* Connector line */}
                      {!isLast && (
                        <div style={{
                          position: 'absolute', left: 17, top: 36, width: 2, height: 'calc(100% - 8px)',
                          background: isDone && i < currentStep ? 'var(--lime-400)' : 'var(--outline)',
                          transition: 'background 0.5s ease',
                        }} />
                      )}

                      {/* Icon circle */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: isDone ? 'var(--lime-400)' : 'var(--surface-container)',
                        border: isDone ? '2px solid var(--lime-400)' : '2px solid var(--outline)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isActive ? '0 0 16px rgba(0,229,255,0.35)' : 'none',
                        transition: 'all 0.4s ease',
                        zIndex: 1,
                        animation: isActive ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: isDone ? '#000' : 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                      </div>

                      {/* Text */}
                      <div style={{ paddingBottom: isLast ? 0 : 28, paddingTop: 4 }}>
                        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: isActive ? 900 : 700, color: isDone ? 'var(--foreground)' : 'var(--on-surface-variant)', marginBottom: 2 }}>
                          {step.label}
                          {isActive && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--lime-400)', marginLeft: 8, background: 'rgba(0,229,255,0.12)', padding: '2px 6px', borderRadius: 10 }}>CURRENT</span>}
                        </p>
                        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>{step.desc}</p>
                        {isDone && result.date && i === 0 && (
                          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--lime-400)', marginTop: 4, fontWeight: 600 }}>{relTime(result.date)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: 20, padding: '20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--error)', flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>{CANCELLED.icon}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 900, color: 'var(--error)', marginBottom: 4 }}>{CANCELLED.label}</p>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)' }}>{CANCELLED.desc}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          {result.products && result.products.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '20px' }}>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Order Items ({result.products.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.products.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-container)', flexShrink: 0 }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{p.name}</p>
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                        Qty: {p.quantity || 1}{p.size ? ` · Size: ${p.size}` : ''}
                      </p>
                    </div>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--lime-400)', flexShrink: 0 }}>
                      GH₵{(p.price * (p.quantity || 1)).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {(result.address || result.city) && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)', flexShrink: 0, marginTop: 2 }}>location_on</span>
              <div>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Shipping To</p>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5 }}>
                  {[result.fullName || result.customerName, result.address, result.city, result.region].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Link href="/shop" style={{ flex: 1, padding: '13px', borderRadius: 12, border: '1px solid var(--outline)', background: 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shopping_bag</span>
              Continue Shopping
            </Link>
            <Link href="/account" style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
              My Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
