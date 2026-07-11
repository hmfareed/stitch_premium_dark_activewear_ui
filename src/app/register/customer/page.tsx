'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

/* ── Ghana phone regex (mirrors backend) ─────────────────────────────────── */
const GHANA_PHONE_RE = /^(\+233|0)[235][0-9]{8}$/;

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(name: string, email: string, phone: string, password: string, confirmPassword: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!name.trim() || name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
  if (!GHANA_PHONE_RE.test(phone.trim())) errs.phone = 'Enter a valid Ghana number (e.g. 0501234567)';
  if (password.length < 8) errs.password = 'Password must be at least 8 characters';
  if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
  return errs;
}

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  background: 'var(--surface-container)',
  border: '1.5px solid var(--outline)',
  borderRadius: 10,
  color: 'var(--foreground)',
  fontSize: 15,
  fontFamily: 'var(--font-inter)',
  outline: 'none',
  transition: 'border-color 0.18s',
};

const inputError: React.CSSProperties = {
  ...inputBase,
  borderColor: 'var(--error)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-lexend)',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--on-surface-variant)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 6,
};

const errorMsgStyle: React.CSSProperties = {
  color: 'var(--error)',
  fontSize: 12,
  marginTop: 4,
  fontFamily: 'var(--font-inter)',
};

export default function CustomerRegisterPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const runValidation = useCallback(() => {
    return validate(name, email, phone, password, confirmPassword);
  }, [name, email, phone, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });

    const errs = runValidation();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Store JWT and persist via AuthContext
        if (data.token) localStorage.setItem('africart-token', data.token);
        await signup(name.trim(), email.trim(), phone.trim(), password);
        showToast('Account created! Welcome to AfriCart 🎉', 'success');
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        router.push(redirect && redirect.startsWith('/') ? redirect : '/account');
        return;
      }

      if (res.status === 409) {
        if (data.fields) setFieldErrors(data.fields);
        setGeneralError(data.error || 'Account already exists');
        return;
      }

      if (res.status === 400 && data.fields) {
        setFieldErrors(data.fields);
        return;
      }

      setGeneralError(data.error || 'Something went wrong. Please try again.');
    } catch {
      setGeneralError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const errs = touched.name || touched.email ? runValidation() : fieldErrors;

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px 80px',
        background: 'var(--background)',
      }}
    >
      {/* Header */}
      <div className="animate-scale-in" style={{ textAlign: 'center', marginBottom: 36 }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: 16 }}>
          <h1
            style={{
              fontFamily: 'var(--font-lexend)',
              fontSize: 34,
              fontWeight: 900,
              color: 'var(--lime-400)',
              letterSpacing: '-0.03em',
            }}
          >
            AfriCart
          </h1>
        </Link>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>
          Create your account
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
          Shop from thousands of vendors across Ghana
        </p>
      </div>

      {/* Card */}
      <div
        className="glass animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 16,
          padding: '32px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        }}
      >
        {/* General error banner */}
        {generalError && (
          <div
            className="animate-fade-in"
            style={{
              background: 'rgba(255,68,68,0.12)',
              border: '1px solid var(--error)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)', flexShrink: 0, marginTop: 1 }}>
              error
            </span>
            <p style={{ color: 'var(--error)', fontSize: 13, fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}>
              {generalError}
            </p>
          </div>
        )}

        <form id="customer-register-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" style={labelStyle}>Full Name</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => touch('name')}
              placeholder="Kwame Mensah"
              style={touched.name && errs.name ? inputError : inputBase}
            />
            {touched.name && errs.name && <p style={errorMsgStyle}>{errs.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" style={labelStyle}>Email Address</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              placeholder="you@example.com"
              style={touched.email && errs.email ? inputError : inputBase}
            />
            {touched.email && errs.email && <p style={errorMsgStyle}>{errs.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="reg-phone" style={labelStyle}>Ghana Phone Number</label>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onBlur={() => touch('phone')}
              placeholder="0501234567"
              style={touched.phone && errs.phone ? inputError : inputBase}
            />
            {touched.phone && errs.phone && <p style={errorMsgStyle}>{errs.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="At least 8 characters"
                style={{ ...(touched.password && errs.password ? inputError : inputBase), paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', lineHeight: 1,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {touched.password && errs.password && <p style={errorMsgStyle}>{errs.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" style={labelStyle}>Confirm Password</label>
            <input
              id="reg-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onBlur={() => touch('confirmPassword')}
              placeholder="Repeat your password"
              style={touched.confirmPassword && errs.confirmPassword ? inputError : inputBase}
            />
            {touched.confirmPassword && errs.confirmPassword && (
              <p style={errorMsgStyle}>{errs.confirmPassword}</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="customer-register-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? 'var(--outline)' : 'var(--lime-400)',
              color: loading ? 'var(--on-surface-variant)' : '#000',
              fontFamily: 'var(--font-lexend)',
              fontWeight: 800,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'wait' : 'pointer',
              transition: 'background 0.2s, transform 0.15s',
              marginTop: 4,
            }}
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--lime-400)', fontWeight: 600 }}>
              Sign In
            </Link>
          </p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
            Want to sell on AfriCart?{' '}
            <Link href="/register/vendor" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
              Apply as a Vendor →
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom link */}
      <div style={{ marginTop: 24 }}>
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)' }}
        >
          Continue as Guest →
        </Link>
      </div>
    </div>
  );
}
