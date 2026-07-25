'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

const GHANA_PHONE_RE = /^(\+233|0)[235][0-9]{8}$/;

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

const errStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#f87171',
  marginTop: 4,
  fontFamily: 'var(--font-inter, sans-serif)',
};

export default function VendorRegisterPage() {
  const router = useRouter();
  const { vendorSignup } = useAuth();
  const { showToast } = useToast();

  const [stage, setStage] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    businessCategory: '',
    city: '',
    businessAddress: '',
    momoNumber: '',
    agreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validateStage1 = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = 'Full name must be at least 2 characters';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!GHANA_PHONE_RE.test(form.phone)) e.phone = 'Enter a valid Ghana number (e.g. 0501234567)';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStage2 = () => {
    const e: Record<string, string> = {};
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStage1 = () => {
    if (validateStage1()) {
      setErrors({});
      setStage(2);
    }
  };

  const handleNextStage2 = () => {
    if (validateStage2()) {
      setErrors({});
      setStage(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreed) {
      setErrors({ agreed: 'You must agree to the Vendor Agreement' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await vendorSignup({
        name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        businessName: form.businessName.trim(),
        businessCategory: form.businessCategory || 'fashion_apparel',
        momoNumber: form.momoNumber || form.phone.trim(),
      });

      if (res.success) {
        showToast('Vendor application submitted! Account pending review by Superadmin.', 'success');
        router.push('/login');
      } else {
        showToast(res.error || 'Vendor registration failed', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sectionHead = (icon: string, label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#c3f400', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#000', fontWeight: 900 }}>{icon}</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: '#c3f400', fontFamily: 'var(--font-lexend, sans-serif)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      {/* Header Bar with Real Africart Logo */}
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
          Have an account?{' '}
          <Link href="/login" style={{ color: '#c3f400', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </header>

      {/* Main Full Page Content */}
      <div style={{ flex: 1, padding: '24px 16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '100%',
          maxWidth: 480,
          background: '#0d0f0b',
          border: '1px solid rgba(195, 244, 0, 0.22)',
          boxShadow: '0 0 30px rgba(195, 244, 0, 0.05)',
          borderRadius: 24,
          padding: '24px 20px',
          boxSizing: 'border-box',
        }}>
          {/* Title Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-lexend, sans-serif)', fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
              <span style={{ color: '#c3f400' }}>CREATE</span> VENDOR ACCOUNT
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Join Africart and grow your business
            </p>
          </div>

          {/* Dynamic Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => { if (stage > 1) setStage(1); }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: stage >= 1 ? '#c3f400' : 'rgba(255,255,255,0.03)',
                border: stage >= 1 ? 'none' : '1px solid rgba(255,255,255,0.25)',
                color: stage >= 1 ? '#000' : '#888',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, fontFamily: 'var(--font-lexend, sans-serif)',
                transition: 'all 0.2s',
              }}>
                {stage > 1 ? <span className="material-symbols-outlined" style={{ fontSize: 16, fontWeight: 900 }}>check</span> : '1'}
              </div>
              <span style={{ fontSize: 10, color: stage >= 1 ? '#c3f400' : '#666', fontWeight: 700, fontFamily: 'var(--font-inter, sans-serif)', whiteSpace: 'nowrap' }}>Account Info</span>
            </div>

            <div style={{ flex: 1, height: 2, background: stage > 1 ? '#c3f400' : 'rgba(255,255,255,0.15)', margin: '0 8px', marginBottom: 14, transition: 'all 0.2s' }} />

            {/* Step 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => { if (stage > 2) setStage(2); }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: stage >= 2 ? '#c3f400' : 'rgba(255,255,255,0.03)',
                border: stage >= 2 ? 'none' : '1px solid rgba(255,255,255,0.25)',
                color: stage >= 2 ? '#000' : '#888',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, fontFamily: 'var(--font-lexend, sans-serif)',
                transition: 'all 0.2s',
              }}>
                {stage > 2 ? <span className="material-symbols-outlined" style={{ fontSize: 16, fontWeight: 900 }}>check</span> : '2'}
              </div>
              <span style={{ fontSize: 10, color: stage >= 2 ? '#c3f400' : '#666', fontWeight: 700, fontFamily: 'var(--font-inter, sans-serif)', whiteSpace: 'nowrap' }}>Store Info</span>
            </div>

            <div style={{ flex: 1, height: 2, background: stage > 2 ? '#c3f400' : 'rgba(255,255,255,0.15)', margin: '0 8px', marginBottom: 14, transition: 'all 0.2s' }} />

            {/* Step 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: stage === 3 ? '#c3f400' : 'rgba(255,255,255,0.03)',
                border: stage === 3 ? 'none' : '1px solid rgba(255,255,255,0.25)',
                color: stage === 3 ? '#000' : '#888',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, fontFamily: 'var(--font-lexend, sans-serif)',
                transition: 'all 0.2s',
              }}>
                3
              </div>
              <span style={{ fontSize: 10, color: stage === 3 ? '#c3f400' : '#666', fontWeight: 700, fontFamily: 'var(--font-inter, sans-serif)', whiteSpace: 'nowrap' }}>Verification</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* ── STAGE 1: ACCOUNT INFORMATION ── */}
            {stage === 1 && (
              <div>
                {sectionHead('person', 'ACCOUNT INFORMATION')}

                {/* Full Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>person</span>
                    </span>
                    <input id="vendor-name" type="text" placeholder="Enter your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} autoComplete="name"
                      style={{ ...inputBase, borderColor: errors.fullName ? '#f87171' : 'rgba(255,255,255,0.12)' }} />
                  </div>
                  {errors.fullName && <p style={errStyle}>{errors.fullName}</p>}
                </div>

                {/* Email Address */}
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>mail</span>
                    </span>
                    <input id="vendor-email" type="email" placeholder="Enter your email address" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email"
                      style={{ ...inputBase, borderColor: errors.email ? '#f87171' : 'rgba(255,255,255,0.12)' }} />
                  </div>
                  {errors.email && <p style={errStyle}>{errors.email}</p>}
                </div>

                {/* Ghana Phone Number */}
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Ghana Phone Number</label>
                  <div style={{ display: 'flex', borderRadius: 10, border: `1px solid ${errors.phone ? '#f87171' : 'rgba(255,255,255,0.12)'}`, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', borderRight: '1px solid rgba(255,255,255,0.12)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ fontSize: 15 }}>🇬🇭</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>+233</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#888' }}>expand_more</span>
                    </div>
                    <input id="vendor-phone" type="tel" placeholder="24 123 4567" value={form.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel"
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '12px 12px', fontFamily: 'var(--font-inter, sans-serif)' }} />
                  </div>
                  {errors.phone && <p style={errStyle}>{errors.phone}</p>}
                </div>

                {/* Password & Confirm Password Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                      </span>
                      <input id="vendor-password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password"
                        style={{ ...inputBase, padding: '12px 34px 12px 32px', borderColor: errors.password ? '#f87171' : 'rgba(255,255,255,0.12)' }} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0, display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    {errors.password && <p style={errStyle}>{errors.password}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                      </span>
                      <input id="vendor-confirm-password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} autoComplete="new-password"
                        style={{ ...inputBase, padding: '12px 34px 12px 32px', borderColor: errors.confirmPassword ? '#f87171' : 'rgba(255,255,255,0.12)' }} />
                      <button type="button" onClick={() => setShowConfirmPassword(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: 0, display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                    {errors.confirmPassword && <p style={errStyle}>{errors.confirmPassword}</p>}
                  </div>
                </div>

                <button type="button" onClick={handleNextStage1}
                  style={{ width: '100%', padding: '15px', background: '#c3f400', color: '#000', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'var(--font-lexend, sans-serif)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  CONTINUE TO STORE INFO
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontWeight: 900 }}>arrow_forward</span>
                </button>
              </div>
            )}

            {/* ── STAGE 2: STORE / BUSINESS INFORMATION ── */}
            {stage === 2 && (
              <div>
                {sectionHead('store', 'BUSINESS INFORMATION')}

                {/* Business Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Business Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>store</span>
                    </span>
                    <input id="vendor-business-name" type="text" placeholder="Enter your business name" value={form.businessName} onChange={e => set('businessName', e.target.value)}
                      style={{ ...inputBase, borderColor: errors.businessName ? '#f87171' : 'rgba(255,255,255,0.12)' }} />
                  </div>
                  {errors.businessName && <p style={errStyle}>{errors.businessName}</p>}
                </div>

                {/* Business Type & Category Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Business Type</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>business_center</span>
                      </span>
                      <select id="vendor-business-type" value={form.businessType} onChange={e => set('businessType', e.target.value)}
                        style={{ ...inputBase, padding: '12px 28px 12px 32px', appearance: 'none', cursor: 'pointer', color: form.businessType ? '#fff' : '#666' }}>
                        <option value="" disabled>Select type</option>
                        <option value="sole_proprietorship">Sole Proprietorship</option>
                        <option value="limited_company">Limited Liability</option>
                        <option value="partnership">Partnership</option>
                        <option value="individual">Individual Seller</option>
                      </select>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#666', pointerEvents: 'none' }}>expand_more</span>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>What do you plan to sell?</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sell</span>
                      </span>
                      <select id="vendor-business-category" value={form.businessCategory} onChange={e => set('businessCategory', e.target.value)}
                        style={{ ...inputBase, padding: '12px 28px 12px 32px', appearance: 'none', cursor: 'pointer', color: form.businessCategory ? '#fff' : '#666' }}>
                        <option value="" disabled>Select category</option>
                        <option value="fashion_apparel">Fashion &amp; Apparel</option>
                        <option value="electronics">Electronics &amp; Tech</option>
                        <option value="food_groceries">Food &amp; Groceries</option>
                        <option value="health_beauty">Health &amp; Beauty</option>
                        <option value="home_living">Home &amp; Living</option>
                        <option value="other">Other</option>
                      </select>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#666', pointerEvents: 'none' }}>expand_more</span>
                    </div>
                  </div>
                </div>

                {/* City & Business Address Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                      </span>
                      <input id="vendor-city" type="text" placeholder="Enter your city" value={form.city} onChange={e => set('city', e.target.value)}
                        style={{ ...inputBase, padding: '12px 10px 12px 32px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Business Address</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>map</span>
                      </span>
                      <input id="vendor-address" type="text" placeholder="Enter business address" value={form.businessAddress} onChange={e => set('businessAddress', e.target.value)}
                        style={{ ...inputBase, padding: '12px 10px 12px 32px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStage(1)}
                    style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-lexend, sans-serif)', cursor: 'pointer' }}>
                    BACK
                  </button>
                  <button type="button" onClick={handleNextStage2}
                    style={{ flex: 2, padding: '14px', background: '#c3f400', color: '#000', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'var(--font-lexend, sans-serif)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    CONTINUE TO VERIFICATION
                    <span className="material-symbols-outlined" style={{ fontSize: 18, fontWeight: 900 }}>arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STAGE 3: VERIFICATION & AGREEMENT ── */}
            {stage === 3 && (
              <div>
                {sectionHead('verified', 'VERIFICATION & AGREEMENT')}

                {/* Summary Card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#c3f400', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-lexend, sans-serif)' }}>Store Summary Review</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#ccc', fontFamily: 'var(--font-inter, sans-serif)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Owner Name:</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{form.fullName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Email / Phone:</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{form.email} · +233 {form.phone}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Business Name:</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{form.businessName}</span>
                    </div>
                    {form.city && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>City:</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{form.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: errors.agreed ? 8 : 20, userSelect: 'none' }}>
                  <div onClick={() => set('agreed', !form.agreed)}
                    style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: form.agreed ? 'none' : `1.5px solid ${errors.agreed ? '#f87171' : 'rgba(255,255,255,0.3)'}`, background: form.agreed ? '#c3f400' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {form.agreed && <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#000', fontWeight: 900 }}>check</span>}
                  </div>
                  <span style={{ fontSize: 12, color: '#999', fontFamily: 'var(--font-inter, sans-serif)', lineHeight: 1.4 }}>
                    I agree to the Africart <Link href="/terms" style={{ color: '#c3f400', textDecoration: 'none', fontWeight: 600 }}>Vendor Agreement</Link> and <Link href="/privacy" style={{ color: '#c3f400', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
                  </span>
                </label>
                {errors.agreed && <p style={{ ...errStyle, marginBottom: 16 }}>{errors.agreed}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStage(2)}
                    style={{ flex: 1, padding: '15px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-lexend, sans-serif)', cursor: 'pointer' }}>
                    BACK
                  </button>
                  <button id="vendor-create-account-btn" type="submit" disabled={loading}
                    style={{ flex: 2, padding: '15px', background: loading ? '#8ba800' : '#c3f400', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'var(--font-lexend, sans-serif)', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                    {loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>}
                    {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Note */}
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#666', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Already a vendor?{' '}
              <Link href="/login" style={{ color: '#c3f400', textDecoration: 'none', fontWeight: 700 }}>Sign in</Link>
            </p>
          </form>
        </div>
      </div>

      <style>{`
        input::placeholder { color: #555; }
        input:focus, select:focus { border-color: rgba(195,244,0,0.5) !important; }
        select option { background: #121212; color: #fff; }
      `}</style>
    </div>
  );
}
