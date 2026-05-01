'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist, useCart, useToast } from '@/context/AppContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  if (wishlist.length === 0) {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#222', marginBottom: 16 }}>favorite</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Your wishlist is empty</h2>
        <p style={{ fontFamily: 'var(--font-inter)', color: '#666', marginBottom: 24, fontSize: 14 }}>Save your favorite items here.</p>
        <Link href="/shop" style={{
          background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)',
          fontWeight: 800, padding: '14px 32px', borderRadius: 8, fontSize: 13,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>Wishlist</h1>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{wishlist.length} ITEM{wishlist.length !== 1 ? 'S' : ''}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {wishlist.map((product, i) => (
          <div key={product.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`} style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href={`/product/${product.id}`} style={{
              position: 'relative', aspectRatio: '4/5', background: '#111',
              borderRadius: 12, overflow: 'hidden', border: '1px solid #1a1a1a', marginBottom: 8,
            }}>
              <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} src={product.image} />
              <button
                onClick={(e) => { e.preventDefault(); removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }}
                style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </button>
            </Link>
            <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: '#fff' }}>{product.name}</p>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, color: '#555', fontWeight: 600, textTransform: 'uppercase' }}>{product.subCategory}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--lime-400)' }}>${product.price.toFixed(2)}</span>
              <button
                onClick={() => { addToCart(product); showToast(`${product.name} added to cart!`); }}
                style={{
                  background: '#1a1a1a', border: '1px solid #222', borderRadius: 8,
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
    </div>
  );
}
