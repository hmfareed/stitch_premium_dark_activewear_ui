'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'MOMO';
  provider: string;
  details: string; // e.g. "•••• 4242" or "050 ••• ••••"
  isDefault: boolean;
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const saved = localStorage.getItem(`reed-payments-${user.email}`);
    if (saved) {
      setMethods(JSON.parse(saved));
    } else {
      setMethods([]);
      localStorage.setItem(`reed-payments-${user.email}`, JSON.stringify([]));
    }
  }, [user, router]);

  const requireBiometric = (action: () => void) => {
    setPendingAction(() => action);
    setShowBiometric(true);
  };

  const confirmBiometric = () => {
    setShowBiometric(false);
    showToast('Biometric authentication successful');
    if (pendingAction) {
      setTimeout(pendingAction, 300);
    }
  };

  const handleAdd = (type: 'CARD' | 'MOMO') => {
    requireBiometric(() => {
      const newMethod: PaymentMethod = type === 'CARD' 
        ? { id: Date.now().toString(), type: 'CARD', provider: 'Mastercard', details: '•••• 5555', isDefault: methods.length === 0 }
        : { id: Date.now().toString(), type: 'MOMO', provider: 'Telecel Cash', details: '020 ••• 5678', isDefault: methods.length === 0 };
      
      const updated = [...methods, newMethod];
      setMethods(updated);
      localStorage.setItem(`reed-payments-${user?.email}`, JSON.stringify(updated));
      setIsAdding(false);
      showToast('Payment method added securely');
    });
  };

  const handleDelete = (id: string) => {
    requireBiometric(() => {
      const updated = methods.filter(m => m.id !== id);
      setMethods(updated);
      localStorage.setItem(`reed-payments-${user?.email}`, JSON.stringify(updated));
      showToast('Payment method removed', 'info');
    });
  };

  if (!user) return null;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: '#fff' }}>Payment Methods</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {!isAdding ? (
          <>
            {methods.map((method, i) => (
              <div key={method.id} className={`animate-fade-in-up stagger-${i + 1}`} style={{
                background: '#111', border: method.isDefault ? '1px solid var(--lime-400)' : '1px solid #1a1a1a', 
                borderRadius: 12, padding: 16, position: 'relative', display: 'flex', alignItems: 'center', gap: 16
              }}>
                <div style={{ width: 48, height: 32, background: '#222', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: '#fff' }}>
                    {method.type === 'CARD' ? 'credit_card' : 'smartphone'}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, color: '#fff', marginBottom: 2 }}>{method.provider}</h3>
                  <p style={{ color: '#888', fontSize: 13 }}>{method.details}</p>
                </div>
                <button onClick={() => handleDelete(method.id)} style={{
                  background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', display: 'flex'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                </button>
                {method.isDefault && (
                  <span style={{
                    position: 'absolute', top: -8, right: 16, fontSize: 9, fontWeight: 800,
                    background: 'var(--lime-400)', color: '#000', padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase'
                  }}>Default</span>
                )}
              </div>
            ))}
            <button onClick={() => setIsAdding(true)} className="animate-fade-in-up" style={{
              width: '100%', padding: '16px', marginTop: 16, border: '1px dashed #333', background: 'transparent',
              color: 'var(--lime-400)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
              fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase'
            }}>
              <span className="material-symbols-outlined">add</span> Add Payment Method
            </button>
          </>
        ) : (
          <div className="animate-fade-in-up" style={{ background: '#111', padding: 16, borderRadius: 12, border: '1px solid #1a1a1a' }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', color: '#fff', marginBottom: 16 }}>Select Method Type</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button onClick={() => handleAdd('CARD')} style={{ flex: 1, padding: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined">credit_card</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-lexend)' }}>Card</span>
              </button>
              <button onClick={() => handleAdd('MOMO')} style={{ flex: 1, padding: 16, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined">smartphone</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-lexend)' }}>Mobile Money</span>
              </button>
            </div>
            <button onClick={() => setIsAdding(false)} style={{ width: '100%', padding: 12, background: 'transparent', color: '#888', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Biometric Simulation Modal */}
      {showBiometric && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="animate-scale-in" style={{
            background: '#111', padding: 32, borderRadius: 24, border: '1px solid #222',
            display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80%', maxWidth: 300
          }}>
            <span className="material-symbols-outlined animate-pulse-glow" style={{ fontSize: 64, color: 'var(--lime-400)', marginBottom: 16 }}>fingerprint</span>
            <h3 style={{ fontFamily: 'var(--font-lexend)', color: '#fff', marginBottom: 8, textAlign: 'center' }}>Verify Identity</h3>
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>Touch the fingerprint sensor to authenticate this action securely.</p>
            
            <div style={{ display: 'flex', width: '100%', gap: 12 }}>
              <button onClick={() => setShowBiometric(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmBiometric} style={{ flex: 1, padding: 12, background: 'var(--lime-400)', border: 'none', color: '#000', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Simulate Touch</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
