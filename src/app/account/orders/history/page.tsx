'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

const STATUS_BADGES: Record<string, { bg: string; color: string }> = {
  Processing: { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706' },
  Ongoing:    { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706' },
  Pending:    { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706' },
  Shipped:    { bg: 'rgba(37, 99, 235, 0.15)',  color: '#2563EB' },
  Delivered:  { bg: 'rgba(22, 163, 74, 0.15)',  color: '#16A34A' },
  'Picked Up':{ bg: 'rgba(147, 51, 234, 0.15)', color: '#9333EA' },
  Cancelled:  { bg: 'rgba(220, 38, 38, 0.15)',  color: '#DC2626' },
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }

    setIsFetching(true);
    fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.orders)) {
          const mapped = data.orders.map((o: any) => ({
            ...o,
            id: o.orderId || o._id,
            status: (o.status === 'Pending' || o.status === 'Ongoing') ? 'Processing' : o.status,
            dateFormatted: new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            itemCount: o.itemsCount || o.products?.length || 1,
            totalPrice: o.total ?? o.grandTotal ?? 0
          }));
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch order history:', err);
        setOrders([]);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: 100
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-lexend, system-ui, -apple-system, sans-serif)',
        color: 'var(--foreground)'
      }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} aria-label="Go back" style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>chevron_left</span>
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Order History</h1>
          </div>
          <button aria-label="Filter" style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>tune</span>
          </button>
        </div>

        {/* Content */}
        {isFetching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--outline)',
                  borderRadius: 16, padding: '16px 14px', color: 'var(--on-surface-variant)', fontSize: 13
                }}
              >
                Loading order history...
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--outline)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            marginTop: 12
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 54, color: 'var(--on-surface-variant)', opacity: 0.6, marginBottom: 12 }}>
              history
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--foreground)' }}>
              No order history
            </h3>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Your completed and past order history will appear here.
            </p>
            <Link
              href="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 12,
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              Start Shopping
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {orders.map((order, idx) => {
              const badge = STATUS_BADGES[order.status] || STATUS_BADGES.Processing;
              const img = order.products?.[0]?.image || order.items?.[0]?.image;

              return (
                <div
                  key={order.id || idx}
                  onClick={() => router.push(`/account/orders/${order.id}`)}
                  className="animate-fade-in-up"
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--outline)',
                    borderRadius: 16, padding: '12px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12
                  }}
                >
                  {/* Product Thumbnail */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
                    background: 'var(--surface-container-high, rgba(0,0,0,0.04))', border: '1px solid var(--outline)', flexShrink: 0
                  }}>
                    {img ? (
                      <img src={img} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>inventory_2</span>
                      </div>
                    )}
                  </div>

                  {/* Order Detail Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 2px 0' }}>
                      #{order.id}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', margin: '0 0 2px 0' }}>
                      {order.dateFormatted}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                      <span style={{ fontWeight: 400, color: 'var(--on-surface-variant)' }}>{order.itemCount} {order.itemCount === 1 ? 'Item' : 'Items'}</span> · GHS {Number(order.totalPrice).toFixed(2)}
                    </p>
                  </div>

                  {/* Status Badge & Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                      fontFamily: 'var(--font-lexend)', background: badge.bg, color: badge.color
                    }}>
                      {order.status}
                    </span>
                    <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 18 }}>chevron_right</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

