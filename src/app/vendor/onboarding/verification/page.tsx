'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';
import VendorOnboardingProgress from '@/components/VendorOnboardingProgress';

export default function BusinessVerificationStepPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [taxId, setTaxId] = useState('');
  const [ghanaCardId, setGhanaCardId] = useState('');
  const [registrationDocUrl, setRegistrationDocUrl] = useState('');
  const [ghanaCardDocUrl, setGhanaCardDocUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxId.trim()) { setError('Tax Identification Number (TIN) is required'); return; }
    if (!ghanaCardId.trim()) { setError('Ghana Card ID Number is required'); return; }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/vendor/onboarding/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taxId: taxId.trim(),
          ghanaCardId: ghanaCardId.trim(),
          registrationDocUrl: registrationDocUrl.trim() || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
          ghanaCardDocUrl: ghanaCardDocUrl.trim() || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit verification details');

      showToast('Verification documents submitted! Moving to Step 3.', 'success');
      router.push('/vendor/onboarding/subscription');
    } catch (err: any) {
      setError(err.message || 'Verification submission error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#061d13', color: '#ffffff', fontFamily: 'var(--font-inter, sans-serif)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Step Progress Header Bar */}
        <VendorOnboardingProgress currentStep={2} />

        <div style={{
          backgroundColor: '#0a291b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Step 2: Business Verification & Compliance
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, margin: 0 }}>
              Provide official tax registration and identity verification documents.
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Tax ID & Ghana Card Number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                  Tax Identification Number (TIN) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. C001234567X"
                  value={taxId}
                  onChange={e => setTaxId(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                  Ghana Card ID Number *
                </label>
                <input
                  type="text"
                  placeholder="GHA-712345678-9"
                  value={ghanaCardId}
                  onChange={e => setGhanaCardId(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Document Upload Links */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                Business Registration Certificate Document URL
              </label>
              <input
                type="text"
                placeholder="Upload certificate link or image URL"
                value={registrationDocUrl}
                onChange={e => setRegistrationDocUrl(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                Ghana Card Identity Photo Document URL
              </label>
              <input
                type="text"
                placeholder="Upload Ghana Card front image URL"
                value={ghanaCardDocUrl}
                onChange={e => setGhanaCardDocUrl(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
              />
            </div>

            {/* Verification Guarantee Card */}
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#a3e635' }}>verified</span>
              <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.4 }}>
                <strong style={{ color: '#a3e635' }}>Enterprise Security Guarantee:</strong> Document verification unlocks Tier 2 store status, verified vendor badge, and lower payment processing fees.
              </div>
            </div>

            {/* Action Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <Link href="/vendor/onboarding" style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                ← Back to Step 1
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
                <span>{loading ? 'SUBMITTING...' : 'NEXT: SUBSCRIPTION SELECTION'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
