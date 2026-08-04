'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/AppContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email address or phone number');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset request failed');

      setSubmitted(true);
      showToast('Reset verification code sent!', 'success');
      startTimer();
    } catch (err: any) {
      setError(err.message || 'Unable to process reset request');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'var(--font-inter, sans-serif)' }}>
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, fontSize: 18 }}>
            <span style={{ color: '#c3f400' }}>Afri</span>
            <span style={{ color: '#ffffff' }}>cart</span>
          </div>
        </Link>
        <Link href="/login" style={{ color: '#c3f400', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Back to Sign In
        </Link>
      </header>

      <div style={{ flex: 1, padding: '24px 16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: '#0d0f0b',
          border: '1px solid rgba(195, 244, 0, 0.22)',
          borderRadius: 24,
          padding: '32px 24px',
          boxSizing: 'border-box',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(195, 244, 0, 0.15)', color: '#c3f400', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>lock_reset</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, color: '#fff' }}>
              Forgot Password?
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888' }}>
              Enter your registered Email or Phone number to receive a password reset verification code.
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px', marginBottom: 16, color: '#f87171', fontSize: 12, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ccc', marginBottom: 6 }}>
                  Email Address or Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. user@example.com or +233241234567"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 13,
                    padding: '12px 14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#c3f400',
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-lexend, sans-serif)',
                  textTransform: 'uppercase',
                }}
              >
                {loading ? 'Sending Code...' : 'SEND RESET CODE'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ padding: '16px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: 12, marginBottom: 20, fontSize: 13, color: '#34d399' }}>
                A verification code has been dispatched to <strong>{identifier}</strong>.
              </div>

              <button
                onClick={() => router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#c3f400',
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: 'pointer',
                  marginBottom: 12,
                }}
              >
                ENTER RESET CODE & NEW PASSWORD →
              </button>

              {countdown > 0 ? (
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                  Resend code available in <strong>{countdown}s</strong>
                </p>
              ) : (
                <button
                  onClick={handleSubmit}
                  style={{ background: 'none', border: 'none', color: '#c3f400', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                >
                  Resend Code
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
