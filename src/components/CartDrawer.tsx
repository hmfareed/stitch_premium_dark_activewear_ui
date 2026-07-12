'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, useWishlist, useUserActivity, useToast } from '@/context/AppContext';

export const CartDrawer: React.FC = () => {
  const { cart, cartDrawerOpen, closeCartDrawer, removeFromCart, updateQuantity, totalItems, totalPrice, addToCart, getCartItemPrice } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { recentlyViewed } = useUserActivity();
  const { showToast } = useToast();

  // Lock body scroll when open
  useEffect(() => {
    if (cartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [cartDrawerOpen]);

  if (!cartDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCartDrawer}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out both',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', zIndex: 201,
          top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 420,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--outline)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInFromRight 0.3s cubic-bezier(0.32,0.72,0,1) both',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--outline)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>
              YOUR CART
            </h2>
            {totalItems > 0 && (
              <span style={{
                background: 'var(--lime-400)', color: '#000',
                fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-lexend)',
                padding: '2px 8px', borderRadius: 20,
              }}>
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCartDrawer}
            aria-label="Close cart"
            style={{
              background: 'var(--surface-container)', border: '1px solid var(--outline)',
              borderRadius: 8, width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--on-surface-variant)',
              transition: 'all 0.15s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }} className="no-scrollbar">
          {cart.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '40px 32px', textAlign: 'center', gap: 12,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--on-surface-variant)', opacity: 0.3 }}>shopping_cart</span>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>
                Your cart is empty
              </p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4, margin: '0 0 4px' }}>
                Add items from the shop to get started.
              </p>
              <Link
                href="/shop"
                onClick={closeCartDrawer}
                style={{
                  padding: '10px 24px', borderRadius: 10,
                  background: 'var(--lime-400)', color: '#000',
                  fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12,
                  textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-block'
                }}
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.id}-${item.selectedSize ?? ''}`} style={{
                display: 'flex', gap: 14,
                padding: '14px 20px',
                borderBottom: '1px solid var(--outline)',
              }}>
                {/* Image */}
                <Link href={`/product/${item.id}`} onClick={closeCartDrawer} style={{
                  width: 72, height: 72, borderRadius: 10, overflow: 'hidden',
                  background: 'var(--surface-container)', flexShrink: 0,
                  display: 'block',
                }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="72px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </Link>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Link href={`/product/${item.id}`} onClick={closeCartDrawer}>
                    <p className="line-clamp-2" style={{
                      fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700,
                      color: 'var(--foreground)', lineHeight: 1.3,
                    }}>
                      {item.name}
                    </p>
                  </Link>
                  {item.selectedSize && (
                    <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                      Size: {item.selectedSize}
                    </span>
                  )}
                  {item.vendorStoreName && (
                    <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                      {item.vendorStoreName}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    {(() => {
                      const unitPrice = getCartItemPrice(item);
                      const isDiscounted = unitPrice < item.price;
                      return isDiscounted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--lime-400)' }}>
                              GH₵{(unitPrice * item.quantity).toFixed(2)}
                            </span>
                            <span style={{ textDecoration: 'line-through', fontSize: 11, color: 'var(--on-surface-variant)', opacity: 0.7 }}>
                              GH₵{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                          <span style={{ fontSize: '8px', background: 'rgba(0,229,255,0.12)', color: '#00e5ff', padding: '1px 5px', borderRadius: '4px', width: 'fit-content', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Volume/Promo Deal
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800,
                          color: 'var(--price-color)',
                        }}>
                          GH₵{(item.price * item.quantity).toFixed(2)}
                        </span>
                      );
                    })()}

                    {/* Quantity controls */}
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container)', borderRadius: 8, border: '1px solid var(--outline)', overflow: 'hidden' }}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label="Decrease quantity"
                        style={{
                          width: 32, height: 32, background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--foreground)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 700,
                        }}
                      >&#x2212;</button>
                      <span style={{
                        minWidth: 28, textAlign: 'center',
                        fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700,
                        color: 'var(--foreground)',
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label="Increase quantity"
                        style={{
                          width: 32, height: 32, background: 'none', border: 'none',
                          cursor: 'pointer', color: 'var(--foreground)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 700,
                        }}
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Remove ${item.name}`}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--on-surface-variant)', padding: 4,
                    flexShrink: 0, marginTop: -2,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_outline</span>
                </button>
              </div>
            ))
          )}

          {/* Wishlist in Drawer */}
          {wishlist.length > 0 && (
            <div style={{ padding: '24px 20px 8px', borderTop: cart.length > 0 ? 'none' : '1px solid var(--outline)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.03em' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff4444', fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  WISHLIST
                </h3>
                <Link href="/wishlist" onClick={closeCartDrawer} style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', textTransform: 'uppercase', textDecoration: 'none' }}>
                  View All
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }} className="no-scrollbar">
                {wishlist.map(item => (
                  <div key={item.id} style={{
                    width: 110, flexShrink: 0, background: 'var(--surface-container-low)',
                    border: '1px solid var(--outline)', borderRadius: 10, padding: 6,
                    display: 'flex', flexDirection: 'column', position: 'relative'
                  }}>
                    {/* Remove button */}
                    <button
                      onClick={() => { removeFromWishlist(item.id); showToast('Removed from wishlist', 'info'); }}
                      style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 10,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                        color: '#ff4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </button>
                    <Link href={`/product/${item.id}`} onClick={closeCartDrawer} style={{ width: '100%', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: 'var(--surface-container)', display: 'block', marginBottom: 4 }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Link>
                    <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1px' }}>{item.name}</p>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800, color: 'var(--lime-400)', margin: '0 0 6px' }}>GH₵{item.price.toFixed(0)}</p>
                    <button
                      onClick={() => { addToCart(item); showToast(`${item.name} added to cart!`); }}
                      style={{
                        width: '100%', padding: '5px 0', background: 'var(--lime-400)', color: '#000',
                        border: 'none', borderRadius: 4, fontFamily: 'var(--font-lexend)', fontWeight: 800,
                        fontSize: 8, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Viewed in Drawer */}
          {recentlyViewed.length > 0 && (
            <div style={{ padding: '16px 20px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: 4, letterSpacing: '0.03em' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--lime-400)' }}>history</span>
                  RECENTLY VIEWED
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }} className="no-scrollbar">
                {recentlyViewed.map(item => (
                  <div key={item.id} style={{
                    width: 110, flexShrink: 0, background: 'var(--surface-container-low)',
                    border: '1px solid var(--outline)', borderRadius: 10, padding: 6,
                    display: 'flex', flexDirection: 'column'
                  }}>
                    <Link href={`/product/${item.id}`} onClick={closeCartDrawer} style={{ width: '100%', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: 'var(--surface-container)', display: 'block', marginBottom: 4 }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Link>
                    <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 1px' }}>{item.name}</p>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800, color: 'var(--lime-400)', margin: '0 0 6px' }}>GH₵{item.price.toFixed(0)}</p>
                    <button
                      onClick={() => { addToCart(item); showToast(`${item.name} added to cart!`); }}
                      style={{
                        width: '100%', padding: '5px 0', background: 'var(--lime-400)', color: '#000',
                        border: 'none', borderRadius: 4, fontFamily: 'var(--font-lexend)', fontWeight: 800,
                        fontSize: 8, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{
            padding: '16px 20px 24px',
            borderTop: '1px solid var(--outline)',
            flexShrink: 0,
            background: 'var(--surface)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16,
            }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
                SUBTOTAL ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, color: 'var(--foreground)' }}>
                GH&#x20B5;{totalPrice.toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '15px 24px', borderRadius: 12,
                  background: 'var(--lime-400)', color: '#000',
                  fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>lock</span>
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCartDrawer}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 24px', borderRadius: 12,
                  background: 'transparent', color: 'var(--foreground)',
                  fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13,
                  border: '1px solid var(--outline)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
