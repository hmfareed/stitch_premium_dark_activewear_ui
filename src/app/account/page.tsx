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
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;

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
    { icon: 'history', label: 'Recently Viewed', sub: 'Pieces you looked at', href: '#', onClick: () => setShowHistoryModal(true) },
    { icon: 'settings', label: 'Settings', sub: 'Dark mode, password & more', href: '/account/settings' },
  ];

  // Truncate long emails
  const truncateEmail = (email: string, maxLen: number = 28) => {
    if (email.length <= maxLen) return email;
    return email.substring(0, maxLen) + '...';
  };

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
          display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 50, overflow: 'visible'
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=c3f400&color=000&size=256`} 
              alt="Profile" 
              style={{
                width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer'
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: 'var(--foreground)', fontWeight: 800, marginBottom: 4 }}>{user.name}</h2>
            <p style={{ 
              color: 'var(--on-surface-variant)', fontSize: 13, marginBottom: 8,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'
            }} title={user.email}>{truncateEmail(user.email)}</p>
            {user.role === 'super_admin' ? (
              <span style={{ background: 'color-mix(in srgb, #ff00ff 20%, transparent)', color: '#ff00ff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>SUPER ADMIN</span>
            ) : user.role === 'vendor' ? (
              <span style={{ background: 'color-mix(in srgb, #00e5ff 20%, transparent)', color: '#00e5ff', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>VENDOR</span>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ background: 'rgba(195,244,0,0.1)', color: 'var(--lime-400)', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, textTransform: 'uppercase' }}>CUSTOMER</span>
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>stars</span>
                  {user.points || 0} POINTS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Loyalty Tier Card ─────────────────────────── */}
        {user.role === 'customer' && (() => {
          const points = user.points || 0;
          const tiers = [
            { name: 'Bronze', icon: '🥉', color: '#CD7F32', min: 0,    max: 499,  perks: ['5% birthday discount', 'Early sale access'] },
            { name: 'Silver', icon: '🥈', color: '#C0C0C0', min: 500,  max: 1999, perks: ['Free shipping ≥ GH₵50', '2× points on Fridays'] },
            { name: 'Gold',   icon: '🥇', color: '#FFD700', min: 2000, max: 4999, perks: ['Flash sale early access', 'Free returns'] },
            { name: 'Platinum', icon: '💎', color: '#e5e4e2', min: 5000, max: 9999, perks: ['5% cashback', 'Personal shopper'] },
          ];
          const tier = tiers.find(t => points <= t.max) || tiers[tiers.length - 1];
          const nextTier = tiers[tiers.indexOf(tier) + 1];
          const progress = nextTier
            ? Math.min(100, ((points - tier.min) / (nextTier.min - tier.min)) * 100)
            : 100;
          const remaining = nextTier ? nextTier.min - points : 0;

          return (
            <div className="animate-fade-in-up" style={{
              background: `linear-gradient(135deg, var(--surface) 0%, var(--surface-container) 100%)`,
              border: `1px solid ${tier.color}44`, borderRadius: 20, padding: 20,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Glow */}
              <div style={{ position: 'absolute', top: -40, right: -20, width: 160, height: 160, background: `${tier.color}18`, filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{tier.icon}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loyalty Tier</p>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, color: tier.color, letterSpacing: '-0.01em' }}>{tier.name}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, color: 'var(--lime-400)' }}>{points.toLocaleString()}</p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>POINTS</p>
                </div>
              </div>

              {/* Progress bar */}
              {nextTier && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--on-surface-variant)' }}>{tier.name}</span>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: tier.color }}>
                      {remaining} pts to {nextTier.name} {nextTier.icon}
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--outline)', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${progress}%`, borderRadius: 6,
                      background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
                      transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: `0 0 8px ${tier.color}66`,
                    }} />
                  </div>
                </div>
              )}
              {!nextTier && (
                <div style={{ textAlign: 'center', padding: '8px 0 12px', color: tier.color, fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700 }}>
                  🎉 Maximum tier achieved — you&apos;re the best!
                </div>
              )}

              {/* Perks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Your Perks</p>
                {tier.perks.map(perk => (
                  <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: tier.color }}>check_circle</span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--foreground)' }}>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Earn more CTA */}
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--lime-400)' }}>info</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  Earn 1 point per GH₵1 spent. +50 pts for leaving a review!
                </span>
              </div>
            </div>
          );
        })()}

        {/* Email Verification Banner */}
        {!user.isVerified && (
          <div className="animate-fade-in-up" style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(195,244,0,0.08) 100%)',
            border: '1px solid rgba(251,191,36,0.3)', borderRadius: 16, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fbbf24' }}>warning</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-lexend)' }}>Verify your email</p>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Secure your account and unlock all features</p>
              </div>
            </div>
            {!showOtpInput ? (
              <button
                onClick={async () => {
                  setVerifyLoading(true);
                  try {
                    const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) });
                    const data = await res.json();
                    if (data.success) { setShowOtpInput(true); showToast('Verification code sent to your email!'); }
                    else showToast(data.error || 'Failed to send code', 'error');
                  } catch { showToast('Network error', 'error'); }
                  setVerifyLoading(false);
                }}
                disabled={verifyLoading}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#fbbf24', color: '#000', border: 'none', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, cursor: verifyLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {verifyLoading ? <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Sending...</> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span> Send Verification Code</>}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit code"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: 16, fontFamily: 'monospace', letterSpacing: 4, textAlign: 'center', outline: 'none' }}
                />
                <button
                  onClick={async () => {
                    if (otpCode.length !== 6) { showToast('Enter the 6-digit code', 'error'); return; }
                    setVerifyLoading(true);
                    try {
                      const res = await fetch('/api/auth/verify-email', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, code: otpCode }) });
                      const data = await res.json();
                      if (data.success) { showToast('Email verified! 🎉'); window.location.reload(); }
                      else showToast(data.error || 'Invalid code', 'error');
                    } catch { showToast('Network error', 'error'); }
                    setVerifyLoading(false);
                  }}
                  disabled={verifyLoading || otpCode.length !== 6}
                  style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--lime-400)', color: '#000', border: 'none', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  {verifyLoading ? '...' : 'Verify'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Verified badge on profile */}
        {user.isVerified && (
          <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.2)', borderRadius: 10, padding: '8px 14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--lime-400)' }}>verified</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)' }}>Email Verified</span>
          </div>
        )}

        {/* Stat Cards */}
        <div className="animate-fade-in-up stagger-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { icon: 'local_mall', count: totalItems, label: 'IN BAG' },
            { icon: 'favorite', count: totalWishlist, label: 'SAVED' },
            { icon: 'package_2', count: orderCount, label: 'ORDERS' },
            { icon: 'stars', count: user.points || 0, label: 'POINTS', color: '#fbbf24' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: '16px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
            }}>
              <span className="material-symbols-outlined" style={{ color: stat.color || 'var(--on-surface-variant)', fontSize: 20 }}>{stat.icon}</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>{stat.count}</span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Dashboard Access for Admins */}
        {(user.role === 'vendor' || user.role === 'super_admin') && (
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

            {(user.role === 'vendor' || user.role === 'super_admin') && (
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
            <div key={i} onClick={item.onClick || (() => item.href !== '#' && router.push(item.href))} style={{ cursor: 'pointer' }}>
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
                    <span style={{ color: 'var(--on-lime-400)', fontSize: 12, fontWeight: 800 }}>{item.badge}</span>
                  </div>
                )}
                <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>chevron_right</span>
              </div>
            </div>
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


        {/* Become a Vendor for regular users */}
        {user.role === 'customer' && (
          <div className="animate-fade-in-up stagger-4">
            <button onClick={() => router.push('/apply')} style={{
              background: 'linear-gradient(135deg, var(--lime-400) 0%, #00e5ff 100%)', border: 'none', borderRadius: 16, padding: '16px 12px',
              color: 'var(--on-lime-400)', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px rgba(195, 244, 0, 0.2)',
              transition: 'transform 0.2s', width: '100%'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>storefront</span>
              Become a Vendor — Sell on AfriCart
            </button>
          </div>
        )}

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
                  padding: 16, background: theme === t ? 'color-mix(in srgb, var(--lime-400) 10%, transparent)' : 'var(--surface-container)',
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

            <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)', marginBottom: 16, fontSize: 18 }}>Select Theme Accent Color</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: accentColor === color ? '3px solid white' : '2px solid transparent',
                    boxShadow: accentColor === color ? '0 0 12px var(--lime-400)' : '0 2px 6px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transform: accentColor === color ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  title={color}
                />
              ))}

              <div style={{ position: 'relative', width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: !presetColors.includes(accentColor) ? '3px solid white' : '2px solid transparent', boxShadow: !presetColors.includes(accentColor) ? '0 0 12px var(--lime-400)' : '0 2px 6px rgba(0,0,0,0.3)', cursor: 'pointer' }} title="Custom Accent Color">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{
                    position: 'absolute',
                    width: '140%',
                    height: '140%',
                    cursor: 'pointer',
                    border: 'none',
                    padding: 0,
                    backgroundColor: 'transparent'
                  }}
                />
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '18px', pointerEvents: 'none', zIndex: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>palette</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: 'var(--on-surface-variant)' }}>
              <span style={{ fontSize: 14 }}>Active Accent:</span>
              <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: accentColor }} />
              <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{accentColor}</span>
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
