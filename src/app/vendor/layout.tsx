'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useStore } from '@/context/AppContext';
import AdminHeaderSearch from '@/components/AdminHeaderSearch';
import VendorHeaderNotifications from '@/components/VendorHeaderNotifications';

interface VendorNavGroup {
  group: string;
  items: {
    title: string;
    icon: string;
    path: string;
    badge?: string;
  }[];
}

const VENDOR_NAV_GROUPS: VendorNavGroup[] = [
  {
    group: 'SALES',
    items: [
      { title: 'POS', icon: 'point_of_sale', path: '/vendor/pos' },
      { title: 'Orders', icon: 'shopping_bag', path: '/vendor/orders' },
      { title: 'Returns', icon: 'replay', path: '/vendor/returns' },
    ],
  },
  {
    group: 'CATALOG',
    items: [
      { title: 'Products', icon: 'inventory_2', path: '/vendor/products' },
      { title: 'Categories', icon: 'category', path: '/vendor/categories' },
      { title: 'Brands', icon: 'branding_watermark', path: '/vendor/brands' },
    ],
  },
  {
    group: 'INVENTORY',
    items: [
      { title: 'Stock In', icon: 'move_to_inbox', path: '/vendor/inventory/stock-in' },
      { title: 'Stock Out', icon: 'outbox', path: '/vendor/inventory/stock-out' },
      { title: 'Transfers', icon: 'sync_alt', path: '/vendor/inventory/transfers' },
      { title: 'Adjustments', icon: 'tune', path: '/vendor/inventory/adjustments' },
      { title: 'Warehouses', icon: 'warehouse', path: '/vendor/inventory/warehouses' },
    ],
  },
  {
    group: 'CUSTOMERS',
    items: [
      { title: 'Customers', icon: 'group', path: '/vendor/customers' },
      { title: 'Loyalty Points', icon: 'card_giftcard', path: '/vendor/loyalty' },
    ],
  },
  {
    group: 'FINANCE',
    items: [
      { title: 'Sales Analytics', icon: 'insights', path: '/vendor/analytics' },
      { title: 'Expenses', icon: 'receipt_long', path: '/vendor/finance/expenses' },
      { title: 'Payments & Payouts', icon: 'payments', path: '/vendor/payouts' },
    ],
  },
  {
    group: 'REPORTS',
    items: [
      { title: 'Reports', icon: 'assessment', path: '/vendor/reports' },
    ],
  },
  {
    group: 'SETTINGS',
    items: [
      { title: 'Store Settings', icon: 'settings', path: '/vendor/settings' },
      { title: 'Users & Cashiers', icon: 'badge', path: '/vendor/staff' },
      { title: 'Payment Methods', icon: 'credit_card', path: '/vendor/settings/payments' },
      { title: 'Taxes & Charges', icon: 'request_quote', path: '/vendor/settings/taxes' },
    ],
  },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { vendorStore, vendorStoreLoading } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('Fresh Mart - Main Branch');

  // Auth Guard
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'vendor' && user.role !== 'super_admin') {
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || (user.role !== 'vendor' && user.role !== 'super_admin')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#0f172a' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #10b981', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: 13, color: '#15803d', fontWeight: 600 }}>Loading Vendor Dashboard...</span>
        </div>
      </div>
    );
  }

  const storeName = vendorStore?.name || user.name || "Fresh Mart";
  const userDisplayName = user.name || storeName || "Kofi Mensah";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', color: '#1e293b', fontFamily: 'var(--font-inter, sans-serif)' }}>
      
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', zIndex: 40 }}
        />
      )}

      {/* Left Sidebar Navigation matching reference image */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform 0.25s ease',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="md:translate-x-0"
      >
        {/* Top Header Logo Box matching spec screenshot */}
        <div style={{ backgroundColor: '#0B3B24', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 38,15 C 48,13 62,11 72,18 C 76,21 75,27 79,31 C 82,34 86,36 86,41 C 86,47 80,51 77,55 C 73,60 70,66 65,72 C 60,78 57,85 52,91 C 51,93 49,93 48,91 C 45,84 44,77 42,71 C 40,66 38,62 33,59 C 28,56 22,55 18,50 C 13,44 11,36 15,29 C 18,22 27,17 38,15 Z"
                stroke="#c3f400"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M 33,40 L 39,46 L 68,46" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 39,46 L 43,62 L 63,62 L 68,46 Z" fill="rgba(255, 255, 255, 0.2)" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="43" cy="74" r="5" fill="#c3f400" />
              <circle cx="59" cy="74" r="5" fill="#c3f400" />
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, fontSize: '1.25rem', color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                <span style={{ color: '#c3f400' }}>Afri</span>
                <span style={{ color: '#ffffff' }}>Cart</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#a3e635', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 2 }}>
                Vendor Panel
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* View Marketplace Link */}
        <div style={{ padding: '12px 14px 4px 14px' }}>
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>storefront</span>
            <span>View Marketplace</span>
          </Link>
        </div>

        {/* Dashboard Main Link */}
        <div style={{ padding: '4px 14px 0' }}>
          <Link
            href="/vendor"
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: pathname === '/vendor' ? 700 : 500,
              color: pathname === '/vendor' ? '#15803d' : '#475569',
              backgroundColor: pathname === '/vendor' ? '#dcfce7' : 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: pathname === '/vendor' ? '#16a34a' : '#64748b' }}>
              space_dashboard
            </span>
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Nav Groups Scrollable List matching reference screenshot */}
        <nav style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {VENDOR_NAV_GROUPS.map((group) => (
            <div key={group.group}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 6, paddingLeft: 10, textTransform: 'uppercase' }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((item) => {
                  const isActive = pathname?.startsWith(item.path);
                  return (
                    <Link
                      key={item.title}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#15803d' : '#475569',
                        backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 18, color: isActive ? '#16a34a' : '#64748b' }}
                      >
                        {item.icon}
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Profile Section */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#0B3B24', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, border: '1px solid #10b981', flexShrink: 0 }}>
                {userDisplayName.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {userDisplayName}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  Vendor Account
                </div>
              </div>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 4 }}
              title="Logout"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="md:ml-[260px]">
        
        {/* Top Header Bar matching screenshot */}
        <header style={{
          height: '64px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Left: Mobile Toggle & Page Identifier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', display: 'flex', padding: 4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
            </button>
          </div>

          {/* Right Header Controls: Branch Selector + Search + Notifications + Profile Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Branch / Store Selector Dropdown */}
            <div style={{ position: 'relative' }} className="hidden sm:flex">
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                style={{
                  padding: '6px 32px 6px 36px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                <option value="Fresh Mart - Main Branch">{storeName} - Main Branch</option>
                <option value="Fresh Mart - Osu Branch">{storeName} - Osu Branch</option>
                <option value="Fresh Mart - East Legon Branch">{storeName} - East Legon Branch</option>
              </select>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: 7, fontSize: 18, color: '#10b981', pointerEvents: 'none' }}>
                store
              </span>
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: 10, top: 7, fontSize: 16, color: '#94a3b8', pointerEvents: 'none' }}>
                expand_more
              </span>
            </div>

            {/* Interactive Predictive Search */}
            <AdminHeaderSearch />

            {/* Corner Notification Popover */}
            <VendorHeaderNotifications />

            {/* Header User Avatar Dropdown matching screenshot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} className="hidden sm:flex">
              <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#0B3B24', color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, border: '2px solid #10b981' }}>
                {userDisplayName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{userDisplayName}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Vendor</div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94a3b8' }}>expand_more</span>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

    </div>
  );
}
