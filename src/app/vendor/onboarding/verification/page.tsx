'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

interface CheckResult {
  phoneVerified: boolean;
  paystackActive: boolean;
  contentClean: boolean;
}

function VerificationContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');

  const [checks, setChecks] = useState<CheckResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [storeStatus, setStoreStatus] = useState('');

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (!isLoading && !storeId) router.push('/vendor/onboarding');
  }, [user, isLoading, storeId, router]);

  const runVerification = useCallback(async () => {
    if (!storeId) return;
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(`/api/stores/${storeId}/verify`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Verification failed');
      setChecks(data.checks);
      setStoreStatus(data.storeStatus);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  }, [storeId]);

  // Auto-run on mount
  useEffect(() => {
    if (!isLoading && user && storeId) runVerification();
  }, [isLoading, user, storeId, runVerification]);

  const allPassed = checks?.phoneVerified && checks?.paystackActive && checks?.contentClean;

  const requestGoLive = async () => {
    setSubmitting(true);
    setError('');
    try {
      // Store is already set to under_review by the verify API — just navigate
      router.push(`/vendor/onboarding/pending?storeId=${storeId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime-400)' }} />
      </div>
    );
  }

  const checkItems = [
    {
      key: 'phoneVerified',
      label: 'Phone number verified',
      desc: checks?.phoneVerified
        ? 'Your phone was verified during account registration.'
        : 'Your phone number has not been verified yet. This was completed during account registration.',
      passed: checks?.phoneVerified,
    },
    {
      key: 'paystackActive',
      label: 'Payout account connected',
      desc: checks?.paystackActive
        ? 'Your Paystack payout account is active and ready to receive payments.'
        : 'Your payout account is not yet connected or is pending confirmation. Go back to set it up.',
      passed: checks?.paystackActive,
      fixLink: checks?.paystackActive ? undefined : `/vendor/onboarding/payment?storeId=${storeId}`,
      fixLabel: 'Connect Payout Account',
    },
    {
      key: 'contentClean',
      label: 'Store content review',
      desc: checks?.contentClean
        ? 'Your store name and category passed our automated content check.'
        : 'Your store name or description contains terms that need review. Please edit your store name.',
      passed: checks?.contentClean,
      fixLink: checks?.contentClean ? undefined : `/vendor/onboarding`,
      fixLabel: 'Edit Store Name',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--outline)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ height: '100%', width: '75%', background: 'linear-gradient(90deg, #00e5ff, var(--lime-400))', transition: 'width 0.5s ease' }} />
      </div>

      {/* Header */}
      <header style={{ padding: '20px 32px', borderBottom: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(45deg, #00e5ff, var(--lime-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AfriCart</span>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>/ Verification</span>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shield</span>
          Step 3 of 4
        </span>
      </header>

      <div style={{ flex: 1, maxWidth: 720, margin: '0 auto', width: '100%', padding: '56px 24px' }}>
        <div className="animate-fade-in-up">
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0' }}>
            Almost there!
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', margin: '0 0 40px 0', lineHeight: 1.6 }}>
            Before your store can go live, we need to confirm a few things. All three checks below must pass.
          </p>

          {/* Verification checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
            {checkItems.map(item => (
              <div key={item.key} style={{
                padding: '24px', borderRadius: 16,
                border: `1px solid ${verifying ? 'var(--outline)' : item.passed ? 'rgba(195,244,0,0.3)' : 'rgba(244,67,54,0.3)'}`,
                background: verifying ? 'var(--surface-container)' : item.passed ? 'rgba(195,244,0,0.04)' : 'rgba(244,67,54,0.04)',
                display: 'flex', alignItems: 'flex-start', gap: 20, transition: 'all 0.3s',
              }}>
                {/* Status icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: verifying ? 'var(--surface-container-high)' : item.passed ? 'rgba(195,244,0,0.15)' : 'rgba(244,67,54,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {verifying
                    ? <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--on-surface-variant)', animation: 'spin 1s linear infinite' }}>sync</span>
                    : item.passed
                      ? <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--lime-400)' }}>check_circle</span>
                      : <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--error)' }}>cancel</span>
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: 'var(--on-surface)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{verifying ? 'Checking…' : item.desc}</div>
                  {!verifying && !item.passed && item.fixLink && (
                    <a href={item.fixLink} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 16px', borderRadius: 8, background: 'rgba(244,67,54,0.1)', border: '1px solid rgba(244,67,54,0.3)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                      {item.fixLabel}
                    </a>
                  )}
                </div>

                {/* Pill badge */}
                {!verifying && (
                  <div style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: item.passed ? 'rgba(195,244,0,0.12)' : 'rgba(244,67,54,0.12)', color: item.passed ? 'var(--lime-400)' : 'var(--error)' }}>
                    {item.passed ? 'PASS' : 'FAIL'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: 24, padding: '14px 20px', background: 'rgba(244,67,54,0.08)', border: '1px solid var(--error)', borderRadius: 12, color: 'var(--error)', fontSize: '0.9rem', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
              {error}
            </div>
          )}

          {/* All passed state */}
          {!verifying && allPassed && (
            <div className="animate-fade-in-up" style={{ padding: '24px', borderRadius: 16, background: 'rgba(195,244,0,0.06)', border: '1px solid rgba(195,244,0,0.3)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--lime-400)', flexShrink: 0 }}>verified</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>All checks passed!</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Your store is ready for final review. Click below to submit for go-live approval — our team typically reviews within a few hours.</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
              Back
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              {!verifying && !allPassed && (
                <button onClick={runVerification} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                  Re-check
                </button>
              )}
              {!verifying && allPassed && (
                <button
                  onClick={requestGoLive}
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', border: 'none', color: '#000', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-lexend)', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Submitting…' : 'Submit for Go-Live'}
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{submitting ? 'sync' : 'rocket_launch'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime-400)' }} />
      </div>
    }>
      <VerificationContent />
    </Suspense>
  );
}
