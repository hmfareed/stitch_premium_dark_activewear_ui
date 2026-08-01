'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

interface OrderItem {
  name: string;
  color?: string;
  qty: number;
  price: number;
  image: string;
}

interface OrderData {
  id: string;
  status: 'Processing' | 'Shipped' | 'Picked Up' | 'Delivered' | 'Cancelled';
  rawStatus: string;
  dateFormatted: string;
  itemCount: number;
  totalPrice: number;
  product: OrderItem;
  estimatedDelivery?: string;
  courier?: string;
  trackingId?: string;
  pickupPoint?: string;
  pickupDate?: string;
  deliveredDate?: string;
  cancelledDate?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  Processing: { bg: 'rgba(245, 158, 11, 0.15)', color: '#D97706', dot: '#F59E0B', label: 'Processing' },
  Shipped:    { bg: 'rgba(37, 99, 235, 0.15)', color: '#2563EB', dot: '#3B82F6', label: 'Shipped' },
  'Picked Up':{ bg: 'rgba(147, 51, 234, 0.15)', color: '#9333EA', dot: '#A855F7', label: 'Picked Up' },
  Delivered:  { bg: 'rgba(22, 163, 74, 0.15)', color: '#16A34A', dot: '#22C55E', label: 'Delivered' },
  Cancelled:  { bg: 'rgba(220, 38, 38, 0.15)', color: '#DC2626', dot: '#EF4444', label: 'Cancelled' },
};

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (authLoading) return;

    if (!user?.email) {
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    fetch(`/api/orders?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.orders)) {
          const mapped: OrderData[] = data.orders.map((o: any) => {
            const rawStatusStr = String(o.status || 'Processing').trim();
            const lowerStatus = rawStatusStr.toLowerCase();

            let mappedStatus: OrderData['status'] = 'Processing';
            if (lowerStatus.includes('shipped') || lowerStatus.includes('transit') || lowerStatus.includes('out for delivery')) {
              mappedStatus = 'Shipped';
            } else if (lowerStatus.includes('picked') || lowerStatus.includes('pickup')) {
              mappedStatus = 'Picked Up';
            } else if (lowerStatus.includes('delivered') || lowerStatus.includes('completed')) {
              mappedStatus = 'Delivered';
            } else if (lowerStatus.includes('cancel') || lowerStatus.includes('refund')) {
              mappedStatus = 'Cancelled';
            }

            const rawProducts = o.products || o.items || [];
            const firstProduct = rawProducts[0] || {};
            const itemCount = o.itemsCount || rawProducts.length || 1;

            const orderDate = o.date ? new Date(o.date) : new Date();
            const dateFormatted = isNaN(orderDate.getTime())
              ? 'Recent'
              : orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

            return {
              id: o.orderId || (o._id ? String(o._id).slice(-8).toUpperCase() : `ORD-${Math.floor(100000 + Math.random() * 900000)}`),
              status: mappedStatus,
              rawStatus: rawStatusStr,
              dateFormatted,
              itemCount,
              totalPrice: Number(o.total ?? o.grandTotal ?? firstProduct.price ?? 0),
              product: {
                name: firstProduct.name || firstProduct.title || 'Ordered Item',
                color: firstProduct.color || firstProduct.selectedSize || firstProduct.variant || undefined,
                qty: firstProduct.quantity || firstProduct.qty || 1,
                price: Number(firstProduct.price || o.total || 0),
                image: firstProduct.image || firstProduct.thumbnail || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80'
              },
              estimatedDelivery: o.estimatedDelivery || o.deliveryDate || '3-5 Business Days',
              courier: o.courier || o.shippingMethod || 'Standard Delivery',
              trackingId: o.trackingId || o.trackingNumber || undefined,
              pickupPoint: o.pickupPoint || o.pickupLocation || undefined,
              pickupDate: o.pickupDate || dateFormatted,
              deliveredDate: o.deliveredDate || dateFormatted,
              cancelledDate: o.cancelledDate || dateFormatted
            };
          });
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch orders:', err);
        setOrders([]);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [user, authLoading]);

  // Dynamic Tab counts based strictly on actual user orders
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: orders.length,
      Processing: 0,
      Shipped: 0,
      'Picked Up': 0,
      Delivered: 0,
      Cancelled: 0,
    };
    orders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status] += 1;
      }
    });
    return counts;
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesTab = activeTab === 'All' || o.status === activeTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.product.name.toLowerCase().includes(q) ||
        (o.courier && o.courier.toLowerCase().includes(q)) ||
        (o.trackingId && o.trackingId.toLowerCase().includes(q))
      );
    });
  }, [orders, activeTab, searchQuery]);

  const tabsList = ['All', 'Processing', 'Shipped', 'Picked Up', 'Delivered', 'Cancelled'] as const;

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
      {/* Center Container matching exact mobile max-width */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-lexend, system-ui, -apple-system, sans-serif)',
        color: 'var(--foreground)'
      }}>
        {/* Header Bar matching Screen Design */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>chevron_left</span>
          </button>

          <h1 style={{
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            color: 'var(--foreground)',
            letterSpacing: '-0.01em'
          }}>
            My Orders
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setIsSearching(!isSearching)}
              aria-label="Search orders"
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
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>search</span>
            </button>
            <Link
              href="/cart"
              aria-label="Shopping Cart"
              style={{
                color: 'var(--foreground)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                padding: 4
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>shopping_bag</span>
            </Link>
          </div>
        </header>

        {/* Search Input field (expandable) */}
        {isSearching && (
          <div style={{ marginBottom: 14 }} className="animate-fade-in-up">
            <input
              type="text"
              placeholder="Search by Order ID or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 12,
                border: '1px solid var(--outline)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: 14,
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Status Filter Horizontal Scrollable Pills */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 16,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {tabsList.map(tab => {
            const isActive = activeTab === tab;
            const count = tabCounts[tab] || 0;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid var(--outline)',
                  backgroundColor: isActive ? 'var(--foreground)' : 'var(--surface)',
                  color: isActive ? 'var(--background)' : 'var(--on-surface-variant)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <span>{tab}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: isActive ? 'var(--background)' : 'var(--surface-container-high, rgba(0,0,0,0.06))',
                    color: isActive ? 'var(--foreground)' : 'var(--on-surface-variant)'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders Content Area */}
        {isFetching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            {[1, 2].map(i => (
              <div
                key={i}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid var(--outline)',
                  minHeight: 140,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-surface-variant)',
                  fontSize: 14
                }}
              >
                Loading orders...
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--outline)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            marginTop: 8
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 54, color: 'var(--on-surface-variant)', opacity: 0.6, marginBottom: 12 }}>
              package_2
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--foreground)' }}>
              {activeTab === 'All' ? 'No orders yet' : `No ${activeTab} orders`}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              {activeTab === 'All'
                ? "When you place an order, your items and live tracking details will appear here."
                : `You currently have no orders under the "${activeTab}" status.`}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredOrders.map(order => {
              const statusStyle = STATUS_CONFIG[order.status] || STATUS_CONFIG.Processing;

              return (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 16,
                    border: '1px solid var(--outline)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Order Top Row: ID, Date, Item Count, Status Pill & Link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--foreground)',
                        margin: 0,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Order #{order.id}
                      </h2>
                      <p style={{
                        fontSize: 13,
                        color: 'var(--on-surface-variant)',
                        margin: '4px 0 0 0'
                      }}>
                        {order.dateFormatted} • {order.itemCount} {order.itemCount === 1 ? 'Item' : 'Items'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 16,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: statusStyle.dot,
                          display: 'inline-block'
                        }} />
                        {statusStyle.label}
                      </div>

                      <button
                        onClick={() => router.push(`/account/orders/${order.id}`)}
                        aria-label="View order details"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--on-surface-variant)',
                          cursor: 'pointer',
                          padding: 2,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                      </button>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div style={{ height: 1, backgroundColor: 'var(--outline)', margin: '14px 0', opacity: 0.5 }} />

                  {/* Main Product Info Row */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 72,
                      height: 72,
                      borderRadius: 12,
                      backgroundColor: 'var(--surface-container-high, rgba(0,0,0,0.04))',
                      border: '1px solid var(--outline)',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <img
                        src={order.product.image}
                        alt={order.product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'var(--foreground)',
                        margin: '0 0 2px 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {order.product.name}
                      </h3>
                      {order.product.color && (
                        <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: '0 0 2px 0' }}>
                          {order.product.color}
                        </p>
                      )}
                      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: '0 0 4px 0' }}>
                        Qty: {order.product.qty}
                      </p>
                      <p style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--foreground)',
                        margin: 0
                      }}>
                        GH₵ {order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Logistic & Delivery Info Row */}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {order.status === 'Processing' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--on-surface-variant)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>calendar_today</span>
                        <span>Estimated delivery: {order.estimatedDelivery}</span>
                      </div>
                    )}

                    {order.status === 'Shipped' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, flexWrap: 'wrap', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--on-surface-variant)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>local_shipping</span>
                            <span>Courier: {order.courier}</span>
                          </div>
                          {order.trackingId && (
                            <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>
                              Tracking ID: {order.trackingId}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--on-surface-variant)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>calendar_today</span>
                          <span>Estimated delivery: {order.estimatedDelivery}</span>
                        </div>
                      </>
                    )}

                    {order.status === 'Picked Up' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--on-surface-variant)', flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>location_on</span>
                          <span>Picked up from: {order.pickupPoint || 'Pickup Point'}</span>
                        </div>
                        <span style={{ color: 'var(--on-surface-variant)', opacity: 0.8 }}>{order.pickupDate}</span>
                      </div>
                    )}

                    {order.status === 'Delivered' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#16A34A' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#22C55E' }}>check_circle</span>
                        <span>Delivered on {order.deliveredDate || order.dateFormatted}</span>
                      </div>
                    )}

                    {order.status === 'Cancelled' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#DC2626' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#EF4444' }}>cancel</span>
                        <span>Cancelled on {order.cancelledDate || order.dateFormatted}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons Row */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    {order.status === 'Processing' && (
                      <>
                        <button
                          onClick={() => alert(`Cancel request sent for order #${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: '1px solid var(--outline)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--foreground)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>cancel</span>
                          Cancel Order
                        </button>
                        <button
                          onClick={() => router.push(`/track/${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: 'var(--foreground)',
                            color: 'var(--background)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>local_shipping</span>
                          Track Order
                        </button>
                      </>
                    )}

                    {order.status === 'Shipped' && (
                      <>
                        <button
                          onClick={() => router.push('/chat')}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: '1px solid var(--outline)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--foreground)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>chat_bubble</span>
                          Contact Seller
                        </button>
                        <button
                          onClick={() => router.push(`/track/${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: 'var(--foreground)',
                            color: 'var(--background)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>local_shipping</span>
                          Track Package
                        </button>
                      </>
                    )}

                    {order.status === 'Picked Up' && (
                      <>
                        <button
                          onClick={() => router.push(`/account/orders/${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: '1px solid var(--outline)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--foreground)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>description</span>
                          View Details
                        </button>
                        <button
                          onClick={() => router.push('/chat')}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: '1px solid var(--outline)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--foreground)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>chat_bubble</span>
                          Contact Seller
                        </button>
                      </>
                    )}

                    {order.status === 'Delivered' && (
                      <>
                        <button
                          onClick={() => router.push(`/account/orders/${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: '1px solid var(--outline)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--foreground)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>description</span>
                          View Details
                        </button>
                        <button
                          onClick={() => router.push('/chat')}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: 'var(--foreground)',
                            color: 'var(--background)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>rate_review</span>
                          Leave Review
                        </button>
                      </>
                    )}

                    {order.status === 'Cancelled' && (
                      <>
                        <button
                          onClick={() => router.push(`/account/orders/${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: '1px solid var(--outline)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--foreground)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>description</span>
                          View Details
                        </button>
                        <button
                          onClick={() => router.push('/cart')}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: 'none',
                            backgroundColor: 'var(--foreground)',
                            color: 'var(--background)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>refresh</span>
                          Reorder
                        </button>
                      </>
                    )}
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


