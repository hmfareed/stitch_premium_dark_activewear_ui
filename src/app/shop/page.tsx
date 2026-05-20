'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { categories } from '@/data/products';
import { useWishlist, useCart, useToast, useStore } from '@/context/AppContext';
import { ProductLoadingSkeleton } from '@/components/ProductLoadingSkeleton';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'name_asc';

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

  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Flash sale filter
    if (filterParam === 'flash') {
      filtered = filtered.filter(p => p.isFlashSale);
    }

    // Category
    if (activeCategory !== 'All') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    // Search
    const q = localSearchQuery.toLowerCase();
    if (q) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.subCategory.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.vendorStoreName && p.vendorStoreName.toLowerCase().includes(q))
      );
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

      {/* Category Tabs (Horizontal Scroll) */}
      <div className="no-scrollbar" style={{
        position: 'sticky', top: 110, zIndex: 25,
        display: 'flex', gap: 8, padding: '8px 16px',
        overflowX: 'auto', whiteSpace: 'nowrap',
        background: 'var(--background)',
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 16px', borderRadius: 20,
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: activeCategory === cat ? 'var(--lime-400)' : 'var(--surface-container-high)',
              color: activeCategory === cat ? '#000' : 'var(--on-surface-variant)',
              border: 'none',
              cursor: 'pointer', transition: 'all 0.25s',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--on-surface-variant)', opacity: 0.3, marginBottom: 16 }}>search_off</span>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>No products found</h2>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 280, lineHeight: 1.6 }}>
            Try adjusting your filters or search term to find what you&apos;re looking for.
          </p>
          <button onClick={clearFilters} style={{
            marginTop: 20, padding: '12px 24px', borderRadius: 10,
            background: 'var(--lime-400)', color: '#000', border: 'none',
            fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Product Grid */}
      <section style={{ padding: '12px 8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, paddingBottom: 32 }}>
        {filteredProducts.map((product, i) => (
          <div key={product.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`} style={{ 
            display: 'flex', flexDirection: 'column', height: '100%', 
            background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 10, padding: 6,
            position: 'relative'
          }}>
            <Link href={`/product/${product.id}`} style={{
              position: 'relative', aspectRatio: '1', background: 'var(--surface-container)',
              borderRadius: 6, overflow: 'hidden',
              marginBottom: 6, display: 'block',
            }}>
              <img style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} alt={product.name} src={product.image} />
              {product.isNew && (
                <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 3, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' }}>NEW</span>
              )}
              {product.isLimited && (
                <span style={{ position: 'absolute', top: 4, left: 4, background: '#ff5e07', color: '#fff', fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 3, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' }}>LTD</span>
              )}
              {product.isFlashSale && (
                <span style={{ position: 'absolute', top: 4, left: 4, background: '#ff4444', color: '#fff', fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 3, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' }}>⚡ SALE</span>
              )}
              {product.originalPrice && (
                <span style={{ position: 'absolute', top: 4, right: 4, background: '#ff4444', color: '#fff', fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 3, fontFamily: 'var(--font-lexend)' }}>
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              )}
              {(product.stock !== undefined && product.stock <= 0) && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 9, fontWeight: 900, color: '#fff', background: 'var(--error)', padding: '4px 8px', borderRadius: 4 }}>OUT</span>
                </div>
              )}
            </Link>
            
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', margin: 0, flex: 1 }}>{product.name}</p>
                <button
                  onClick={() => {
                    if (isInWishlist(product.id)) { removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }
                    else { addToWishlist(product); showToast('Added to wishlist!'); }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isInWishlist(product.id) ? 'var(--error)' : 'var(--on-surface-variant)', display: 'flex', flexShrink: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                </button>
              </div>
              
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 8, color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 4px' }}>{product.subCategory}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--price-color)' }}>GH₵{product.price.toFixed(0)}</span>
                {product.originalPrice && <span style={{ fontSize: 9, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>GH₵{product.originalPrice.toFixed(0)}</span>}
              </div>
              
              {/* Rating + Stock Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 10, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--foreground)' }}>{product.rating}</span>
                </div>
                <span style={{ fontSize: 7, fontWeight: 900, color: (product.stock || 0) > 5 ? 'var(--lime-400)' : (product.stock || 0) > 0 ? '#ff9800' : 'var(--error)' }}>
                  {(product.stock || 0) > 0 ? `${product.stock} LEFT` : 'OUT'}
                </span>
              </div>
              
              {/* Stock Bar */}
              <div style={{ marginTop: 3 }}>
                <div style={{ height: 2, width: '100%', background: 'var(--surface-container-highest)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(((product.stock || 0) / 20) * 100, 100)}%`, 
                    background: (product.stock || 0) > 5 ? 'var(--lime-400)' : 'var(--error)',
                    borderRadius: 2,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            </div>

            {/* Quick Add to Cart */}
            <button
              onClick={() => {
                if ((product.stock || 0) <= 0) { showToast('Out of stock', 'error'); return; }
                addToCart(product);
                showToast(`${product.name} added to cart!`);
              }}
              disabled={(product.stock || 0) <= 0}
              style={{
                width: '100%', marginTop: 8, padding: '5px 0',
                background: (product.stock || 0) <= 0 ? 'var(--surface-container-high)' : 'var(--lime-400)',
                color: (product.stock || 0) <= 0 ? 'var(--on-surface-variant)' : '#000',
                border: 'none', borderRadius: 6,
                fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                cursor: (product.stock || 0) <= 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>shopping_cart</span>
              {(product.stock || 0) <= 0 ? 'OUT' : '+ CART'}
            </button>
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
                  {allSizes.map(size => (
                    <button 
                      key={size}
                      onClick={() => toggleSize(size)}
                      style={{ 
                        padding: '8px 16px', borderRadius: 8, 
                        background: selectedSizes.includes(size) ? 'var(--lime-400)' : 'var(--surface-container-high)',
                        color: selectedSizes.includes(size) ? '#000' : 'var(--foreground)',
                        border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors Filter */}
            {allColors.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {allColors.map(color => (
                    <button 
                      key={color}
                      onClick={() => toggleColor(color)}
                      style={{ 
                        padding: '8px 16px', borderRadius: 8, 
                        background: selectedColors.includes(color) ? 'var(--lime-400)' : 'var(--surface-container-high)',
                        color: selectedColors.includes(color) ? '#000' : 'var(--foreground)',
                        border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      {color}
                    </button>
                  ))}
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

    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--foreground)' }}>Loading Shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
