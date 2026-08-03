'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useStore } from '@/context/AppContext';

interface VendorNavSubItem {
  name: string;
  path: string;
}

interface VendorNavSection {
  title: string;
  icon: string;
  path?: string;
  subItems?: VendorNavSubItem[];
}

const vendorNavSections: VendorNavSection[] = [
  { title: 'Dashboard', icon: 'grid_view', path: '/vendor' },
  {
    title: 'Products & Catalog',
    icon: 'inventory_2',
    path: '/vendor/products',
    subItems: [
      { name: 'All Products', path: '/vendor/products' },
      { name: 'Add Product', path: '/vendor/products' },
      { name: 'Stock & Inventory', path: '/vendor/products' },
    ],
  },
  {
    title: 'Orders & Sales',
    icon: 'shopping_bag',
    path: '/vendor/orders',
    subItems: [
      { name: 'All Orders', path: '/vendor/orders' },
      { name: 'Pending Orders', path: '/vendor/orders' },
      { name: 'Processing', path: '/vendor/orders' },
      { name: 'Ready for Pickup', path: '/vendor/orders' },
      { name: 'Delivered', path: '/vendor/orders' },
    ],
  },
  { title: 'Customers', icon: 'group', path: '/vendor/customers' },
  {
    title: 'Earnings & Payouts',
    icon: 'account_balance_wallet',
    path: '/vendor/payouts',
    subItems: [
      { name: 'Payout History', path: '/vendor/payouts' },
      { name: 'Request Payout', path: '/vendor/payouts' },
      { name: 'Bank & MoMo Setup', path: '/vendor/payouts' },
    ],
  },
  { title: 'Analytics & Reports', icon: 'analytics', path: '/vendor/analytics' },
  {
    title: 'Promotions & Ads',
    icon: 'campaign',
    path: '/vendor/promotions',
    subItems: [
      { name: 'Store Coupons', path: '/vendor/promotions' },
      { name: 'Flash Sales', path: '/vendor/promotions' },
      { name: 'Ad Campaigns', path: '/vendor/campaigns' },
    ],
  },
  { title: 'Consignment', icon: 'warehouse', path: '/vendor/consignment' },
  { title: 'Staff & Team', icon: 'badge', path: '/vendor/staff' },
  {
    title: 'Messages & Support',
    icon: 'chat',
    path: '/vendor/messages',
    subItems: [
      { name: 'Customer Chats', path: '/vendor/messages' },
      { name: 'Admin Support', path: '/vendor/messages' },
    ],
  },
  { title: 'Notifications', icon: 'notifications', path: '/vendor/settings?tab=notifications' },
  {
    title: 'Store Settings',
    icon: 'storefront',
    path: '/vendor/settings?tab=store',
    subItems: [
      { name: 'Store Profile', path: '/vendor/settings?tab=store' },
      { name: 'Logo & Banner', path: '/vendor/settings?tab=store' },
      { name: 'Business Information', path: '/vendor/settings?tab=store' },
      { name: 'Bank Details', path: '/vendor/payouts' },
      { name: 'Delivery Locations', path: '/vendor/settings?tab=delivery' },
    ],
  },
  { title: 'Subscription & Billing', icon: 'card_membership', path: '/vendor/billing' },
  { title: 'Account & Verification', icon: 'verified', path: '/vendor/settings?tab=verification' },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { allProducts, vendorStore, vendorStoreLoading, vendorStoreError, refreshVendorStore } = useStore();

  const [expandedVendorSections, setExpandedVendorSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/');
      } else if (user.role !== 'vendor' && user.role !== 'super_admin') {
        router.replace('/');
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

  useEffect(() => {
    vendorNavSections.forEach((sec) => {
      if (sec.path && pathname?.startsWith(sec.path) && sec.path !== '/vendor') {
        setExpandedVendorSections((prev) => ({ ...prev, [sec.title]: true }));
      }
    });
  }, [pathname]);

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

  const storeName = vendorStore?.name || "Ree's Store";
  const storeInitials = storeName.substring(0, 2).toUpperCase();
  const vendorEmail = vendorStore?.vendorEmail || user.email;
  const lowStockAlerts = allProducts.filter(p => p.vendorEmail === vendorEmail && (p.stock || 0) <= 5);

  interface VendorNavSubItem {
    name: string;
    path: string;
  }

  interface VendorNavSection {
    title: string;
    icon: string;
    path?: string;
    badge?: string;
    subItems?: VendorNavSubItem[];
  }

  const vendorNavSections: VendorNavSection[] = [
    { title: 'Dashboard', icon: 'grid_view', path: '/vendor' },
    {
      title: 'Orders',
      icon: 'shopping_bag',
      path: '/vendor/orders',
      subItems: [
        { name: 'New Orders', path: '/vendor/orders' },
        { name: 'Processing', path: '/vendor/orders' },
        { name: 'Ready for Pickup', path: '/vendor/orders' },
        { name: 'Picked Up', path: '/vendor/orders' },
        { name: 'Delivered', path: '/vendor/orders' },
        { name: 'Cancelled', path: '/vendor/orders' },
        { name: 'Returns', path: '/vendor/orders' },
      ],
    },
    {
      title: 'Products',
      icon: 'inventory_2',
      path: '/vendor/products',
      subItems: [
        { name: 'All Products', path: '/vendor/products' },
        { name: 'Add Product', path: '/vendor/products' },
        { name: 'Draft Products', path: '/vendor/products' },
        { name: 'Inventory', path: '/vendor/products' },
        { name: 'Categories', path: '/vendor/products' },
        { name: 'Product Reviews', path: '/vendor/products' },
      ],
    },
    { title: 'Customers', icon: 'people', path: '/vendor/customers' },
    {
      title: 'Sales & Analytics',
      icon: 'analytics',
      path: '/vendor/analytics',
      subItems: [
        { name: 'Sales Reports', path: '/vendor/analytics' },
        { name: 'Best Selling Products', path: '/vendor/analytics' },
        { name: 'Revenue Overview', path: '/vendor/analytics' },
      ],
    },
    {
      title: 'Finance & Payouts',
      icon: 'account_balance_wallet',
      path: '/vendor/payouts',
      subItems: [
        { name: 'Wallet & Balance', path: '/vendor/payouts' },
        { name: 'Withdraw Earnings', path: '/vendor/payouts' },
        { name: 'Transactions', path: '/vendor/payouts' },
        { name: 'Payout History', path: '/vendor/payouts' },
      ],
    },
    { title: 'Billing & Plans', icon: 'credit_card', path: '/vendor/billing' },
    {
      title: 'Shipping & Delivery',
      icon: 'local_shipping',
      path: '/vendor/settings?tab=delivery',
      subItems: [
        { name: 'Shipping Settings', path: '/vendor/settings?tab=delivery' },
        { name: 'Pickup Address', path: '/vendor/settings?tab=delivery' },
      ],
    },
    {
      title: 'Marketing & Promos',
      icon: 'campaign',
      path: '/vendor/promotions',
      subItems: [
        { name: 'Discounts & Coupons', path: '/vendor/promotions' },
        { name: 'Ad Campaigns', path: '/vendor/campaigns' },
      ],
    },
    { title: 'Consignment', icon: 'warehouse', path: '/vendor/consignment' },
    { title: 'Staff & Team', icon: 'badge', path: '/vendor/staff' },
    {
      title: 'Messages & Support',
      icon: 'chat',
      path: '/vendor/messages',
      subItems: [
        { name: 'Customer Chats', path: '/vendor/messages' },
        { name: 'Admin Support', path: '/vendor/messages' },
      ],
    },
    { title: 'Notifications', icon: 'notifications', path: '/vendor/settings?tab=notifications' },
    {
      title: 'Store Settings',
      icon: 'storefront',
      path: '/vendor/settings?tab=store',
      subItems: [
        { name: 'Store Profile', path: '/vendor/settings?tab=store' },
        { name: 'Logo & Banner', path: '/vendor/settings?tab=store' },
        { name: 'Business Information', path: '/vendor/settings?tab=store' },
        { name: 'Bank Details', path: '/vendor/payouts' },
        { name: 'Delivery Locations', path: '/vendor/settings?tab=delivery' },
      ],
    },
    { title: 'Account & Verification', icon: 'verified', path: '/vendor/settings?tab=verification' },
  ];

  const toggleVendorSection = (title: string) => {
    setExpandedVendorSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

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
          {vendorNavSections.map((sec) => {
            const hasSub = sec.subItems && sec.subItems.length > 0;
            const isExpanded = !!expandedVendorSections[sec.title];
            const isActive = sec.path === '/vendor'
              ? pathname === '/vendor'
              : sec.path && pathname?.startsWith(sec.path);

            if (!hasSub) {
              return (
                <Link
                  key={sec.title}
                  href={sec.path || '/vendor'}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    color: isActive ? '#FFFFFF' : '#88D1A3',
                    backgroundColor: isActive ? '#10B981' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? '#FFF' : '#65B883' }}>{sec.icon}</span>
                    <span>{sec.title}</span>
                  </div>
                </Link>
              );
            }

            return (
              <div key={sec.title} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => toggleVendorSection(sec.title)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    color: isActive ? '#FFFFFF' : '#88D1A3',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.88rem',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? '#10B981' : '#65B883' }}>{sec.icon}</span>
                    <span>{sec.title}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#65B883', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    expand_more
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '24px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: '2px', marginBottom: '4px', gap: '2px' }}>
                    {sec.subItems!.map((sub, idx) => (
                      <Link
                        key={idx}
                        href={sub.path}
                        onClick={() => setSidebarOpen(false)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          color: '#A3E635',
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
        <div style={{ padding: '16px 14px 24px 14px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
            <span className="material-symbols-outlined" style={{ marginRight: '14px', fontSize: '20px', color: '#A3E635' }}>storefront</span>
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
