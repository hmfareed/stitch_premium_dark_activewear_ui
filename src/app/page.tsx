'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist, useCart, useToast, useStore } from '@/context/AppContext';

export default function HomePage() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { allProducts } = useStore();

  const featured = allProducts.slice(0, 4);
  const newArrivals = allProducts.filter(p => p.isNew);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Hero Banner */}
      <section className="animate-fade-in" style={{ position: 'relative', width: '100%', height: '65vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, transparent 50%, rgba(10,10,10,0.3) 100%)', zIndex: 10 }} />
        <img
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
          alt="Athlete"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuChj0jFk38oi9hjqKzStv4KUrdv0KuAnifPHOggdrfs_2d9JES48C2SY-c0HZkr_Y7OtmZIi9JvdlIXiK9FA1mm9lUAEp5AFhZ7rugy5aZXQOoFyDE67a17cd2Ou_x_Um0U0BvipM_xcN1qnzfRmMxLohVdbLJ073KKg2BA42UGHQm4N6Y1fKH1pibAk7nlnEnmlVlyWwd1DMuTy6MNuE2lHj8Fb2JQn0gWn9_7a8vOA7Qbkr7HhBQcoCuZNg1YXvrk0qBCiPvMRxRQ"
        />
        <div className="animate-fade-in-up" style={{ position: 'absolute', bottom: 40, left: 20, right: 20, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', color: 'var(--lime-400)', letterSpacing: '0.15em', fontSize: 11, fontWeight: 700 }}>NEW ARRIVALS 2024</span>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 0.95, textTransform: 'uppercase' }}>EVERYTHING<br/>YOU NEED</h1>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: '#aaa', maxWidth: 280, lineHeight: 1.5 }}>Shop the latest trends in electronics, fashion, and home essentials.</p>
          <Link href="/shop" style={{
            display: 'inline-block', marginTop: 8, background: 'var(--lime-400)', color: '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, padding: '14px 32px',
            fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            borderRadius: 4, transition: 'transform 0.15s', width: 'fit-content',
          }}>
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <h2 className="animate-fade-in-up" style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: '#fff' }}>CATEGORIES</h2>
          <Link href="/shop" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #444' }}>VIEW ALL</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '200px 200px', gap: 10 }}>
          {[
            { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800', span: true },
            { name: 'Fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800' },
            { name: 'Home', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=800' },
          ].map((cat, i) => (
            <Link
              key={cat.name}
              href={`/shop?category=${cat.name}`}
              className={`animate-fade-in-up stagger-${i + 1}`}
              style={{
                gridRow: cat.span ? 'span 2' : undefined,
                position: 'relative', overflow: 'hidden', borderRadius: 12,
                border: '1px solid #1a1a1a', background: '#111',
              }}
            >
              <img style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transition: 'transform 0.5s' }} alt={cat.name} src={cat.img} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 14, zIndex: 10 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 700, color: '#fff' }}>{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '8px 16px 32px' }}>
        <h2 className="animate-fade-in-up" style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 16 }}>TOP PICKS FOR YOU</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {featured.map((product, i) => (
            <div key={product.id} className={`animate-fade-in-up stagger-${i + 1}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <Link href={`/product/${product.id}`} style={{ position: 'relative', aspectRatio: '3/4', background: '#111', borderRadius: 12, overflow: 'hidden', border: '1px solid #1a1a1a', marginBottom: 8 }}>
                <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} src={product.image} />
                {product.isNew && (
                  <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--lime-400)', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>NEW</span>
                )}
                {product.isLimited && (
                  <span style={{ position: 'absolute', top: 8, left: 8, background: '#ff5e07', color: '#fff', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>LIMITED</span>
                )}
              </Link>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: '#fff' }}>{product.name}</p>
                  <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.subCategory}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--lime-400)' }}>${product.price.toFixed(2)}</span>
                    {product.originalPrice && (
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: '#555', textDecoration: 'line-through' }}>${product.originalPrice.toFixed(2)}</span>
                    )}
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
        </div>
      </section>

      {/* Stats Section */}
      <section className="animate-fade-in-up" style={{ margin: '0 16px 32px', padding: 32, border: '1px solid #1a1a1a', background: '#111', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(195,244,0,0.06)', filter: 'blur(50px)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 48, fontWeight: 900, color: 'var(--lime-400)' }}>1M+</p>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>PRODUCTS DELIVERED</p>
          </div>
          <div style={{ height: 1, background: '#1a1a1a', width: '50%', margin: '0 auto' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: '#fff', fontStyle: 'italic' }}>&quot;FAST & RELIABLE&quot;</p>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: '#444', marginTop: 8, textTransform: 'uppercase' }}>— CUSTOMER REVIEWS</p>
          </div>
        </div>
      </section>
    </div>
  );
}
