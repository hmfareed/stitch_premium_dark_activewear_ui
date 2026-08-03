'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

interface RiderNavItem {
  title: string;
  icon: string;
  path: string;
  badge?: number;
}

const riderNavItems: RiderNavItem[] = [
  { title: 'Home / Dashboard', icon: 'dashboard', path: '/rider' },
  { title: 'Active Delivery', icon: 'two_wheeler', path: '/rider/active-delivery' },
  { title: 'Delivery History', icon: 'history', path: '/rider/history' },
  { title: 'Earnings', icon: 'payments', path: '/rider/earnings' },
  { title: 'Area & Schedule', icon: 'map', path: '/rider/area' },
  { title: 'Profile & Documents', icon: 'account_circle', path: '/rider/profile' },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Gating
  useEffect(() => {
    if (user && user.role !== 'rider' && user.role !== 'super_admin') {
      router.replace('/');
    }
  }, [user, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#090a07', color: '#fff', display: 'flex', fontFamily: 'var(--font-inter, sans-serif)' }}>
      {/* Sidebar for Desktop */}
      <aside style={{
        width: 250,
        background: '#0d0f0b',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 40,
      }} className="hidden-mobile">
        {/* Header */}
        <div style={{ padding: '20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ color: '#c3f400', fontSize: 28 }}>two_wheeler</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#fff', fontFamily: 'var(--font-lexend, sans-serif)' }}>
              Afri<span style={{ color: '#c3f400' }}>Cart</span> Rider
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>Tamale Operations Hub</div>
          </div>
        </div>

        {/* Online Status Toggle */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: isOnline ? 'rgba(195,244,0,0.05)' : 'rgba(255,255,255,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: isOnline ? '#c3f400' : '#888' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: isOnline ? '#c3f400' : '#888' }}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: 'none',
                background: isOnline ? '#c3f400' : '#333',
                color: isOnline ? '#000' : '#fff',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {riderNavItems.map(item => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  color: active ? '#c3f400' : '#aaa',
                  background: active ? 'rgba(195, 244, 0, 0.1)' : 'transparent',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  textDecoration: 'none',
                  marginBottom: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rider Profile Footer */}
        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user?.name || 'Rider Partner'}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{user?.phone || 'Tamale, GH'}</div>
          </div>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex' }}
            title="Log Out"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: 250, padding: 24, maxWidth: 1200 }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          main { margin-left: 0 !important; padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
