'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

// Types for the rider dashboard
interface DeliveryOrder {
  id: string;
  orderId: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  vendorName: string;
  vendorAddress: string;
  vendorPhone: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  deliveryCode: string;
  qrCode: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  deliveryFee: number;
  tip?: number;
  distance: number; // km
  estimatedTime: number; // minutes
  createdAt: string;
  pickupTime?: string;
  deliveredAt?: string;
}

interface RiderStats {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalDeliveries: number;
  todayDeliveries: number;
  rating: number;
  onTimeRate: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export default function RiderDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [isOnline, setIsOnline] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<DeliveryOrder | null>(null);
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<RiderStats>({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalDeliveries: 0,
    todayDeliveries: 0,
    rating: 0,
    onTimeRate: 0,
  });
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [deliveryToConfirm, setDeliveryToConfirm] = useState<DeliveryOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'current' | 'completed'>('available');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated and is a rider
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Check if user has rider role
    if (user.role !== 'rider') {
      router.push('/');
      return;
    }
    
    loadRiderData();
  }, [user, router]);

  // Location tracking
  useEffect(() => {
    if (!isOnline) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(newLocation);
        // Send to server
        updateLocation(newLocation);
      },
      (error) => {
        console.error('Location error:', error);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline]);

  const loadRiderData = async () => {
    setIsLoading(true);
    try {
      // Fetch rider stats
      const statsRes = await fetch('/api/rider/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch current order
      const currentRes = await fetch('/api/rider/current-order');
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        setCurrentOrder(currentData.order);
        if (currentData.order) {
          setActiveTab('current');
        }
      }

      // Fetch available orders
      const availableRes = await fetch('/api/rider/available-orders');
      if (availableRes.ok) {
        const availableData = await availableRes.json();
        setAvailableOrders(availableData.orders);
      }

      // Fetch completed orders
      const completedRes = await fetch('/api/rider/completed-orders');
      if (completedRes.ok) {
        const completedData = await completedRes.json();
        setCompletedOrders(completedData.orders);
      }
    } catch (error) {
      console.error('Error loading rider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = async (loc: LocationData) => {
    try {
      await fetch('/api/rider/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    try {
      await fetch('/api/rider/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlineStatus: newStatus ? 'online' : 'offline' }),
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/rider/orders/${orderId}/accept`, {
        method: 'POST',
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentOrder(data.order);
        setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
        setActiveTab('current');
      } else {
        alert('Failed to accept order. It may have been taken by another rider.');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const updateOrderStatus = async (status: string) => {
    if (!currentOrder) return;
    
    try {
      const res = await fetch(`/api/rider/orders/${currentOrder.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCurrentOrder(data.order);
        
        if (status === 'delivered') {
          setCurrentOrder(null);
          setActiveTab('completed');
          loadRiderData();
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const confirmDelivery = () => {
    if (!currentOrder) return;
    setDeliveryToConfirm(currentOrder);
    setShowCodeModal(true);
  };

  const submitDeliveryCode = async () => {
    if (!deliveryToConfirm) return;
    
    try {
      const res = await fetch(`/api/rider/orders/${deliveryToConfirm.id}/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      
      if (res.ok) {
        setShowCodeModal(false);
        setVerificationCode('');
        setDeliveryToConfirm(null);
        setCurrentOrder(null);
        setActiveTab('completed');
        loadRiderData();
      } else {
        alert('Invalid delivery code. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--lime-400)', animation: 'spin 1s linear infinite' }}>sync</span>
          <p style={{ marginTop: 16, color: 'var(--on-surface-variant)' }}>Loading rider dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--outline)', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--lime-400)' }}>local_shipping</span>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>AfriCart Rider</h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>Delivery Partner Dashboard</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Online Status Toggle */}
            <div 
              onClick={toggleOnlineStatus}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 24,
                background: isOnline ? 'rgba(0, 229, 255, 0.15)' : 'var(--surface-container)',
                border: `1px solid ${isOnline ? '#00e5ff' : 'var(--outline)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ 
                  fontSize: 18, 
                  color: isOnline ? '#00e5ff' : 'var(--on-surface-variant)',
                  fontVariationSettings: isOnline ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                {isOnline ? 'online_prediction' : 'offline_bolt'}
              </span>
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600, 
                color: isOnline ? '#00e5ff' : 'var(--on-surface-variant)' 
              }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--lime-400), #00e5ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#000',
                fontSize: '0.875rem'
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'R'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--outline)',
            borderRadius: 16,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>payments</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>Today's Earnings</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>GH₵{stats.todayEarnings.toFixed(2)}</p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--outline)',
            borderRadius: 16,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#00e5ff' }}>local_shipping</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>Today's Deliveries</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.todayDeliveries}</p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--outline)',
            borderRadius: 16,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>star</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>Rating</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.rating.toFixed(1)}</p>
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--outline)',
            borderRadius: 16,
            padding: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--secondary)' }}>schedule</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.875rem' }}>On-Time Rate</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{stats.onTimeRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--outline)' }}>
          {[
            { key: 'available', label: 'Available Orders', icon: 'inventory_2', count: availableOrders.length },
            { key: 'current', label: 'Current Delivery', icon: 'delivery_dining', count: currentOrder ? 1 : 0 },
            { key: 'completed', label: 'Completed', icon: 'check_circle', count: completedOrders.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.key ? 'var(--lime-400)' : 'transparent'}`,
                background: 'transparent',
                color: activeTab === tab.key ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.key ? 'var(--lime-400)' : 'var(--surface-container-high)',
                  color: activeTab === tab.key ? '#000' : 'var(--on-surface-variant)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.75rem'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Available Orders Tab */}
          {activeTab === 'available' && (
            <div>
              {!isOnline && (
                <div style={{
                  background: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span className="material-symbols-outlined" style={{ color: '#ff9800' }}>info</span>
                  <p style={{ margin: 0, color: '#ff9800' }}>Go online to see and accept available delivery orders</p>
                </div>
              )}

              {isOnline && availableOrders.length === 0 && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  borderRadius: 16,
                  padding: 48,
                  textAlign: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--on-surface-variant)', marginBottom: 16 }}>local_shipping</span>
                  <h3 style={{ margin: '0 0 8px 0' }}>No orders available</h3>
                  <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>Stay online - new delivery requests will appear here</p>
                </div>
              )}

              {availableOrders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {availableOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      type="available"
                      onAccept={() => acceptOrder(order.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current Delivery Tab */}
          {activeTab === 'current' && (
            <div>
              {!currentOrder ? (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  borderRadius: 16,
                  padding: 48,
                  textAlign: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--on-surface-variant)', marginBottom: 16 }}>delivery_dining</span>
                  <h3 style={{ margin: '0 0 8px 0' }}>No active delivery</h3>
                  <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>Accept an order to start a delivery</p>
                  <button
                    onClick={() => setActiveTab('available')}
                    style={{
                      marginTop: 24,
                      padding: '12px 24px',
                      background: 'var(--lime-400)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    View Available Orders
                  </button>
                </div>
              ) : (
                <ActiveDeliveryView
                  order={currentOrder}
                  onUpdateStatus={updateOrderStatus}
                  onConfirmDelivery={confirmDelivery}
                />
              )}
            </div>
          )}

          {/* Completed Tab */}
          {activeTab === 'completed' && (
            <div>
              {completedOrders.length === 0 ? (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  borderRadius: 16,
                  padding: 48,
                  textAlign: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--on-surface-variant)', marginBottom: 16 }}>check_circle</span>
                  <h3 style={{ margin: '0 0 8px 0' }}>No completed deliveries</h3>
                  <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>Your delivery history will appear here</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {completedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      type="completed"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delivery Code Modal */}
      {showCodeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 24,
            padding: 32,
            maxWidth: 400,
            width: '90%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--lime-400)' }}>verified</span>
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>Confirm Delivery</h3>
              <p style={{ color: 'var(--on-surface-variant)', margin: 0, fontSize: '0.875rem' }}>
                Enter the 4-digit code from the customer or ask them to show their QR code
              </p>
            </div>

            <input
              type="text"
              maxLength={4}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '2rem',
                textAlign: 'center',
                letterSpacing: 8,
                background: 'var(--surface-container)',
                border: '2px solid var(--outline)',
                borderRadius: 12,
                color: 'var(--foreground)',
                fontFamily: 'monospace',
                fontWeight: 700,
                marginBottom: 16
              }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowCodeModal(false);
                  setVerificationCode('');
                  setDeliveryToConfirm(null);
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'var(--surface-container)',
                  border: '1px solid var(--outline)',
                  borderRadius: 10,
                  color: 'var(--foreground)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitDeliveryCode}
                disabled={verificationCode.length !== 4}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: verificationCode.length === 4 ? 'var(--lime-400)' : 'var(--surface-container-high)',
                  border: 'none',
                  borderRadius: 10,
                  color: verificationCode.length === 4 ? '#000' : 'var(--on-surface-variant)',
                  fontWeight: 600,
                  cursor: verificationCode.length === 4 ? 'pointer' : 'not-allowed'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Order Card Component
function OrderCard({ order, type, onAccept }: { order: DeliveryOrder; type: 'available' | 'completed'; onAccept?: () => void }) {
  const statusColors: Record<string, string> = {
    pending: '#ff9800',
    assigned: '#00e5ff',
    picked_up: '#7c4dff',
    in_transit: '#a855f7',
    delivered: 'var(--lime-400)',
    cancelled: 'var(--error)'
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--outline)',
      borderRadius: 16,
      padding: 20
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Order #{order.orderId}</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 600,
              background: `${statusColors[order.status]}20`,
              color: statusColors[order.status]
            }}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>{order.items.length} items · GH₵{order.deliveryFee.toFixed(2)} delivery fee</p>
        </div>
        
        {type === 'available' && onAccept && (
          <button
            onClick={onAccept}
            style={{
              padding: '10px 20px',
              background: 'var(--lime-400)',
              border: 'none',
              borderRadius: 8,
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Accept
          </button>
        )}
      </div>

      {/* Pickup Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, padding: 12, background: 'var(--surface-container)', borderRadius: 12 }}>
        <span className="material-symbols-outlined" style={{ color: '#00e5ff' }}>store</span>
        <div>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '0.875rem' }}>Pickup: {order.vendorName}</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{order.vendorAddress}</p>
        </div>
      </div>

      {/* Delivery Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--surface-container)', borderRadius: 12 }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>home</span>
        <div>
          <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '0.875rem' }}>Deliver to: {order.customerName}</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{order.customerAddress}</p>
        </div>
      </div>

      {type === 'completed' && order.deliveredAt && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--outline)' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
            Delivered on {new Date(order.deliveredAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// Active Delivery View Component
function ActiveDeliveryView({ order, onUpdateStatus, onConfirmDelivery }: { 
  order: DeliveryOrder; 
  onUpdateStatus: (status: string) => void;
  onConfirmDelivery: () => void;
}) {
  const [showQR, setShowQR] = useState(false);
  
  const statusSteps = [
    { key: 'assigned', label: 'Assigned', icon: 'assignment_ind' },
    { key: 'picked_up', label: 'Picked Up', icon: 'store' },
    { key: 'in_transit', label: 'In Transit', icon: 'local_shipping' },
    { key: 'delivered', label: 'Delivered', icon: 'check_circle' }
  ];
  
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);

  return (
    <div>
      {/* Progress Steps */}
      <div style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--outline)', 
        borderRadius: 16, 
        padding: 24,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {/* Progress Line */}
          <div style={{
            position: 'absolute',
            top: 20,
            left: '10%',
            right: '10%',
            height: 4,
            background: 'var(--surface-container-high)',
            borderRadius: 2,
            zIndex: 0
          }}>
            <div style={{
              height: '100%',
              width: `${Math.max(0, Math.min(100, (currentStepIndex / (statusSteps.length - 1)) * 100))}%`,
              background: 'var(--lime-400)',
              borderRadius: 2,
              transition: 'width 0.3s'
            }} />
          </div>
          
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={step.key} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                zIndex: 1,
                opacity: isCompleted || isCurrent ? 1 : 0.5
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: isCompleted ? 'var(--lime-400)' : isCurrent ? '#00e5ff' : 'var(--surface-container-high)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3px solid ${isCompleted ? 'var(--lime-400)' : isCurrent ? '#00e5ff' : 'var(--outline)'}`,
                  transition: 'all 0.3s'
                }}>
                  <span className="material-symbols-outlined" style={{
                    fontSize: 24,
                    color: isCompleted ? '#000' : isCurrent ? '#000' : 'var(--on-surface-variant)',
                    fontVariationSettings: isCompleted ? "'FILL' 1" : "'FILL' 0"
                  }}>
                    {isCompleted ? 'check' : step.icon}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: isCompleted ? 'var(--lime-400)' : isCurrent ? '#00e5ff' : 'var(--on-surface-variant)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details & Actions */}
      {order.status === 'assigned' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1), rgba(0, 229, 255, 0.05))',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#00e5ff' }}>store</span>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>Head to Pickup Location</h3>
              <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>{order.vendorName}</p>
            </div>
          </div>
          <p style={{ margin: '0 0 16px 0', color: 'var(--on-surface-variant)' }}>{order.vendorAddress}</p>
          <button
            onClick={() => onUpdateStatus('picked_up')}
            style={{
              width: '100%',
              padding: '16px',
              background: '#00e5ff',
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span className="material-symbols-outlined">check_circle</span>
            I've Picked Up the Order
          </button>
        </div>
      )}

      {(order.status === 'picked_up' || order.status === 'in_transit') && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(195, 244, 0, 0.1), rgba(195, 244, 0, 0.05))',
          border: '1px solid rgba(195, 244, 0, 0.3)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--lime-400)' }}>home</span>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>
                {order.status === 'picked_up' ? 'Heading to Customer' : 'Out for Delivery'}
              </h3>
              <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>{order.customerName}</p>
            </div>
          </div>
          <p style={{ margin: '0 0 16px 0', color: 'var(--on-surface-variant)' }}>{order.customerAddress}</p>
          
          {order.status === 'picked_up' && (
            <button
              onClick={() => onUpdateStatus('in_transit')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'var(--lime-400)',
                border: 'none',
                borderRadius: 10,
                color: '#000',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <span className="material-symbols-outlined">local_shipping</span>
              I'm on the Way
            </button>
          )}

          <button
            onClick={onConfirmDelivery}
            style={{
              width: '100%',
              padding: '16px',
              background: 'var(--lime-400)',
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <span className="material-symbols-outlined">verified</span>
            Confirm Delivery
          </button>
        </div>
      )}
    </div>
  );
}
