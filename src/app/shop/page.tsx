'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { topLevelCategories, categoryHierarchy, getCategoryFamily } from '@/data/products';
import { useWishlist, useCart, useToast, useStore } from '@/context/AppContext';
import { ProductLoadingSkeleton } from '@/components/ProductLoadingSkeleton';
import QuickViewModal from '@/components/QuickViewModal';
import type { Product } from '@/data/products';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'name_asc';

function jaroWinkler(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1 === s2) return 1;

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let m = 0;
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - range);
    const end = Math.min(s2.length - 1, i + range);
    for (let j = start; j <= end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  let t = 0;
  let point = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[point]) point++;
      if (s1[i] !== s2[point]) t++;
      point++;
    }
  }

  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  let l = 0;
  while (s1[l] === s2[l] && l < Math.min(4, s1.length)) l++;

  return jaro + l * 0.1 * (1 - jaro);
}

function isSearchMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (!q) return true;
  if (t.includes(q)) return true;

  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);

  for (const qw of qWords) {
    if (qw.length < 3) {
      if (!tWords.some(tw => tw.includes(qw))) return false;
      continue;
    }
    const hasCloseWord = tWords.some(tw => {
      if (tw.includes(qw)) return true;
      const sim = jaroWinkler(qw, tw);
      return sim > 0.82;
    });
    if (!hasCloseWord) return false;
  }
  return true;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const filterParam = searchParams.get('filter') || '';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { allProducts, productsLoading } = useStore();

  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    allProducts.forEach(p => p.sizes?.forEach(s => sizes.add(s)));
    return Array.from(sizes).sort();
  }, [allProducts]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    allProducts.forEach(p => p.colors?.forEach(c => colors.add(c)));
    return Array.from(colors).sort();
  }, [allProducts]);

  // Derive the selected parent category (if any)
  const selectedParent = useMemo(() => {
    if (activeCategory === 'All') return null;
    if (topLevelCategories.includes(activeCategory)) return activeCategory;
    for (const [parent, children] of Object.entries(categoryHierarchy)) {
      if (children.includes(activeCategory)) return parent;
    }
    return null;
  }, [activeCategory]);

  // Children of the selected parent (for sub-row)
  const activeChildren = useMemo(() => {
    if (!selectedParent) return [];
    return categoryHierarchy[selectedParent] ?? [];
  }, [selectedParent]);

  // Dynamic counts for each filter option based on base products matching categories/search/price/rating
  const facetCounts = useMemo(() => {
    const baseProducts = allProducts.filter(p => {
      // Flash sale filter
      if (filterParam === 'flash' && !p.isFlashSale) return false;
      // Category filter
      if (activeCategory !== 'All') {
        const family = getCategoryFamily(activeCategory);
        if (!family.includes(p.category)) return false;
      }
      // Search with typo tolerance
      if (localSearchQuery) {
        const searchTarget = `${p.name} ${p.category} ${p.subCategory} ${p.vendorStoreName || ''}`;
        if (!isSearchMatch(localSearchQuery, searchTarget)) return false;
      }
      // Price
      if (p.price < priceRange.min || p.price > priceRange.max) return false;
      // Rating
      if (minRating > 0 && p.rating < minRating) return false;
      // In stock
      if (inStockOnly && (!p.stock || p.stock <= 0)) return false;
      return true;
    });

    const sizes: Record<string, number> = {};
    const colors: Record<string, number> = {};

    baseProducts.forEach(p => {
      p.sizes?.forEach(s => {
        sizes[s] = (sizes[s] || 0) + 1;
      });
      p.colors?.forEach(c => {
        colors[c] = (colors[c] || 0) + 1;
      });
    });

    return { sizes, colors };
  }, [allProducts, activeCategory, localSearchQuery, priceRange, minRating, inStockOnly, filterParam]);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Flash sale filter
    if (filterParam === 'flash') {
      filtered = filtered.filter(p => p.isFlashSale);
    }

    // Category — if a top-level parent is selected, include all its children too
    if (activeCategory !== 'All') {
      const family = getCategoryFamily(activeCategory);
      filtered = filtered.filter(p => family.includes(p.category));
    }

    // Search with typo tolerance
    if (localSearchQuery) {
      filtered = filtered.filter(p => {
        const targetText = `${p.name} ${p.category} ${p.subCategory} ${p.vendorStoreName || ''}`;
        return isSearchMatch(localSearchQuery, targetText);
      });
    }

    // Price
    filtered = filtered.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    // Rating
    if (minRating > 0) {
      filtered = filtered.filter(p => p.rating >= minRating);
    }

    // In stock
    if (inStockOnly) {
      filtered = filtered.filter(p => (p.stock || 0) > 0);
    }

    // Sizes
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => p.sizes?.some(s => selectedSizes.includes(s)));
    }

    // Colors
    if (selectedColors.length > 0) {
      filtered = filtered.filter(p => p.colors?.some(c => selectedColors.includes(c)));
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'rating': sorted.sort((a, b) => b.rating - a.rating); break;
      case 'name_asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'newest':
      default: break; // Already sorted by createdAt from API
    }

    return sorted;
  }, [activeCategory, localSearchQuery, allProducts, priceRange, selectedSizes, selectedColors, sortBy, minRating, inStockOnly, filterParam]);

  // Category suggestions if search yields 0 results
  const suggestedCategories = useMemo(() => {
    if (filteredProducts.length > 0 || !localSearchQuery) return [];
    return topLevelCategories.filter(cat => {
      const catSimilarity = jaroWinkler(localSearchQuery.toLowerCase(), cat.toLowerCase());
      return catSimilarity > 0.45; // Match standard threshold for dynamic categories recommendation
    });
  }, [filteredProducts.length, localSearchQuery]);

  if (productsLoading) {
    return <ProductLoadingSkeleton />;
  }

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const clearFilters = () => {
    setPriceRange({ min: 0, max: 50000 });
    setSelectedSizes([]);
    setSelectedColors([]);
    setActiveCategory('All');
    setLocalSearchQuery('');
    setSortBy('newest');
    setMinRating(0);
    setInStockOnly(false);
  };

  const activeFilterCount = [
    priceRange.min > 0 || priceRange.max < 50000,
    selectedSizes.length > 0,
    selectedColors.length > 0,
    minRating > 0,
    inStockOnly,
  ].filter(Boolean).length;

  const sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: 'newest', label: 'Newest', icon: 'schedule' },
    { value: 'price_asc', label: 'Price: Low → High', icon: 'arrow_upward' },
    { value: 'price_desc', label: 'Price: High → Low', icon: 'arrow_downward' },
    { value: 'rating', label: 'Top Rated', icon: 'star' },
    { value: 'name_asc', label: 'Name: A → Z', icon: 'sort_by_alpha' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      {/* Header */}
      <section className="animate-fade-in-up" style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 32, fontWeight: 900, color: 'var(--foreground)', textTransform: 'uppercase' }}>
          {searchQuery ? `Results for "${searchQuery}"` : filterParam === 'flash' ? '⚡ Flash Sale' : 'Gear Up'}
        </h1>
        <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 4 }}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </p>
      </section>

      {/* Search & Filter Header */}
      <section className="animate-fade-in-up" style={{ padding: '16px 16px 0', display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: 20 }}>search</span>
          <input 
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="Search products..."
            id="shop-search-input"
            style={{ width: '100%', padding: '12px 16px 12px 44px', background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 12, color: 'var(--foreground)', fontSize: 14, outline: 'none' }}
          />
        </div>
        <button 
          onClick={() => setShowFilters(true)}
          style={{ 
            width: 48, height: 48, borderRadius: 12, background: 'var(--surface-container)', 
            border: activeFilterCount > 0 ? '2px solid var(--lime-400)' : '1px solid var(--outline)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
            color: activeFilterCount > 0 ? 'var(--lime-400)' : 'var(--foreground)',
            position: 'relative',
          }}
        >
          <span className="material-symbols-outlined">tune</span>
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--lime-400)', color: '#000',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-lexend)',
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </section>

      {/* Sort Bar */}
      <div className="no-scrollbar" style={{
        display: 'flex', gap: 6, padding: '12px 16px 4px',
        overflowX: 'auto', whiteSpace: 'nowrap',
      }}>
        {sortOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
              background: sortBy === opt.value ? 'color-mix(in srgb, var(--lime-400) 15%, transparent)' : 'transparent',
              color: sortBy === opt.value ? 'var(--lime-400)' : 'var(--on-surface-variant)',
              border: sortBy === opt.value ? '1px solid var(--lime-400)' : '1px solid var(--outline)',
              cursor: 'pointer', transition: 'all 0.2s',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Category Filter Row (hierarchical) ── */}
      <div style={{
        position: 'sticky', top: 100, zIndex: 25,
        background: 'var(--background)',
        borderBottom: '1px solid var(--outline)',
        paddingBottom: activeChildren.length > 0 ? 0 : 8,
      }}>
        {/* Top-level parent pills */}
        <div className="no-scrollbar" style={{
          display: 'flex', gap: 6, padding: '8px 16px',
          overflowX: 'auto', whiteSpace: 'nowrap',
        }}>
          <button
            onClick={() => setActiveCategory('All')}
            style={{
              padding: '6px 16px', borderRadius: 20,
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: activeCategory === 'All' ? 'var(--lime-400)' : 'transparent',
              color: activeCategory === 'All' ? '#000' : 'var(--on-surface-variant)',
              border: activeCategory === 'All' ? 'none' : '1px solid var(--outline)',
              cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
            }}
          >All</button>

          {topLevelCategories.map(cat => {
            const isActive = selectedParent === cat || activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '6px 16px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: isActive ? 'var(--lime-400)' : 'transparent',
                  color: isActive ? '#000' : 'var(--on-surface-variant)',
                  border: isActive ? 'none' : '1px solid var(--outline)',
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}
              >{cat}</button>
            );
          })}
        </div>

        {/* Child sub-pills — appear when a parent with children is selected */}
        {activeChildren.length > 0 && (
          <div className="no-scrollbar animate-fade-in" style={{
            display: 'flex', gap: 6, padding: '0 16px 8px',
            overflowX: 'auto', whiteSpace: 'nowrap',
          }}>
            {/* "All [Parent]" shortcut */}
            <button
              onClick={() => setActiveCategory(selectedParent!)}
              style={{
                padding: '4px 12px', borderRadius: 20,
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                background: activeCategory === selectedParent ? 'rgba(0,229,255,0.12)' : 'transparent',
                color: activeCategory === selectedParent ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                border: '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
              }}
            >All {selectedParent}</button>

            {activeChildren.map(child => (
              <button
                key={child}
                onClick={() => setActiveCategory(child)}
                style={{
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: activeCategory === child ? 'rgba(0,229,255,0.12)' : 'transparent',
                  color: activeCategory === child ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                  border: '1px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}
              >{child}</button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--on-surface-variant)', opacity: 0.3, marginBottom: 16 }}>search_off</span>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>No products found</h2>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 280, lineHeight: 1.6 }}>
            Try adjusting your filters or search term to find what you&apos;re looking for.
          </p>

          {/* Suggested Categories */}
          {suggestedCategories.length > 0 && (
            <div style={{ marginTop: 24, marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 12, fontWeight: 600 }}>Did you mean one of these categories?</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {suggestedCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setActiveCategory(cat);
                      setLocalSearchQuery('');
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-lexend)',
                      background: 'rgba(195,244,0,0.1)', color: 'var(--lime-400)',
                      border: '1px solid var(--lime-400)', cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={clearFilters} style={{
            marginTop: 20, padding: '12px 24px', borderRadius: 10,
            background: 'var(--lime-400)', color: '#000', border: 'none',
            fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* ── Product Grid ── */}
      <section style={{
        padding: '16px 10px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 12,
      }}>
        {filteredProducts.map((product, i) => (
          <div
            key={product.id}
            className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
            style={{
              display: 'flex', flexDirection: 'column',
              background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14,
              overflow: 'hidden', position: 'relative',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            {/* Image area */}
            <Link href={`/product/${product.id}`} style={{
              position: 'relative', aspectRatio: '1', display: 'block',
              background: 'var(--surface-container)', overflow: 'hidden',
            }}>
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 160px, 240px"
                style={{
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />

              {/* Badge — only show one */}
              {product.isFlashSale ? (
                <span style={{ position: 'absolute', top: 8, left: 8, background: '#ff4444', color: '#fff', fontSize: 8, fontWeight: 900, padding: '3px 6px', borderRadius: 4, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>⚡ SALE</span>
              ) : product.isNew ? (
                <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--lime-400)', color: '#000', fontSize: 8, fontWeight: 900, padding: '3px 6px', borderRadius: 4, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NEW</span>
              ) : product.isLimited ? (
                <span style={{ position: 'absolute', top: 8, left: 8, background: '#ff5e07', color: '#fff', fontSize: 8, fontWeight: 900, padding: '3px 6px', borderRadius: 4, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>LIMITED</span>
              ) : null}

              {/* Discount badge */}
              {product.originalPrice && (
                <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,68,68,0.9)', color: '#fff', fontSize: 8, fontWeight: 900, padding: '3px 6px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              )}

              {/* Out of stock overlay */}
              {(product.stock !== undefined && product.stock <= 0) && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 900, color: '#fff', background: 'var(--error)', padding: '6px 12px', borderRadius: 6, letterSpacing: '0.06em' }}>OUT OF STOCK</span>
                </div>
              )}

              {/* Wishlist button — top-right overlay */}
              <button
                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                onClick={e => {
                  e.preventDefault();
                  if (isInWishlist(product.id)) { removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }
                  else { addToWishlist(product); showToast('Added to wishlist!'); }
                }}
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  color: isInWishlist(product.id) ? '#ff4444' : 'rgba(255,255,255,0.7)',
                  transition: 'all 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              </button>
            </Link>

            {/* Card body */}
            <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', flex: 1, gap: 4 }}>
              {/* Vendor — clickable link to store */}
              {product.vendorStoreName && (
                <Link
                  href={`/store/${encodeURIComponent(product.vendorEmail || '')}`}
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontSize: 10, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)',
                    margin: 0, letterSpacing: '0.03em', fontWeight: 700,
                    opacity: 0.8, transition: 'opacity 0.15s',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 9 }}>storefront</span>
                  {product.vendorStoreName}
                </Link>
              )}

              {/* Product name — 2 lines */}
              <p className="line-clamp-2" style={{
                fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
                color: 'var(--foreground)', margin: 0, lineHeight: 1.35,
              }}>{product.name}</p>

              {/* Rating row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#A3A3A3' }}>{product.rating}</span>
                {(product.stock || 0) > 0 && (product.stock || 0) <= 5 && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#ff9800', marginLeft: 'auto' }}>{product.stock} LEFT</span>
                )}
              </div>

              {/* Price row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 900, color: 'var(--price-color)' }}>
                  GH&#x20B5;{product.price.toFixed(0)}
                </span>
                {product.originalPrice && (
                  <span style={{ fontSize: 10, color: '#666', textDecoration: 'line-through' }}>GH&#x20B5;{product.originalPrice.toFixed(0)}</span>
                )}
              </div>

              {/* Actions row */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {/* Add to Cart — premium gradient button */}
                <button
                  aria-label={`Add ${product.name} to cart`}
                  onClick={() => {
                    if ((product.stock || 0) <= 0) { showToast('Out of stock', 'error'); return; }
                    addToCart(product);
                    showToast(`${product.name} added to cart!`);
                  }}
                  disabled={(product.stock || 0) <= 0}
                  style={{
                    flex: 1, padding: '8px 0',
                    background: (product.stock || 0) <= 0
                      ? 'var(--surface-container-high)'
                      : 'linear-gradient(135deg, var(--lime-400) 0%, #a8e600 100%)',
                    color: (product.stock || 0) <= 0 ? '#555' : '#000',
                    border: 'none', borderRadius: 8,
                    fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 10,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: (product.stock || 0) <= 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: (product.stock || 0) > 0 ? '0 2px 8px rgba(195,244,0,0.25)' : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if ((product.stock || 0) > 0) {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(195,244,0,0.45)';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = (product.stock || 0) > 0 ? '0 2px 8px rgba(195,244,0,0.25)' : 'none';
                  }}
                  onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)'; }}
                  onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}
                  >
                    {(product.stock || 0) <= 0 ? 'block' : 'add_shopping_cart'}
                  </span>
                  {(product.stock || 0) <= 0 ? 'Sold Out' : 'Add'}
                </button>

                {/* Quick view */}
                <button
                  onClick={() => setQuickViewProduct(product)}
                  aria-label={`Quick view ${product.name}`}
                  style={{
                    width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: '1px solid var(--outline)', borderRadius: 8,
                    color: 'var(--on-surface-variant)',
                    transition: 'all 0.2s', flexShrink: 0,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lime-400)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--lime-400)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--outline)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--on-surface-variant)';
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Filter Sidebar Overlay */}
      {showFilters && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowFilters(false)}>
          <div 
            className="animate-slide-in-right"
            style={{ width: '85%', maxWidth: 350, height: '100%', background: 'var(--surface)', padding: '24px', display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900 }}>FILTERS</h2>
              <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Price Filter */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Price Range (GH₵)</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input 
                  type="number" 
                  value={priceRange.min} 
                  onChange={e => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                  style={{ flex: 1, padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', fontSize: 14 }}
                />
                <span style={{ color: 'var(--on-surface-variant)' }}>—</span>
                <input 
                  type="number" 
                  value={priceRange.max} 
                  onChange={e => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                  style={{ flex: 1, padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', fontSize: 14 }}
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Minimum Rating</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 3, 3.5, 4, 4.5].map(rating => (
                  <button 
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    style={{ 
                      padding: '8px 12px', borderRadius: 8, 
                      background: minRating === rating ? 'color-mix(in srgb, #fbbf24 15%, transparent)' : 'var(--surface-container-high)',
                      color: minRating === rating ? '#fbbf24' : 'var(--foreground)',
                      border: minRating === rating ? '1px solid #fbbf24' : '1px solid var(--outline)',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {rating === 0 ? 'All' : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
                        {rating}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Toggle */}
            <div>
              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  background: inStockOnly ? 'color-mix(in srgb, var(--lime-400) 10%, transparent)' : 'var(--surface-container)',
                  border: inStockOnly ? '1px solid var(--lime-400)' : '1px solid var(--outline)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: inStockOnly ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>inventory</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: inStockOnly ? 'var(--lime-400)' : 'var(--foreground)', fontFamily: 'var(--font-lexend)' }}>In Stock Only</span>
                </div>
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: inStockOnly ? 'var(--lime-400)' : 'var(--surface-container-highest)',
                  padding: 2, transition: 'all 0.2s', position: 'relative',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#fff',
                    transition: 'transform 0.2s',
                    transform: inStockOnly ? 'translateX(20px)' : 'translateX(0)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </button>
            </div>

            {/* Sizes Filter */}
            {allSizes.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Size</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {allSizes.map(size => {
                    const count = facetCounts.sizes[size] || 0;
                    const isSelected = selectedSizes.includes(size);
                    const disabled = count === 0 && !isSelected;
                    return (
                      <button 
                        key={size}
                        disabled={disabled}
                        onClick={() => toggleSize(size)}
                        style={{ 
                          padding: '8px 16px', borderRadius: 8, 
                          background: isSelected ? 'var(--lime-400)' : 'var(--surface-container-high)',
                          color: isSelected ? '#000' : 'var(--foreground)',
                          border: 'none', fontWeight: 700, fontSize: 12,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.35 : 1,
                        }}
                      >
                        {size} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colors Filter */}
            {allColors.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {allColors.map(color => {
                    const count = facetCounts.colors[color] || 0;
                    const isSelected = selectedColors.includes(color);
                    const disabled = count === 0 && !isSelected;
                    return (
                      <button 
                        key={color}
                        disabled={disabled}
                        onClick={() => toggleColor(color)}
                        style={{ 
                          padding: '8px 16px', borderRadius: 8, 
                          background: isSelected ? 'var(--lime-400)' : 'var(--surface-container-high)',
                          color: isSelected ? '#000' : 'var(--foreground)',
                          border: 'none', fontWeight: 700, fontSize: 12,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.35 : 1,
                        }}
                      >
                        {color} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
              <button onClick={clearFilters} style={{ flex: 1, padding: 16, borderRadius: 12, background: 'transparent', border: '1px solid var(--outline)', color: 'var(--foreground)', fontWeight: 700, cursor: 'pointer' }}>CLEAR</button>
              <button onClick={() => setShowFilters(false)} style={{ flex: 1, padding: 16, borderRadius: 12, background: 'var(--lime-400)', border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer' }}>APPLY</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ProductLoadingSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}
