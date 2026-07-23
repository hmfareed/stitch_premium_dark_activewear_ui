'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

const MOMO_NETWORKS = [
  { id: 'MTN', label: 'MTN MoMo', color: '#fbbf24', icon: '📡' },
  { id: 'TELECEL', label: 'Telecel Cash', color: '#e11d48', icon: '📶' },
  { id: 'AIRTELTIGO', label: 'AirtelTigo Money', color: '#dc2626', icon: '📲' },
];

function PaymentSetupContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');

  const [method, setMethod] = useState<'momo' | 'bank' | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (!isLoading && !storeId) router.push('/vendor/onboarding');
  }, [user, isLoading, storeId, router]);

  const canSubmit = () => {
    if (!method) return false;
    if (method === 'momo') return momoNumber.length >= 10 && !!momoNetwork;
    if (method === 'bank') return bankName.trim().length > 0 && accountNumber.length >= 10 && accountName.trim().length > 0;
    return false;
  };

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/stores/${storeId}/paystack-subaccount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, momoNumber, momoNetwork, bankName, accountNumber, accountName, branchCode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Payout setup failed. Please check your details and try again.');
      router.push(`/vendor/onboarding/verification?storeId=${storeId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime-400)' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--outline)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ height: '100%', width: '50%', background: 'linear-gradient(90deg, #00e5ff, var(--lime-400))', transition: 'width 0.5s ease' }} />
      </div>

      {/* Header */}
      <header className="payment-onboarding-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(45deg, #00e5ff, var(--lime-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AfriCart</span>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>/ Payout Setup</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--on-surface-variant)', fontSize: '0.82rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
          Secured by Paystack
        </div>
      </header>

      <div className="payment-onboarding-layout">

        {/* Left sidebar */}
        <aside className="payment-onboarding-aside">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,229,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#00e5ff', fontSize: 26 }}>account_balance_wallet</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Payout Account</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>Step 2 of 4</div>
              </div>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.65 }}>
              Connect where AfriCart should send your earnings. You&apos;ll receive payouts based on your store&apos;s payout schedule.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: 'security', label: 'Bank-level encryption' },
                { icon: 'speed', label: 'Payouts within 24–72 hours' },
                { icon: 'edit', label: 'Editable anytime in Settings' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skip for now link */}
          <button
            onClick={() => router.push(`/vendor/onboarding/verification?storeId=${storeId}`)}
            style={{ marginTop: 16, width: '100%', padding: '12px', background: 'none', border: '1px solid var(--outline)', borderRadius: 12, color: 'var(--on-surface-variant)', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Skip for now — I&apos;ll set this up later
          </button>
        </aside>

        {/* Main content */}
        <main className="payment-onboarding-main">
          <h1 className="animate-fade-in-up" style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0' }}>
            Connect your payout account
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', margin: '0 0 36px 0', lineHeight: 1.6 }}>
            Choose how you&apos;d like to receive your earnings from AfriCart. This is how Paystack will settle funds into your account.
          </p>

          {/* Method selector */}
          <div className="payment-method-grid">
            {[
              { value: 'momo', label: 'Mobile Money', desc: 'MTN, Telecel, AirtelTigo', icon: 'smartphone' },
              { value: 'bank', label: 'Bank Account', desc: 'Ghana bank account', icon: 'account_balance' },
            ].map(opt => {
              const sel = method === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setMethod(opt.value as 'momo' | 'bank')}
                  style={{
                    padding: '24px 20px', borderRadius: 16, border: `2px solid ${sel ? '#00e5ff' : 'var(--outline)'}`,
                    background: sel ? 'rgba(0,229,255,0.06)' : 'var(--surface-container)',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                    transition: 'all 0.2s', boxShadow: sel ? '0 0 0 4px rgba(0,229,255,0.12)' : 'none', textAlign: 'left',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: sel ? '#00e5ff' : 'var(--on-surface-variant)' }}>{opt.icon}</span>
                  <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>

          {/* MoMo form */}
          {method === 'momo' && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Network Provider *</label>
                <div className="payment-momo-network-grid">
                  {MOMO_NETWORKS.map(net => {
                    const sel = momoNetwork === net.id;
                    return (
                      <button key={net.id} onClick={() => setMomoNetwork(net.id)} style={{
                        padding: '14px 12px', borderRadius: 12, border: `2px solid ${sel ? net.color : 'var(--outline)'}`,
                        background: sel ? `${net.color}15` : 'var(--surface-container)', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>{net.icon}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: sel ? 700 : 500, color: sel ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>{net.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>MoMo Number *</label>
                <input type="tel" value={momoNumber} onChange={e => setMomoNumber(e.target.value)} placeholder="0XX XXX XXXX" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Bank form */}
          {method === 'bank' && (
            <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Bank Name *</label>
                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. GCB Bank" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Account Number *</label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Enter your account number" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Account Name *</label>
                <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="As shown on your bank statement" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Branch Code (optional)</label>
                <input type="text" value={branchCode} onChange={e => setBranchCode(e.target.value)} placeholder="e.g. 02080" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop: 20, padding: '14px 20px', background: 'rgba(244,67,54,0.08)', border: '1px solid var(--error)', borderRadius: 12, color: 'var(--error)', fontSize: '0.9rem', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="payment-actions-bar">
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              Back
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit() || saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', border: 'none', color: '#000', fontWeight: 700, fontSize: '0.95rem', cursor: canSubmit() && !saving ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-lexend)', opacity: canSubmit() && !saving ? 1 : 0.4, transition: 'all 0.2s' }}
            >
              {saving ? 'Connecting…' : 'Connect Payout Account'}
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{saving ? 'sync' : 'account_balance_wallet'}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PaymentSetupPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime-400)' }} />
      </div>
    }>
      <PaymentSetupContent />
    </Suspense>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '14px 18px', borderRadius: 12,
  background: 'var(--surface-container)', border: '1px solid var(--outline)',
  color: 'var(--on-surface)', fontSize: '0.95rem', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 600,
  color: 'var(--on-surface-variant)', letterSpacing: '0.03em',
};
