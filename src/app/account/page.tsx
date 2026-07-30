'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useCart, useWishlist, useTheme, ThemeMode, useToast, useNotifications, useUserActivity } from '@/context/AppContext';

const presetColors = [
  '#00E5FF', // Electric Cyan
  '#A855F7', // Royal Violet
  '#FF9100', // Sunset Orange
  '#6366F1', // Electric Indigo
  '#FB7185', // Rose Pink
  '#14B8A6', // Teal
  '#FBBF24', // Amber Gold
  '#10B981', // Emerald
  '#FF4081', // Pink Accent
  '#C3F400'  // Original Lime
];

export default function AccountPage() {
  const { user, logout, updateProfilePic, isLoading } = useAuth();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  const { unreadCount, activeOrderCount: orderCount } = useNotifications();
  const { recentlyViewed: viewedProducts } = useUserActivity();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

  const handleSignOut = () => {
    logout();
    window.location.href = '/';
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

  // Structured menu items matching Screen 1 mockup
  const accountGroup = [
    { icon: 'package_2', label: 'Orders', sub: 'View all your orders', href: '/account/orders' },
    { icon: 'favorite', label: 'Wishlist', sub: 'Your saved items', href: '/wishlist' },
    { icon: 'history', label: 'Order History', sub: 'Your past purchases', href: '/account/orders/history' },
    { icon: 'visibility', label: 'Recently Viewed', sub: 'Items you viewed recently', href: '/account/recently-viewed' },
    { icon: 'sell', label: 'Coupons', sub: 'Available offers for you', href: '#', onClick: () => showToast('Coupon code SAVE10 applied!', 'info') },
  ];

  const moreGroup = [
    { icon: 'notifications', label: 'Notifications', sub: 'Updates on your orders & account', href: '/account/notifications', badge: unreadCount > 0 ? unreadCount.toString() : undefined },
    { icon: 'location_on', label: 'Addresses', sub: 'Manage delivery locations', href: '/account/addresses' },
    { icon: 'credit_card', label: 'Payment Methods', sub: 'Saved cards & mobile money', href: '/account/payments' },
  ];

  return (
    <div style={{ padding: '0 16px', paddingBottom: 60, maxWidth: 480, margin: '0 auto' }}>
      {/* Top Header */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 800, color: 'var(--foreground)' }}>Account</h1>
        </div>

        <button onClick={() => setShowThemeModal(true)} style={{ background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 12, padding: '8px 12px', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)' }}>palette</span> Theme
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
        {/* Profile Card */}
        <div className="animate-fade-in-up" style={{
          background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: 18,
          display: 'flex', alignItems: 'center', gap: 16, position: 'relative'
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366F1&color=fff&size=256`} 
              alt="Profile" 
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid var(--lime-400)' }} 
            />
            {showProfileMenu && (
              <div className="animate-scale-in" style={{
                position: 'absolute', top: 70, left: 0, background: 'var(--surface-container-high)', border: '1px solid var(--outline)', 
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
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> Remove
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: 'var(--foreground)', fontWeight: 800, marginBottom: 2 }}>{user.name}</h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {user.isVerified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0, 229, 255, 0.1)', color: 'var(--lime-400)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span> Verified
                </span>
              )}
              {user.role === 'super_admin' ? (
                <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>ADMIN</span>
              ) : user.role === 'vendor' ? (
                <span style={{ background: 'rgba(0, 229, 255, 0.2)', color: '#00e5ff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>VENDOR</span>
              ) : null}
            </div>
          </div>
        </div>



        {/* Admin Controls (If Vendor / Super Admin) */}
        {(user.role === 'vendor' || user.role === 'super_admin') && (
          <div className="animate-fade-in-up stagger-2" style={{ display: 'flex', gap: 10 }}>
            {user.role === 'super_admin' && (
              <button onClick={() => router.push('/admin')} style={{
                flex: 1, background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', border: 'none', borderRadius: 14, padding: '12px',
                color: '#fff', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>admin_panel_settings</span> Admin Panel
              </button>
            )}
            {(user.role === 'vendor' || user.role === 'super_admin') && (
              <button onClick={() => router.push('/vendor')} style={{
                flex: 1, background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)', border: 'none', borderRadius: 14, padding: '12px',
                color: '#fff', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0, 229, 255, 0.3)'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>storefront</span> Vendor Portal
              </button>
            )}
          </div>
        )}

        {/* SECTION 1: MY ACCOUNT */}
        <div className="animate-fade-in-up stagger-2">
          <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, paddingLeft: 4 }}>
            My Account
          </h3>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, overflow: 'hidden' }}>
            {accountGroup.map((item, i) => (
              <div 
                key={i} 
                onClick={item.onClick || (() => item.href !== '#' && router.push(item.href))}
                style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  borderBottom: i < accountGroup.length - 1 ? '1px solid var(--outline)' : 'none',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: 36, height: 36, background: 'var(--surface-container-high)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--foreground)', fontSize: 20 }}>{item.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{item.label}</h4>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, margin: '2px 0 0 0' }}>{item.sub}</p>
                </div>
                <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 18 }}>chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: MORE */}
        <div className="animate-fade-in-up stagger-3">
          <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, paddingLeft: 4 }}>
            More
          </h3>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, overflow: 'hidden' }}>
            {moreGroup.map((item, i) => (
              <div 
                key={i} 
                onClick={() => router.push(item.href)}
                style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                  borderBottom: i < moreGroup.length - 1 ? '1px solid var(--outline)' : 'none',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: 36, height: 36, background: 'var(--surface-container-high)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--foreground)', fontSize: 20 }}>{item.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{item.label}</h4>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, margin: '2px 0 0 0' }}>{item.sub}</p>
                </div>
                {item.badge && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                    <span style={{ color: '#000000', fontSize: 11, fontWeight: 900 }}>{item.badge}</span>
                  </div>
                )}
                <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 18 }}>chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Support / Assistance */}
        <div className="animate-fade-in-up stagger-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => router.push('/chat')} style={{
            background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14, padding: '12px',
            color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)' }}>smart_toy</span> Live AI Support
          </button>
          <a href="https://wa.me/233204540781" target="_blank" rel="noopener noreferrer" style={{
            background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14, padding: '12px',
            color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#25D366' }}>chat</span> WhatsApp
          </a>
        </div>

        {/* Sign Out Button */}
        <button onClick={handleSignOut} className="animate-fade-in-up stagger-4" style={{
          background: 'rgba(255, 68, 68, 0.08)', border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: 16, padding: '14px',
          color: '#ff4444', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 8
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
          Sign Out
        </button>
      </div>

      {/* Theme Customization Modal */}
      {showThemeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-end'
        }} onClick={() => setShowThemeModal(false)}>
          <div className="animate-slide-in" onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
            borderTop: '1px solid var(--outline)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)', marginBottom: 16, fontSize: 18 }}>Select Appearance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
                <button key={t} onClick={() => handleThemeChange(t)} style={{
                  padding: 16, background: theme === t ? 'rgba(0, 229, 255, 0.1)' : 'var(--surface-container)',
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

            <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)', marginBottom: 16, fontSize: 18 }}>Accent Color</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', backgroundColor: color,
                    border: accentColor === color ? '3px solid white' : '2px solid transparent',
                    cursor: 'pointer', outline: 'none'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recently Viewed Modal */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--background)', zIndex: 10000,
          display: 'flex', flexDirection: 'column'
        }} className="animate-fade-in">
          <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--outline)' }}>
            <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800 }}>Recently Viewed</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {viewedProducts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16 }}>history</span>
                <p>No recently viewed items</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {viewedProducts.map(product => (
                  <Link key={product.id} href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--outline)', background: 'var(--surface-container)' }}>
                        <img src={product.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }} className="line-clamp-1">{product.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--lime-400)' }}>GH₵{product.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
