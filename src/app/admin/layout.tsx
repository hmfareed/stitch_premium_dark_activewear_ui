'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

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
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--lime-400)' }} />
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', icon: 'grid_view', path: '/admin' },
    { name: 'Users', icon: 'group', path: '/admin/customers' },
    { name: 'Vendors', icon: 'storefront', path: '/admin/vendors' },
    { name: 'Riders', icon: 'two_wheeler', path: '/admin/riders' },
    { name: 'Orders', icon: 'shopping_bag', path: '/admin/orders' },
    { name: 'Products', icon: 'inventory_2', path: '/admin/products' },
    { name: 'Transactions', icon: 'account_balance_wallet', path: '/admin/finance' },
    { name: 'Reports', icon: 'description', path: '/admin/campaigns' },
    { name: 'Analytics', icon: 'analytics', path: '/admin/compliance' },
    { name: 'Coupons', icon: 'confirmation_number', path: '/admin/campaigns' },
    { name: 'Disputes', icon: 'gavel', path: '/admin/security' },
    { name: 'System Settings', icon: 'settings_suggest', path: '/admin/settings' },
    { name: 'Admins', icon: 'shield_person', path: '/admin/admins' },
    { name: 'Support Tickets', icon: 'confirmation_number', path: '/admin/messages' },
    { name: 'Audit Logs', icon: 'history', path: '/admin/audit-logs' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--on-surface)', fontFamily: 'var(--font-inter)', width: '100%', overflowX: 'hidden' }}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}

      {/* Dark Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px',
        backgroundColor: '#131127', color: '#FFFFFF',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        overflowY: 'auto',
      }} className="md:translate-x-0">
        {/* Brand Header */}
        <div style={{ padding: '24px 20px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/icon.svg" alt="AfriCart Logo" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                <span style={{ color: 'var(--lime-400)' }}>Afri</span><span style={{ color: '#FFFFFF' }}>Cart</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9B96BE', fontWeight: 500 }}>Super Admin</div>
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

        {/* Menu Navigation */}
        <nav style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  padding: '11px 16px',
                  borderRadius: '12px',
                  color: isActive ? '#FFFFFF' : '#9B96BE',
                  backgroundColor: isActive ? 'var(--lime-400)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ marginRight: '14px', fontSize: '20px', color: isActive ? '#FFF' : '#8580AA' }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div style={{ padding: '16px 14px 24px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
        {/* Header Bar: Hamburger inline with Super Admin title, Notification bell on right */}
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
          {/* Left: Hamburger + Super Admin inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
            </button>
            <div style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--on-surface)' }}>
              Super Admin
            </div>
          </div>

          {/* Right: Notification Bell only */}
          <button style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px', position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '7px', height: '7px', backgroundColor: 'var(--error)', borderRadius: '50%' }} />
          </button>
        </header>

        {/* Page Content Container */}
        <main style={{ flex: 1, padding: '16px', overflowY: 'auto', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
