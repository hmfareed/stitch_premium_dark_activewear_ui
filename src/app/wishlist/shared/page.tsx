'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, useWishlist, useToast, useStore } from '@/context/AppContext';

function SharedWishlistContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { allProducts } = useStore();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids && allProducts.length > 0) {
      const idList = ids.split(',');
      const found = allProducts.filter(p => idList.includes(p.id));
      setProducts(found);
      setLoading(false);
    } else if (allProducts.length > 0) {
      setLoading(false);
    }
  }, [searchParams, allProducts]);

  if (loading) {
    return (
      <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="shimmer" style={{ width: '60%', height: 28, borderRadius: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="shimmer" style={{ aspectRatio: '4/5', borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--on-surface-variant)', opacity: 0.2, marginBottom: 16 }}>link_off</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>Wishlist not found</h2>
        <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--on-surface-variant)', marginBottom: 24, fontSize: 14 }}>This shared wishlist link may be invalid or the products are no longer available.</p>
        <Link href="/shop" style={{
          background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontFamily: 'var(--font-lexend)',
          fontWeight: 800, padding: '14px 32px', borderRadius: 8, fontSize: 13,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Browse Products
        </Link>
      </div>
    );
  }

  const totalValue = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div style={{ padding: '0 16px', paddingBottom: 100 }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)', textTransform: 'uppercase' }}>Shared Wishlist</h1>
          <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{products.length} ITEM{products.length !== 1 ? 'S' : ''} · GH₵{totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="animate-fade-in-up stagger-1" style={{
        background: 'linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(195,244,0,0.05) 100%)',
        border: '1px solid rgba(0,229,255,0.2)', borderRadius: 12, padding: 14, marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#00e5ff' }}>share</span>
        <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
          Someone shared their wishlist with you! Add items to your own wishlist or cart.
        </p>
      </div>

      {/* Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {products.map((product, i) => (
          <div key={product.id} className={`animate-fade-in-up stagger-${Math.min(i + 2, 6)}`} style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href={`/product/${product.id}`} style={{
              position: 'relative', aspectRatio: '4/5', background: 'var(--surface)',
              borderRadius: 12, overflow: 'hidden', border: '1px solid var(--outline)', marginBottom: 8,
            }}>
              <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} src={product.image} />
              {!isInWishlist(product.id) && (
                <button
                  onClick={(e) => { e.preventDefault(); addToWishlist(product); showToast('Added to your wishlist!'); }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.85)', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>favorite</span>
                </button>
              )}
              {isInWishlist(product.id) && (
                <div style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ff4444', fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
              )}
            </Link>
            <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{product.name}</p>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase' }}>{product.subCategory}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--lime-400)' }}>GH₵{product.price.toFixed(2)}</span>
              <button
                onClick={() => { addToCart(product); showToast(`${product.name} added to cart!`); }}
                style={{
                  background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer', color: 'var(--lime-400)',
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                  textTransform: 'uppercase',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add_shopping_cart</span>
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add All to Cart */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, width: '100%', zIndex: 45,
        background: 'linear-gradient(to top, var(--background) 60%, transparent)', padding: '24px 16px 16px',
      }}>
        <button
          onClick={() => {
            products.forEach(p => addToCart(p));
            showToast(`${products.length} items added to cart!`);
            router.push('/cart');
          }}
          style={{
            width: '100%', height: 52,
            background: 'var(--lime-400)', color: '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shopping_bag</span>
          Add All to Cart — GH₵{totalValue.toFixed(2)}
        </button>
      </div>
    </div>
  );
}

export default function SharedWishlistPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="shimmer" style={{ width: '60%', height: 28, borderRadius: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="shimmer" style={{ aspectRatio: '4/5', borderRadius: 12 }} />
          ))}
        </div>
      </div>
    }>
      <SharedWishlistContent />
    </Suspense>
  );
}
