'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useStore } from '@/context/AppContext';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { allProducts, vendorStore, vendorStoreLoading, vendorStoreError, refreshVendorStore } = useStore();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'vendor' && user.role !== 'super_admin') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  const isOnboardingRoute = pathname?.startsWith('/vendor/onboarding');
  useEffect(() => {
    const cachedStore = typeof window !== 'undefined' ? localStorage.getItem('africart-vendor-store') : null;
    const hasStore = !!(vendorStore || cachedStore);

    if (
      !isLoading &&
      !vendorStoreLoading &&
      !vendorStoreError &&
      user &&
      (user.role === 'vendor' || user.role === 'super_admin') &&
      !isOnboardingRoute &&
      !hasStore
    ) {
      router.push('/vendor/onboarding');
    }
  }, [isLoading, vendorStoreLoading, vendorStoreError, user, vendorStore, isOnboardingRoute, router]);

  if (isLoading || !user || (user.role !== 'vendor' && user.role !== 'super_admin')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#10B981' }} />
      </div>
    );
  }

  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  if (vendorStoreLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#10B981' }} />
      </div>
    );
  }

  if (vendorStoreError && !vendorStore) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', gap: 16, padding: 24 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--error)' }}>cloud_off</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.2rem', color: 'var(--on-surface)', textAlign: 'center' }}>Couldn't load your store data</h2>
        <button
          onClick={refreshVendorStore}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#10B981', border: 'none', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Retry
        </button>
      </div>
    );
  }

  const storeName = vendorStore?.name || "Ree's Store";
  const storeInitials = storeName.substring(0, 2).toUpperCase();
  const vendorEmail = vendorStore?.vendorEmail || user.email;
  const lowStockAlerts = allProducts.filter(p => p.vendorEmail === vendorEmail && (p.stock || 0) <= 5);

  const menuItems = [
    { name: 'Dashboard', icon: 'grid_view', path: '/vendor' },
    { name: 'Products', icon: 'inventory_2', path: '/vendor/products' },
    { name: 'Orders', icon: 'shopping_bag', path: '/vendor/orders', badge: '24' },
    { name: 'Coupons', icon: 'confirmation_number', path: '/vendor/promotions' },
    { name: 'Customers', icon: 'group', path: '/vendor/customers' },
    { name: 'Analytics', icon: 'analytics', path: '/vendor/analytics' },
    { name: 'Payouts', icon: 'account_balance_wallet', path: '/vendor/payouts' },
    { name: 'Store Settings', icon: 'storefront', path: '/vendor/settings' },
    { name: 'Staff', icon: 'badge', path: '/vendor/staff' },
    { name: 'Messages', icon: 'chat', path: '/vendor/messages', badge: '8' },
    { name: 'Support', icon: 'help_outline', path: '/vendor/support' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--on-surface)', fontFamily: 'var(--font-inter)', width: '100%', overflowX: 'hidden' }}>
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}

      {/* Dark Forest Green Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px',
        backgroundColor: '#062C1A', color: '#FFFFFF',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        overflowY: 'auto',
      }} className="md:translate-x-0">
        {/* Brand Header */}
        <div style={{ padding: '24px 20px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/icon.svg" alt="AfriCart Logo" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                <span style={{ color: '#A3E635' }}>Afri</span><span style={{ color: '#FFFFFF' }}>Cart</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#88D1A3', fontWeight: 500 }}>Vendor</div>
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

        {/* Store Profile Card */}
        <div style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#0B3B24', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
              {storeInitials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storeName}</div>
              <div style={{ marginTop: '2px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.18)', padding: '2px 8px', borderRadius: '100px' }}>
                  Premium Vendor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => {
            const isActive = pathname === item.path || (item.path !== '/vendor' && pathname?.startsWith(item.path));
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  color: isActive ? '#FFFFFF' : '#88D1A3',
                  backgroundColor: isActive ? '#10B981' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? '#FFF' : '#65B883' }}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(16,185,129,0.25)',
                    color: '#FFF',
                    padding: '2px 8px',
                    borderRadius: '100px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 14px 24px 14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => { logout(); router.push('/login'); }}
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
            }}
          >
            <span className="material-symbols-outlined" style={{ marginRight: '14px', fontSize: '20px' }}>logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: '0px' }} className="md:ml-[260px]">
        {/* Header Bar matching Vendor mobile spec */}
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
          {/* Left: Hamburger + Store Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px', flexShrink: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
            </button>
            <div style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {storeName}
            </div>
          </div>

          {/* Right: Search + Notification + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
            </button>
            <button style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', padding: '4px', position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
              {lowStockAlerts.length > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', backgroundColor: 'var(--error)', borderRadius: '50%' }} />
              )}
            </button>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0B3B24', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', border: '2px solid #10B981', flexShrink: 0 }}>
              {storeInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main style={{ flex: 1, padding: '16px', paddingBottom: '84px', overflowY: 'auto', width: '100%' }}>
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
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
            { name: 'Home', icon: 'home', path: '/vendor' },
            { name: 'Orders', icon: 'shopping_bag', path: '/vendor/orders' },
            { name: 'Products', icon: 'inventory_2', path: '/vendor/products' },
            { name: 'More', icon: 'more_horiz', path: '/vendor/settings' },
          ].map(tab => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.name}
                href={tab.path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  color: isActive ? '#10B981' : 'var(--on-surface-variant)',
                  textDecoration: 'none',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{tab.icon}</span>
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
