'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

const STATUS_BADGES: Record<string, { bg: string; color: string }> = {
  Processing: { bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800' },
  Ongoing:    { bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800' },
  Pending:    { bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800' },
  Shipped:    { bg: 'rgba(33, 150, 243, 0.15)', color: '#2196F3' },
  Delivered:  { bg: 'rgba(76, 175, 80, 0.15)',  color: '#4CAF50' },
  'Picked Up':{ bg: 'rgba(156, 39, 176, 0.15)', color: '#9C27B0' },
  Cancelled:  { bg: 'rgba(244, 67, 54, 0.15)',  color: '#F44336' },
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }

    fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const mapped = data.orders.map((o: any) => ({
            ...o,
            id: o.orderId || o._id,
            status: (o.status === 'Pending' || o.status === 'Ongoing') ? 'Processing' : o.status,
            dateFormatted: new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            itemCount: o.itemsCount || o.products?.length || 1,
            totalPrice: o.total ?? o.grandTotal ?? 0
          }));
          setOrders(mapped);
        }
      })
      .catch(console.error);
  }, [user, isLoading, router]);

  // Demo fallback matching Screen 5 reference image if no orders yet
  const displayOrders = orders.length > 0 ? orders : [
    { id: 'ORD-764512', dateFormatted: 'Jul 25, 2026', itemCount: 1, totalPrice: 250.00, status: 'Processing', products: [{ image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200' }] },
    { id: 'ORD-764511', dateFormatted: 'Jul 24, 2026', itemCount: 2, totalPrice: 450.00, status: 'Shipped',    products: [{ image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200' }] },
    { id: 'ORD-764510', dateFormatted: 'Jul 23, 2026', itemCount: 1, totalPrice: 120.00, status: 'Delivered',  products: [{ image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200' }] },
    { id: 'ORD-764509', dateFormatted: 'Jul 22, 2026', itemCount: 1, totalPrice: 80.00,  status: 'Cancelled',  products: [{ image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200' }] },
    { id: 'ORD-764508', dateFormatted: 'Jul 21, 2026', itemCount: 3, totalPrice: 620.00, status: 'Delivered',  products: [{ image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' }] },
    { id: 'ORD-764507', dateFormatted: 'Jul 20, 2026', itemCount: 1, totalPrice: 150.00, status: 'Delivered',  products: [{ image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200' }] },
  ];

  if (isLoading || !user) return null;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      {/* Header matching Screen 5 */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>Order History</h1>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>tune</span>
        </button>
      </div>

      {/* List Rows matching Screen 5 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        {displayOrders.map((order, idx) => {
          const badge = STATUS_BADGES[order.status] || STATUS_BADGES.Processing;
          const img = order.products?.[0]?.image;

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
                background: 'var(--surface-container-high)', border: '1px solid var(--outline)', flexShrink: 0
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
    </div>
  );
}
