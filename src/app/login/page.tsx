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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email or phone is required'); return; }
    if (!password) { setError('Password is required'); return; }
    setError('');
    setLoading(true);

    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        showToast('Logged in successfully!', 'success');
        router.push('/');
      } else {
        setError('Invalid credentials');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
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
            <circle cx="43" cy="74" r="1.5" fill="#000" />
            <circle cx="59" cy="74" r="1.5" fill="#000" />
          </svg>
          <div>
            <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, fontSize: 18, letterSpacing: '0.02em', lineHeight: 1 }}>
              <span style={{ color: '#c3f400' }}>Afri</span>
              <span style={{ color: '#ffffff' }}>cart</span>
            </div>
            <div style={{ fontSize: 10, color: '#888', fontFamily: 'var(--font-inter, sans-serif)', marginTop: 2 }}>Multi-vendor Marketplace</div>
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
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: 24, fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
              <span style={{ color: '#c3f400' }}>WELCOME</span> BACK
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Sign in to access your orders, store, or deliveries.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, color: '#f87171', fontSize: 13, textAlign: 'center', fontFamily: 'var(--font-inter, sans-serif)' }}>
                {error}
              </div>
            )}

            {/* Email / Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email Address or Phone Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>mail</span>
                </span>
                <input id="login-email" type="text" placeholder="Enter your email or phone" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username"
                  style={inputBase} />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                <Link href="/reset-password" style={{ fontSize: 11, color: '#c3f400', textDecoration: 'none', fontFamily: 'var(--font-inter, sans-serif)' }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>lock</span>
                </span>
                <input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                  style={{ ...inputBase, paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', padding: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button id="login-submit-btn" type="submit" disabled={loading}
              style={{ width: '100%', padding: '15px', background: loading ? '#8ba800' : '#c3f400', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'var(--font-lexend, sans-serif)', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
              {loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>}
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>

          {/* Account Types Shortcuts */}
          <div style={{ marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#666', fontFamily: 'var(--font-inter, sans-serif)', marginBottom: 12 }}>Create a new account</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Link href="/register/customer" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)', display: 'block', textAlign: 'center' }}>
                Customer
              </Link>
              <Link href="/register/vendor" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)', display: 'block', textAlign: 'center' }}>
                Vendor
              </Link>
              <Link href="/register/rider" style={{ padding: '10px 4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)', display: 'block', textAlign: 'center' }}>
                Rider
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        input::placeholder { color: #555; }
        input:focus { border-color: rgba(195,244,0,0.5) !important; }
      `}</style>
    </div>
  );
}
