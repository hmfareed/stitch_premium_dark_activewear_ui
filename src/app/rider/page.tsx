'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

// Types for rider dashboard
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
  qrCode?: string;
  items: Array<{ name: string; quantity: number }>;
  deliveryFee: number;
  tip?: number;
  distance: number;
  estimatedTime: number;
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
  avgDeliveryTime: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export default function RiderDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  
  const [isOnline, setIsOnline] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    avgDeliveryTime: 0,
  });
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [deliveryToConfirm, setDeliveryToConfirm] = useState<DeliveryOrder | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'deliveries' | 'earnings' | 'wallet'>('home');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve before redirecting
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role !== 'rider' && user.role !== 'super_admin') {
      router.push('/');
      return;
    }
    loadRiderData();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!isOnline) return;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(newLocation);
          updateLocation(newLocation);
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isOnline]);

  const loadRiderData = async () => {
    setIsLoading(true);
    try {
      const statsRes = await fetch('/api/rider/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(prev => ({ ...prev, ...statsData }));
      }

      const currentRes = await fetch('/api/rider/current-order');
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        if (currentData.order) setCurrentOrder(currentData.order);
      }

      const availableRes = await fetch('/api/rider/available-orders');
      if (availableRes.ok) {
        const availableData = await availableRes.json();
        if (availableData.orders) setAvailableOrders(availableData.orders);
      }

      const completedRes = await fetch('/api/rider/completed-orders');
      if (completedRes.ok) {
        const completedData = await completedRes.json();
        if (completedData.orders) setCompletedOrders(completedData.orders);
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
        loadRiderData();
      } else {
        alert('Invalid delivery code. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  const handleTriggerSos = async () => {
    setSosSending(true);
    try {
      const res = await fetch('/api/rider/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderPhone: user?.phone,
          riderEmail: user?.email,
          latitude: location?.latitude,
          longitude: location?.longitude,
          activeSubOrderId: currentOrder?.orderId,
          note: 'One-tap SOS Emergency Triggered from Rider Dashboard',
        }),
      });
      if (res.ok) {
        setShowSosModal(true);
      }
    } catch (error) {
      console.error('Error sending SOS alert:', error);
    } finally {
      setSosSending(false);
    }
  };

  const mockActiveDeliveries = [
    {
      id: '#DEL-765412',
      pickup: 'KFC - Tamale',
      dropoff: 'University for Development Studies',
      eta: '12 mins away',
    },
    {
      id: '#DEL-765413',
      pickup: 'Melcom - Tamale',
      dropoff: 'Zagyuri',
      eta: '18 mins away',
    },
    {
      id: '#DEL-765414',
      pickup: "Mama's Chop Bar",
      dropoff: 'Nyohini',
      eta: '25 mins away',
    },
  ];

  interface RiderNavSubItem {
    name: string;
    path?: string;
  }

  interface RiderNavSection {
    title: string;
    icon: string;
    path?: string;
    subItems?: RiderNavSubItem[];
  }

  const riderNavSections: RiderNavSection[] = [
    { title: 'Dashboard', icon: 'grid_view', path: '/rider' },
    {
      title: 'Deliveries',
      icon: 'local_shipping',
      path: '/rider',
      subItems: [
        { name: 'Available Deliveries', path: '/rider' },
        { name: 'Accepted Deliveries', path: '/rider' },
        { name: 'Pickups & In-Transit', path: '/rider' },
        { name: 'Completed & History', path: '/rider' },
      ],
    },
    {
      title: 'Navigation & Map',
      icon: 'map',
      path: '/rider',
      subItems: [
        { name: 'Delivery Map', path: '/rider' },
        { name: 'Route Optimization', path: '/rider' },
      ],
    },
    {
      title: 'Earnings & Wallet',
      icon: 'payments',
      path: '/rider',
      subItems: [
        { name: 'Daily & Weekly Earnings', path: '/rider' },
        { name: 'Wallet & Payouts', path: '/rider' },
      ],
    },
    {
      title: 'Messages & Support',
      icon: 'chat',
      path: '/rider',
      subItems: [
        { name: 'Customer Communication', path: '/rider' },
        { name: 'Admin Support', path: '/rider' },
      ],
    },
    { title: 'Notifications', icon: 'notifications', path: '/rider' },
    { title: 'Ratings & Reviews', icon: 'star', path: '/rider' },
    {
      title: 'Documents & Verification',
      icon: 'description',
      path: '/rider/apply',
      subItems: [
        { name: "Driver's License", path: '/rider/apply' },
        { name: 'National ID (Ghana Card)', path: '/rider/apply' },
        { name: 'Vehicle Info & Insurance', path: '/rider/apply' },
        { name: 'Application Status', path: '/rider/application-status' },
      ],
    },
    {
      title: 'Rider Settings',
      icon: 'settings',
      path: '/rider/apply',
      subItems: [
        { name: 'Online / Offline Status', path: '/rider' },
        { name: 'Verification & Profile', path: '/rider/apply' },
        { name: 'Check Status', path: '/rider/application-status' },
      ],
    },
  ];

  const [expandedRiderSections, setExpandedRiderSections] = useState<Record<string, boolean>>({
    Deliveries: true,
  });
  const [riderBreakdown, setRiderBreakdown] = useState<{
    baseFare: number;
    incentives: number;
    tips: number;
    hourlyDistribution: number[];
    walletBalance: number;
  }>({
    baseFare: 0,
    incentives: 0,
    tips: 0,
    hourlyDistribution: [0, 0, 0, 0, 0, 0, 0],
    walletBalance: 0,
  });

  useEffect(() => {
    fetch('/api/rider/stats')
      .then(res => res.json())
      .then(data => {
        if (data && data.baseFare !== undefined) {
          setRiderBreakdown({
            baseFare: data.baseFare || 0,
            incentives: data.incentives || 0,
            tips: data.tips || 0,
            hourlyDistribution: data.hourlyDistribution || [0, 0, 0, 0, 0, 0, 0],
            walletBalance: data.walletBalance || 0,
          });
        }
      })
      .catch(err => console.error('Failed to load rider stats extra:', err));
  }, []);

  const toggleRiderSection = (title: string) => {
    setExpandedRiderSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  if (authLoading || !user || (user.role !== 'rider' && user.role !== 'super_admin')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
      </div>
    );
  }

  const riderName = user?.name || 'Abdul Rahman';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--on-surface)', fontFamily: 'var(--font-inter)', width: '100%', overflowX: 'hidden' }}>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}

      {/* Dark Navy Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px',
        backgroundColor: '#0F172A', color: '#FFFFFF',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        overflowY: 'auto',
      }} className="md:translate-x-0">
        {/* Brand Header */}
        <div style={{ padding: '24px 20px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>two_wheeler</span>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: '1.1rem', color: '#FFF' }}>Africart 2.0</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>Rider</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
            style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', width: '32px', height: '32px', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Rider Profile Card */}
        <div style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1E293B', border: '2px solid #2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
              {riderName.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{riderName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700 }}>★ {stats.rating || 4.8}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.18)', padding: '2px 8px', borderRadius: '100px' }}>
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {riderNavSections.map((sec, idx) => {
            const hasSub = sec.subItems && sec.subItems.length > 0;
            const isExpanded = !!expandedRiderSections[sec.title];
            const isActive = idx === 0;

            if (!hasSub) {
              return (
                <Link
                  key={sec.title}
                  href={sec.path || '/rider'}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    backgroundColor: isActive ? '#2563EB' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? '#FFF' : '#64748B' }}>{sec.icon}</span>
                    <span>{sec.title}</span>
                  </div>
                </Link>
              );
            }

            return (
              <div key={sec.title} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => toggleRiderSection(sec.title)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderRadius: '12px',
                    color: '#94A3B8',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#2563EB' }}>{sec.icon}</span>
                    <span>{sec.title}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#64748B', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    expand_more
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '24px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: '2px', marginBottom: '4px', gap: '2px' }}>
                    {sec.subItems!.map((sub, sIdx) => (
                      <Link
                        key={sIdx}
                        href={sub.path || '/rider'}
                        onClick={() => setSidebarOpen(false)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          color: '#93C5FD',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          fontWeight: 400,
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Actions: View storefront & Logout */}
        <div style={{ padding: '16px 14px 24px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              color: '#FFFFFF',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxSizing: 'border-box',
              transition: 'background-color 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ marginRight: '14px', fontSize: '20px', color: '#60A5FA' }}>storefront</span>
            <span>View storefront</span>
          </Link>
          <button
            onClick={() => { logout(); window.location.href = '/'; }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              color: '#FF6B6B',
              backgroundColor: 'rgba(255,107,107,0.08)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          >
            <span className="material-symbols-outlined" style={{ marginRight: '14px', fontSize: '20px' }}>logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: '0px' }} className="md:ml-[260px]">
        {/* Header Bar matching Rider mobile spec: Profile + Online Status Switch */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--outline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Left: Hamburger & Rider Profile Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px', flexShrink: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
            </button>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
              {riderName.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{riderName}</div>
              <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                Online
              </div>
            </div>
          </div>

          {/* Right: SOS Emergency Button & Online Status Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={handleTriggerSos}
              disabled={sosSending}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '100px',
                fontWeight: 900,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sos</span>
              <span>{sosSending ? 'ALERTING...' : 'SOS'}</span>
            </button>

            <div
              onClick={toggleOnlineStatus}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-container)',
                padding: '5px 12px',
                borderRadius: '100px',
                border: `1px solid ${isOnline ? '#10B981' : 'var(--outline)'}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isOnline ? '#10B981' : 'var(--on-surface-variant)' }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <div style={{
                width: '32px', height: '18px', borderRadius: '10px',
                backgroundColor: isOnline ? '#10B981' : 'var(--on-surface-variant)',
                position: 'relative', transition: 'background 0.2s ease',
              }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  position: 'absolute', top: '2px', left: isOnline ? '16px' : '2px',
                  transition: 'left 0.2s ease',
                }} />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main style={{ flex: 1, padding: '16px', paddingBottom: '84px', overflowY: 'auto', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Welcome Banner */}
            <div>
              <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                Good morning, {riderName} 👋
              </h1>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem', marginTop: '4px' }}>
                You're online and ready to receive deliveries.
              </p>
            </div>

            {/* 2-Column Mobile Stat Cards Grid matching mobile wireframe spec */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              width: '100%',
            }} className="sm:grid-cols-2 md:grid-cols-4">
              {[
                { title: "Today's Earnings", val: `GHS ${stats.todayEarnings.toFixed(2)}`, icon: 'payments', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
                { title: 'Deliveries Completed', val: stats.todayDeliveries, icon: 'check_circle', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
                { title: 'Active Deliveries', val: currentOrder ? 1 : availableOrders.length, icon: 'local_shipping', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
                { title: 'Acceptance Rate', val: `${stats.onTimeRate}%`, icon: 'thumb_up', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' },
              ].map((card, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1px solid var(--outline)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: 0,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    backgroundColor: card.bg, color: card.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{card.icon}</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</div>
                    <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)', fontWeight: 700, color: 'var(--on-surface)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {card.val}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Links List matching Rider Mobile Screen 1 */}
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              padding: '12px',
              border: '1px solid var(--outline)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              {[
                { label: 'Go to Deliveries', icon: 'local_shipping', count: String(currentOrder ? 1 : availableOrders.length) },
                { label: 'Earnings', icon: 'payments' },
                { label: 'Wallet', icon: 'account_balance_wallet', value: `GHS ${(riderBreakdown.walletBalance || 0).toFixed(2)}` },
                { label: 'Performance', icon: 'star' },
                { label: 'History', icon: 'history' },
                { label: 'Help & Support', icon: 'help_outline' },
                { label: 'Settings', icon: 'settings' },
              ].map((link, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-container)',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#2563EB' }}>{link.icon}</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--on-surface)' }}>{link.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {link.count && (
                      <span style={{ backgroundColor: '#2563EB', color: '#FFF', fontSize: '0.72rem', fontWeight: 700, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {link.count}
                      </span>
                    )}
                    {link.value && (
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--on-surface)' }}>
                        {link.value}
                      </span>
                    )}
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--on-surface-variant)' }}>chevron_right</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle Grid: Active Deliveries & Earnings Overview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '20px',
              alignItems: 'start',
              width: '100%',
            }}>
              {/* Active Deliveries List */}
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid var(--outline)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflow: 'hidden',
                minWidth: 0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                    Active Deliveries
                  </h3>
                  <button style={{ color: '#2563EB', fontSize: '0.78rem', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View All
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentOrder ? (
                    <div style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-container)',
                      border: '1px solid var(--outline)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      minWidth: 0,
                    }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: '#2563EB', color: '#FFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                        }}>
                          1
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>#{currentOrder.orderId}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Pick up: <strong>{currentOrder.vendorName}</strong>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Drop-off: <strong>{currentOrder.customerAddress}</strong>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>
                            {currentOrder.estimatedTime} mins away
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={confirmDelivery}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                        }}
                      >
                        Confirm Code
                      </button>
                    </div>
                  ) : mockActiveDeliveries.map((delivery, idx) => (
                    <div key={idx} style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--surface-container)',
                      border: '1px solid var(--outline)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      minWidth: 0,
                    }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: '#2563EB', color: '#FFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{delivery.id}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Pick up: <strong>{delivery.pickup}</strong>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Drop-off: <strong>{delivery.dropoff}</strong>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600, marginTop: '2px' }}>
                            {delivery.eta}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={confirmDelivery}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                        }}
                      >
                        Navigate
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings Overview */}
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid var(--outline)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflow: 'hidden',
                minWidth: 0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                    Earnings Overview
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', backgroundColor: 'var(--surface-container)', padding: '3px 8px', borderRadius: '6px' }}>
                    Today
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--on-surface)' }}>
                    GHS {stats.todayEarnings.toFixed(2)}
                  </span>
                  <span style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 700 }}>live earnings</span>
                </div>

                {/* Earnings Hourly Bar Chart */}
                <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid var(--outline)' }}>
                  {riderBreakdown.hourlyDistribution.map((amt, i) => {
                    const maxAmt = Math.max(...riderBreakdown.hourlyDistribution, 1);
                    const pct = Math.max((amt / maxAmt) * 100, 10);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: '100%', height: `${pct}%`,
                          backgroundColor: i === 4 ? '#2563EB' : 'rgba(37, 99, 235, 0.25)',
                          borderRadius: '4px 4px 2px 2px',
                        }} />
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: '0.68rem', fontWeight: 600 }}>
                  <span>12 AM</span>
                  <span>4 AM</span>
                  <span>8 AM</span>
                  <span>12 PM</span>
                  <span>4 PM</span>
                  <span>8 PM</span>
                  <span>11 PM</span>
                </div>

                {/* Earnings Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>Base Fare</span>
                    <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>GHS {riderBreakdown.baseFare.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>Incentives</span>
                    <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>GHS {riderBreakdown.incentives.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>Tips</span>
                    <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>GHS {riderBreakdown.tips.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Performance & Wallet Balance */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '20px',
              alignItems: 'start',
              width: '100%',
            }}>
              {/* Performance */}
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid var(--outline)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                overflow: 'hidden',
                minWidth: 0,
              }}>
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                  Performance
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                  <div style={{ padding: '12px 8px', backgroundColor: 'var(--surface-container)', borderRadius: '10px', minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--on-surface)' }}>{stats.rating || 4.8}</div>
                    <div style={{ color: '#F59E0B', fontSize: '0.75rem', margin: '2px 0' }}>★★★★★</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Customer Rating</div>
                  </div>
                  <div style={{ padding: '12px 8px', backgroundColor: 'var(--surface-container)', borderRadius: '10px', minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--on-surface)' }}>{stats.onTimeRate || 98}%</div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', margin: '2px 0' }}>On-Time Rate</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Completion Rate</div>
                  </div>
                  <div style={{ padding: '12px 8px', backgroundColor: 'var(--surface-container)', borderRadius: '10px', minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--on-surface)' }}>
                      {stats.avgDeliveryTime > 0 ? `${stats.avgDeliveryTime} mins` : '—'}
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', margin: '2px 0' }}>Good</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Avg Delivery</div>
                  </div>
                </div>
              </div>

              {/* Wallet Balance */}
              <div style={{
                backgroundColor: 'var(--surface)',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid var(--outline)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflow: 'hidden',
                minWidth: 0,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                    Wallet Balance
                  </h3>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Available Balance</div>
                    <div style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.6rem', fontWeight: 800, marginTop: '2px' }}>
                      GHS {(riderBreakdown.walletBalance || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#2563EB', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                      Withdraw
                    </button>
                    <button style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                      Transactions
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Mobile Bottom Bar */}
        <nav className="md:hidden" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--outline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 40,
        }}>
          {[
            { id: 'home', name: 'Home', icon: 'home' },
            { id: 'deliveries', name: 'Deliveries', icon: 'local_shipping' },
            { id: 'earnings', name: 'Earnings', icon: 'payments' },
            { id: 'wallet', name: 'More', icon: 'more_horiz' },
          ].map(tab => {
            const isActive = activeMobileTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMobileTab(tab.id as any)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  color: isActive ? '#2563EB' : 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Verification Code Modal */}
      {showCodeModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '20px', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--on-surface)' }}>Confirm Delivery</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>Enter the 4-digit code provided by the customer to complete this delivery.</p>
            <input
              type="text"
              maxLength={4}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="0 0 0 0"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '2px solid var(--outline)',
                backgroundColor: 'var(--surface-container)',
                textAlign: 'center',
                fontSize: '1.4rem',
                letterSpacing: '8px',
                fontWeight: 800,
                outline: 'none',
                marginBottom: '16px',
                color: 'var(--on-surface)',
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowCodeModal(false); setVerificationCode(''); }}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: 'var(--surface-container-high)', border: 'none', color: 'var(--on-surface-variant)', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitDeliveryCode}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: '#2563EB', border: 'none', color: '#FFFFFF', fontWeight: 700, cursor: 'pointer' }}
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
