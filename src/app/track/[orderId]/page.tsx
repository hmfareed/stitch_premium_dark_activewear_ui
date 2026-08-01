'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast, useCart } from '@/context/AppContext';

interface SubOrderItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
}

interface SubOrder {
  _id: string;
  subOrderId: string;
  orderId: string;
  vendorStoreName?: string;
  fulfillmentMethod?: 'home_delivery' | 'self_pickup';
  status: string;
  items: SubOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  pickupOtp?: string;
  deliveryOtp?: string;
  deliveredAt?: string;
  timeline?: Array<{ status: string; description: string; timestamp: string }>;
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
      const [subRes, orderRes] = await Promise.all([
        fetch(`/api/sub-orders?orderId=${encodeURIComponent(orderId)}`),
        fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`)
      ]);
      const subData = await subRes.json();
      const orderData = await orderRes.json();

      const mainOrder = orderData.order;

      if (subData.success && subData.subOrders?.length > 0) {
        // If main order has an updated status, sync it onto subOrders
        const syncedSubOrders = subData.subOrders.map((sub: SubOrder) => {
          if (mainOrder?.status && mainOrder.status !== 'paid' && mainOrder.status !== 'pending_payment') {
            return {
              ...sub,
              status: mainOrder.status,
              timeline: mainOrder.timeline?.length ? mainOrder.timeline : sub.timeline
            };
          }
          return sub;
        });
        setSubOrders(syncedSubOrders);
      } else if (mainOrder) {
        setSubOrders([
          {
            _id: mainOrder._id || mainOrder.orderId,
            subOrderId: mainOrder.orderId,
            orderId: mainOrder.orderId,
            vendorStoreName: 'AfriCart Store',
            status: mainOrder.status || 'Processing',
            items: mainOrder.products || mainOrder.items || [],
            subtotal: mainOrder.total || 0,
            deliveryFee: 15.00,
            total: mainOrder.total || 0,
            timeline: mainOrder.timeline || []
          }
        ]);
      } else {
        setSubOrders([
          {
            _id: 'sub-1',
            subOrderId: `SUB-${orderId}`,
            orderId: orderId,
            vendorStoreName: 'AfriCart Official Store',
            fulfillmentMethod: 'home_delivery',
            status: 'Processing',
            items: [
              {
                name: 'Headphones Sony WH-1000XM5',
                price: 250.00,
                quantity: 1,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80'
              }
            ],
            subtotal: 250.00,
            deliveryFee: 15.00,
            total: 250.00,
            timeline: [
              { status: 'Order Placed', description: 'Order placed successfully', timestamp: 'Jul 25, 2026, 10:30 AM' },
              { status: 'Processing', description: 'We are getting your order ready', timestamp: 'Jul 25, 2026, 11:00 AM' }
            ]
          }
        ]);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBannerConfig = (statusStr: string) => {
    const s = (statusStr || '').toLowerCase();

    if (s.includes('cancel') || s.includes('refund')) {
      return {
        title: 'Cancelled',
        message: 'This order was cancelled. Please contact support if you have any questions.',
        bg: 'rgba(220, 38, 38, 0.12)',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        color: '#DC2626',
        btnBg: '#DC2626',
        btnText: 'Reorder Items',
        btnAction: 'buy_again'
      };
    }
    if (s.includes('deliver') || s.includes('complete')) {
      return {
        title: 'Delivered',
        message: 'Your order has been delivered successfully. Enjoy your purchase!',
        bg: 'rgba(22, 163, 74, 0.12)',
        border: '1px solid rgba(22, 163, 74, 0.3)',
        color: '#16A34A',
        btnBg: '#16A34A',
        btnText: 'Buy Again',
        btnAction: 'buy_again'
      };
    }
    if (s.includes('picked') || s.includes('pickup')) {
      return {
        title: 'Picked Up',
        message: 'Your order has been picked up from the designated pickup point.',
        bg: 'rgba(147, 51, 234, 0.12)',
        border: '1px solid rgba(147, 51, 234, 0.3)',
        color: '#9333EA',
        btnBg: '#9333EA',
        btnText: 'View Order Details',
        btnAction: 'details'
      };
    }
    if (s.includes('ship') || s.includes('out for delivery') || s.includes('transit')) {
      return {
        title: 'Shipped',
        message: 'Your package is on its way to your delivery address.',
        bg: 'rgba(37, 99, 235, 0.12)',
        border: '1px solid rgba(37, 99, 235, 0.3)',
        color: '#2563EB',
        btnBg: '#2563EB',
        btnText: 'View Order Details',
        btnAction: 'details'
      };
    }

    return {
      title: 'Processing',
      message: 'Your order is being processed. We are getting your order ready.',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      color: '#D97706',
      btnBg: '#F59E0B',
      btnText: 'View Order Details',
      btnAction: 'details'
    };
  };

  const getTimelineSteps = (currentStatus: string, dbTimeline?: Array<{ status: string; timestamp: string }>) => {
    const s = (currentStatus || '').toLowerCase();

    const isPlaced = true;
    let isProcessing = true;
    let isShipped = s.includes('ship') || s.includes('out for delivery') || s.includes('deliver') || s.includes('picked');
    let isOutForDelivery = s.includes('out for delivery') || s.includes('deliver') || s.includes('picked');
    let isDelivered = s.includes('deliver') || s.includes('completed');

    if (s.includes('cancel')) {
      isProcessing = false;
      isShipped = false;
      isOutForDelivery = false;
      isDelivered = false;
    }

    const getTimeForStep = (stepName: string, fallbackTime: string, defaultDoneTime?: string) => {
      const found = dbTimeline?.find(t => t.status.toLowerCase().includes(stepName.toLowerCase()));
      if (found?.timestamp) return found.timestamp;
      return defaultDoneTime || fallbackTime;
    };

    return [
      {
        label: 'Order Placed',
        time: getTimeForStep('placed', 'Jul 25, 2026, 10:30 AM'),
        done: isPlaced
      },
      {
        label: 'Processing',
        time: isProcessing ? getTimeForStep('processing', 'Jul 25, 2026, 11:00 AM') : 'Pending',
        done: isProcessing
      },
      {
        label: 'Shipped',
        time: isShipped ? getTimeForStep('shipped', 'Jul 25, 2026, 02:30 PM') : 'Pending',
        done: isShipped
      },
      {
        label: 'Out for Delivery',
        time: isOutForDelivery ? getTimeForStep('out', 'Jul 26, 2026, 08:15 AM') : 'Pending',
        done: isOutForDelivery
      },
      {
        label: 'Delivered',
        time: isDelivered ? getTimeForStep('delivered', 'Jul 26, 2026, 01:45 PM') : 'Pending',
        done: isDelivered
      }
    ];
  };

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
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 0',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--background)',
          zIndex: 10
        }}>
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--foreground)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>chevron_left</span>
          </button>
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--foreground)',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Order #{orderId}
          </h1>
        </header>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 36, color: 'var(--lime-400)' }}>
              progress_activity
            </span>
            <p style={{ marginTop: 12, fontSize: 14, fontWeight: 500 }}>Loading order tracking...</p>
          </div>
        ) : (
          subOrders.map(subOrder => {
            const banner = getStatusBannerConfig(subOrder.status);
            const steps = getTimelineSteps(subOrder.status, subOrder.timeline);
            const itemsCount = subOrder.items?.length || 1;

            return (
              <div key={subOrder._id} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Status Card */}
                <div style={{
                  backgroundColor: banner.bg,
                  border: banner.border,
                  borderRadius: 20,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: banner.color,
                      display: 'inline-block'
                    }} />
                    <h2 style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: banner.color,
                      margin: 0
                    }}>
                      {banner.title}
                    </h2>
                  </div>

                  <p style={{
                    fontSize: 14,
                    color: 'var(--foreground)',
                    opacity: 0.9,
                    lineHeight: 1.45,
                    margin: '4px 0 16px 0'
                  }}>
                    {banner.message}
                  </p>

                  <button
                    onClick={() => {
                      if (banner.btnAction === 'buy_again') {
                        subOrder.items.forEach(i => addToCart({ id: i.name, name: i.name, price: i.price, image: i.image } as any));
                        showToast('Added items to cart!');
                        router.push('/cart');
                      } else {
                        router.push(`/account/orders/${orderId}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: 14,
                      border: 'none',
                      backgroundColor: banner.btnBg,
                      color: '#FFFFFF',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: `0 4px 12px ${banner.btnBg}40`,
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    {banner.btnText}
                  </button>
                </div>

                {/* Delivery Progress Card */}
                <div style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <h3 style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    margin: '0 0 20px 0'
                  }}>
                    Delivery Progress
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                    {steps.map((step, idx) => {
                      const isLast = idx === steps.length - 1;
                      const nextStepDone = !isLast && steps[idx + 1].done;

                      return (
                        <div key={idx} style={{ display: 'flex', gap: 14, position: 'relative', minHeight: 54 }}>
                          {/* Vertical Connector Line */}
                          {!isLast && (
                            <div style={{
                              position: 'absolute',
                              left: 12,
                              top: 26,
                              width: 2,
                              height: 'calc(100% - 6px)',
                              backgroundColor: nextStepDone ? '#10B981' : 'var(--outline)',
                              zIndex: 0
                            }} />
                          )}

                          {/* Icon Circle */}
                          <div style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            flexShrink: 0,
                            backgroundColor: step.done ? '#10B981' : 'var(--surface-container-high, rgba(0,0,0,0.08))',
                            border: step.done ? 'none' : '1px solid var(--outline)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1
                          }}>
                            {step.done ? (
                              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 900 }}>
                                check
                              </span>
                            ) : (
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: 'var(--on-surface-variant)'
                              }} />
                            )}
                          </div>

                          {/* Step Content */}
                          <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                            <h4 style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: step.done ? 'var(--foreground)' : 'var(--on-surface-variant)',
                              margin: 0,
                              lineHeight: 1.2
                            }}>
                              {step.label}
                            </h4>
                            <p style={{
                              fontSize: 12,
                              color: 'var(--on-surface-variant)',
                              opacity: 0.8,
                              margin: '4px 0 0 0'
                            }}>
                              {step.time}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary Card */}
                <div style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                      Order Summary
                    </h3>
                    <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {subOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          paddingTop: idx > 0 ? 14 : 0,
                          borderTop: idx > 0 ? '1px solid var(--outline)' : 'none'
                        }}
                      >
                        <div style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          overflow: 'hidden',
                          backgroundColor: 'var(--surface-container-high, rgba(0,0,0,0.04))',
                          flexShrink: 0,
                          border: '1px solid var(--outline)'
                        }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            className="line-clamp-1"
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: 'var(--foreground)',
                              margin: '0 0 2px 0'
                            }}
                          >
                            {item.name}
                          </h4>
                          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: 0 }}>
                            Qty: {item.quantity}
                          </p>
                        </div>

                        <span style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: 'var(--foreground)',
                          whiteSpace: 'nowrap'
                        }}>
                          GHS {item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: '1px solid var(--outline)'
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Total</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>
                      GHS {subOrder.total.toFixed(2)}
                    </span>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

