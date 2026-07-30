'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast, useCart } from '@/context/AppContext';

interface SubOrder {
  _id: string;
  subOrderId: string;
  orderId: string;
  vendorStoreName: string;
  fulfillmentMethod: 'home_delivery' | 'self_pickup';
  status: string;
  items: Array<{ name: string; price: number; quantity: number; image: string }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  pickupOtp?: string;
  deliveryOtp?: string;
  deliveredAt?: string;
  timeline: Array<{ status: string; description: string; timestamp: string }>;
}

export default function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  const fetchTrackingData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-orders?orderId=${orderId}`);
      const data = await res.json();
      if (data.success && data.subOrders?.length > 0) {
        setSubOrders(data.subOrders);
      } else {
        // Mock default order for preview if no DB sub-orders exist yet
        setSubOrders([
          {
            _id: 'sub-1',
            subOrderId: `SUB-${orderId}-1`,
            orderId: orderId,
            vendorStoreName: 'AfriCart Official Store',
            fulfillmentMethod: 'home_delivery',
            status: 'vendor_processing',
            items: [
              { name: 'Headphones Sony WH-1000XM5', price: 250.00, quantity: 1, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' }
            ],
            subtotal: 250.00,
            deliveryFee: 15.00,
            total: 265.00,
            timeline: [
              { status: 'Order Placed', description: 'Order placed successfully', timestamp: 'Jul 25, 2026, 10:30 AM' },
              { status: 'Processing', description: 'We are getting your order ready', timestamp: 'Jul 25, 2026, 11:00 AM' }
            ]
          }
        ]);
      }
    } catch (err) {
      showToast('Error fetching tracking info', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBanner = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('cancel')) {
      return {
        title: 'Cancelled',
        message: 'This order has been cancelled. Your order was cancelled.',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#ef4444',
        btnText: 'Buy Again',
        btnAction: 'buy_again'
      };
    }
    if (s.includes('deliver') || s.includes('complete')) {
      return {
        title: 'Delivered',
        message: 'Your order has been delivered. Thank you for shopping with AfriCart!',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        color: '#10b981',
        btnText: 'Buy Again',
        btnAction: 'buy_again'
      };
    }
    if (s.includes('picked') || s.includes('collected')) {
      return {
        title: 'Picked Up',
        message: 'Your order has been picked up. The rider has picked up your order.',
        bg: 'rgba(168, 85, 247, 0.12)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        color: '#a855f7',
        btnText: 'Track Order',
        btnAction: 'track'
      };
    }
    if (s.includes('ship') || s.includes('out_for_delivery')) {
      return {
        title: 'Shipped',
        message: 'Your order is on the way. Your order has been shipped.',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#3b82f6',
        btnText: 'Track Order',
        btnAction: 'track'
      };
    }
    // Default Processing
    return {
      title: 'Processing',
      message: 'Your order is being processed. We are getting your order ready.',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      color: '#f59e0b',
      btnText: 'View Order Details',
      btnAction: 'details'
    };
  };

  return (
    <div style={{ padding: '0 16px', paddingBottom: 60, maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>Order #{orderId}</h1>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32, color: 'var(--lime-400)' }}>refresh</span>
          <p style={{ marginTop: 8, fontSize: 13 }}>Loading tracking info...</p>
        </div>
      ) : (
        subOrders.map(subOrder => {
          const banner = getStatusBanner(subOrder.status);
          return (
            <div key={subOrder._id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status Banner Card matching Screens 7-11 in mockup */}
              <div className="animate-fade-in-up" style={{
                background: banner.bg, border: banner.border, borderRadius: 20, padding: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: banner.color }} />
                  <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: banner.color, margin: 0 }}>
                    {banner.title}
                  </h2>
                </div>
                <p style={{ color: 'var(--foreground)', fontSize: 13, lineHeight: 1.4, margin: '0 0 16px 0', opacity: 0.9 }}>
                  {banner.message}
                </p>

                <button
                  onClick={() => {
                    if (banner.btnAction === 'buy_again') {
                      subOrder.items.forEach(i => addToCart({ id: i.name, name: i.name, price: i.price, image: i.image } as any));
                      showToast('Added items to cart!');
                      router.push('/cart');
                    } else {
                      showToast('Live tracking updated!');
                    }
                  }}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    background: banner.color, color: '#ffffff', fontFamily: 'var(--font-lexend)',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 14px ${banner.color}40`
                  }}
                >
                  {banner.btnText}
                </button>
              </div>

              {/* Timeline Steps Card */}
              <div className="animate-fade-in-up stagger-1" style={{
                background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: 20
              }}>
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>
                  Delivery Progress
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
                  {[
                    { label: 'Order Placed', time: 'Jul 25, 2026, 10:30 AM', done: true },
                    { label: 'Processing', time: 'Jul 25, 2026, 11:00 AM', done: true },
                    { label: 'Shipped', time: 'Pending', done: banner.title === 'Shipped' || banner.title === 'Delivered' || banner.title === 'Picked Up' },
                    { label: 'Out for Delivery', time: 'Pending', done: banner.title === 'Delivered' || banner.title === 'Picked Up' },
                    { label: 'Delivered', time: 'Pending', done: banner.title === 'Delivered' }
                  ].map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: step.done ? 'var(--lime-400)' : 'var(--surface-container-high)',
                        border: step.done ? 'none' : '2px solid var(--outline)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {step.done ? (
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#000', fontWeight: 900 }}>check</span>
                        ) : (
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--on-surface-variant)' }} />
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: step.done ? 'var(--foreground)' : 'var(--on-surface-variant)', margin: 0 }}>
                          {step.label}
                        </h4>
                        <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', margin: '2px 0 0 0' }}>
                          {step.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="animate-fade-in-up stagger-2" style={{
                background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: 20
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Order Summary</h3>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{subOrder.items.length} item</span>
                </div>

                {subOrder.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 10, borderTop: idx > 0 ? '1px solid var(--outline)' : 'none' }}>
                    <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', background: 'var(--surface-container)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', margin: 0 }} className="line-clamp-1">{item.name}</h4>
                      <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', margin: '2px 0 0 0' }}>Qty: {item.quantity}</p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--foreground)' }}>
                      GHS {item.price.toFixed(2)}
                    </span>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--outline)' }}>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: 'var(--lime-400)' }}>
                    GHS {subOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
