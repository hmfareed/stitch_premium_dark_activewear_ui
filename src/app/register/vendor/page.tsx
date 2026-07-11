'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';

/* ── Ghana phone/momo regex (mirrors backend) ─────────────────────────────── */
const GHANA_PHONE_RE = /^(\+233|0)[235][0-9]{8}$/;

const BUSINESS_CATEGORIES = [
  { value: 'fashion_apparel',  label: 'Fashion & Apparel' },
  { value: 'electronics',      label: 'Electronics & Gadgets' },
  { value: 'food_groceries',   label: 'Food & Groceries' },
  { value: 'health_beauty',    label: 'Health & Beauty' },
  { value: 'home_living',      label: 'Home & Living' },
  { value: 'sports_fitness',   label: 'Sports & Fitness' },
  { value: 'arts_crafts',      label: 'Arts & Crafts' },
  { value: 'books_media',      label: 'Books & Media' },
  { value: 'automotive',       label: 'Automotive' },
  { value: 'other',            label: 'Other' },
];

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  businessName?: string;
  businessCategory?: string;
  momoNumber?: string;
}

function validate(
  name: string, email: string, phone: string,
  password: string, confirmPassword: string,
  businessName: string, businessCategory: string, momoNumber: string,
): FieldErrors {
  const errs: FieldErrors = {};
  if (!name.trim() || name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
  if (!GHANA_PHONE_RE.test(phone.trim())) errs.phone = 'Enter a valid Ghana number (e.g. 0501234567)';
  if (password.length < 8) errs.password = 'Password must be at least 8 characters';
  if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
  if (!businessName.trim() || businessName.trim().length < 3) errs.businessName = 'Business name must be at least 3 characters';
  if (!businessCategory) errs.businessCategory = 'Please select a business category';
  if (!GHANA_PHONE_RE.test(momoNumber.trim())) errs.momoNumber = 'Enter a valid Ghana MoMo number (e.g. 0241234567)';
  return errs;
}

const inputBase: React.CSSProperties = {
  width: '100%', padding: '13px 14px',
  background: 'var(--surface-container)',
  border: '1.5px solid var(--outline)',
  borderRadius: 10,
  color: 'var(--foreground)', fontSize: 15,
  fontFamily: 'var(--font-inter)', outline: 'none',
  transition: 'border-color 0.18s',
};
const inputErr: React.CSSProperties = { ...inputBase, borderColor: 'var(--error)' };
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-lexend)', fontSize: 11,
  fontWeight: 700, color: 'var(--on-surface-variant)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
};
const errMsg: React.CSSProperties = { color: 'var(--error)', fontSize: 12, marginTop: 4, fontFamily: 'var(--font-inter)' };

