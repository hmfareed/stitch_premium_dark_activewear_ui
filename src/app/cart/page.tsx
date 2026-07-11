'use client';

import React from 'react';
import Link from 'next/link';
import { useCart, useToast, useWishlist, useUserActivity } from '@/context/AppContext';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems, addToCart } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { recentlyViewed } = useUserActivity();
  const { showToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 16px', paddingBottom: 180 }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--foreground)', textTransform: 'uppercase' }}>Your Cart</h1>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{totalItems} ITEM{totalItems !== 1 ? 'S' : ''}</p>
      </div>

      {cart.length === 0 ? (
        /* Empty Cart State */
        <div className="animate-fade-in-up" style={{ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          padding: '40px 24px', textAlign: 'center', background: 'var(--surface-container-low)', 
          border: '1px dashed var(--outline)', borderRadius: 16, margin: '8px 0 24px' 
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--on-surface-variant)', opacity: 0.25, marginBottom: 12 }}>shopping_bag</span>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)', marginBottom: 6 }}>Your cart is empty</h2>
          <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--on-surface-variant)', marginBottom: 20, fontSize: 13 }}>Premium performance gear is waiting for you.</p>
          <Link href="/shop" style={{
            background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)',
            fontWeight: 800, padding: '12px 28px', borderRadius: 8, fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-block'
          }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        /* Cart Items & Summary */
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map((item, i) => (
              <div key={`${item.id}-${item.selectedSize}`} className={`animate-slide-in stagger-${Math.min(i + 1, 6)}`} style={{
                display: 'flex', gap: 14, padding: 14, background: 'var(--surface)',
                border: '1px solid var(--outline)', borderRadius: 14,
              }}>
                <Link href={`/product/${item.id}`} style={{ width: 90, height: 90, flexShrink: 0, background: 'var(--surface-container)', borderRadius: 10, overflow: 'hidden' }}>
                  <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} src={item.image} />
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{item.name}</p>
                      <button onClick={() => { removeFromCart(item.id); showToast('Removed from cart', 'info'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 2 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                      </button>
                    </div>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                      Size: {item.selectedSize || 'N/A'} • {item.category}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--outline)', borderRadius: 8, overflow: 'hidden' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
                      </button>
                      <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-lexend)' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                      </button>
                    </div>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--lime-400)' }}>GH₵{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="animate-fade-in-up stagger-3" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--foreground)', fontSize: 14 }}>GH₵{totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>Shipping</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--lime-400)', fontSize: 13 }}>FREE</span>
            </div>
            <div style={{ height: 1, background: 'var(--outline)', margin: '8px 0 16px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, color: 'var(--foreground)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, color: 'var(--lime-400)' }}>GH₵{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout CTA */}
          <div style={{
            position: 'fixed', bottom: 64, left: 0, width: '100%', padding: '16px',
            background: 'linear-gradient(to top, var(--background) 70%, transparent)', zIndex: 40,
          }}>
            <Link href="/checkout" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '16px', background: 'var(--lime-400)', color: 'var(--on-lime-400)',
              fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10,
            }}>
              PROCEED TO CHECKOUT
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
        </>
      )}

      {/* Wishlist Section */}
      {wishlist.length > 0 && (
        <div style={{ marginTop: 40, paddingBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.03em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ff4444', fontVariationSettings: "'FILL' 1" }}>favorite</span>
              FROM YOUR WISHLIST
            </h2>
            <Link href="/wishlist" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--lime-400)', textTransform: 'uppercase', textDecoration: 'none', letterSpacing: '0.04em' }}>
              View All
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }} className="no-scrollbar">
            {wishlist.map((item) => (
              <div key={item.id} style={{
                width: 130, flexShrink: 0, background: 'var(--surface)',
                border: '1px solid var(--outline)', borderRadius: 12, padding: 8,
                display: 'flex', flexDirection: 'column', position: 'relative'
              }}>
                {/* Remove button */}
                <button
                  onClick={() => { removeFromWishlist(item.id); showToast('Removed from wishlist', 'info'); }}
                  style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 10,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                    color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </button>
                <Link href={`/product/${item.id}`} style={{ width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-container)', display: 'block', marginBottom: 6 }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>
                <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px' }}>{item.name}</p>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--lime-400)', margin: '0 0 8px' }}>GH₵{item.price.toFixed(2)}</p>
                <button
                  onClick={() => { addToCart(item); showToast(`${item.name} added to cart!`); }}
                  style={{
                    width: '100%', padding: '6px 0', background: 'var(--lime-400)', color: '#000',
                    border: 'none', borderRadius: 6, fontFamily: 'var(--font-lexend)', fontWeight: 800,
                    fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}
                >
                  Add To Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <div style={{ marginTop: 28, paddingBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.03em' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)' }}>history</span>
              RECENTLY VIEWED
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }} className="no-scrollbar">
            {recentlyViewed.map((item) => (
              <div key={item.id} style={{
                width: 130, flexShrink: 0, background: 'var(--surface)',
                border: '1px solid var(--outline)', borderRadius: 12, padding: 8,
                display: 'flex', flexDirection: 'column'
              }}>
                <Link href={`/product/${item.id}`} style={{ width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--surface-container)', display: 'block', marginBottom: 6 }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>
                <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px' }}>{item.name}</p>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--lime-400)', margin: '0 0 8px' }}>GH₵{item.price.toFixed(2)}</p>
                <button
                  onClick={() => { addToCart(item); showToast(`${item.name} added to cart!`); }}
                  style={{
                    width: '100%', padding: '6px 0', background: 'var(--lime-400)', color: '#000',
                    border: 'none', borderRadius: 6, fontFamily: 'var(--font-lexend)', fontWeight: 800,
                    fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}
                >
                  Add To Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
