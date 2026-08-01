'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCart, useWishlist, useNotifications } from '@/context/AppContext';
import { createPortal } from 'react-dom';
import Link from 'next/link';

const navItems = [
  { href: '/shop', icon: 'home', label: 'Home' },
  { href: '/shop?view=categories', icon: 'grid_view', label: 'Categories' },
  { href: '/cart', icon: 'shopping_bag', label: 'Cart' },
  { href: '/account', icon: 'person', label: 'Account' },
];

// SVG icon paths for the bottom nav
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
  receipt: {
    outline: "M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2l-1.5 1.5L6 2l-1.5 1.5L3 2v20z",
    filled: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z"
  },
  person: {
    outline: "M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z",
    filled: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
  },
};

function BottomNavBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalItems, openCartDrawer, closeCartDrawer } = useCart();
  const { totalWishlist } = useWishlist();
  const { unreadCount, activeOrderCount: orderCount } = useNotifications();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const isCheckout = pathname === '/checkout' || pathname === '/confirmation';

  useEffect(() => {
    if (isCheckout) return;
    
    let container = document.getElementById('bottom-nav-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'bottom-nav-portal';
      document.body.appendChild(container);
    }
    setPortalContainer(container);
  }, [isCheckout]);

  if (isCheckout || !portalContainer) return null;

  const isActive = (href: string) => {
    const viewParam = searchParams?.get('view');
    if (href === '/shop?view=categories') {
      return pathname === '/shop' && viewParam === 'categories';
    }
    if (href === '/shop') {
      return (pathname === '/shop' && viewParam !== 'categories') || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="bottom-nav-bar-container">
      {navItems.map(item => {
        const active = isActive(item.href);
        const badge = item.href === '/cart' ? totalItems : item.href === '/account/orders' ? orderCount : item.href === '/account' ? unreadCount : 0;
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
              } else {
                closeCartDrawer();
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

  return createPortal(navContent, portalContainer);
}

export const BottomNavBar: React.FC = () => {
  return (
    <React.Suspense fallback={null}>
      <BottomNavBarContent />
    </React.Suspense>
  );
};
