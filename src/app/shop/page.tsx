'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { categories } from '@/data/products';
import { useWishlist, useToast, useStore } from '@/context/AppContext';

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { allProducts } = useStore();

  const filteredProducts = useMemo(() => {
    let filtered = activeCategory === 'All' ? allProducts : allProducts.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.subCategory.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return filtered;
  }, [activeCategory, searchQuery, allProducts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      {/* Header */}
      <section className="animate-fade-in-up" style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 32, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
          {searchQuery ? `Results for "${searchQuery}"` : 'Gear Up'}
        </h1>
        <p style={{ fontFamily: 'var(--font-inter)', color: '#666', fontSize: 13, marginTop: 4 }}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </p>
      </section>

      {/* Category Tabs */}
      <div className="no-scrollbar" style={{
        position: 'sticky', top: 100, zIndex: 30,
        display: 'flex', gap: 8, padding: '16px 16px 12px',
        overflowX: 'auto', whiteSpace: 'nowrap',
        background: 'var(--background)', borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 20px', borderRadius: 20,
              fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              background: activeCategory === cat ? 'var(--lime-400)' : 'transparent',
              color: activeCategory === cat ? '#000' : '#666',
              border: activeCategory === cat ? 'none' : '1px solid #222',
              cursor: 'pointer', transition: 'all 0.25s',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <section style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 32 }}>
        {filteredProducts.map((product, i) => (
          <div key={product.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`} style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href={`/product/${product.id}`} style={{
              position: 'relative', aspectRatio: '4/5', background: '#111',
              borderRadius: 12, overflow: 'hidden', border: '1px solid #1a1a1a',
              marginBottom: 8, display: 'block',
            }}>
              <img style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} alt={product.name} src={product.image} />
              {product.isNew && (
                <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--lime-400)', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>NEW</span>
              )}
              {product.isLimited && (
                <span style={{ position: 'absolute', top: 8, left: 8, background: '#ff5e07', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>LIMITED</span>
              )}
              {product.originalPrice && (
                <span style={{ position: 'absolute', top: 8, right: 8, background: '#ff4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </span>
              )}
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: '#fff' }}>{product.name}</p>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.subCategory}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--lime-400)' }}>${product.price.toFixed(2)}</span>
                  {product.originalPrice && <span style={{ fontSize: 11, color: '#555', textDecoration: 'line-through' }}>${product.originalPrice.toFixed(2)}</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  if (isInWishlist(product.id)) { removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }
                  else { addToWishlist(product); showToast('Added to wishlist!'); }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: isInWishlist(product.id) ? '#ff4444' : '#555' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              </button>
            </div>
          </div>
        ))}
      </section>

      {filteredProducts.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: '#222', marginBottom: 16 }}>search_off</span>
          <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 700, color: '#fff' }}>No products found</p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: '#666', marginTop: 4 }}>Try a different category or search term</p>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>Loading Shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}

