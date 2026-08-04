'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/context/AppContext';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const idParam = searchParams.get('identifier');
    const tokenParam = searchParams.get('token');
    if (idParam) setIdentifier(idParam);
    if (tokenParam) setResetToken(tokenParam);
  }, [searchParams]);

  // Password Strength Meter
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSymbol].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) { setError('Identifier is required'); return; }
    if (!resetToken.trim()) { setError('Reset code or token is required'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (strengthScore < 3) { setError('Please choose a stronger password matching criteria below'); return; }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          token: resetToken.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');

      showToast('Password updated successfully! Please sign in.', 'success');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 440,
      background: '#0d0f0b',
      border: '1px solid rgba(195, 244, 0, 0.22)',
      borderRadius: 24,
      padding: '32px 24px',
      boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, color: '#fff' }}>
          Reset Password
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: '#888' }}>
          Set your new secure password for AfriCart.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px', marginBottom: 16, color: '#f87171', fontSize: 12, textAlign: 'center' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Identifier */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>Email or Phone</label>
          <input
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="User identifier"
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, padding: '10px 12px', outline: 'none' }}
          />
        </div>

        {/* Reset Token / OTP Code */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>6-Digit Code / Reset Token</label>
          <input
            type="text"
            value={resetToken}
            onChange={e => setResetToken(e.target.value)}
            placeholder="Enter reset code"
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, padding: '10px 12px', outline: 'none' }}
          />
        </div>

        {/* New Password */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, padding: '10px 40px 10px 12px', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>

        {/* Password Strength Indicator */}
        {newPassword && (
          <div style={{ marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 6 }}>
              <span>Password Strength:</span>
              <span style={{ fontWeight: 800, color: strengthScore <= 2 ? '#f87171' : strengthScore === 3 ? '#f59e0b' : '#34d399' }}>
                {strengthScore <= 2 ? 'Weak' : strengthScore === 3 ? 'Good' : 'Strong'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, height: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4].map(step => (
                <div key={step} style={{ flex: 1, height: '100%', borderRadius: 2, backgroundColor: step <= strengthScore ? (strengthScore <= 2 ? '#ef4444' : strengthScore === 3 ? '#f59e0b' : '#10b981') : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10 }}>
              <span style={{ color: hasMinLength ? '#34d399' : '#888' }}>✓ 8+ Characters</span>
              <span style={{ color: hasUppercase ? '#34d399' : '#888' }}>✓ Uppercase Letter</span>
              <span style={{ color: hasNumber ? '#34d399' : '#888' }}>✓ Number</span>
              <span style={{ color: hasSymbol ? '#34d399' : '#888' }}>✓ Special Symbol</span>
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>Confirm New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, padding: '10px 12px', outline: 'none' }}
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
          {loading ? 'RESETTING...' : 'UPDATE PASSWORD'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', color: '#fff', fontFamily: 'var(--font-inter, sans-serif)' }}>
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
        <Suspense fallback={<div style={{ color: '#c3f400' }}>Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
