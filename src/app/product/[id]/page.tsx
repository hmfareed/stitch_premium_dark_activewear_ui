'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, useWishlist, useToast, useStore, useAuth } from '@/context/AppContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { allProducts, isFollowing, followVendor, unfollowVendor } = useStore();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const product = allProducts.find(p => p.id === id);
  if (!product) return <div style={{ padding: 80, textAlign: 'center', color: '#fff' }}>Product not found</div>;

  const sizes = product.sizes || ['S', 'M', 'L', 'XL'];

  const handleAddToCart = () => {
    if (!selectedSize) { showToast('Please select a size first', 'error'); return; }
    addToCart(product, selectedSize);
    showToast(`${product.name} added to cart!`);
  };

  const toggleWishlist = () => {
    if (isInWishlist(product.id)) { removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }
    else { addToWishlist(product); showToast('Added to wishlist!'); }
  };

  const handleFollowVendor = () => {
    if (!user) {
      showToast('Please login to follow vendors', 'error');
      router.push('/login');
      return;
    }
    if (!product.vendorEmail) return;

    if (isFollowing(product.vendorEmail, user.email)) {
      unfollowVendor(product.vendorEmail, user.email);
      showToast(`Unfollowed ${product.vendorStoreName || 'Vendor'}`);
    } else {
      followVendor(product.vendorEmail, user.email);
      showToast(`Now following ${product.vendorStoreName || 'Vendor'}!`);
    }
  };

  const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 160 }}>
      {/* Back button */}
      <div className="animate-fade-in" style={{ padding: '8px 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'var(--font-inter)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span> Back
        </button>
      </div>

      {/* Product Image */}
      <section className="animate-fade-in" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <div style={{ aspectRatio: '1/1', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <img style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 400 }} alt={product.name} src={product.image} />
        </div>
        <button
          onClick={toggleWishlist}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(17,17,17,0.8)', border: '1px solid #222',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: isInWishlist(product.id) ? '#ff4444' : '#888',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        {product.isNew && <span style={{ position: 'absolute', top: 16, left: 16, background: 'var(--lime-400)', color: '#000', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>NEW</span>}
        {product.isLimited && <span style={{ position: 'absolute', top: 16, left: 16, background: '#ff5e07', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>LIMITED EDITION</span>}
      </section>

      {/* Product Info */}
      <section className="animate-fade-in-up" style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{product.subCategory}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{product.rating}</span>
          </div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: 12 }}>{product.name}</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--lime-400)' }}>${product.price.toFixed(2)}</span>
          {product.originalPrice && <span style={{ fontSize: 16, color: '#555', textDecoration: 'line-through' }}>${product.originalPrice.toFixed(2)}</span>}
          {product.originalPrice && <span style={{ fontSize: 12, fontWeight: 700, color: '#ff4444', fontFamily: 'var(--font-lexend)' }}>-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF</span>}
        </div>

        {/* Size Selector */}
        <div className="animate-fade-in-up stagger-1" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Size</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                style={{
                  minWidth: 48, height: 44, border: selectedSize === size ? '2px solid var(--lime-400)' : '1px solid #222',
                  background: selectedSize === size ? 'rgba(195,244,0,0.08)' : 'transparent',
                  color: selectedSize === size ? 'var(--lime-400)' : '#888',
                  fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                  padding: '0 12px',
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Vendor Profile Section */}
        {product.vendorEmail && (
          <div className="animate-fade-in-up stagger-2" style={{ marginBottom: 24, padding: '16px', background: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'color-mix(in srgb, #00e5ff 20%, transparent)', color: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {(product.vendorStoreName || 'V')[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{product.vendorStoreName || 'Vendor Store'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'var(--lime-400)' }}>verified</span>
                    <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Verified Seller</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleFollowVendor}
                style={{ 
                  padding: '8px 16px', borderRadius: '20px', 
                  background: (user && isFollowing(product.vendorEmail, user.email)) ? 'transparent' : '#00e5ff', 
                  border: (user && isFollowing(product.vendorEmail, user.email)) ? '1px solid #00e5ff' : 'none',
                  color: (user && isFollowing(product.vendorEmail, user.email)) ? '#00e5ff' : '#000', 
                  fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                {(user && isFollowing(product.vendorEmail, user.email)) ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="animate-fade-in-up stagger-3" style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</span>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: '#888', lineHeight: 1.7, marginTop: 8 }}>{product.description}</p>
        </div>

        {/* Features */}
        <div className="animate-fade-in-up stagger-4" style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'block' }}>Features</span>
          {['High Quality Material', 'Durable Construction', 'Satisfaction Guaranteed'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#ddd', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="animate-fade-in-up stagger-5" style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'block' }}>You Might Also Like</span>
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
              {related.map(p => (
                <Link key={p.id} href={`/product/${p.id}`} style={{ flexShrink: 0, width: 140, textDecoration: 'none' }}>
                  <div style={{ aspectRatio: '3/4', background: '#111', borderRadius: 10, overflow: 'hidden', border: '1px solid #1a1a1a', marginBottom: 6 }}>
                    <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} src={p.image} />
                  </div>
                  <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.name}</p>
                  <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800, color: 'var(--lime-400)' }}>${p.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sticky Add to Cart */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, width: '100%', zIndex: 45,
        background: 'linear-gradient(to top, var(--background) 60%, transparent)', padding: '24px 16px 16px',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={toggleWishlist} style={{
            width: 52, height: 52, borderRadius: 10, border: '1px solid #222',
            background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: isInWishlist(product.id) ? '#ff4444' : '#888',
          }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
          <button onClick={handleAddToCart} style={{
            flex: 1, height: 52, background: 'var(--lime-400)', color: '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'transform 0.15s',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shopping_bag</span>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
