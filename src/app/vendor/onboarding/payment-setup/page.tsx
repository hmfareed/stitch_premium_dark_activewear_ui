'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';
import VendorOnboardingProgress from '@/components/VendorOnboardingProgress';

export default function PaymentSetupStepPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'bank'>('momo');

  // MoMo state
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [momoNumber, setMomoNumber] = useState(user?.phone || '');
  const [momoName, setMomoName] = useState(user?.name || '');

  // Bank state
  const [bankName, setBankName] = useState('GCB Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState(user?.name || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payoutMethod === 'momo' && !momoNumber.trim()) {
      setError('Mobile Money Phone Number is required');
      return;
    }
    if (payoutMethod === 'bank' && !accountNumber.trim()) {
      setError('Bank Account Number is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/vendor/onboarding/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          momoNetwork,
          momoNumber: momoNumber.trim(),
          momoName: momoName.trim(),
          bankName,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment setup failed');

      showToast('Payout details configured! Moving to Step 5.', 'success');
      router.push('/vendor/onboarding/completion');
    } catch (err: any) {
      setError(err.message || 'Payment setup error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#061d13', color: '#ffffff', fontFamily: 'var(--font-inter, sans-serif)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Step Progress Header Bar */}
        <VendorOnboardingProgress currentStep={4} />

        <div style={{
          backgroundColor: '#0a291b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Step 4: Payout & Payment Setup
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, margin: 0 }}>
              Connect your Mobile Money or Bank Account to receive automatic daily sales payouts.
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Method Switcher */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setPayoutMethod('momo')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 12,
                border: payoutMethod === 'momo' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: payoutMethod === 'momo' ? '#0b3824' : '#061d13',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#a3e635' }}>phone_android</span>
              <span>Mobile Money Payout</span>
            </button>
            <button
              type="button"
              onClick={() => setPayoutMethod('bank')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: 12,
                border: payoutMethod === 'bank' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: payoutMethod === 'bank' ? '#0b3824' : '#061d13',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#60a5fa' }}>account_balance</span>
              <span>Bank Account Payout</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {payoutMethod === 'momo' ? (
              /* Mobile Money Payout Form */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                      Mobile Money Network
                    </label>
                    <select
                      value={momoNetwork}
                      onChange={e => setMomoNetwork(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="Telecel">Telecel Cash</option>
                      <option value="AT">AT Money</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                      MoMo Phone Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0241234567"
                      value={momoNumber}
                      onChange={e => setMomoNumber(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Registered MoMo Name"
                    value={momoName}
                    onChange={e => setMomoName(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </>
            ) : (
              /* Bank Account Payout Form */
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                      Commercial Bank Name
                    </label>
                    <select
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="GCB Bank">GCB Bank Ghana</option>
                      <option value="Ecobank">Ecobank Ghana</option>
                      <option value="Fidelity Bank">Fidelity Bank Ghana</option>
                      <option value="Stanbic Bank">Stanbic Bank Ghana</option>
                      <option value="Absa Bank">Absa Bank Ghana</option>
                      <option value="Zenith Bank">Zenith Bank Ghana</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                      Bank Account Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 101118274639"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                    Bank Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="Account Name as registered with Bank"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </>
            )}

            {/* Paystack Escrow Security Banner */}
            <div style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#60a5fa' }}>lock</span>
              <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>
                <strong style={{ color: '#60a5fa' }}>Paystack Escrow Settlement:</strong> Sales funds are disbursed directly into your selected account upon order completion.
              </div>
            </div>

            {/* Action Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <Link href="/vendor/onboarding/subscription" style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ← Back to Step 3
              </Link>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-lexend, sans-serif)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{loading ? 'FINALIZE...' : 'FINALIZE STORE LAUNCH'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
