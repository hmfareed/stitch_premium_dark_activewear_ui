'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: 'var(--surface-container)',
    border: '1px solid var(--outline)', borderRadius: 10,
    color: 'var(--foreground)', fontSize: 14, fontFamily: 'var(--font-inter)', outline: 'none',
  };

  if (!token || !email) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--error)', marginBottom: 16 }}>error</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Invalid Reset Link</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: 24 }}>This password reset link is invalid or has expired.</p>
        <Link href="/login" style={{ color: 'var(--lime-400)', fontWeight: 700 }}>Back to Login</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--lime-400)', marginBottom: 16 }}>check_circle</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Password Reset!</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: 24 }}>{message}</p>
        <button onClick={() => router.push('/login')} style={{ padding: '14px 32px', background: 'var(--lime-400)', color: '#000', border: 'none', borderRadius: 10, fontFamily: 'var(--font-lexend)', fontWeight: 800, cursor: 'pointer' }}>
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 24px', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--lime-400)' }}>AfriCart</h1>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 4 }}>Choose a new password</p>
      </div>

      <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto', width: '100%' }}>
        <div>
          <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>New Password</label>
          <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="••••••••" minLength={6} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Confirm Password</label>
          <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" minLength={6} />
        </div>
        {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '16px', background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14, textTransform: 'uppercase', border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--foreground)' }}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
