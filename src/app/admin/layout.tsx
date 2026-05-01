'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AdminProvider } from '@/context/AdminContext';
import { useTheme, ThemeMode, useAuth } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isLoading } = useAuth();

  // Role-based protection
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'admin') {
        router.push('/vendor'); // Standard admins go to Vendor portal
      } else if (user.role !== 'super_admin') {
        router.push('/'); // Regular users go to home
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
    { name: 'Admins & Vendors', icon: 'shield_person', path: '/admin/admins' },
    { name: 'Products', icon: 'inventory_2', path: '/admin/products' },
    { name: 'Orders', icon: 'shopping_bag', path: '/admin/orders' },
    { name: 'Customers', icon: 'group', path: '/admin/customers' },
    { name: 'Messages', icon: 'chat', path: '/admin/messages' },
    { name: 'Finance', icon: 'account_balance', path: '/admin/finance' },
    { name: 'Security', icon: 'security', path: '/admin/security' },
    { name: 'Settings', icon: 'settings', path: '/admin/settings' },
  ];

  const themeIcon = theme === 'dark' ? 'dark_mode' : theme === 'light' ? 'light_mode' : 'routine';
  const themeOptions: { mode: ThemeMode; icon: string; label: string }[] = [
    { mode: 'light', icon: 'light_mode', label: 'Light' },
    { mode: 'dark', icon: 'dark_mode', label: 'Dark' },
    { mode: 'system', icon: 'routine', label: 'System' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 30, backdropFilter: 'blur(2px)' }} 
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
        {/* Logo and Close */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0, background: 'linear-gradient(135deg, var(--lime-400), var(--secondary-container))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            REED ADMIN
          </h1>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'var(--surface-container)', borderRadius: '50%', width: '32px', height: '32px', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {menuItems.map(item => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname?.startsWith(item.path));
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                onClick={() => setSidebarOpen(false)}
                style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderRadius: '12px', color: isActive ? 'var(--lime-400)' : 'var(--on-surface-variant)', backgroundColor: isActive ? 'var(--surface-container-high)' : 'transparent', textDecoration: 'none', transition: 'all 0.2s ease', marginBottom: '8px' }}
              >
                <span className="material-symbols-outlined" style={{ marginRight: '16px', fontSize: '22px' }}>{item.icon}</span>
                <span style={{ fontSize: '1rem', fontWeight: isActive ? 600 : 500 }}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick links */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--outline)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', color: 'var(--on-surface-variant)', textDecoration: 'none', fontSize: '0.9rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>shopping_bag</span>
            View Store Front
          </Link>
        </div>

        {/* User Info */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--lime-400), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>SA</div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--on-surface)' }}>Super Admin</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--lime-400)', fontWeight: 500 }}>Full Access</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Header */}
        <header style={{ height: '72px', borderBottom: '1px solid var(--outline)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', backgroundColor: 'var(--surface)', position: 'sticky', top: 0, zIndex: 15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>menu</span>
            </button>
            <h1 className="font-lexend hidden md:block" style={{ fontSize: '1.2rem', margin: 0 }}>REED ADMIN</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Theme Toggle */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowTheme(!showTheme); setShowNotifications(false); setShowProfile(false); }} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined">{themeIcon}</span>
              </button>
              {showTheme && (
                <div style={{ position: 'absolute', right: 0, top: '48px', width: '180px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden', padding: '8px' }}>
                  {themeOptions.map(opt => (
                    <button key={opt.mode} onClick={() => { setTheme(opt.mode); setShowTheme(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', backgroundColor: theme === opt.mode ? 'var(--surface-container-high)' : 'transparent', color: theme === opt.mode ? 'var(--lime-400)' : 'var(--on-surface)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: theme === opt.mode ? 600 : 400 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{opt.icon}</span>
                      {opt.label}
                      {theme === opt.mode && <span className="material-symbols-outlined" style={{ fontSize: '16px', marginLeft: 'auto' }}>check</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); setShowTheme(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', padding: '4px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--lime-400), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '0.8rem' }}>SA</div>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
              </button>
              {showProfile && (
                <div style={{ position: 'absolute', right: 0, top: '48px', width: '220px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden', padding: '8px' }}>
                  {[
                    { icon: 'person', label: 'My Profile' },
                    { icon: 'settings', label: 'Settings', href: '/admin/settings' },
                    { icon: 'help', label: 'Help Center' },
                    { icon: 'logout', label: 'Sign Out', color: 'var(--error)' },
                  ].map(item => (
                    <button key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: item.color || 'var(--on-surface)', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={{ padding: '32px', flex: 1, backgroundColor: 'var(--background)' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
