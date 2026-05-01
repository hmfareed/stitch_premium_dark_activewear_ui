'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart, useAuth } from '@/context/AppContext';
import { categories } from '@/data/products';

export const TopAppBar: React.FC = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isCheckout = pathname === '/checkout' || pathname === '/confirmation';

  if (isCheckout) {
    return (
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 20px', height: 60,
        background: 'var(--background)', borderBottom: '1px solid #1a1a1a',
      }}>
        <Link href="/cart" style={{ color: '#999', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.05em' }}>CHECKOUT</span>
        <Link href="/" style={{ color: '#999', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined">close</span>
        </Link>
      </header>
    );
  }

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        background: 'var(--background)', borderBottom: '1px solid #1a1a1a',
      }}>
        {/* Main bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 16px', height: 56,
        }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 22,
            color: 'var(--lime-400)', letterSpacing: '-0.03em',
          }}>
            REED STORE
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#999' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>search</span>
            </button>

            <Link href={user ? '/account' : '/login'} style={{ padding: 8, color: '#999', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {user ? 'person' : 'person_outline'}
              </span>
            </Link>

            <Link href="/cart" style={{ padding: 8, color: '#999', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>shopping_bag</span>
              {totalItems > 0 && (
                <span className="animate-bounce-in" style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--lime-400)', color: '#000',
                  fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-lexend)',
                }}>
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar (expandable) */}
        {searchOpen && (
          <div className="animate-fade-in" style={{ padding: '0 16px 12px' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`; }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#151515', borderRadius: 10, padding: '0 12px', border: '1px solid #222',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#555', fontSize: 20 }}>search</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                autoFocus
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#fff', padding: '10px 0', fontSize: 14,
                  fontFamily: 'var(--font-inter)',
                }}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                </button>
              )}
            </form>
          </div>
        )}

        {/* Category pills (only on Home / Shop) */}
        {(pathname === '/' || pathname === '/shop') && !searchOpen && (
          <div className="no-scrollbar" style={{
            display: 'flex', gap: 8, padding: '0 16px 10px',
            overflowX: 'auto', whiteSpace: 'nowrap',
          }}>
            {categories.map(cat => {
              const isActive = pathname === '/shop' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('category') === cat;
              return (
                <Link
                  key={cat}
                  href={cat === 'All' ? '/shop' : `/shop?category=${cat}`}
                  style={{
                    padding: '6px 16px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    background: isActive ? 'var(--lime-400)' : 'transparent',
                    color: isActive ? '#000' : '#777',
                    border: isActive ? 'none' : '1px solid #222',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
};
