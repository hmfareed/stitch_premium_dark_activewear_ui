'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        showToast('Welcome back!');
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        router.push(redirect && redirect.startsWith('/') ? redirect : '/account');
      } else {
        showToast('Invalid email or password', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'An error occurred', 'error');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotSent(true);
        showToast('Reset email sent! Check your inbox.', 'success');
      } else {
        showToast(data.error || 'Failed to send reset email', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: 'var(--surface-container)',
    border: '1px solid var(--outline)', borderRadius: 10,
    color: 'var(--foreground)', fontSize: 14, fontFamily: 'var(--font-inter)',
    outline: 'none', transition: 'border-color 0.2s',
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 24px', justifyContent: 'center' }}>
        <div className="animate-scale-in" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 32, fontWeight: 900, color: 'var(--lime-400)', letterSpacing: '-0.03em' }}>AfriCart</h1>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>
            {forgotSent ? 'Check your email for the reset link' : 'Enter your email to reset your password'}
          </p>
        </div>

        {forgotSent ? (
          <div className="animate-fade-in-up" style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--lime-400)', marginBottom: 16 }}>mark_email_read</span>
            <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: 24 }}>
              We&apos;ve sent a password reset link to <strong style={{ color: 'var(--foreground)' }}>{forgotEmail}</strong>.{' '}
              Check your inbox and spam folder.
            </p>
            <button onClick={() => { setShowForgotPassword(false); setForgotSent(false); }} style={{ padding: '14px 32px', background: 'var(--lime-400)', color: '#000', border: 'none', borderRadius: 10, fontFamily: 'var(--font-lexend)', fontWeight: 800, cursor: 'pointer' }}>
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto', width: '100%' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Email Address</label>
              <input required type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => setShowForgotPassword(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-inter)', marginTop: 8 }}>
              ← Back to Login
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 24px', justifyContent: 'center' }}>
      {/* Logo */}
      <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
        <BrandLogo size={48} />
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 12 }}>
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div className="animate-fade-in-up stagger-1">
          <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
        </div>

        <div className="animate-fade-in-up stagger-2">
          <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Password</label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
        </div>

        {/* Forgot Password Link */}
        <div className="animate-fade-in-up stagger-2" style={{ textAlign: 'right', marginTop: -8 }}>
          <button type="button" onClick={() => setShowForgotPassword(true)} style={{ background: 'none', border: 'none', color: 'var(--lime-400)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-inter)', fontWeight: 600 }}>
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="animate-fade-in-up stagger-3"
          style={{
            width: '100%', padding: '16px', background: 'var(--lime-400)', color: 'var(--on-lime-400)',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
            transition: 'transform 0.15s, opacity 0.2s',
            opacity: loading ? 0.7 : 1,
            marginTop: 8,
          }}
        >
          {loading ? 'Please wait...' : 'Sign In'}
        </button>
      </form>

      <div className="animate-fade-in-up stagger-4" style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register/customer" style={{ color: 'var(--on-surface-variant)', fontWeight: 600 }}>Create account</Link>
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
          Want to sell on AfriCart?{' '}
          <Link href="/register/vendor" style={{ color: 'var(--on-surface-variant)', fontWeight: 600 }}>Apply as Vendor →</Link>
        </p>
      </div>

      <div className="animate-fade-in-up stagger-5" style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)' }}>Continue as Guest →</Link>
      </div>
    </div>
  );
}
