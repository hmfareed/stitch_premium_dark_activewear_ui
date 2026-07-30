'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart, useToast } from '@/context/AppContext';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, totalPrice, totalItems, getCartItemPrice } = useCart();
  const { showToast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>(() => cart.map(i => i.id));
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Demo fallback items matching Screen 13 reference image if cart is empty
  const displayCart = cart.length > 0 ? cart : [
    { id: 'c1', name: 'Samsung Galaxy Buds 2', selectedSize: 'White', price: 599.00, quantity: 1, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200' },
    { id: 'c2', name: 'Lenovo IdeaPad 3', selectedSize: '15.6" Laptop', price: 4200.00, quantity: 1, image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200' },
  ];

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'SAVE10' || code === 'AFRICART10') {
      setDiscountPercent(10);
      showToast('Coupon code applied! 10% discount added.', 'success');
    } else {
      showToast('Invalid coupon code. Try SAVE10', 'error');
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const calculatedSubtotal = cart.length > 0 ? totalPrice : 4799.00;
  const deliveryFee = 20.00;
  const discountAmount = (calculatedSubtotal * discountPercent) / 100;
  const finalTotal = Math.max(0, calculatedSubtotal - discountAmount + deliveryFee);
  const rewardPoints = 48;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 16px', paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>
      {/* Top Header matching Screen 13 */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>
            My Cart ({displayCart.length})
          </h1>
        </div>

        <button
          onClick={() => {
            if (selectedItems.length === displayCart.length) setSelectedItems([]);
            else setSelectedItems(displayCart.map(i => i.id));
          }}
          style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}
        >
          Edit
        </button>
      </div>

      {/* Cart Item Cards matching Screen 13 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayCart.map((item: any, i) => {
            const isSelected = selectedItems.includes(item.id) || selectedItems.length === 0;
            const unitPrice = item.price || getCartItemPrice(item);
          return (
            <div
              key={`${item.id}-${i}`}
              className={`animate-slide-in stagger-${Math.min(i + 1, 6)}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--surface)',
                border: '1px solid var(--outline)', borderRadius: 16,
              }}
            >
              {/* Checkbox Icon */}
              <div
                onClick={() => toggleSelectItem(item.id)}
                style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: isSelected ? '#6366F1' : 'transparent',
                  border: isSelected ? 'none' : '2px solid var(--outline)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0
                }}
              >
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffffff', fontWeight: 'bold' }}>check</span>
                )}
              </div>

              {/* Product Image Thumbnail */}
              <Link href={`/product/${item.id}`} style={{ width: 60, height: 60, flexShrink: 0, background: 'var(--surface-container-high)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--outline)' }}>
                <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} src={item.image} />
              </Link>

              {/* Product Info */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 2 }}>
                <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{item.name}</p>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, color: 'var(--on-surface-variant)', margin: 0 }}>
                  {item.selectedSize || 'White'}
                </p>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--foreground)', margin: '2px 0 0 0' }}>
                  GHS {unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Stepper (- 1 +) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-container-high)', borderRadius: 8, padding: '4px 8px' }}>
                <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>remove</span>
                </button>
                <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: 'center', color: 'var(--foreground)', fontFamily: 'var(--font-lexend)' }}>{item.quantity || 1}</span>
                <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Coupon Row matching Screen 13 */}
      <div style={{ marginTop: 14 }}>
        {!showCouponInput ? (
          <button
            onClick={() => setShowCouponInput(true)}
            style={{
              width: '100%', padding: '14px 16px', background: 'var(--surface)',
              border: '1px solid var(--outline)', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#6366F1' }}>confirmation_number</span>
              <span>Apply Coupon</span>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>chevron_right</span>
          </button>
        ) : (
          <form onSubmit={handleApplyCoupon} style={{
            display: 'flex', gap: 8, background: 'var(--surface)',
            border: '1px solid var(--outline)', borderRadius: 16, padding: 6
          }}>
            <input
              type="text"
              placeholder="Enter code (e.g. SAVE10)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none', paddingLeft: 12,
                color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontSize: 13
              }}
            />
            <button
              type="submit"
              style={{
                background: '#6366F1', border: 'none',
                borderRadius: 10, padding: '8px 16px', color: '#ffffff',
                fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Summary Breakdown matching Screen 13 */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--on-surface-variant)' }}>
          <span>Subtotal</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--foreground)' }}>GHS {calculatedSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        {discountPercent > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6366F1' }}>
            <span>Discount ({discountPercent}%)</span>
            <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700 }}>- GHS {discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--on-surface-variant)' }}>
          <span>Delivery Fee</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--foreground)' }}>GHS {deliveryFee.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: 'var(--foreground)' }}>
            GHS {finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Primary CTA Button & Rewards Subtext matching Screen 13 */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <Link href="/checkout" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '14px', background: '#6366F1', color: '#ffffff',
          fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
          borderRadius: 14, textDecoration: 'none'
        }}>
          Proceed to Checkout
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-lexend)' }}>
            You will earn {rewardPoints} points on this order
          </span>
        </div>
      </div>
    </div>
  );
}
