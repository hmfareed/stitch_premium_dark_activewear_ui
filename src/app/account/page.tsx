'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCart, useWishlist, useTheme, ThemeMode, useToast } from '@/context/AppContext';

export default function AccountPage() {
  const { user, logout, updateProfilePic } = useAuth();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [orderCount, setOrderCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      const savedOrders = JSON.parse(localStorage.getItem(`reed-orders-${user.email}`) || '[]');
      const activeOrders = savedOrders.filter((o: any) => o.status === 'Processing' || o.status === 'Ongoing' || o.status === 'Shipped');
      setOrderCount(activeOrders.length);
      
      const savedNotifs = JSON.parse(localStorage.getItem(`reed-notifications-${user.email}`) || '[]');
      setUnreadCount(savedNotifs.filter((n: any) => !n.read).length);
    }
  }, [user, router]);

  if (!user) return null;

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setShowThemeModal(false);
    showToast(`Theme changed to ${newTheme}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Resize & compress the image for better quality and smaller storage
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 512;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/webp', 0.85);
            updateProfilePic(compressed);
            showToast('Profile picture updated');
            setShowProfileMenu(false);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePic = () => {
    updateProfilePic(undefined);
    showToast('Profile picture removed');
    setShowProfileMenu(false);
  };

  const menuItems = [
    { icon: 'notifications', label: 'Notifications', sub: 'Updates on your orders & account', href: '/account/notifications', badge: unreadCount > 0 ? unreadCount.toString() : undefined },
    { icon: 'package_2', label: 'My Orders', sub: 'Track & manage your orders', href: '/account/orders', badge: orderCount > 0 ? orderCount.toString() : undefined },
    { icon: 'location_on', label: 'Delivery Address', sub: 'Manage shipping addresses', href: '/account/addresses' },
    { icon: 'credit_card', label: 'Payment Methods', sub: 'Cards & mobile money', href: '/account/payments' },
    { icon: 'local_mall', label: 'My Cart', sub: 'View your shopping bag', href: '/cart' },
    { icon: 'favorite', label: 'Wishlist', sub: 'Your saved pieces', href: '/wishlist' },
    { icon: 'history', label: 'Recently Viewed', sub: 'Pieces you looked at', href: '#' },
    { icon: 'settings', label: 'Settings', sub: 'Dark mode, password & more', href: '/account/settings' },
  ];

  return (
    <div style={{ padding: '0 16px', paddingBottom: 40 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>Account</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
        {/* Profile Card */}
        <div className="animate-fade-in-up" style={{
          background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: 20,
          display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 50
        }}>
          <div style={{ position: 'relative' }}>
            <img 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=c3f400&color=000&size=256`} 
              alt="Profile" 
              style={{
                width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--lime-400)', cursor: 'pointer'
              }} 
            />
            {showProfileMenu && (
              <div className="animate-scale-in" style={{
                position: 'absolute', top: 70, left: 0, background: 'var(--surface-container)', border: '1px solid var(--outline)', 
                borderRadius: 12, padding: 8, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 4, width: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}>
                <label style={{ cursor: 'pointer', padding: '8px 12px', fontSize: 13, color: 'var(--foreground)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span> Upload Photo
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                {user.profilePic && (
                  <button onClick={handleRemovePic} style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: 13, color: 'var(--error)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> Remove Photo
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: 'var(--foreground)', fontWeight: 800, marginBottom: 4 }}>{user.name}</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginBottom: 8 }}>{user.email}</p>
            {user.role === 'super_admin' ? (
              <span style={{ background: 'color-mix(in srgb, #ff00ff 20%, transparent)', color: '#ff00ff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>SUPER ADMIN</span>
            ) : user.role === 'admin' ? (
              <span style={{ background: 'color-mix(in srgb, #00e5ff 20%, transparent)', color: '#00e5ff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>ADMIN</span>
            ) : (
              <span style={{ background: 'rgba(195,244,0,0.1)', color: 'var(--lime-400)', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>USER</span>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="animate-fade-in-up stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { icon: 'local_mall', count: totalItems, label: 'IN BAG' },
            { icon: 'favorite', count: totalWishlist, label: 'SAVED' },
            { icon: 'package_2', count: orderCount, label: 'ORDERS' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: '16px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>{stat.icon}</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>{stat.count}</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Dashboard Access for Admins */}
        {(user.role === 'admin' || user.role === 'super_admin') && (
          <div className="animate-fade-in-up stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: 'var(--foreground)', marginBottom: 4 }}>Admin Controls</h2>
            
            {user.role === 'super_admin' && (
              <button onClick={() => router.push('/admin')} style={{
                background: 'linear-gradient(135deg, #ff00ff 0%, #aa00ff 100%)', border: 'none', borderRadius: 16, padding: '16px 12px',
                color: '#fff', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(255, 0, 255, 0.3)',
                transition: 'transform 0.2s', width: '100%'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>admin_panel_settings</span>
                Super Admin Dashboard
              </button>
            )}

            {(user.role === 'admin' || user.role === 'super_admin') && (
              <button onClick={() => router.push('/vendor')} style={{
                background: 'linear-gradient(135deg, #00e5ff 0%, #0088ff 100%)', border: 'none', borderRadius: 16, padding: '16px 12px',
                color: '#fff', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0, 229, 255, 0.3)',
                transition: 'transform 0.2s', width: '100%'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>storefront</span>
                Vendor Portal
              </button>
            )}
          </div>
        )}

        {/* Menu Items */}
        <div className="animate-fade-in-up stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menuItems.map((item, i) => (
            <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: 16,
                display: 'flex', alignItems: 'center', gap: 16
              }}>
                <div style={{ width: 40, height: 40, background: 'var(--surface-container)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 20 }}>{item.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, color: 'var(--foreground)', marginBottom: 2 }}>{item.label}</h3>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>{item.sub}</p>
                </div>
                {item.badge && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ffae00', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <span style={{ color: '#000', fontSize: 12, fontWeight: 800 }}>{item.badge}</span>
                  </div>
                )}
                <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>chevron_right</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Need Assistance */}
        <div className="animate-fade-in-up stagger-3" style={{ marginTop: 8 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: 'var(--foreground)', marginBottom: 16 }}>Need Assistance?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={() => router.push('/chat')} style={{
              background: 'linear-gradient(135deg, #ff8c00 0%, #ff5e07 100%)', border: '1px solid rgba(255,140,0,0.5)', borderRadius: 16, padding: '16px 12px',
              color: '#fff', fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(255, 94, 7, 0.3)', transition: 'transform 0.2s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat_bubble</span> Live Chat
            </button>
            <a href="https://wa.me/233204540781" target="_blank" rel="noopener noreferrer" style={{
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', border: '1px solid rgba(37,211,102,0.5)', borderRadius: 16, padding: '16px 12px',
              color: '#fff', fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)', transition: 'transform 0.2s',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              WhatsApp
            </a>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="animate-fade-in-up stagger-4" onClick={() => setShowThemeModal(true)} style={{
          background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: 16,
          display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'
        }}>
          <div style={{ width: 40, height: 40, background: 'var(--surface-container)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--foreground)', fontSize: 20 }}>
              {theme === 'light' ? 'light_mode' : theme === 'dark' ? 'dark_mode' : 'hdr_auto'}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, color: 'var(--foreground)', marginBottom: 2 }}>Theme Appearance</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>Toggle light, dark, or system mode</p>
          </div>
          <span style={{ fontSize: 13, color: 'var(--on-surface-variant)', textTransform: 'capitalize' }}>{theme}</span>
        </div>

        {/* Sign Out */}
        <button onClick={handleSignOut} className="animate-fade-in-up stagger-4" style={{
          background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: 16, padding: 16,
          color: '#ff4444', fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          Sign Out
        </button>
      </div>

      {/* Theme Modal */}
      {showThemeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(4px)'
        }} onClick={() => setShowThemeModal(false)}>
          <div className="animate-slide-in" onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
            borderTop: '1px solid var(--outline)'
          }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)', marginBottom: 16, fontSize: 18 }}>Select Appearance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
                <button key={t} onClick={() => handleThemeChange(t)} style={{
                  padding: 16, background: theme === t ? 'rgba(195,244,0,0.1)' : 'var(--surface-container)',
                  border: theme === t ? '1px solid var(--lime-400)' : '1px solid var(--outline)',
                  borderRadius: 12, color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontSize: 15, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-outlined">
                      {t === 'light' ? 'light_mode' : t === 'dark' ? 'dark_mode' : 'hdr_auto'}
                    </span>
                    <span style={{ textTransform: 'capitalize' }}>{t}</span>
                  </div>
                  {theme === t && <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>check</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
