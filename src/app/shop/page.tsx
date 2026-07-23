'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart, useWishlist, useToast, useAuth, useStore, useNotifications } from '@/context/AppContext';
import { Product, topLevelCategories, categoryHierarchy, getCategoryFamily } from '@/data/products';
import { ProductLoadingSkeleton } from '@/components/ProductLoadingSkeleton';
import QuickViewModal from '@/components/QuickViewModal';

const CATEGORY_ICONS: Record<string, string> = {
  'Fashion': 'checkroom',
  'Phones & Electronics': 'smartphone',
  'Electronics': 'devices',
  'Groceries': 'local_grocery_store',
  'Beauty': 'spa',
  'Home & Living': 'chair',
  'Home': 'chair',
  'Kids & Baby': 'child_care',
  'Baby': 'child_care',
  'Local Crafts': 'palette',
  'Sports': 'sports_soccer',
  'Phones': 'smartphone',
  'Mobile Accessories': 'headphones',
  'Cooling': 'ac_unit',
  'Washers/Dryers': 'local_laundry_service',
  'Gaming': 'sports_esports',
  'Health': 'health_and_safety',
  'Books': 'menu_book',
  'Automotive': 'directions_car',
  'Toys': 'toys',
  'Computing': 'laptop',
  'Phones/Tablets': 'tablet_mac',
  'Pet Supplies': 'pets',
  'Home Appliances': 'kitchen',
  'Phone Accessories': 'headset',
  'Beverages': 'local_bar',
};

const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #153200 0%, #2e4a00 50%, #0d1e00 100%)',
  'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #090d16 100%)',
  'linear-gradient(135deg, #311b92 0%, #4527a0 50%, #1a0c4d 100%)',
  'linear-gradient(135deg, #881337 0%, #9f1239 50%, #4c0519 100%)',
  'linear-gradient(135deg, #064e3b 0%, #047857 50%, #022c22 100%)',
];

/* ─── Registered Vendor type ─────────────────────────────────────────────── */
interface RegisteredVendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeName: string;
  businessCategory: string | null;
  profilePic: string | null;
  isVerified: boolean;
  joinedAt: string;
}

function HomeStorefrontContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { totalItems, addToCart } = useCart();
  const { totalWishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { unreadCount } = useNotifications();
  const { showToast } = useToast();
  const { allProducts, productsLoading } = useStore();

  const viewMode = searchParams.get('view');
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Live Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic Rotating Banner State
  const [bannerIndex, setBannerIndex] = useState(0);

  // Derived user greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'Ama';
  const hour = new Date().getHours();
  const greetingTime = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Dynamic Store Products for Banner Carousel
  const bannerProducts = useMemo(() => {
    if (!allProducts.length) return [];
    return allProducts.slice(0, 6);
  }, [allProducts]);

  useEffect(() => {
    if (!bannerProducts.length) return;
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % bannerProducts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bannerProducts]);

  // Live search handler
  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    setSelectedIndex(-1);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = val.toLowerCase();
    const matches = allProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
      (p.vendorStoreName && p.vendorStoreName.toLowerCase().includes(q))
    ).slice(0, 6);
    setSuggestions(matches);
    setShowSuggestions(true);
  }, [allProducts]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside search suggestions
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        router.push(`/product/${suggestions[selectedIndex].id}`);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Flash deals products
  const flashDeals = useMemo(() => {
    return allProducts.filter(p => p.isFlashSale || p.originalPrice).slice(0, 8);
  }, [allProducts]);

  const [registeredVendors, setRegisteredVendors] = useState<RegisteredVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<RegisteredVendor | null>(null);

  // Colour palette for vendor avatars (cycles)
  const VENDOR_COLORS = ['#1e3a8a', '#f59e0b', '#047857', '#6b21a8', '#be123c', '#0369a1', '#65a30d', '#92400e'];

  useEffect(() => {
    fetch('/api/vendors')
      .then(r => r.json())
      .then(d => { if (d.success) setRegisteredVendors(d.vendors); })
      .catch(() => {});
  }, []);

  // Recently viewed / Pick up where you left off
  const recentProducts = useMemo(() => {
    return allProducts.slice(0, 6);
  }, [allProducts]);

  // Popular & Category Filtered products
  const popularProducts = useMemo(() => {
    let filtered = allProducts;
    if (selectedCategory !== 'All') {
      const family = getCategoryFamily(selectedCategory);
      filtered = filtered.filter(p => {
        if (p.category === selectedCategory || p.subCategory === selectedCategory) return true;
        return family.some(f => 
          p.category.toLowerCase() === f.toLowerCase() || 
          (p.subCategory && p.subCategory.toLowerCase() === f.toLowerCase())
        );
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [allProducts, selectedCategory, searchQuery]);

  if (productsLoading) return <ProductLoadingSkeleton />;

  /* ── 🌟 DEDICATED CATEGORIES VIEW (Triggered via Bottom Nav "Categories") ── */
  if (viewMode === 'categories') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh', background: 'var(--background)',
        paddingBottom: 100, color: 'var(--foreground)'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', background: 'var(--surface-container-low)',
          borderBottom: '1px solid var(--outline)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
              Explore Categories 🗂️
            </h1>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>
              Select a category to view collection products
            </p>
          </div>
          <button
            onClick={() => router.push('/shop')}
            style={{
              background: 'rgba(195,244,0,0.12)', border: '1px solid rgba(195,244,0,0.3)',
              borderRadius: 20, padding: '6px 14px', color: 'var(--lime-400)',
              fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Storefront
          </button>
        </div>

        {/* Category List Cards Grid */}
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {topLevelCategories.map(cat => {
            const iconName = CATEGORY_ICONS[cat] || 'category';
            const children = categoryHierarchy[cat] || [];
            const catProducts = allProducts.filter(p => p.category === cat || children.includes(p.category));

            return (
              <div
                key={cat}
                style={{
                  background: 'var(--surface-container)', border: '1px solid var(--outline)',
                  borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 14
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: 'rgba(195,244,0,0.15)', border: '1px solid rgba(195,244,0,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--lime-400)'
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{iconName}</span>
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 800, margin: 0 }}>{cat}</h3>
                      <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>{catProducts.length} Items</span>
                    </div>
                  </div>
                  <Link
                    href={`/shop?category=${encodeURIComponent(cat)}`}
                    style={{
                      color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)',
                      fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      display: 'flex', alignItems: 'center', gap: 2,
                      background: 'rgba(195,244,0,0.08)', padding: '6px 12px', borderRadius: 20
                    }}
                  >
                    View All <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                  </Link>
                </div>

                {/* Subcategory Pills */}
                {children.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {children.map(sub => (
                      <Link
                        key={sub}
                        href={`/shop?category=${encodeURIComponent(sub)}`}
                        style={{
                          padding: '6px 14px', borderRadius: 20,
                          background: 'var(--surface-container-high)', border: '1px solid var(--outline)',
                          color: 'var(--foreground)', fontSize: 11, fontWeight: 600,
                          textDecoration: 'none', transition: 'all 0.15s'
                        }}
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Sample product previews */}
                {catProducts.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 2 }}>
                    {catProducts.slice(0, 4).map(p => (
                      <div
                        key={p.id}
                        onClick={() => router.push(`/product/${p.id}`)}
                        style={{
                          position: 'relative', aspectRatio: '1/1', borderRadius: 10,
                          overflow: 'hidden', background: 'var(--surface)', cursor: 'pointer',
                          border: '1px solid var(--outline)'
                        }}
                      >
                        <Image src={p.image} alt={p.name} fill sizes="120px" style={{ objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentBannerProduct = bannerProducts[bannerIndex] || bannerProducts[0];
  const activeGradient = BANNER_GRADIENTS[bannerIndex % BANNER_GRADIENTS.length];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', background: 'var(--background)',
      paddingBottom: 90, color: 'var(--foreground)'
    }}>
      {/* ── 1. Top Bar: Greeting ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px 12px', background: 'var(--background)',
        borderBottom: '1px solid var(--outline)'
      }}>
        {/* User Greeting */}
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
          {greetingTime}, {firstName} 👋
        </h1>
      </div>

      {/* ── 2. Search Bar with LIVE Suggestions ── */}
      <div style={{ padding: '12px 18px 16px', display: 'flex', gap: 10 }}>
        <div ref={searchContainerRef} style={{ flex: 1, position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--surface-container)', border: '1px solid var(--outline)',
            borderRadius: showSuggestions && suggestions.length > 0 ? '14px 14px 0 0' : 14,
            padding: '0 14px', transition: 'border-radius 0.15s'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => { if (searchQuery.trim() && suggestions.length > 0) setShowSuggestions(true); }}
              placeholder="Search products, categories, stores..."
              style={{
                width: '100%', padding: '12px 10px', background: 'transparent',
                border: 'none', outline: 'none', color: 'var(--foreground)',
                fontSize: 14, fontFamily: 'var(--font-inter)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 4 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            )}
          </div>

          {/* Live suggestions popover dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--surface-container)', border: '1px solid var(--outline)',
                borderTop: 'none', borderRadius: '0 0 14px 14px', zIndex: 999,
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)', overflow: 'hidden'
              }}
            >
              {suggestions.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setShowSuggestions(false);
                    router.push(`/product/${p.id}`);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    cursor: 'pointer',
                    background: idx === selectedIndex ? 'rgba(195,244,0,0.12)' : 'transparent',
                    borderBottom: idx < suggestions.length - 1 ? '1px solid var(--outline)' : 'none',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ position: 'relative', width: 42, height: 42, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)' }}>
                    <Image src={p.image} alt={p.name} fill sizes="42px" style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="line-clamp-1" style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', margin: 0 }}>{p.category} {p.subCategory ? `· ${p.subCategory}` : ''}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: 'var(--lime-400)', flexShrink: 0 }}>
                    GH₵{p.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--surface-container)', border: '1px solid var(--outline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--foreground)', cursor: 'pointer'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>tune</span>
        </button>
      </div>

      {/* ── 4. Category Circles Horizontal Scroll (MODERN PROFESSIONAL VECTOR ICONS) ── */}
      <div className="no-scrollbar" style={{
        display: 'flex', gap: 14, padding: '4px 18px 16px',
        overflowX: 'auto', whiteSpace: 'nowrap'
      }}>
        {topLevelCategories.map(cat => {
          const iconName = CATEGORY_ICONS[cat] || 'category';
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(isSelected ? 'All' : cat)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0
              }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: isSelected ? 'rgba(195,244,0,0.18)' : 'var(--surface-container)',
                border: isSelected ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 0 16px rgba(195,244,0,0.3)' : 'none'
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 26,
                  color: isSelected ? 'var(--lime-400)' : 'var(--on-surface-variant)'
                }}>
                  {iconName}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700,
                color: isSelected ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                maxWidth: 68, textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.2
              }}>
                {cat}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── DEDICATED CATEGORY & SEARCH FILTERED RESULTS VIEW ── */}
      {(selectedCategory !== 'All' || searchQuery.trim()) && (
        <div style={{ padding: '0 18px 28px' }} className="animate-fade-in">
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16, background: 'var(--surface-container)', padding: '14px 18px',
            borderRadius: 16, border: '1px solid var(--outline)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 22 }}>
                  {CATEGORY_ICONS[selectedCategory] || 'category'}
                </span>
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--foreground)' }}>
                  {selectedCategory !== 'All' ? selectedCategory : `Search: "${searchQuery}"`}
                </h3>
              </div>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>
                Showing {popularProducts.length} product{popularProducts.length === 1 ? '' : 's'}
              </p>
            </div>

            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              style={{
                background: 'rgba(195,244,0,0.15)', border: '1px solid var(--lime-400)',
                color: 'var(--lime-400)', borderRadius: 20, padding: '6px 14px',
                fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, cursor: 'pointer'
              }}
            >
              Clear Filter ✕
            </button>
          </div>

          {popularProducts.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--surface-container)', borderRadius: 16, border: '1px solid var(--outline)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--on-surface-variant)', marginBottom: 8 }}>search_off</span>
              <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--foreground)' }}>
                No products found in {selectedCategory}
              </h4>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)', margin: '0 0 14px' }}>
                Try selecting a different category or clearing your filter.
              </p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                style={{ background: 'var(--lime-400)', color: '#000', border: 'none', borderRadius: 12, padding: '10px 20px', fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                View All Products
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {popularProducts.map(p => {
                const inWish = isInWishlist(p.id);
                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--surface-container)', border: '1px solid var(--outline)',
                      borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      position: 'relative', padding: 10
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        inWish ? removeFromWishlist(p.id) : addToWishlist(p);
                      }}
                      style={{
                        position: 'absolute', top: 16, right: 16, zIndex: 5,
                        width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
                        color: inWish ? '#ef4444' : '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {inWish ? 'favorite' : 'favorite_border'}
                      </span>
                    </button>

                    <div
                      onClick={() => router.push(`/product/${p.id}`)}
                      style={{
                        position: 'relative', width: '100%', aspectRatio: '1/1',
                        borderRadius: 10, overflow: 'hidden', background: 'var(--surface)',
                        cursor: 'pointer', marginBottom: 8
                      }}
                    >
                      <Image src={p.image} alt={p.name} fill sizes="180px" style={{ objectFit: 'cover' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                      <p
                        className="line-clamp-1"
                        onClick={() => router.push(`/product/${p.id}`)}
                        style={{
                          fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
                          color: 'var(--foreground)', margin: 0, cursor: 'pointer'
                        }}
                      >
                        {p.name}
                      </p>

                      <p style={{
                        fontFamily: 'var(--font-inter)', fontSize: 10,
                        color: 'var(--on-surface-variant)', margin: 0
                      }}>
                        {p.vendorStoreName || 'Zarstyle Ghana'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                        <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: 'var(--lime-400)' }}>
                          GH₵{p.price.toFixed(2)}
                        </span>
                        {p.originalPrice && (
                          <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>
                            GH₵{p.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <span style={{ color: '#f59e0b', fontSize: 11 }}>★</span>
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                          {p.rating || '4.6'} ({p.reviewsCount || p.reviews?.length || '120'})
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                          showToast(`Added ${p.name} to cart!`, 'success');
                        }}
                        style={{
                          width: '100%', padding: '7px 10px', marginTop: 8,
                          background: 'var(--lime-400)', color: '#000',
                          borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add_shopping_cart</span>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 5. DYNAMIC ROTATING STORE BANNER (Changes products automatically) ── */}
      {currentBannerProduct && (
        <div style={{ padding: '0 18px 24px' }}>
          <div style={{
            position: 'relative', borderRadius: 20, overflow: 'hidden',
            background: activeGradient,
            padding: '20px', border: '1px solid rgba(195,244,0,0.25)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            transition: 'background 0.5s ease-in-out'
          }}>
            <div style={{ flex: 1, paddingRight: 12, minWidth: 0 }}>
              {/* Tag */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--lime-400)', color: '#000',
                padding: '4px 12px', borderRadius: 100,
                fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 900,
                textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8
              }}>
                🔥 FEATURED DEAL
              </div>

              <h2 className="line-clamp-2" style={{
                fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900,
                lineHeight: 1.2, margin: '0 0 6px', letterSpacing: '-0.02em'
              }}>
                {currentBannerProduct.name}
              </h2>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, color: 'var(--lime-400)' }}>
                  GH₵{currentBannerProduct.price.toFixed(2)}
                </span>
                {currentBannerProduct.originalPrice && (
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'rgba(255,255,255,0.6)', textDecoration: 'line-through' }}>
                    GH₵{currentBannerProduct.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>

              <button
                onClick={() => router.push(`/product/${currentBannerProduct.id}`)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#fff', color: '#000', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 900,
                  padding: '8px 18px', borderRadius: 100,
                  textTransform: 'uppercase', letterSpacing: '0.06em'
                }}
              >
                Shop Now
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </button>
            </div>

            {/* Product Banner Image */}
            <div
              onClick={() => router.push(`/product/${currentBannerProduct.id}`)}
              style={{
                position: 'relative', width: 110, height: 110, borderRadius: 14,
                overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}
            >
              <Image src={currentBannerProduct.image} alt={currentBannerProduct.name} fill sizes="110px" style={{ objectFit: 'cover' }} />
            </div>

            {/* Carousel Dots */}
            <div style={{
              position: 'absolute', bottom: 8, left: 0, right: 0,
              display: 'flex', gap: 6, justifyContent: 'center'
            }}>
              {bannerProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setBannerIndex(idx)}
                  style={{
                    width: idx === bannerIndex ? 18 : 6, height: 6, borderRadius: 100,
                    background: idx === bannerIndex ? 'var(--lime-400)' : 'rgba(255,255,255,0.3)',
                    border: 'none', padding: 0, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Flash Deals ⚡ Section ── */}
      <div style={{ paddingBottom: 24 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 18px 12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, margin: 0 }}>
              Flash Deals ⚡
            </h3>
            <span style={{
              background: '#ef4444', color: '#fff',
              fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800,
              padding: '3px 8px', borderRadius: 6
            }}>
              Ends in 02:14:56
            </span>
          </div>

          <Link href="/shop?filter=flash" style={{
            fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
            color: '#22c55e', textDecoration: 'none'
          }}>
            See All &gt;
          </Link>
        </div>

        {/* Cards Row */}
        <div className="no-scrollbar" style={{
          display: 'flex', gap: 12, padding: '0 18px',
          overflowX: 'auto', whiteSpace: 'nowrap'
        }}>
          {flashDeals.map(p => (
            <div
              key={p.id}
              style={{
                width: 150, flexShrink: 0, background: 'var(--surface-container)',
                borderRadius: 14, border: '1px solid var(--outline)',
                padding: 10, position: 'relative', display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Discount Tag */}
              <span style={{
                position: 'absolute', top: 8, left: 8, zIndex: 2,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 900, fontFamily: 'var(--font-lexend)',
                padding: '2px 6px', borderRadius: 4
              }}>
                -30%
              </span>

              {/* Product Picture -> Opens full details */}
              <div
                onClick={() => router.push(`/product/${p.id}`)}
                style={{
                  position: 'relative', width: '100%', height: 110,
                  borderRadius: 10, overflow: 'hidden', background: 'var(--surface)',
                  marginBottom: 8, cursor: 'pointer'
                }}
              >
                <Image src={p.image} alt={p.name} fill sizes="150px" style={{ objectFit: 'cover' }} />
              </div>

              <p className="line-clamp-1" style={{
                fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
                color: 'var(--foreground)', margin: '0 0 4px', cursor: 'pointer'
              }} onClick={() => router.push(`/product/${p.id}`)}>
                {p.name}
              </p>

              <p style={{
                fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900,
                color: 'var(--lime-400)', margin: '0 0 2px'
              }}>
                GH₵{p.price.toFixed(2)}
              </p>

              {/* Add to Cart Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(p);
                  showToast(`Added ${p.name} to cart!`, 'success');
                }}
                style={{
                  width: '100%', padding: '6px', marginTop: 6,
                  background: 'var(--lime-400)', color: '#000',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>add_shopping_cart</span>
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Pick Up Where You Left Off ── */}
      <div style={{ paddingBottom: 24 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 18px 12px'
        }}>
          <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, margin: 0 }}>
            Pick Up Where You Left Off
          </h3>
          <Link href="/shop" style={{
            fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
            color: '#22c55e', textDecoration: 'none'
          }}>
            See All &gt;
          </Link>
        </div>

        <div className="no-scrollbar" style={{
          display: 'flex', gap: 12, padding: '0 18px',
          overflowX: 'auto', whiteSpace: 'nowrap'
        }}>
          {recentProducts.map(p => (
            <div
              key={p.id}
              style={{
                width: 180, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--surface-container)', border: '1px solid var(--outline)',
                borderRadius: 12, padding: 8
              }}
            >
              <div
                onClick={() => router.push(`/product/${p.id}`)}
                style={{
                  width: 50, height: 50, borderRadius: 8,
                  overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer'
                }}
              >
                <Image src={p.image} alt={p.name} fill sizes="50px" style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="line-clamp-1"
                  onClick={() => router.push(`/product/${p.id}`)}
                  style={{
                    fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
                    color: 'var(--foreground)', margin: '0 0 2px', cursor: 'pointer'
                  }}
                >
                  {p.name}
                </p>
                <p style={{
                  fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 900,
                  color: 'var(--lime-400)', margin: '0 0 4px'
                }}>
                  GH₵{p.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. Shop by Vendor (Live Registered Vendors) ── */}
      {registeredVendors.length > 0 && (
        <div style={{ paddingBottom: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 18px 12px'
          }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, margin: 0 }}>
              Shop by Vendor
            </h3>
            <span style={{
              fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
              color: 'var(--on-surface-variant)'
            }}>
              {registeredVendors.length} Vendors
            </span>
          </div>

          <div className="no-scrollbar" style={{
            display: 'flex', gap: 14, padding: '0 18px',
            overflowX: 'auto', whiteSpace: 'nowrap'
          }}>
            {registeredVendors.map((v, idx) => {
              const color = VENDOR_COLORS[idx % VENDOR_COLORS.length];
              const initial = (v.storeName || v.name)[0].toUpperCase();
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVendor(v)}
                  style={{
                    width: 160, flexShrink: 0, background: 'var(--surface-container)',
                    border: '1px solid var(--outline)', borderRadius: 16,
                    padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', cursor: 'pointer',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    whiteSpace: 'normal'
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lime-400)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 16px rgba(195,244,0,0.2)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--outline)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  {v.profilePic ? (
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%',
                      overflow: 'hidden', position: 'relative', marginBottom: 8, flexShrink: 0
                    }}>
                      <Image src={v.profilePic} alt={v.name} fill sizes="54px" style={{ objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: 54, height: 54, borderRadius: '50%',
                      background: color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 20,
                      marginBottom: 8, flexShrink: 0
                    }}>
                      {initial}
                    </div>
                  )}

                  <p style={{
                    fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800,
                    color: 'var(--foreground)', margin: '0 0 4px',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const
                  }}>
                    {v.storeName || v.name}
                  </p>

                  {v.isVerified ? (
                    <span style={{
                      fontSize: 10, color: '#22c55e', fontWeight: 700,
                      fontFamily: 'var(--font-inter)', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 2
                    }}>
                      ✔ Verified Vendor
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 10, color: '#f59e0b', fontWeight: 700,
                      fontFamily: 'var(--font-inter)', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 2
                    }}>
                      ⏳ Unverified Vendor
                    </span>
                  )}

                  <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                    Tap to view profile
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Vendor Detail Modal ── */}
      {selectedVendor && (
        <div
          onClick={() => setSelectedVendor(null)}
          className="animate-fade-in"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-scale-up"
            style={{
              width: '100%', maxWidth: 440,
              background: 'var(--surface-container)',
              borderRadius: 24,
              padding: '24px 0',
              border: '1px solid var(--outline)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Close top right button */}
            <button
              onClick={() => setSelectedVendor(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--surface-container-high)', border: '1px solid var(--outline)',
                color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 10
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            </button>

            {/* Avatar + store header */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 24px 20px', borderBottom: '1px solid var(--outline)', gap: 12 }}>
              {selectedVendor.profilePic ? (
                <div style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', position: 'relative', border: '3px solid var(--lime-400)', boxShadow: '0 0 20px rgba(195,244,0,0.3)' }}>
                  <Image src={selectedVendor.profilePic} alt={selectedVendor.name} fill sizes="76px" style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{
                  width: 76, height: 76, borderRadius: '50%',
                  background: `linear-gradient(135deg, var(--lime-400), #86efac)`,
                  color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 30,
                  border: '3px solid var(--lime-400)', boxShadow: '0 0 20px rgba(195,244,0,0.3)'
                }}>
                  {(selectedVendor.storeName || selectedVendor.name)[0].toUpperCase()}
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, margin: '0 0 4px', color: 'var(--foreground)' }}>
                  {selectedVendor.storeName || selectedVendor.name}
                </h2>
                {selectedVendor.isVerified ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                    fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800,
                    padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>verified</span>
                    Verified Vendor
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                    fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800,
                    padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>pending</span>
                    Pending Verification
                  </span>
                )}
              </div>
            </div>

            {/* Vendor details */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: 'person', label: 'Owner Name', value: selectedVendor.name },
                { icon: 'phone', label: 'Phone', value: selectedVendor.phone },
                { 
                  icon: 'email', 
                  label: 'Email (Protected)', 
                  value: (() => {
                    const e = selectedVendor.email;
                    if (!e || !e.includes('@')) return e;
                    const [local, dom] = e.split('@');
                    const domParts = dom.split('.');
                    const lMask = local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : `${local[0]}*`;
                    const dName = domParts[0];
                    const ext = domParts.slice(1).join('.');
                    const dMask = dName.length > 2 ? `${dName[0]}***${dName[dName.length - 1]}` : `${dName[0]}*`;
                    return `${lMask}@${dMask}.${ext}`;
                  })()
                },
                { icon: 'storefront', label: 'Store Name', value: selectedVendor.storeName || selectedVendor.name },
                { icon: 'calendar_today', label: 'Member Since', value: new Date(selectedVendor.joinedAt).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(195,244,0,0.12)', border: '1px solid rgba(195,244,0,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--lime-400)', flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{row.icon}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {row.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons — Chat Vendor & Close */}
            <div style={{ padding: '0 24px', display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  const vendorEmail = selectedVendor.email;
                  const vendorName = selectedVendor.storeName || selectedVendor.name;
                  setSelectedVendor(null);
                  router.push(`/chat?vendor=${encodeURIComponent(vendorEmail)}&name=${encodeURIComponent(vendorName)}`);
                }}
                style={{
                  flex: 1, padding: '12px',
                  background: 'var(--lime-400)', color: '#000',
                  borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chat</span>
                Chat Vendor
              </button>
              <button
                onClick={() => setSelectedVendor(null)}
                style={{
                  padding: '12px 20px',
                  background: 'var(--surface-container-high)', color: 'var(--on-surface)',
                  borderRadius: 12, border: '1px solid var(--outline)', cursor: 'pointer',
                  fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. Popular Right Now (CONTAINERS RESIZED TO MATCH REGULAR SIZE + ADD TO CART) ── */}
      <div style={{ padding: '0 18px 24px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 14
        }}>
          <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, margin: 0 }}>
            Popular Right Now
          </h3>
          <Link href="/shop" style={{
            fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
            color: '#22c55e', textDecoration: 'none'
          }}>
            See All &gt;
          </Link>
        </div>

        {/* 2-Column Standardized Product Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {popularProducts.slice(0, 8).map(p => {
            const inWish = isInWishlist(p.id);
            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--surface-container)', border: '1px solid var(--outline)',
                  borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  position: 'relative', padding: 10
                }}
              >
                {/* Wishlist Heart Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    inWish ? removeFromWishlist(p.id) : addToWishlist(p);
                  }}
                  style={{
                    position: 'absolute', top: 16, right: 16, zIndex: 5,
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
                    color: inWish ? '#ef4444' : '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {inWish ? 'favorite' : 'favorite_border'}
                  </span>
                </button>

                {/* Product Picture -> Opens FULL DETAILS on click */}
                <div
                  onClick={() => router.push(`/product/${p.id}`)}
                  style={{
                    position: 'relative', width: '100%', aspectRatio: '1/1',
                    borderRadius: 10, overflow: 'hidden', background: 'var(--surface)',
                    cursor: 'pointer', marginBottom: 8
                  }}
                >
                  <Image src={p.image} alt={p.name} fill sizes="180px" style={{ objectFit: 'cover' }} />
                </div>

                {/* Product Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                  <p
                    className="line-clamp-1"
                    onClick={() => router.push(`/product/${p.id}`)}
                    style={{
                      fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700,
                      color: 'var(--foreground)', margin: 0, cursor: 'pointer'
                    }}
                  >
                    {p.name}
                  </p>

                  <p style={{
                    fontFamily: 'var(--font-inter)', fontSize: 10,
                    color: 'var(--on-surface-variant)', margin: 0
                  }}>
                    {p.vendorStoreName || 'Zarstyle Ghana'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: 'var(--lime-400)' }}>
                      GH₵{p.price.toFixed(2)}
                    </span>
                    {p.originalPrice && (
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>
                        GH₵{p.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ color: '#f59e0b', fontSize: 11 }}>★</span>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 600, color: 'var(--on-surface-variant)' }}>
                      {p.rating || '4.6'} ({p.reviewsCount || p.reviews?.length || '120'})
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(p);
                      showToast(`Added ${p.name} to cart!`, 'success');
                    }}
                    style={{
                      width: '100%', padding: '7px 10px', marginTop: 8,
                      background: 'var(--lime-400)', color: '#000',
                      borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      transition: 'transform 0.15s, opacity 0.15s'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add_shopping_cart</span>
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 10. Trust Badges Row ── */}
      <div style={{
        margin: '0 18px 24px', padding: 16,
        background: 'var(--surface-container)', border: '1px solid var(--outline)',
        borderRadius: 16, display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#22c55e' }}>lock</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800 }}>
            Secure Payments (Paystack)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f59e0b' }}>smartphone</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800 }}>
            Pay with MoMo
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#22c55e' }}>verified_user</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800 }}>
            Buyer Protection
          </span>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}


export default function ShopPage() {
  return (
    <Suspense fallback={<ProductLoadingSkeleton />}>
      <HomeStorefrontContent />
    </Suspense>
  );
}
