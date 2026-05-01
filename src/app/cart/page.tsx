'use client';

import React from 'react';
import Link from 'next/link';
import { useCart, useToast } from '@/context/AppContext';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const { showToast } = useToast();

  if (cart.length === 0) {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: '#222', marginBottom: 16 }}>shopping_bag</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Your cart is empty</h2>
        <p style={{ fontFamily: 'var(--font-inter)', color: '#666', marginBottom: 24, fontSize: 14 }}>Premium performance gear is waiting for you.</p>
        <Link href="/shop" style={{
          background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)',
          fontWeight: 800, padding: '14px 32px', borderRadius: 8, fontSize: 13,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 16px', paddingBottom: 160 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>Your Cart</h1>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{totalItems} ITEM{totalItems !== 1 ? 'S' : ''}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {cart.map((item, i) => (
          <div key={`${item.id}-${item.selectedSize}`} className={`animate-slide-in stagger-${Math.min(i + 1, 6)}`} style={{
            display: 'flex', gap: 14, padding: 14, background: '#111',
            border: '1px solid #1a1a1a', borderRadius: 14,
          }}>
            <Link href={`/product/${item.id}`} style={{ width: 90, height: 90, flexShrink: 0, background: '#0e0e0e', borderRadius: 10, overflow: 'hidden' }}>
              <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} src={item.image} />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.name}</p>
                  <button onClick={() => { removeFromCart(item.id); showToast('Removed from cart', 'info'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                  </button>
                </div>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 600, color: '#555', textTransform: 'uppercase' }}>
                  Size: {item.selectedSize || 'N/A'} • {item.category}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
                  </button>
                  <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-lexend)' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                  </button>
                </div>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--lime-400)' }}>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="animate-fade-in-up stagger-3" style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#666', fontSize: 13 }}>Subtotal</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: '#fff', fontSize: 14 }}>${totalPrice.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: '#666', fontSize: 13 }}>Shipping</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--lime-400)', fontSize: 13 }}>FREE</span>
        </div>
        <div style={{ height: 1, background: '#1a1a1a', margin: '8px 0 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, color: '#fff' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, color: 'var(--lime-400)' }}>${totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout CTA */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, width: '100%', padding: '16px',
        background: 'linear-gradient(to top, var(--background) 70%, transparent)', zIndex: 40,
      }}>
        <Link href="/checkout" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: '16px', background: 'var(--lime-400)', color: '#000',
          fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
          textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 10,
        }}>
          PROCEED TO CHECKOUT
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
