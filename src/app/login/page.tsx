'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 13,
  padding: '12px 14px 12px 38px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-inter, sans-serif)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#ccc',
  marginBottom: 6,
  fontFamily: 'var(--font-inter, sans-serif)',
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA Challenge Modal state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  // OTP Sign-in mode state
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const isPhoneFormat = /^[0-9+\s\-()]{7,15}$/.test(identifier.trim());

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Email address or phone number is required'); return; }
    if (!useOtpMode && !password) { setError('Password is required'); return; }
    setError('');
    setLoading(true);

    try {
      if (useOtpMode && otpSent) {
        // Verify OTP
        const res = await fetch('/api/auth/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: identifier.trim(), code: otpCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid OTP code');
      }

      const ok = await login(identifier.trim(), password || 'otp_authenticated_login');
      if (ok) {
        if (rememberMe) {
          localStorage.setItem('africart-remember-me', 'true');
        }
        showToast('Logged in successfully!', 'success');
        redirectUser();
      } else {
        // Check if 2FA challenge is required
        setShow2FAModal(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!identifier.trim()) { setError('Enter your email or phone number first'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP code');
      setOtpSent(true);
      showToast('OTP code sent successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'OTP request failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      setError('Please enter a 6-digit 2FA verification code');
      return;
    }
    setTwoFactorLoading(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_login',
          email: identifier.trim(),
          code: twoFactorCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '2FA Verification failed');

      setShow2FAModal(false);
      showToast('Two-Factor Authentication verified!', 'success');
      redirectUser();
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const redirectUser = () => {
    const savedUser = JSON.parse(localStorage.getItem('africart-user') || '{}');
    const role = savedUser?.role;
    if (role === 'rider') {
      router.push('/rider');
    } else if (role === 'vendor') {
      router.push('/vendor');
    } else if (role === 'super_admin' || role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#080808' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path
              d="M 38,15 C 48,13 62,11 72,18 C 76,21 75,27 79,31 C 82,34 86,36 86,41 C 86,47 80,51 77,55 C 73,60 70,66 65,72 C 60,78 57,85 52,91 C 51,93 49,93 48,91 C 45,84 44,77 42,71 C 40,66 38,62 33,59 C 28,56 22,55 18,50 C 13,44 11,36 15,29 C 18,22 27,17 38,15 Z"
              stroke="#c3f400"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M 33,40 L 39,46 L 68,46" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 39,46 L 43,62 L 63,62 L 68,46 Z" fill="rgba(212, 175, 55, 0.12)" stroke="#D4AF37" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="43" cy="74" r="4.5" fill="#D4AF37" />
            <circle cx="59" cy="74" r="4.5" fill="#D4AF37" />
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, fontSize: 18, letterSpacing: '0.02em', lineHeight: 1 }}>
              <span style={{ color: '#c3f400' }}>Afri</span>
              <span style={{ color: '#ffffff' }}>cart</span>
            </div>
            <div style={{ fontSize: 10, color: '#888', fontFamily: 'var(--font-inter, sans-serif)', marginTop: 2 }}>Authentication & Security</div>
          </div>
        </Link>
        <div style={{ fontSize: 13, color: '#888', fontFamily: 'var(--font-inter, sans-serif)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register/customer" style={{ color: '#c3f400', fontWeight: 700, textDecoration: 'none' }}>Sign up</Link>
        </div>
      </header>

      {/* Main Full Page Content */}
      <div style={{ flex: 1, padding: '24px 16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#0d0f0b',
          border: '1px solid rgba(195, 244, 0, 0.22)',
          boxShadow: '0 0 30px rgba(195, 244, 0, 0.05)',
          borderRadius: 24,
          padding: '32px 24px',
          boxSizing: 'border-box',
        }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
              <span style={{ color: '#c3f400' }}>WELCOME</span> BACK
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Sign in with your Email, Phone number, or OTP.
            </p>
          </div>

          {/* Mode Switcher: Password vs OTP */}
          <div style={{ display: 'flex', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 10, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setUseOtpMode(false); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: !useOtpMode ? '#c3f400' : 'transparent',
                color: !useOtpMode ? '#000' : '#888',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => { setUseOtpMode(true); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: useOtpMode ? '#c3f400' : 'transparent',
                color: useOtpMode ? '#000' : '#888',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              OTP Quick Login
            </button>
          </div>

          <form onSubmit={handleStandardSubmit} noValidate>
            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, color: '#f87171', fontSize: 13, textAlign: 'center', fontFamily: 'var(--font-inter, sans-serif)' }}>
                {error}
              </div>
            )}

            {/* Email / Phone Field with Format Badge */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Email or Phone Number</label>
                {identifier.trim() && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: isPhoneFormat ? 'rgba(37,99,235,0.2)' : 'rgba(16,185,129,0.2)', color: isPhoneFormat ? '#60a5fa' : '#34d399' }}>
                    {isPhoneFormat ? 'Phone Identifier' : 'Email Address'}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{isPhoneFormat ? 'call' : 'mail'}</span>
                </span>
                <input
                  id="login-email"
                  type="text"
                  placeholder="e.g. user@example.com or +233241234567"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="username"
                  style={inputBase}
                />
              </div>
            </div>

            {/* Standard Password Field */}
            {!useOtpMode ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                  <Link href="/forgot-password" style={{ fontSize: 11, color: '#c3f400', textDecoration: 'none', fontFamily: 'var(--font-inter, sans-serif)' }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>lock</span>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{ ...inputBase, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', padding: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* OTP Code Field */
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>6-Digit One-Time Password (OTP)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    maxLength={6}
                    style={{ ...inputBase, paddingLeft: 14 }}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      padding: '0 14px',
                      backgroundColor: 'rgba(195,244,0,0.15)',
                      border: '1px solid #c3f400',
                      color: '#c3f400',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {otpSent ? 'Resend OTP' : 'Get OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: '#c3f400', cursor: 'pointer' }}
              />
              <label htmlFor="remember-me" style={{ fontSize: 12, color: '#aaa', cursor: 'pointer', fontFamily: 'var(--font-inter, sans-serif)' }}>
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#8ba800' : '#c3f400',
                color: '#000',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-lexend, sans-serif)',
                textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading && <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'spin 0.8s linear infinite' }}>refresh</span>}
              {loading ? 'Authenticating...' : (useOtpMode ? 'VERIFY & SIGN IN' : 'SIGN IN')}
            </button>
          </form>

          {/* Account Types Shortcuts */}
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#666', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: 10 }}>Register new account</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Link href="/register/customer" style={{ padding: '8px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>
                Customer
              </Link>
              <Link href="/register/vendor" style={{ padding: '8px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>
                Vendor
              </Link>
              <Link href="/register/rider" style={{ padding: '8px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600, textAlign: 'center' }}>
                Rider
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Challenge Modal */}
      {show2FAModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#0d0f0b', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%', border: '1px solid #c3f400' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: '#c3f400' }}>verified_user</span>
                Two-Factor Security
              </h3>
              <button onClick={() => setShow2FAModal(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: '#aaa', marginBottom: 18 }}>
              Enter the 6-digit verification code from your Authenticator App or enter a backup code.
            </p>

            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="6-digit code or backup code"
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value)}
                style={{ ...inputBase, paddingLeft: 14, textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
              />
            </div>

            <button
              onClick={handle2FAVerify}
              disabled={twoFactorLoading}
              style={{ width: '100%', padding: 12, backgroundColor: '#c3f400', color: '#000', border: 'none', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}
            >
              {twoFactorLoading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
