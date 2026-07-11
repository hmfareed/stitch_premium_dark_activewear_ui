'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useStore, useNotifications } from '@/context/AppContext';
import { categoryHierarchy, topLevelCategories, Product } from '@/data/products';
import { Icon } from './Icon';
import { NotificationPanel } from './NotificationPanel';

const PRIMARY_NAV_COUNT = 7; // how many top-level cats to show before "More"

export const TopAppBar: React.FC = () => {
  const { user } = useAuth();
  const { allProducts } = useStore();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // "More" mega-menu state
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isCheckout = pathname === '/checkout' || pathname === '/confirmation';

  const primaryCats = topLevelCategories.slice(0, PRIMARY_NAV_COUNT);
  const moreCats = topLevelCategories.slice(PRIMARY_NAV_COUNT);

  // Read category from URL safely after mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveCategory(params.get('category'));
  }, [pathname]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const q = value.toLowerCase();
      const results = allProducts
        .filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q) ||
          (p.vendorStoreName && p.vendorStoreName.toLowerCase().includes(q))
        )
        .slice(0, 6);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 150);
  }, [allProducts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        router.push(`/product/${suggestions[selectedIndex].id}`);
        setShowSuggestions(false);
        setSearchOpen(false);
        setSearchQuery('');
      } else if (searchQuery.trim()) {
        router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
        setShowSuggestions(false);
        setSearchOpen(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
      setSearchOpen(false);
    }
  };

  // Helper: is this top-level cat active?
  const isCatActive = (cat: string) => {
    if (pathname !== '/shop') return false;
    if (!activeCategory) return false;
    const family = [cat, ...(categoryHierarchy[cat] ?? [])];
    return family.includes(activeCategory);
  };

  if (isCheckout) {
    return (
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 20px', height: 60,
        background: 'var(--background)', borderBottom: '1px solid var(--outline)',
      }}>
        <Link href="/cart" style={{ color: '#999', display: 'flex', alignItems: 'center' }}>
          <Icon name="arrow_back" size={20} />
        </Link>
        <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.05em' }}>CHECKOUT</span>
        <Link href="/" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}>
          <Icon name="close" size={20} />
        </Link>
      </header>
    );
  }

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        background: 'var(--background)', borderBottom: '1px solid var(--outline)',
      }}>
        {/* ── Main bar ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 16px', height: 56, gap: 12,
        }}>
          {/* Logo */}
          <Link href="/" style={{
            fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 22,
            color: 'var(--lime-400)', letterSpacing: '-0.03em', flexShrink: 0,
          }}>
            AfriCart
          </Link>

          {/* Icon group — Search · Notifications · AI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Search */}
            <button
              id="header-search-btn"
              aria-label="Search products"
              onClick={() => { setSearchOpen(!searchOpen); if (!searchOpen) setTimeout(() => inputRef.current?.focus(), 100); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', borderRadius: 8 }}
            >
              <Icon name="search" size={22} />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setNotificationsOpen(true)}
              aria-label={`Notifications, ${unreadCount} unread`}
              style={{ padding: 8, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', position: 'relative', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}
            >
              <Icon name="notifications" size={22} />
              {unreadCount > 0 && (
                <span className="animate-bounce-in" style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 16, height: 16, borderRadius: '50%',
                  background: 'var(--lime-400)', color: '#000',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-lexend)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* AI Assistant */}
            <button
              id="header-ai-btn"
              aria-label="AI Shopping Assistant"
              onClick={() => router.push('/chat')}
              style={{
                padding: 8, display: 'flex', alignItems: 'center', position: 'relative',
                background: pathname === '/chat' ? 'rgba(195,244,0,0.12)' : 'none',
                border: 'none', cursor: 'pointer', borderRadius: 8,
                color: pathname === '/chat' ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>auto_awesome</span>
              {pathname !== '/chat' && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--lime-400)', border: '1.5px solid var(--background)',
                }} />
              )}
            </button>
          </div>
        </div>

        {/* ── Search bar with live autocomplete ── */}
        {searchOpen && (
          <div ref={searchRef} className="animate-fade-in" style={{ padding: '0 16px 12px', position: 'relative' }}>
            <form
              onSubmit={handleSubmit}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--surface-container)', borderRadius: showSuggestions ? '10px 10px 0 0' : 10,
                padding: '0 12px', border: '1px solid var(--outline)',
                borderBottom: showSuggestions ? '1px solid var(--outline)' : undefined,
              }}
            >
              <Icon name="search" size={20} color="#555" />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder="Search products, categories, stores..."
                autoFocus
                id="global-search-input"
                aria-label="Search"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--foreground)', padding: '10px 0', fontSize: 14,
                  fontFamily: 'var(--font-inter)',
                }}
              />
              {searchQuery && (
                <button type="button" aria-label="Clear search" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                  <Icon name="close" size={18} />
                </button>
              )}
            </form>

            {/* Live suggestions */}
            {showSuggestions && (
              <div
                className="animate-fade-in"
                style={{
                  position: 'absolute', left: 16, right: 16, top: '100%',
                  background: 'var(--surface-container)', border: '1px solid var(--outline)',
                  borderTop: 'none', borderRadius: '0 0 10px 10px',
                  maxHeight: 360, overflowY: 'auto', zIndex: 100,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}
              >
                {suggestions.map((product, idx) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => { setShowSuggestions(false); setSearchOpen(false); setSearchQuery(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      background: idx === selectedIndex ? 'var(--surface-container-high)' : 'transparent',
                      borderBottom: idx < suggestions.length - 1 ? '1px solid var(--outline)' : 'none',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-container-highest)', flexShrink: 0 }}>
                      <Image src={product.image} alt={product.name} fill sizes="40px" style={{ objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="line-clamp-1" style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>{product.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', margin: 0 }}>{product.category} · {product.subCategory}</p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--lime-400)', flexShrink: 0 }}>
                      GH₵{product.price.toFixed(2)}
                    </span>
                  </Link>
                ))}
                <Link
                  href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                  onClick={() => { setShowSuggestions(false); setSearchOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 14px',
                    color: 'var(--lime-400)', fontSize: 12, fontWeight: 700,
                    fontFamily: 'var(--font-lexend)', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  View all results for &ldquo;{searchQuery}&rdquo;
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--lime-400)' }}>arrow_forward</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Category nav row (only on / and /shop) ── */}
        {(pathname === '/' || pathname === '/shop') && !searchOpen && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '0 16px 10px', overflowX: 'auto',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          } as React.CSSProperties}>
            {/* "All" pill */}
            <Link
              href="/shop"
              aria-label="All categories"
              style={{
                padding: '5px 14px', borderRadius: 20, flexShrink: 0,
                fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: pathname === '/shop' && !activeCategory ? 'var(--lime-400)' : 'transparent',
                color: pathname === '/shop' && !activeCategory ? '#000' : 'var(--on-surface-variant)',
                border: pathname === '/shop' && !activeCategory ? 'none' : '1px solid var(--outline)',
                transition: 'all 0.2s',
              }}
            >
              All
            </Link>

            {/* Community link */}
            <Link
              href="/community"
              aria-label="Community"
              style={{
                padding: '5px 14px', borderRadius: 20, flexShrink: 0,
                fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: (pathname as string) === '/community' ? 'linear-gradient(135deg, #00e5ff, var(--lime-400))' : 'transparent',
                color: (pathname as string) === '/community' ? '#000' : 'var(--on-surface-variant)',
                border: (pathname as string) === '/community' ? 'none' : '1px solid var(--outline)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>forum</span>
              Community
            </Link>


            {primaryCats.map(cat => {
              const active = isCatActive(cat);
              return (
                <Link
                  key={cat}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  style={{
                    padding: '5px 14px', borderRadius: 20, flexShrink: 0,
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: active ? 'var(--lime-400)' : 'transparent',
                    color: active ? '#000' : 'var(--on-surface-variant)',
                    border: active ? 'none' : '1px solid var(--outline)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cat}
                </Link>
              );
            })}

            {/* "More ▾" dropdown for overflow categories */}
            {moreCats.length > 0 && (
              <div ref={moreRef} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  id="category-more-btn"
                  aria-label="More categories"
                  aria-expanded={moreOpen}
                  aria-haspopup="menu"
                  onClick={() => setMoreOpen(prev => !prev)}
                  style={{
                    padding: '5px 14px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: moreOpen ? 'var(--lime-400)' : 'transparent',
                    color: moreOpen ? '#000' : 'var(--on-surface-variant)',
                    border: moreOpen ? 'none' : '1px solid var(--outline)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 4,
                    whiteSpace: 'nowrap',
                  }}
                >
                  More
                  <span className="material-symbols-outlined" style={{
                    fontSize: 14,
                    transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>expand_more</span>
                </button>

                {/* Dropdown panel */}
                {moreOpen && (
                  <div
                    className="animate-scale-in"
                    role="menu"
                    style={{
                      position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                      background: 'var(--surface-container)', border: '1px solid var(--outline)',
                      borderRadius: 14, padding: 16,
                      minWidth: 240,
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      zIndex: 200,
                      display: 'flex', flexDirection: 'column', gap: 8,
                    }}
                  >
                    {moreCats.map(cat => {
                      const children = categoryHierarchy[cat] ?? [];
                      const active = isCatActive(cat);
                      return (
                        <div key={cat}>
                          <Link
                            href={`/shop?category=${encodeURIComponent(cat)}`}
                            role="menuitem"
                            onClick={() => setMoreOpen(false)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 10px', borderRadius: 8,
                              fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.06em',
                              color: active ? 'var(--lime-400)' : 'var(--foreground)',
                              background: active ? 'rgba(0,229,255,0.08)' : 'transparent',
                              transition: 'background 0.15s',
                            }}
                          >
                            {cat}
                            {children.length > 0 && (
                              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                                {children.length} sub
                              </span>
                            )}
                          </Link>
                          {children.length > 0 && (
                            <div style={{ paddingLeft: 10, display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                              {children.map(child => (
                                <Link
                                  key={child}
                                  href={`/shop?category=${encodeURIComponent(child)}`}
                                  role="menuitem"
                                  onClick={() => setMoreOpen(false)}
                                  style={{
                                    padding: '5px 10px', borderRadius: 6,
                                    fontFamily: 'var(--font-inter)', fontSize: 12,
                                    color: activeCategory === child ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                                    background: activeCategory === child ? 'rgba(0,229,255,0.08)' : 'transparent',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    transition: 'background 0.15s',
                                  }}
                                >
                                  <span style={{ fontSize: 8, opacity: 0.4 }}>└</span>
                                  {child}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Notification Drawer Panel */}
      <NotificationPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
};
