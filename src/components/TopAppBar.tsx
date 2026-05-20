'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart, useAuth, useStore } from '@/context/AppContext';
import { categories, Product } from '@/data/products';
import { Icon } from './Icon';

export const TopAppBar: React.FC = () => {
  const { totalItems } = useCart();
  const { user } = useAuth();
  const { allProducts } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isCheckout = pathname === '/checkout' || pathname === '/confirmation';

  // Read category from URL safely after mount (avoids hydration mismatch)
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

  // Keyboard navigation
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
        {/* Main bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 16px', height: 56,
        }}>
          <Link href="/" style={{
            fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 22,
            color: 'var(--lime-400)', letterSpacing: '-0.03em',
          }}>
            AfriCart
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => { setSearchOpen(!searchOpen); if (!searchOpen) setTimeout(() => inputRef.current?.focus(), 100); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--on-surface-variant)' }}
            >
              <Icon name="search" size={22} />
            </button>

            <Link href={user ? '/account' : '/login'} style={{ padding: 8, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}>
              <Icon name={user ? 'person' : 'person_outline'} size={22} />
            </Link>

            <Link href="/cart" style={{ padding: 8, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', position: 'relative' }}>
              <Icon name="shopping_bag" size={22} />
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

        {/* Search bar with live autocomplete */}
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
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--foreground)', padding: '10px 0', fontSize: 14,
                  fontFamily: 'var(--font-inter)',
                }}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555' }}>
                  <Icon name="close" size={18} />
                </button>
              )}
            </form>

            {/* Live suggestions dropdown */}
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
                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-container-highest)', flexShrink: 0 }}>
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

                {/* View all results link */}
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

        {/* Category pills (only on Home / Shop) */}
        {(pathname === '/' || pathname === '/shop') && !searchOpen && (
          <div className="no-scrollbar" style={{
            display: 'flex', gap: 8, padding: '0 16px 10px',
            overflowX: 'auto', whiteSpace: 'nowrap',
          }}>
            {categories.map(cat => {
              const isActive = pathname === '/shop' && activeCategory === cat;
              return (
                <Link
                  key={cat}
                  href={cat === 'All' ? '/shop' : `/shop?category=${cat}`}
                  style={{
                    padding: '6px 16px', borderRadius: 20,
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    background: isActive ? 'var(--lime-400)' : 'transparent',
                    color: isActive ? '#000' : 'var(--on-surface-variant)',
                    border: isActive ? 'none' : '1px solid var(--outline)',
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
