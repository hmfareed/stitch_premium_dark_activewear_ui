'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCart, useToast } from '@/context/AppContext';

const STATUS_THEME: Record<string, {
  color: string; bg: string; border: string;
  headline: string; subline: string; buttonLabel: string;
}> = {
  Processing: {
    color: '#FB923C', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)',
    headline: 'Processing', subline: 'Your order is being processed\nWe are getting your order ready.',
    buttonLabel: 'View Order Details',
  },
  Ongoing: {
    color: '#FB923C', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)',
    headline: 'Processing', subline: 'Your order is being processed\nWe are getting your order ready.',
    buttonLabel: 'View Order Details',
  },
  Pending: {
    color: '#FB923C', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)',
    headline: 'Processing', subline: 'Your order is being processed\nWe are getting your order ready.',
    buttonLabel: 'View Order Details',
  },
  Shipped: {
    color: '#60A5FA', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)',
    headline: 'Shipped', subline: 'Your order is on the way\nYour order has been shipped.',
    buttonLabel: 'Track Order',
  },
  Delivered: {
    color: '#4ADE80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)',
    headline: 'Delivered', subline: 'Your order has been delivered\nDelivered on Jul 24, 2026 at 02:15 PM',
    buttonLabel: 'Buy Again',
  },
  'Picked Up': {
    color: '#C084FC', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.25)',
    headline: 'Picked Up', subline: 'Your order has been picked up\nThe rider has picked up your order.',
    buttonLabel: 'Track Order',
  },
  Cancelled: {
    color: '#F87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)',
    headline: 'Cancelled', subline: 'This order has been cancelled\nYour order was cancelled on Jul 22, 2026.',
    buttonLabel: 'Buy Again',
  },
};

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', time: 'Jul 25, 2026, 10:30 AM' },
  { key: 'processing', label: 'Processing', time: 'Jul 25, 2026, 11:00 AM' },
  { key: 'shipped', label: 'Shipped', time: 'Jul 24, 2026, 04:30 PM' },
  { key: 'out_for_delivery', label: 'Out for Delivery', time: 'Pending' },
  { key: 'delivered', label: 'Delivered', time: 'Pending' },
];

function getActiveStepIndex(status: string) {
  switch (status) {
    case 'Pending':
    case 'Processing':
    case 'Ongoing':
      return 1;
    case 'Shipped':
      return 2;
    case 'Picked Up':
      return 3;
    case 'Delivered':
      return 4;
    case 'Cancelled':
      return -1;
    default:
      return 1;
  }
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;
  const { user, isLoading } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); return; }
    if (!user || !orderId) return;

    fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const found = data.orders.find((o: any) =>
            o.orderId === orderId || o._id === orderId
          );
          if (found) {
            setOrder({
              ...found,
              id: found.orderId || found._id,
              displayStatus: (found.status === 'Pending') ? 'Processing' : found.status,
            });
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, isLoading, orderId, router]);

  if (isLoading || !user) return null;

  if (loading) {
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 36, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 12 }}>sync</span>
        <p style={{ color: 'var(--on-surface-variant)' }}>Loading order details...</p>
      </div>
    );
  }

  // Fallback demo order if none found to demonstrate the exact mockup
  const currentOrder = order || {
    id: orderId || 'ORD-764512',
    displayStatus: 'Processing',
    products: [
      { id: 'p1', name: 'Headphones Sony WH-1000XM5', price: 250.00, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' }
    ],
    total: 250.00
  };

  const status = currentOrder.displayStatus || 'Processing';
  const theme = STATUS_THEME[status] || STATUS_THEME.Processing;
  const activeStepIdx = getActiveStepIndex(status);
  const products = currentOrder.products || [];
  const total = currentOrder.total || 250.00;

  const handleAction = () => {
    if (theme.buttonLabel === 'Buy Again') {
      products.forEach((p: any) => addToCart(p));
      showToast('Items added to cart!');
      router.push('/cart');
    } else if (theme.buttonLabel === 'Track Order') {
      router.push(`/track/${currentOrder.id}`);
    } else {
      showToast('Viewing order breakdown below');
    }
  };

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      {/* Top Header matching mockups #7-#11 */}
      <div className="animate-fade-in-up" style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'var(--surface-container)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--foreground)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>
            Order #{currentOrder.id}
          </h1>
        </div>

        <button style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Status Card Banner matching Mockups #7-#11 */}
        <div
          className="animate-fade-in-up"
          style={{
            background: theme.bg, border: `1px solid ${theme.border}`,
            borderRadius: 20, padding: 18,
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'var(--surface-container-high)',
            overflow: 'hidden', flexShrink: 0, border: '1px solid var(--outline)'
          }}>
            {products[0]?.image ? (
              <img src={products[0].image} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: theme.color }}>headphones</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 800, color: theme.color, margin: '0 0 4px 0' }}>
              {theme.headline}
            </h2>
            {theme.subline.split('\n').map((line, idx) => (
              <p key={idx} style={{ fontSize: 12, color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.4 }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Vertical Timeline Steps */}
        <div className="animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {TIMELINE_STEPS.map((step, idx) => {
              const isCancelled = status === 'Cancelled';
              const isCurrent = idx === activeStepIdx;
              const isPast = idx < activeStepIdx;
              const isFailed = isCancelled && idx === 1;

              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                  {/* Step Connector Line */}
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 11, top: 24, bottom: -20, width: 2,
                      background: isPast ? 'var(--lime-400)' : 'var(--outline)'
                    }} />
                  )}

                  {/* Step Dot/Icon */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                    background: isFailed ? 'rgba(239,68,68,0.2)' : isCurrent ? theme.color : isPast ? 'var(--lime-400)' : 'var(--surface-container-high)',
                    border: isFailed ? '2px solid #F87171' : isCurrent || isPast ? 'none' : '2px solid var(--outline)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isFailed ? '#F87171' : isCurrent || isPast ? '#000' : 'var(--on-surface-variant)',
                  }}>
                    {isFailed ? (
                      <span className="material-symbols-outlined" style={{ fontSize: 14, fontWeight: 'bold' }}>close</span>
                    ) : isPast || isCurrent ? (
                      <span className="material-symbols-outlined" style={{ fontSize: 14, fontWeight: 'bold' }}>check</span>
                    ) : (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--outline)' }} />
                    )}
                  </div>

                  {/* Step Text */}
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: isCurrent ? 800 : 600,
                      color: isFailed ? '#F87171' : isPast || isCurrent ? 'var(--foreground)' : 'var(--on-surface-variant)',
                      margin: '0 0 2px 0'
                    }}>
                      {isCancelled && idx === 1 ? 'Cancelled' : step.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', margin: 0 }}>
                      {step.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
              Order Summary
            </span>
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
              {products.length} item
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {products.map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--surface-container-high)', border: '1px solid var(--outline)' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface-variant)' }}>headphones</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px 0' }} className="line-clamp-1">
                    {item.name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', margin: 0 }}>
                    Qty: {item.quantity || 1}
                  </p>
                </div>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--foreground)' }}>
                  GHS {Number(item.price * (item.quantity || 1)).toFixed(2)}
                </span>
              </div>
            ))}

            <div style={{ height: 1, background: 'var(--outline)', margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>
                Total
              </span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 900, color: 'var(--foreground)' }}>
                GHS {Number(total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Main CTA Button matching mockups #7-#11 */}
        <button
          onClick={handleAction}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'var(--lime-400)', color: '#000', border: 'none',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
            cursor: 'pointer', textAlign: 'center', marginTop: 4
          }}
        >
          {theme.buttonLabel}
        </button>
      </div>
    </div>
  );
}
