'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useToast, useCart } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { OrderChat } from '@/components/OrderChat';

type OrderStatus = 'Ongoing' | 'Shipped' | 'Delivered' | 'Picked Up' | 'Cancelled';

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const { updateOrderStatus } = useAdmin();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('Ongoing');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) {
        const mapped = data.orders.map((o: any) => {
          const frontendStatus = (o.status === 'Processing' || o.status === 'Pending') ? 'Ongoing' : o.status;
          return {
            ...o,
            id: o.orderId,
            dbId: o._id,
            originalStatus: o.status,
            status: frontendStatus,
            items: o.itemsCount || o.products.length,
            date: new Date(o.date).toLocaleDateString()
          };
        });
        setOrders(mapped);
        localStorage.setItem(`africart-orders-${user.email}`, JSON.stringify(mapped));
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load and setup polling
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Quick load from cache
      const savedOrders = JSON.parse(localStorage.getItem(`africart-orders-${user.email}`) || '[]');
      if (savedOrders.length > 0) setOrders(savedOrders);

      loadOrders(savedOrders.length > 0);
      const interval = setInterval(() => loadOrders(true), 3000); // Poll silently every 3s
      return () => clearInterval(interval);
    }
  }, [user, isLoading, router]);

  const getStatusIndex = (status: string) => {
    // Map backend statuses to timeline indices
    const statusMap: Record<string, number> = {
      'Pending': 0,
      'Processing': 1,
      'Ongoing': 1,
      'Shipped': 2,
      'Delivered': 3
    };
    return statusMap[status] ?? 0;
  };

  const handleCancelOrder = async (order: any) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? { ...o, status: 'Cancelled', originalStatus: 'Cancelled' }
            : o
        )
      );
      setActiveTab('Cancelled');
      try {
        await updateOrderStatus(order.dbId || order.id, 'Cancelled');
        showToast('Order cancelled successfully', 'info');
        setTimeout(() => loadOrders(true), 1500);
      } catch (err) {
        loadOrders(true);
        setActiveTab('Ongoing');
        showToast('Failed to cancel order', 'error');
      }
    }
  };

  const handleConfirmDelivery = async (order: any) => {
    if (confirm('Confirm you have received all items in this order? This will release payment to the vendor.')) {
      try {
        const res = await fetch(`/api/orders/${order.dbId || order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'Delivered',
            'paymentInfo.escrowStatus': 'Released' 
          })
        });
        
        if (res.ok) {
          showToast('Delivery confirmed! Payment released.');
          setSelectedOrder(null);
          loadOrders(true);
        }
      } catch (err) {
        showToast('Failed to confirm delivery', 'error');
      }
    }
  };

  const handleDisputeOrder = async (order: any) => {
    if (confirm('Are you sure you want to open a dispute? This will hold the vendor funds and notify support.')) {
      try {
        const res = await fetch(`/api/orders/${order.dbId || order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            'paymentInfo.escrowStatus': 'Disputed' 
          })
        });
        
        if (res.ok) {
          showToast('Dispute opened. Support will contact you shortly.', 'success');
          setSelectedOrder(null);
          loadOrders(true);
        }
      } catch (err) {
        showToast('Failed to open dispute', 'error');
      }
    }
  };

  const [reviewModal, setReviewModal] = useState<{ productId: string, orderId: string, rating: number, comment: string, images?: string[] } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const compressReviewImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round(h * maxDim / w);
            w = maxDim;
          } else if (h > w && h > maxDim) {
            w = Math.round(w * maxDim / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/webp', 0.8));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModal) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewModal,
          images: reviewModal.images || [],
          customerName: user?.name,
          customerEmail: user?.email
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Review submitted successfully!', 'success');
        setReviewModal(null);
      } else {
        showToast(data.error || 'Failed to submit review', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    }
  };

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showChat, setShowChat] = useState(false);


  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedOrder]);

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'Ongoing') {
      return o.status === 'Ongoing' || o.status === 'Pending' || o.status === 'Processing';
    }
    return o.status === activeTab;
  });

  if (isLoading || !user) return null;

  const tabs: OrderStatus[] = ['Ongoing', 'Shipped', 'Delivered', 'Picked Up', 'Cancelled'];

  const timelineSteps = [
    { label: 'Confirmed', icon: 'check_circle', desc: 'Order received by platform' },
    { label: 'Processing', icon: 'inventory_2', desc: 'Vendors are preparing items' },
    { label: 'Shipped', icon: 'local_shipping', desc: 'Package is on its way' },
    { label: 'Delivered', icon: 'verified', desc: 'Package received successfully' }
  ];

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      {/* Existing Header & Tabs Code... */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>My Orders</h1>
        </div>
        <button 
          onClick={() => loadOrders()} 
          disabled={isRefreshing}
          style={{ 
            background: 'var(--surface-container)', border: '1px solid var(--outline)', 
            color: 'var(--foreground)', padding: '8px 12px', borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            opacity: isRefreshing ? 0.6 : 1, transition: 'all 0.2s'
          }}
        >
          <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`} style={{ fontSize: 18 }}>refresh</span>
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>{isRefreshing ? 'REFRESHING...' : 'REFRESH'}</span>
        </button>
      </div>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
              background: activeTab === tab ? 'var(--lime-400)' : 'var(--surface)',
              color: activeTab === tab ? '#000' : 'var(--on-surface-variant)',
              border: activeTab === tab ? 'none' : '1px solid var(--outline)',
              fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredOrders.map((order, i) => (
          <div key={order.id} className={`animate-fade-in-up stagger-${i + 1}`} style={{
            background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--foreground)' }}>{order.id}</span>
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Placed on {order.date} • Est. Delivery: {new Date(new Date(order.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase',
                background: order.status === 'Delivered' ? 'rgba(195,244,0,0.1)' 
                  : order.status === 'Cancelled' ? 'rgba(255,68,68,0.1)' 
                  : order.status === 'Picked Up' ? 'rgba(38,166,154,0.1)'
                  : 'rgba(0,229,255,0.1)',
                color: order.status === 'Delivered' ? 'var(--lime-400)' 
                  : order.status === 'Cancelled' ? 'var(--error)' 
                  : order.status === 'Picked Up' ? '#26a69a'
                  : '#00e5ff'
              }}>
                {order.status}
              </span>
            </div>
            
            {/* Timeline UI */}
            {order.status !== 'Cancelled' && order.status !== 'Picked Up' && (
              <div style={{ padding: '0 4px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 10, left: 10, right: 10, height: 2, background: 'var(--surface-container-highest)', zIndex: 0 }} />
                  <div style={{ 
                    position: 'absolute', top: 10, left: 10, 
                    width: `${(getStatusIndex(order.originalStatus) / (timelineSteps.length - 1)) * 100}%`, 
                    height: 2, background: 'var(--lime-400)', zIndex: 0, 
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }} />
                  
                  {timelineSteps.map((step, index) => {
                    const isActive = getStatusIndex(order.originalStatus) >= index;
                    return (
                      <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', border: isActive ? 'none' : '2px solid var(--surface-container-highest)',
                          background: isActive ? 'var(--lime-400)' : 'var(--surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: isActive ? '0 0 10px rgba(195,244,0,0.3)' : 'none'
                        }}>
                          {isActive ? (
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--on-lime-400)', fontWeight: 'bold' }}>check</span>
                          ) : (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--surface-container-highest)' }} />
                          )}
                        </div>
                        <span style={{ 
                          fontSize: 9, fontWeight: isActive ? 700 : 500, 
                          color: isActive ? 'var(--foreground)' : 'var(--on-surface-variant)', 
                          fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' 
                        }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Products Preview */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 12 }} className="no-scrollbar">
              {order.products?.map((p: any, idx: number) => (
                <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={p.image} alt={p.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', background: 'var(--surface-container)' }} />
                  <span style={{ position: 'absolute', bottom: -4, right: -4, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>{p.quantity}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--outline)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>Total Amount</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--lime-400)' }}>GH₵{order.total.toFixed(2)}</span>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {order.originalStatus === 'Pending' && (
                  <button onClick={() => handleCancelOrder(order)} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: 'var(--error)', fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>CANCEL</button>
                )}
                {(order.status === 'Delivered' || order.status === 'Cancelled') && (
                  <button 
                    onClick={() => {
                      order.products?.forEach((p: any) => {
                        const product = { id: p.id, name: p.name, price: p.price, image: p.image, category: p.category || 'Fashion', subCategory: '', rating: 0, description: '', vendorEmail: p.vendorEmail, vendorStoreName: p.vendorStoreName } as any;
                        addToCart(product, p.selectedSize);
                      });
                      showToast('Items added to cart!');
                      router.push('/checkout');
                    }}
                    style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(195,244,0,0.1)', border: '1px solid rgba(195,244,0,0.2)', color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>replay</span>
                    BUY AGAIN
                  </button>
                )}
                <button 
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, background: 'var(--surface-container-high)', border: '1px solid var(--outline)',
                    color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, marginBottom: 16, opacity: 0.2 }}>inventory_2</span>
            <p style={{ fontFamily: 'var(--font-lexend)', fontWeight: 600 }}>No {activeTab.toLowerCase()} orders.</p>
            <Link href="/shop" style={{ display: 'inline-block', marginTop: 16, color: 'var(--lime-400)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Go Shopping</Link>
          </div>
        )}
      </div>

      {/* Customer Order Detail Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedOrder(null)}>
          <div 
            onClick={e => e.stopPropagation()} 
            className="animate-slide-up"
            style={{ 
              background: 'var(--surface)', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, 
              padding: '24px 20px 40px', border: '1px solid var(--outline)', maxHeight: '90vh', overflowY: 'auto' 
            }}
          >
            <div style={{ width: 40, height: 4, background: 'var(--outline)', borderRadius: 2, margin: '0 auto 20px' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Order Details</h2>
                <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'block' }}>ID: {selectedOrder.id}</span>
                <span style={{ fontSize: 12, color: 'var(--lime-400)', fontWeight: 600, marginTop: 4, display: 'block' }}>
                  Expected Delivery: {new Date(new Date(selectedOrder.date).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'var(--surface-container)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--on-surface)' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <button 
                onClick={() => setShowChat(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, border: '1px solid #00e5ff', background: 'rgba(0,229,255,0.05)', color: '#00e5ff', fontWeight: 700, cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat</span>
                Chat with Vendor
              </button>
            </div>

            {/* Detailed Timeline */}
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Tracking History</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {(selectedOrder.timeline && selectedOrder.timeline.length > 0) ? (
                  selectedOrder.timeline.map((step: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                          width: 24, height: 24, borderRadius: '50%', 
                          background: idx === 0 ? 'var(--lime-400)' : 'var(--surface-container)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: idx === 0 ? '#000' : 'var(--outline)', zIndex: 1,
                          border: idx === 0 ? 'none' : '1px solid var(--outline)'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{idx === 0 ? 'check' : 'history'}</span>
                        </div>
                        {idx !== selectedOrder.timeline.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: 'var(--surface-container)', margin: '4px 0' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: 14, fontWeight: 800, color: idx === 0 ? 'var(--foreground)' : 'var(--on-surface-variant)', marginBottom: 2 }}>{step.status}</h4>
                          <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>{step.description}</p>
                        <p style={{ fontSize: 9, color: 'var(--on-surface-variant)', marginTop: 4 }}>{new Date(step.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  timelineSteps.map((step, idx) => {
                    const isActive = getStatusIndex(selectedOrder.originalStatus) >= idx;
                    return (
                      <div key={step.label} style={{ display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ 
                            width: 24, height: 24, borderRadius: '50%', 
                            background: isActive ? 'var(--lime-400)' : 'var(--surface-container)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isActive ? '#000' : 'var(--outline)', zIndex: 1
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{isActive ? 'check' : step.icon}</span>
                          </div>
                          {idx !== timelineSteps.length - 1 && (
                            <div style={{ width: 2, flex: 1, background: isActive && getStatusIndex(selectedOrder.originalStatus) > idx ? 'var(--lime-400)' : 'var(--surface-container)', margin: '4px 0' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: idx !== timelineSteps.length - 1 ? 12 : 0 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 800, color: isActive ? 'var(--foreground)' : 'var(--on-surface-variant)', marginBottom: 2 }}>{step.label}</h4>
                          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Shipping Address */}
            <section style={{ marginBottom: 32, padding: 16, background: 'var(--surface-container)', borderRadius: 16, border: '1px solid var(--outline)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)' }}>location_on</span>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: 'var(--foreground)', textTransform: 'uppercase' }}>Shipping Address</h3>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>{selectedOrder.shippingAddress?.fullName || user.name}</p>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                {selectedOrder.shippingAddress?.address}<br />
                {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.region}<br />
                Phone: {selectedOrder.shippingAddress?.phone}
              </p>
            </section>

            {/* Items Breakdown */}
            <section style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedOrder.products?.map((p: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <img src={p.image} alt={p.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Qty: {p.quantity} {p.selectedSize && `· Size: ${p.selectedSize}`}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--foreground)' }}>GH₵{(p.price * p.quantity).toFixed(2)}</span>
                      {selectedOrder.originalStatus === 'Delivered' && (
                        <button 
                          onClick={() => setReviewModal({ productId: p.id, orderId: selectedOrder.id || selectedOrder.orderId || selectedOrder._id, rating: 5, comment: '' })}
                          style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', color: 'var(--lime-400)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px dashed var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--foreground)' }}>Total Amount</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)' }}>GH₵{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </section>

            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '16px', borderRadius: 12, background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>CLOSE</button>
                {selectedOrder.originalStatus === 'Shipped' && (
                  <button 
                    onClick={() => handleConfirmDelivery(selectedOrder)} 
                    style={{ 
                      flex: 1, padding: '16px', borderRadius: 12, background: 'var(--lime-400)', color: '#000', 
                      border: 'none', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    <span className="material-symbols-outlined">verified</span>
                    CONFIRM DELIVERY
                  </button>
                )}
              </div>
              {(selectedOrder.originalStatus === 'Pending' || selectedOrder.originalStatus === 'Processing' || selectedOrder.originalStatus === 'Shipped') && (
                <button 
                  onClick={() => handleDisputeOrder(selectedOrder)} 
                  style={{ 
                    width: '100%', padding: '14px', borderRadius: 12, background: 'transparent', color: 'var(--error)', 
                    border: '1px dashed var(--error)', fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>report_problem</span>
                  DISPUTE ORDER
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    {/* Review Modal */}
    {reviewModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <form onSubmit={handleReviewSubmit} className="animate-fade-in-up" style={{ width: '100%', maxWidth: 400, background: 'var(--surface)', borderRadius: 24, padding: 24, border: '1px solid var(--outline)', position: 'relative' }}>
          <button type="button" onClick={() => setReviewModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'var(--surface-container)', border: 'none', color: 'var(--foreground)', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
          <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, marginBottom: 16, color: 'var(--foreground)' }}>Leave a Review</h3>
          
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span 
                key={star} 
                onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                className="material-symbols-outlined" 
                style={{ fontSize: 32, cursor: 'pointer', color: star <= reviewModal.rating ? '#FFD700' : 'var(--surface-container-highest)', transition: 'color 0.2s' }}
              >
                star
              </span>
            ))}
          </div>

          <textarea 
            placeholder="What did you like or dislike about this product?"
            value={reviewModal.comment}
            onChange={e => setReviewModal({ ...reviewModal, comment: e.target.value })}
            style={{ width: '100%', padding: '16px', background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 12, color: 'var(--foreground)', fontSize: 14, outline: 'none', minHeight: 100, resize: 'vertical', marginBottom: 16, fontFamily: 'var(--font-inter)' }}
          />

          {/* Photo upload field */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>Add Photos</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {reviewModal.images?.map((img, i) => (
                <div key={i} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--outline)' }}>
                  <img src={img} alt="review preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    type="button" 
                    onClick={() => {
                      const filtered = reviewModal.images?.filter((_, idx) => idx !== i) || [];
                      setReviewModal({ ...reviewModal, images: filtered });
                    }} 
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 16, height: 16, color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 10 }}>close</span>
                  </button>
                </div>
              ))}
              {(!reviewModal.images || reviewModal.images.length < 3) && (
                <label style={{ width: 60, height: 60, borderRadius: 8, border: '1px dashed var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-container-low)' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    hidden 
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      if (!e.target.files) return;
                      setUploadingImage(true);
                      try {
                        const newImages = [...(reviewModal.images || [])];
                        for (let k = 0; k < e.target.files.length; k++) {
                          if (newImages.length >= 3) break;
                          const compressed = await compressReviewImage(e.target.files[k]);
                          newImages.push(compressed);
                        }
                        setReviewModal({ ...reviewModal, images: newImages });
                      } catch (err) {
                        showToast('Error uploading images', 'error');
                      } finally {
                        setUploadingImage(false);
                      }
                    }} 
                  />
                  <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>{uploadingImage ? 'progress_activity' : 'add_a_photo'}</span>
                </label>
              )}
            </div>
            <p style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 6 }}>Max 3 photos (optional)</p>
          </div>

          <button type="submit" disabled={uploadingImage} style={{ width: '100%', padding: '16px', borderRadius: 12, background: uploadingImage ? 'var(--outline-variant)' : 'var(--lime-400)', color: '#000', border: 'none', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14, cursor: uploadingImage ? 'not-allowed' : 'pointer' }}>
            Submit Review
          </button>
        </form>
      </div>
    )}

    {/* Order Chat */}
    {showChat && selectedOrder && (
      <OrderChat 
        orderId={selectedOrder.id}
        receiverEmail={selectedOrder.products?.[0]?.vendorEmail || 'support@africart.com'}
        onClose={() => setShowChat(false)}
      />
    )}
  </div>
);
}

