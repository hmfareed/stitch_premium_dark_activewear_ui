'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let success;
      if (isSignup) {
        success = await signup(name, email, phone, password);
      } else {
        success = await login(email, password);
      }
      if (success) {
        showToast(isSignup ? 'Account created successfully!' : 'Welcome back!');
        router.push('/account');
      } else {
        showToast(isSignup ? 'Email already in use or failed' : 'Invalid email or password', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    }
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: '#111',
    border: '1px solid #222', borderRadius: 10,
    color: '#fff', fontSize: 14, fontFamily: 'var(--font-inter)',
    outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 24px', justifyContent: 'center' }}>
      {/* Logo */}
      <div className="animate-scale-in" style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 32, fontWeight: 900, color: 'var(--lime-400)', letterSpacing: '-0.03em' }}>REED STORE</h1>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: '#555', marginTop: 4 }}>
          {isSignup ? 'Create your account' : 'Sign in to your account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, margin: '0 auto', width: '100%' }}>
        {isSignup && (
          <>
            <div className="animate-fade-in-up">
              <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Full Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="John Doe" />
            </div>
            <div className="animate-fade-in-up stagger-1">
              <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Phone Number</label>
              <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="050 000 0000" />
            </div>
          </>
        )}

        <div className="animate-fade-in-up stagger-1">
          <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" />
        </div>

        <div className="animate-fade-in-up stagger-2">
          <label style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block' }}>Password</label>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" minLength={6} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="animate-fade-in-up stagger-3"
          style={{
            width: '100%', padding: '16px', background: 'var(--lime-400)', color: '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
            transition: 'transform 0.15s, opacity 0.2s',
            opacity: loading ? 0.7 : 1,
            marginTop: 8,
          }}
        >
          {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="animate-fade-in-up stagger-4" style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={() => setIsSignup(!isSignup)}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-inter)' }}
        >
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <span style={{ color: 'var(--lime-400)', fontWeight: 600 }}>{isSignup ? 'Sign In' : 'Sign Up'}</span>
        </button>
      </div>

      <div className="animate-fade-in-up stagger-5" style={{ textAlign: 'center', marginTop: 32 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: '#555' }}>Continue as Guest →</Link>
      </div>
    </div>
  );
}
