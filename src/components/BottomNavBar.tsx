'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useCart, useWishlist, useNotifications } from '@/context/AppContext';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const navItems = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/shop', icon: 'grid_view', label: 'Categories' },
  { href: '/cart', icon: 'shopping_bag', label: 'Cart' },
  { href: '/wishlist', icon: 'favorite', label: 'Wishlist' },
  { href: '/account', icon: 'person', label: 'Account' },
];

// SVG icon paths for the bottom nav (inline to avoid hydration issues with Icon component)
const iconPaths: Record<string, { outline: string, filled: string }> = {
  home: {
    outline: "M6 19h3v-6h6v6h3v-9l-6-4.5L6 10v9zm-2 2V9l8-6 8 6v12h-7v-6h-2v6H4z",
    filled: "M4 21V9l8-6 8 6v12h-7v-6h-2v6H4z"
  },
  grid_view: {
    outline: "M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z",
    filled: "M3 11V3h8v8H3zm0 10v-8h8v8H3zm10-10V3h8v8h-8zm0 10v-8h8v8h-8z"
  },
  shopping_bag: {
    outline: "M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z",
    filled: "M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z"
  },
  favorite: {
    outline: "M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z",
    filled: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
  },
  person: {
    outline: "M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z",
    filled: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
  },
};

export const BottomNavBar: React.FC = () => {
  const pathname = usePathname();
  const { totalItems, openCartDrawer } = useCart();
  const { totalWishlist } = useWishlist();
  const { unreadCount, activeOrderCount: orderCount } = useNotifications();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const isCheckout = pathname === '/checkout' || pathname === '/confirmation';

  // Create a portal container outside React's hydration tree
  useEffect(() => {
    if (isCheckout) return;
    
    let container = document.getElementById('bottom-nav-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bottom-nav-portal';
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    return () => {
      // Don't remove on unmount since other instances might use it
    };
  }, [isCheckout]);

  if (isCheckout || !portalContainer) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="bottom-nav-bar-container">
      {navItems.map(item => {
        const active = isActive(item.href);
        const badge = item.href === '/cart' ? totalItems : item.href === '/wishlist' ? totalWishlist : item.href === '/account' ? (unreadCount + orderCount) : 0;
        const paths = iconPaths[item.icon];
        const d = active && paths ? paths.filled : (paths ? paths.outline : '');

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => {
              if (item.href === '/cart') {
                e.preventDefault();
                openCartDrawer();
              }
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '6px 12px', borderRadius: 10,
              color: active ? 'var(--lime-400)' : 'var(--on-surface-variant)',
              background: active ? 'rgba(195, 244, 0, 0.08)' : 'transparent',
              transition: 'all 0.2s',
              position: 'relative',
              textDecoration: 'none',
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill={active ? 'var(--lime-400)' : 'var(--on-surface-variant)'} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
              <path d={d} />
            </svg>
            <span style={{
              fontFamily: 'var(--font-lexend)', fontSize: 9,
              textTransform: 'uppercase', fontWeight: 600,
              marginTop: 2, letterSpacing: '0.02em',
            }}>
              {item.label}
            </span>
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 6,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--lime-400)', color: '#000',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-lexend)',
              }}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  // Render via portal to bypass React's hydration tree entirely
  return createPortal(navContent, portalContainer);
};
