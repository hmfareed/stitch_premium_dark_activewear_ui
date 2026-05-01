'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, useAuth, useToast } from '@/context/AppContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARD'>('MOBILE_MONEY');
  const [mobileNetwork, setMobileNetwork] = useState<'MTN' | 'TELECEL'>('MTN');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please log in to place an order', 'error');
      router.push('/login');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    
    // Save order
    const currentOrders = JSON.parse(localStorage.getItem(`reed-orders-${user.email}`) || '[]');
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 900000) + 100000}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Processing', // Ordered -> Processing -> Shipped -> Delivered
      total: totalPrice,
      items: cart.length,
      products: cart,
      customerName: user.name,
      customerEmail: user.email,
    };
    localStorage.setItem(`reed-orders-${user.email}`, JSON.stringify([newOrder, ...currentOrders]));
    
    // Also save to global orders for admin panel
    const allOrders = JSON.parse(localStorage.getItem('reed-all-orders') || '[]');
    localStorage.setItem('reed-all-orders', JSON.stringify([newOrder, ...allOrders]));
    
    clearCart();
    setLoading(false);
    showToast('Order placed successfully!');
    router.push('/confirmation');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: '#111',
    border: '1px solid #222', borderRadius: 10,
    color: '#fff', fontSize: 14, fontFamily: 'var(--font-inter)',
    outline: 'none', transition: 'border-color 0.2s',
  };

  if (cart.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: '#fff', marginBottom: 16 }}>Your cart is empty</p>
        <button onClick={() => router.push('/shop')} style={{ background: 'var(--lime-400)', color: '#000', padding: '12px 24px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-lexend)', fontSize: 13 }}>
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 16px', paddingBottom: 140 }}>
      {/* Progress */}
      <div className="animate-fade-in" style={{ padding: '16px 0 24px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          <div style={{ height: 3, flex: 1, background: 'var(--lime-400)', borderRadius: 4, transition: 'all 0.3s' }} />
          <div style={{ height: 3, flex: 1, background: step >= 2 ? 'var(--lime-400)' : '#222', borderRadius: 4, transition: 'all 0.3s' }} />
        </div>
      </div>

      <form onSubmit={handlePlaceOrder}>
        {/* Step 1: Shipping */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: '#fff' }}>Shipping Details</h2>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.08em' }}>STEP 1/2</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Full Name</label>
                <input required style={inputStyle} defaultValue={user?.name || ''} placeholder="Your full name" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Email</label>
                <input required type="email" style={inputStyle} defaultValue={user?.email || ''} placeholder="you@example.com" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Phone Number</label>
                <input required type="tel" style={inputStyle} placeholder="050 000 0000" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Address</label>
                <input required style={inputStyle} placeholder="Street address" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>City</label>
                  <input required style={inputStyle} placeholder="City" />
                </div>
                <div>
                  <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Region</label>
                  <input required style={inputStyle} placeholder="Region" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                width: '100%', padding: '16px', marginTop: 24,
                background: 'var(--lime-400)', color: '#000',
                fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Continue to Payment
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-inter)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span> Back to Shipping
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: '#fff' }}>Payment Method</h2>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.08em' }}>STEP 2/2</span>
            </div>

            {/* Payment method toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['MOBILE_MONEY', 'CARD'] as const).map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{
                  flex: 1, padding: '14px', borderRadius: 10,
                  border: paymentMethod === m ? '2px solid var(--lime-400)' : '1px solid #222',
                  background: paymentMethod === m ? 'rgba(195,244,0,0.06)' : '#111',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: paymentMethod === m ? 'var(--lime-400)' : '#555' }}>
                    {m === 'MOBILE_MONEY' ? 'smartphone' : 'credit_card'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: paymentMethod === m ? 'var(--lime-400)' : '#555', textTransform: 'uppercase' }}>
                    {m === 'MOBILE_MONEY' ? 'Mobile Money' : 'Card'}
                  </span>
                </button>
              ))}
            </div>

            {paymentMethod === 'MOBILE_MONEY' ? (
              <div className="animate-fade-in" style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button type="button" onClick={() => setMobileNetwork('MTN')} style={{
                    flex: 1, padding: '12px', borderRadius: 8,
                    background: mobileNetwork === 'MTN' ? '#FFCB05' : '#1a1a1a',
                    color: mobileNetwork === 'MTN' ? '#000' : '#555',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800,
                  }}>MTN MoMo</button>
                  <button type="button" onClick={() => setMobileNetwork('TELECEL')} style={{
                    flex: 1, padding: '12px', borderRadius: 8,
                    background: mobileNetwork === 'TELECEL' ? '#E60012' : '#1a1a1a',
                    color: mobileNetwork === 'TELECEL' ? '#fff' : '#555',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800,
                  }}>Telecel Cash</button>
                </div>
                <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Phone Number</label>
                <input required type="tel" style={inputStyle} placeholder="050 000 0000" />
              </div>
            ) : (
              <div className="animate-fade-in" style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Card Number</label>
                  <input required style={inputStyle} placeholder="0000 0000 0000 0000" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Expiry</label>
                    <input required style={inputStyle} placeholder="MM/YY" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>CVC</label>
                    <input required style={inputStyle} placeholder="000" />
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div style={{ marginTop: 24, background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Order Summary</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: '#0e0e0e' }}>
                      <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} src={item.image} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.name}</p>
                      <p style={{ fontSize: 10, color: '#555' }}>Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: '#fff' }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: '#1a1a1a', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: '#888', fontSize: 13 }}>Shipping</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--lime-400)', fontSize: 13 }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 900, color: '#fff', fontSize: 16 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 900, color: 'var(--lime-400)', fontSize: 20 }}>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '18px', marginTop: 24,
                background: loading ? '#888' : 'var(--lime-400)', color: '#000',
                fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 15,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
                  Place Order — ${totalPrice.toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
