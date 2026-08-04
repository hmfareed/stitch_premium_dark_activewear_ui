'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';
import AdminHeaderSearch from '@/components/AdminHeaderSearch';
import AdminHeaderNotifications from '@/components/AdminHeaderNotifications';

interface NavItem {
  title: string;
  icon: string;
  path: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: 'MANAGEMENT',
    items: [
      { title: 'Dashboard', icon: 'grid_view', path: '/admin' },
      { title: 'Vendors', icon: 'storefront', path: '/admin/vendors' },
      { title: 'Customer Management', icon: 'group', path: '/admin/customers' },
      { title: 'Stores', icon: 'store', path: '/admin/stores' },
      { title: 'Cashiers', icon: 'badge', path: '/admin/admins' },
      { title: 'Roles & Permissions', icon: 'admin_panel_settings', path: '/admin/admins' },
      { title: 'Subscriptions', icon: 'card_membership', path: '/admin/subscriptions' },
      { title: 'KYC Verifications', icon: 'verified_user', path: '/admin/vendors' },
    ],
  },
  {
    group: 'BUSINESS',
    items: [
      { title: 'Products', icon: 'inventory_2', path: '/admin/products' },
      { title: 'Inventory', icon: 'warehouse', path: '/admin/inventory' },
      { title: 'Categories', icon: 'category', path: '/admin/products' },
      { title: 'Brands', icon: 'branding_watermark', path: '/admin/products' },
      { title: 'Orders', icon: 'shopping_bag', path: '/admin/orders' },
      { title: 'Transactions', icon: 'payments', path: '/admin/finance' },
      { title: 'Commissions & Fees', icon: 'account_balance_wallet', path: '/admin/fees' },
      { title: 'Payouts', icon: 'account_balance', path: '/admin/payouts' },
      { title: 'Promotions', icon: 'campaign', path: '/admin/campaigns' },
    ],
  },
  {
    group: 'REPORTS',
    items: [
      { title: 'Reports & Analytics', icon: 'analytics', path: '/admin/reports' },
      { title: 'Sales Report', icon: 'description', path: '/admin/reports' },
      { title: 'Vendors Report', icon: 'summarize', path: '/admin/reports' },
      { title: 'Financial Report', icon: 'request_quote', path: '/admin/reports' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { title: 'System Settings', icon: 'settings', path: '/admin/settings' },
      { title: 'Notifications', icon: 'notifications', path: '/admin/settings' },
      { title: 'Audit Logs', icon: 'history', path: '/admin/audit-logs' },
      { title: 'Support Tickets', icon: 'support_agent', path: '/admin/tickets' },
      { title: 'CMS Content', icon: 'wysiwyg', path: '/admin/cms' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/');
      } else if (user.role === 'vendor') {
        router.replace('/vendor');
      } else if (user.role !== 'super_admin') {
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'super_admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b', fontFamily: 'var(--font-inter, sans-serif)', width: '100%' }}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease-in-out',
          boxShadow: '2px 0 12px rgba(0,0,0,0.03)',
        }}
        className="md:translate-x-0"
      >
        {/* Dark Emerald Header Box */}
        <div style={{
          backgroundColor: '#043729',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 38,15 C 48,13 62,11 72,18 C 76,21 75,27 79,31 C 82,34 86,36 86,41 C 86,47 80,51 77,55 C 73,60 70,66 65,72 C 60,78 57,85 52,91 C 51,93 49,93 48,91 C 45,84 44,77 42,71 C 40,66 38,62 33,59 C 28,56 22,55 18,50 C 13,44 11,36 15,29 C 18,22 27,17 38,15 Z"
                stroke="#c3f400"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M 33,40 L 39,46 L 68,46" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 39,46 L 43,62 L 63,62 L 68,46 Z" fill="rgba(212, 175, 55, 0.2)" stroke="#D4AF37" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="43" cy="74" r="5" fill="#D4AF37" />
              <circle cx="59" cy="74" r="5" fill="#D4AF37" />
            </svg>
            <div>
              <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, fontSize: '1.2rem', color: '#ffffff', lineHeight: 1 }}>
                <span style={{ color: '#c3f400' }}>Afri</span>Cart
              </div>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#c3f400' }}>verified</span>
                Super Admin
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Sidebar View Marketplace Action Button */}
        <div style={{ padding: '12px 14px 4px 14px' }}>
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>storefront</span>
            <span>View Marketplace</span>
          </Link>
        </div>

        {/* Sidebar Nav Groups */}
        <nav style={{ flex: 1, padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {navGroups.map((group) => (
            <div key={group.group}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8, paddingLeft: 10 }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((item) => {
                  const isActive = item.path === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.path);
                  return (
                    <Link
                      key={item.title}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '9px 12px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#15803d' : '#475569',
                        backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 20, color: isActive ? '#16a34a' : '#64748b' }}
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

        {/* Bottom Profile Section */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#15803d', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                SA
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  Super Admin
                </div>
                <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.email || 'superadmin@africart.com'}
                </div>
              </div>
            </div>
            <button
              onClick={() => { logout(); window.location.href = '/'; }}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: 4 }}
              title="Sign Out"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="md:ml-[260px]">
        {/* Top Header Bar */}
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
          {/* Left: Mobile Toggle & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', display: 'flex', padding: 4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>menu</span>
            </button>
            <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
              Super Admin
            </div>
          </div>

          {/* Right: Interactive Predictive Search & Real-time Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AdminHeaderSearch />
            <AdminHeaderNotifications />
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {children}
        </main>

        {/* Footer matching screenshot */}
        <footer style={{ padding: '16px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b', gap: 12 }}>
          <div>© 2025 AfriCart. All rights reserved.</div>
          <div>Made with ❤️ in Africa</div>
        </footer>
      </div>
    </div>
  );
}
