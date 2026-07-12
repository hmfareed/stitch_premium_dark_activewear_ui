'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'vendor') {
        router.push('/vendor');
      } else if (user.role !== 'super_admin') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'super_admin') {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
      <div className="animate-pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--lime-400)' }} />
    </div>;
  }

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { name: 'Admins & Staff', icon: 'shield_person', path: '/admin/admins' },
    { name: 'Vendors', icon: 'storefront', path: '/admin/vendors' },
    { name: 'Products', icon: 'inventory_2', path: '/admin/products' },
    { name: 'Orders', icon: 'shopping_bag', path: '/admin/orders' },
    { name: 'Customers', icon: 'group', path: '/admin/customers' },
    { name: 'Messages', icon: 'chat', path: '/admin/messages' },
    { name: 'Finance', icon: 'account_balance', path: '/admin/finance' },
    { name: 'Security', icon: 'security', path: '/admin/security' },
    { name: 'Audit Logs', icon: 'history', path: '/admin/audit-logs' },
    { name: 'Compliance', icon: 'gavel', path: '/admin/compliance' },
    { name: 'Settings', icon: 'settings', path: '/admin/settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 30 }}
        />
      )}

      {/* Sidebar Overlay */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '280px',
        backgroundColor: 'var(--surface)', borderRight: '1px solid var(--outline)',
        display: 'flex', flexDirection: 'column', zIndex: 40,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0, background: 'linear-gradient(45deg, var(--lime-400), #00e5ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SUPER ADMIN
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'var(--surface-container)', borderRadius: '50%', width: '32px', height: '32px', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {menuItems.map(item => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname?.startsWith(item.path));
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  color: isActive ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                  backgroundColor: isActive ? 'var(--surface-container-high)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  marginBottom: '8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ marginRight: '16px', fontSize: '22px' }}>{item.icon}</span>
                <span style={{ fontSize: '1rem', fontWeight: isActive ? 600 : 500 }}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--outline)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.9rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>shopping_bag</span>
            View Store Front
          </Link>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'color-mix(in srgb, var(--lime-400) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lime-400)', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
              SA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Super Admin</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        <header style={{ height: '72px', borderBottom: '1px solid var(--outline)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', backgroundColor: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>menu</span>
            </button>
            <h1 className="font-lexend hidden md:block" style={{ fontSize: '1.2rem', margin: 0 }}>SUPER ADMIN</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', position: 'relative' }}>
              <span className="material-symbols-outlined">notifications</span>
              <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: 'var(--error)', borderRadius: '50%' }}></span>
            </button>
            <button style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        <div className="panel-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
