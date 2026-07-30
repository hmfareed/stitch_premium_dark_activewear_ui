'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

const STATUS_PILLS: Record<string, { bg: string; color: string; label: string }> = {
  Processing: { bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', label: 'Processing' },
  Ongoing:    { bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', label: 'Processing' },
  Pending:    { bg: 'rgba(255, 152, 0, 0.15)', color: '#FF9800', label: 'Processing' },
  Shipped:    { bg: 'rgba(33, 150, 243, 0.15)', color: '#2196F3', label: 'Shipped' },
  Delivered:  { bg: 'rgba(76, 175, 80, 0.15)',  color: '#4CAF50', label: 'Delivered' },
  'Picked Up':{ bg: 'rgba(156, 39, 176, 0.15)', color: '#9C27B0', label: 'Picked Up' },
  Cancelled:  { bg: 'rgba(244, 67, 54, 0.15)',  color: '#F44336', label: 'Cancelled' },
};

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');

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

  // Demo fallback matching Screen 3 exactly if no orders yet
  const displayOrders = orders.length > 0 ? orders : [
    {
      id: 'ORD-764512',
      status: 'Processing',
      dateFormatted: 'Jul 25, 2026',
      itemCount: 1,
      totalPrice: 250.00,
      subtext: 'Your order is being processed',
      products: [{ image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200', name: 'Headphones Sony WH-1000XM5' }]
    },
    {
      id: 'ORD-764511',
      status: 'Shipped',
      dateFormatted: 'Jul 24, 2026',
      itemCount: 2,
      totalPrice: 450.00,
      subtext: 'Your order is on the way',
      products: [{ image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200', name: 'Sneakers' }]
    },
    {
      id: 'ORD-764510',
      status: 'Delivered',
      dateFormatted: 'Jul 23, 2026',
      itemCount: 1,
      totalPrice: 120.00,
      subtext: 'Delivered on Jul 24, 2026',
      products: [{ image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200', name: 'Watch' }]
    },
    {
      id: 'ORD-764509',
      status: 'Cancelled',
      dateFormatted: 'Jul 22, 2026',
      itemCount: 1,
      totalPrice: 80.00,
      subtext: 'This order was cancelled',
      products: [{ image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200', name: 'Handbag' }]
    }
  ];

  const filtered = displayOrders.filter(o => {
    if (activeTab === 'All') return true;
    return o.status === activeTab;
  });

  if (isLoading || !user) return null;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      {/* Header matching Screen 3 */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>My Orders</h1>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>search</span>
        </button>
      </div>

      {/* Filter Tabs matching Screen 3 */}
      <div className="no-scrollbar animate-fade-in-up" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
        {(['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-lexend)', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: isActive ? '#6366F1' : 'var(--surface-container-high)',
                color: isActive ? '#ffffff' : 'var(--on-surface-variant)',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Orders List Cards matching Screen 3 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.map((order, i) => {
          const pill = STATUS_PILLS[order.status] || STATUS_PILLS.Processing;
          const firstImg = order.products?.[0]?.image;

          return (
            <div
              key={order.id || i}
              onClick={() => router.push(`/account/orders/${order.id}`)}
              className={`animate-fade-in-up stagger-${(i % 5) + 1}`}
              style={{
                background: 'var(--surface)', border: '1px solid var(--outline)',
                borderRadius: 16, padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14
              }}
            >
              {/* Header Row: Order ID + Date on Left, Status Pill on Right */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                    Order #{order.id}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2, display: 'block' }}>
                    {order.dateFormatted}
                  </span>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 14, fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--font-lexend)', background: pill.bg, color: pill.color
                }}>
                  {pill.label}
                </span>
              </div>

              {/* Item Info Row: Thumb on left, Info in center, Chevron on right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 12, overflow: 'hidden',
                  background: 'var(--surface-container-high)', border: '1px solid var(--outline)', flexShrink: 0
                }}>
                  {firstImg ? (
                    <img src={firstImg} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>inventory_2</span>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', margin: '0 0 2px 0' }}>
                    <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{order.itemCount} {order.itemCount === 1 ? 'Item' : 'Items'}</span> · GHS {Number(order.totalPrice).toFixed(2)}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', margin: 0, opacity: 0.8 }} className="line-clamp-1">
                    {order.subtext || (
                      order.status === 'Processing' ? 'Your order is being processed' :
                      order.status === 'Shipped' ? 'Your order is on the way' :
                      order.status === 'Delivered' ? `Delivered on ${order.dateFormatted}` :
                      order.status === 'Cancelled' ? 'This order was cancelled' : 'Order details'
                    )}
                  </p>
                </div>

                <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>chevron_right</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
