'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart, useWishlist } from '@/context/AppContext';

const navItems = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/shop', icon: 'grid_view', label: 'Categories' },
  { href: '/cart', icon: 'shopping_bag', label: 'Cart' },
  { href: '/wishlist', icon: 'favorite', label: 'Wishlist' },
  { href: '/account', icon: 'person', label: 'Account' },
];

export const BottomNavBar: React.FC = () => {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();

  const isCheckout = pathname === '/checkout' || pathname === '/confirmation';
  if (isCheckout) return null;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 50,
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      height: 64, padding: '0 8px',
      background: 'var(--surface)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--outline)',
    }}>
      {navItems.map(item => {
        const active = isActive(item.href);
        const badge = item.href === '/cart' ? totalItems : item.href === '/wishlist' ? totalWishlist : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
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
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {item.icon}
            </span>
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
};
