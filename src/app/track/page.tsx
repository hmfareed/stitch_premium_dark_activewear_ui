'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { allOrders } = useAdmin();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    setTimeout(() => {
      const order = allOrders.find(o => 
        o.id.toLowerCase() === orderId.toLowerCase() && 
        o.customerEmail.toLowerCase() === email.toLowerCase()
      );

      if (order) {
        setResult(order);
      } else {
        setError('Order not found. Please check your Order ID and Email.');
      }
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'Pending': '#ff9800',
      'Processing': '#00e5ff',
      'Shipped': '#7c4dff',
      'Delivered': 'var(--lime-400)',
      'Cancelled': 'var(--error)'
    };
    return colors[status] || 'var(--on-surface-variant)';
  };

  const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = result ? steps.indexOf(result.status) : -1;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 32, fontWeight: 900, marginBottom: 12 }}>TRACK ORDER</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>Enter your details below to see your order status</p>
      </div>

      <form onSubmit={handleTrack} style={{ background: 'var(--surface-container)', padding: 32, borderRadius: 24, border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>Order ID</label>
          <input 
            required
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            placeholder="e.g. ORD-123456"
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--foreground)', outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>Email Address</label>
          <input 
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--foreground)', outline: 'none' }}
          />
        </div>
        <button 
          disabled={loading}
          style={{ width: '100%', padding: 16, borderRadius: 12, background: 'var(--lime-400)', border: 'none', color: '#000', fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 12 }}
        >
          {loading ? 'TRACKING...' : 'TRACK ORDER'}
        </button>
      </form>

      {error && (
        <div className="animate-fade-in" style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(255,68,68,0.1)', color: 'var(--error)', textAlign: 'center', fontSize: 14, border: '1px solid rgba(255,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="animate-fade-in-up" style={{ marginTop: 40, padding: 32, background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Status</p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: getStatusColor(result.status) }}>{result.status.toUpperCase()}</h2>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Order Date</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{result.date}</p>
            </div>
          </div>

          {/* Progress Bar */}
          {result.status !== 'Cancelled' && (
            <div style={{ position: 'relative', height: 4, background: 'var(--surface-container-highest)', borderRadius: 2, marginBottom: 40, marginTop: 20 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--lime-400)', width: `${((currentStepIndex + 1) / steps.length) * 100}%`, transition: 'width 0.5s ease', borderRadius: 2 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', top: -8 }}>
                {steps.map((step, i) => (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 20, height: 20, borderRadius: '50%', 
                      background: i <= currentStepIndex ? 'var(--lime-400)' : 'var(--surface-container-highest)',
                      border: '4px solid var(--surface)',
                      boxShadow: i <= currentStepIndex ? '0 0 10px rgba(195,244,0,0.4)' : 'none',
                      zIndex: 2
                    }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: i <= currentStepIndex ? 'var(--foreground)' : 'var(--on-surface-variant)' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>ORDER ITEMS</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {result.products.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <img src={p.image} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} alt={p.name} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Qty: {p.quantity} | Size: {p.size || 'N/A'}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800 }}>GH₵{(p.price * p.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
