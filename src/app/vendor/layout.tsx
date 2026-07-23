'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { allProducts, vendorStore, vendorStoreLoading, vendorStoreError, refreshVendorStore } = useStore();
  const { allAdmins } = useAdmin();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'vendor' && user.role !== 'super_admin') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  // Onboarding gate: if vendor has no store, redirect to wizard
  // Skip gate for onboarding sub-routes to avoid redirect loops
  const isOnboardingRoute = pathname?.startsWith('/vendor/onboarding');
  useEffect(() => {
    // Check localStorage cache to avoid redirecting while API call revalidates
    const cachedStore = typeof window !== 'undefined' ? localStorage.getItem('africart-vendor-store') : null;
    const hasStore = !!(vendorStore || cachedStore);

    if (
      !isLoading &&
      !vendorStoreLoading &&
      !vendorStoreError &&        // Don't redirect if the API call failed
      user &&
      (user.role === 'vendor' || user.role === 'super_admin') &&
      !isOnboardingRoute &&
      !hasStore
    ) {
      router.push('/vendor/onboarding');
    }
  }, [isLoading, vendorStoreLoading, vendorStoreError, user, vendorStore, isOnboardingRoute, router]);

  // Auth loading state
  if (isLoading || !user || (user.role !== 'vendor' && user.role !== 'super_admin')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--lime-400)' }} />
      </div>
    );
  }

  // Onboarding pages render without sidebar chrome
  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  // Store loading state
  if (vendorStoreLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#00e5ff' }} />
      </div>
    );
  }

  // Store fetch error state — show portal but warn about connectivity
  if (vendorStoreError && !vendorStore) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)', gap: 16, padding: 24 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--error)' }}>cloud_off</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.2rem', color: 'var(--on-surface)', textAlign: 'center' }}>Couldn't load your store data</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', textAlign: 'center', maxWidth: 360 }}>
          There was a problem connecting to the server. Please check your connection and try again.
        </p>
        <button
          onClick={refreshVendorStore}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Retry
        </button>
      </div>
    );
  }

  const storeName = vendorStore?.name || user.name;
  const storeInitials = storeName.substring(0, 2).toUpperCase();
  const vendorEmail = vendorStore?.vendorEmail || user.email;
  const lowStockAlerts = allProducts.filter(p => p.vendorEmail === vendorEmail && (p.stock || 0) <= 5);

  const menuItems = [
    { name: 'Home',      icon: 'home',                  path: '/vendor' },
    { name: 'Orders',    icon: 'shopping_bag',           path: '/vendor/orders' },
    { name: 'Products',  icon: 'inventory_2',            path: '/vendor/products' },
    { name: 'Customers', icon: 'group',                  path: '/vendor/customers' },
    { name: 'Payouts',   icon: 'account_balance_wallet', path: '/vendor/payouts' },
    { name: 'Staff',     icon: 'badge',                  path: '/vendor/staff' },
    { name: 'Settings',  icon: 'settings',               path: '/vendor/settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)' }}>

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 30 }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '280px',
        backgroundColor: 'var(--surface)', borderRight: '1px solid var(--outline)',
        display: 'flex', flexDirection: 'column', zIndex: 40,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '24px 24px 16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0, background: 'linear-gradient(45deg, #00e5ff, var(--lime-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            VENDOR PORTAL
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'var(--surface-container)', borderRadius: '50%', width: '32px', height: '32px', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        {/* Store info chip */}
        {vendorStore && (
          <div style={{ padding: '0 24px 16px 24px', borderBottom: '1px solid var(--outline)' }}>
            <div style={{ padding: '12px 14px', background: 'var(--surface-container)', borderRadius: 12, border: '1px solid var(--outline)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.06em' }}>ACTIVE STORE</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storeName}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontFamily: 'monospace', marginTop: 2 }}>
                /store/{vendorStore.slug}
              </div>
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {user?.role === 'super_admin' || user?.isVerified ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.15)', color: '#4522c5ff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 100 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>verified</span>
                    ✔ Verified Store
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 100 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
                    🔒 Unverified Store
                  </span>
                )}
              </div>
              {vendorStore.status === 'suspended' && (
                <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', borderRadius: 6, fontSize: '0.72rem', color: 'var(--error)', fontWeight: 700 }}>
                  ⚠️ STORE SUSPENDED
                </div>
              )}
              {vendorStore.status === 'under_review' && (
                <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 6, fontSize: '0.72rem', color: '#00e5ff', fontWeight: 700 }}>
                  ⏳ UNDER REVIEW
                </div>
              )}
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {menuItems.map(item => {
            const isActive = pathname === item.path || (item.path !== '/vendor' && pathname?.startsWith(item.path));
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '14px 20px', borderRadius: '12px',
                  color: isActive ? '#00e5ff' : 'var(--on-surface-variant)',
                  backgroundColor: isActive ? 'var(--surface-container-high)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s ease', marginBottom: '8px',
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
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'color-mix(in srgb, #00e5ff 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
              {storeInitials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storeName}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vendorEmail}</span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="font-lexend hidden md:block" style={{ fontSize: '1.2rem', margin: 0 }}>VENDOR PORTAL</h1>
              {user?.role === 'super_admin' || user?.isVerified ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>verified</span>
                  ✔ Verified Store
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', borderRadius: 100 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>lock</span>
                  🔒 Unverified Store
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', position: 'relative', display: 'flex', padding: 4 }}
              title="Notifications"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>notifications</span>
              {lowStockAlerts.length > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, width: '18px', height: '18px', backgroundColor: 'var(--error)', borderRadius: '50%', color: '#fff', fontSize: '9px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(255,0,0,0.4)' }}>
                  {lowStockAlerts.length}
                </span>
              )}
            </button>

            <button style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: 4 }} title="Account Settings" onClick={() => router.push('/vendor/settings')}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>account_circle</span>
            </button>

            {notifOpen && (
              <>
                <div onClick={() => setNotifOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                <div
                  className="animate-fade-in-up"
                  style={{
                    position: 'absolute', top: '48px', right: 0, width: '320px',
                    background: 'rgba(30,30,30,0.9)', backdropFilter: 'blur(12px)',
                    border: '1px solid var(--outline)', borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: '16px',
                    zIndex: 999, display: 'flex', flexDirection: 'column', gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--outline)', paddingBottom: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '0.85rem', color: 'var(--lime-400)', letterSpacing: '0.05em' }}>AFRICART ALERTS</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{lowStockAlerts.length} Active</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                    {lowStockAlerts.length === 0 ? (
                      <div style={{ padding: '16px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: '28px' }}>check_circle</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>All items fully stocked!</span>
                      </div>
                    ) : (
                      lowStockAlerts.map(p => (
                        <div key={p.id} style={{ padding: '10px 12px', background: 'rgba(255,152,0,0.05)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <img src={p.image} alt={p.name} style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#ff9800', fontWeight: 600, marginTop: '2px' }}>Critical Stock: Only {p.stock || 0} units left!</div>
                          </div>
                          <Link href="/vendor/products" onClick={() => setNotifOpen(false)} style={{ background: 'rgba(195,244,0,0.1)', color: 'var(--lime-400)', border: 'none', borderRadius: '6px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>

                  {lowStockAlerts.length > 0 && (
                    <Link href="/vendor/products" onClick={() => setNotifOpen(false)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--outline)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
                      OPEN INVENTORY MANAGER
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {user?.role === 'vendor' && !user?.isVerified && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 14,
            padding: '12px 18px',
            margin: '16px 24px 0 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#f59e0b'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, flexShrink: 0 }}>lock</span>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
              <strong style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800 }}>🔒 Unverified Account:</strong> Your vendor profile is currently pending verification. Live product publishing, instant payouts, and store promotions are restricted until approved by Admin.
            </div>
          </div>
        )}

        <div className="panel-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