/* ── Success / Pending screen ─────────────────────────────────────────────── */
function PendingScreen({ businessName }: { businessName: string }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px', background: 'var(--background)', textAlign: 'center',
      }}
    >
      {/* Animated icon */}
      <div
        className="animate-bounce-in"
        style={{
          width: 88, height: 88, borderRadius: '50%', marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(195,244,0,0.15), rgba(195,244,0,0.05))',
          border: '2px solid var(--lime-400)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--lime-400)' }}>
          hourglass_top
        </span>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-lexend)', fontSize: 26, fontWeight: 900,
          color: 'var(--foreground)', marginBottom: 12, letterSpacing: '-0.02em',
        }}
      >
        Application Submitted! 🎉
      </h1>

      <p
        style={{
          fontFamily: 'var(--font-inter)', fontSize: 14, color: 'var(--on-surface-variant)',
          maxWidth: 380, lineHeight: 1.65, marginBottom: 32,
        }}
      >
        <strong style={{ color: 'var(--foreground)' }}>{businessName}</strong> is now under review by the AfriCart team.
        We typically review applications within <strong style={{ color: 'var(--lime-400)' }}>24–48 hours</strong>.{' '}
        You&apos;ll receive an email once your account is approved.
      </p>

      {/* Status steps */}
      <div
        style={{
          background: 'var(--surface-container)', border: '1px solid var(--outline)',
          borderRadius: 14, padding: '20px 24px', maxWidth: 360, width: '100%', marginBottom: 32,
          textAlign: 'left',
        }}
      >
        {[
          { icon: 'check_circle', label: 'Account created', done: true },
          { icon: 'schedule', label: 'Under review by our team', done: false, active: true },
          { icon: 'storefront', label: 'Approved to list products', done: false },
        ].map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 0',
              borderBottom: i < 2 ? '1px solid var(--outline)' : 'none',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 20,
                color: step.done ? 'var(--lime-400)' : step.active ? 'var(--secondary)' : 'var(--outline)',
              }}
            >
              {step.icon}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-inter)', fontSize: 13,
                color: step.done || step.active ? 'var(--foreground)' : 'var(--on-surface-variant)',
                fontWeight: step.active ? 600 : 400,
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
        <Link
          href="/login"
          style={{
            display: 'block', width: '100%', padding: '14px',
            background: 'var(--lime-400)', color: '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            borderRadius: 10, textAlign: 'center',
          }}
        >
          Sign In to Your Account
        </Link>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-inter)', fontSize: 13,
            color: 'var(--on-surface-variant)', textAlign: 'center',
          }}
        >
          Browse the marketplace →
        </Link>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function VendorRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pendingBusiness, setPendingBusiness] = useState<string | null>(null);

  const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const runValidation = useCallback(() =>
    validate(name, email, phone, password, confirmPassword, businessName, businessCategory, momoNumber),
    [name, email, phone, password, confirmPassword, businessName, businessCategory, momoNumber],
  );

  if (pendingBusiness) return <PendingScreen businessName={pendingBusiness} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    const allTouched = Object.fromEntries(
      ['name', 'email', 'phone', 'password', 'confirmPassword', 'businessName', 'businessCategory', 'momoNumber']
        .map(k => [k, true]),
    );
    setTouched(allTouched);

    const errs = runValidation();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), phone: phone.trim(), password,
          businessName: businessName.trim(), businessCategory, momoNumber: momoNumber.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.token) localStorage.setItem('africart-token', data.token);
        // Store basic user so they can log in immediately
        const u = { ...data.user, role: 'vendor' };
        localStorage.setItem('africart-user', JSON.stringify(u));
        setPendingBusiness(businessName.trim());
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

  const errs = Object.keys(touched).length ? runValidation() : fieldErrors;

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '32px 20px 80px', background: 'var(--background)',
      }}
    >
      {/* Header */}
      <div className="animate-scale-in" style={{ textAlign: 'center', marginBottom: 32, width: '100%', maxWidth: 480 }}>
        <Link href="/" style={{ display: 'inline-block', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 32, fontWeight: 900, color: 'var(--lime-400)', letterSpacing: '-0.03em' }}>
            AfriCart
          </span>
        </Link>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>
          Sell on AfriCart
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
          Set up your vendor account — takes under 2 minutes
        </p>
      </div>

      {/* Card */}
      <div
        className="glass animate-fade-in-up"
        style={{
          width: '100%', maxWidth: 480, borderRadius: 16,
          padding: '32px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
        }}
      >
        {/* General error banner */}
        {generalError && (
          <div
            className="animate-fade-in"
            style={{
              background: 'rgba(255,68,68,0.12)', border: '1px solid var(--error)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 20,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--error)', flexShrink: 0, marginTop: 1 }}>error</span>
            <p style={{ color: 'var(--error)', fontSize: 13, fontFamily: 'var(--font-inter)', lineHeight: 1.5 }}>{generalError}</p>
          </div>
        )}

        <form id="vendor-register-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* ── Section: Personal Info ── */}
          <div style={{
            background: 'var(--surface-container-low)', borderRadius: 10, padding: '16px 14px',
            border: '1px solid var(--outline)',
          }}>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--lime-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Personal Info
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field id="v-name" label="Full Name" errorKey="name" touched={touched} errs={errs}>
                <input id="v-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} onBlur={() => touch('name')} placeholder="Kofi Acheampong" style={touched.name && errs.name ? inputErr : inputBase} />
              </Field>
              <Field id="v-email" label="Email Address" errorKey="email" touched={touched} errs={errs}>
                <input id="v-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch('email')} placeholder="you@example.com" style={touched.email && errs.email ? inputErr : inputBase} />
              </Field>
              <Field id="v-phone" label="Ghana Phone Number" errorKey="phone" touched={touched} errs={errs}>
                <input id="v-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => touch('phone')} placeholder="0501234567" style={touched.phone && errs.phone ? inputErr : inputBase} />
              </Field>
            </div>
          </div>

          {/* ── Section: Business Info ── */}
          <div style={{
            background: 'var(--surface-container-low)', borderRadius: 10, padding: '16px 14px',
            border: '1px solid var(--outline)',
          }}>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--secondary-container)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Business Info
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field id="v-bname" label="Business Name" errorKey="businessName" touched={touched} errs={errs}>
                <input id="v-bname" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} onBlur={() => touch('businessName')} placeholder="Accra Trends Store" style={touched.businessName && errs.businessName ? inputErr : inputBase} />
              </Field>

              <Field id="v-category" label="Business Category" errorKey="businessCategory" touched={touched} errs={errs}>
                <select
                  id="v-category"
                  value={businessCategory}
                  onChange={e => setBusinessCategory(e.target.value)}
                  onBlur={() => touch('businessCategory')}
                  style={{
                    ...(touched.businessCategory && errs.businessCategory ? inputErr : inputBase),
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M0 0l6 8 6-8z' fill='%23a0a0a0'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: 36,
                  }}
                >
                  <option value="">Select a category…</option>
                  {BUSINESS_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field id="v-momo" label="MoMo Number (Payout)" errorKey="momoNumber" touched={touched} errs={errs}>
                <input id="v-momo" type="tel" value={momoNumber} onChange={e => setMomoNumber(e.target.value)} onBlur={() => touch('momoNumber')} placeholder="0241234567" style={touched.momoNumber && errs.momoNumber ? inputErr : inputBase} />
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 4, fontFamily: 'var(--font-inter)' }}>
                  This is where your payouts will be sent — can be changed later
                </p>
              </Field>
            </div>
          </div>

          {/* ── Section: Password ── */}
          <div style={{
            background: 'var(--surface-container-low)', borderRadius: 10, padding: '16px 14px',
            border: '1px solid var(--outline)',
          }}>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              Security
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field id="v-password" label="Password" errorKey="password" touched={touched} errs={errs}>
                <div style={{ position: 'relative' }}>
                  <input
                    id="v-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                    value={password} onChange={e => setPassword(e.target.value)} onBlur={() => touch('password')}
                    placeholder="At least 8 characters"
                    style={{ ...(touched.password && errs.password ? inputErr : inputBase), paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} aria-label="Toggle password visibility"
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', lineHeight: 1 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </Field>
              <Field id="v-confirm" label="Confirm Password" errorKey="confirmPassword" touched={touched} errs={errs}>
                <input id="v-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={() => touch('confirmPassword')} placeholder="Repeat your password" style={touched.confirmPassword && errs.confirmPassword ? inputErr : inputBase} />
              </Field>
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6, textAlign: 'center' }}>
            By registering, you agree to AfriCart&apos;s terms. Your vendor account will be reviewed before you can list products.
          </p>

          {/* Submit */}
          <button
            id="vendor-register-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? 'var(--outline)' : 'var(--secondary-container)',
              color: loading ? 'var(--on-surface-variant)' : '#fff',
              fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
              transition: 'background 0.2s', marginTop: 4,
            }}
          >
            {loading ? 'Submitting Application…' : 'Submit Vendor Application'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
            Just shopping?{' '}
            <Link href="/register/customer" style={{ color: 'var(--lime-400)', fontWeight: 600 }}>
              Create a customer account
            </Link>
          </p>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)' }}>
          Continue as Guest →
        </Link>
      </div>
    </div>
  );
}

/* ── Extracted static Field component (placed outside to prevent keyboard-drop on keystroke remounts) ── */
interface FieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  errorKey: keyof FieldErrors;
  touched: Record<string, boolean>;
  errs: FieldErrors;
}

function Field({ id, label, children, errorKey, touched, errs }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      {children}
      {touched[errorKey] && errs[errorKey] && <p style={errMsg}>{errs[errorKey]}</p>}
    </div>
  );
}
