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

export default function RiderRegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [stage, setStage] = useState<1 | 2 | 3>(1);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    licensePlate: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
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
    if (!form.vehicleType) e.vehicleType = 'Select a vehicle type';
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
      setErrors({ agreed: 'You must agree to the Rider Agreement' });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: 'rider',
          vehicleType: form.vehicleType || 'motorcycle',
          vehicleBrand: form.vehicleBrand,
          vehicleModel: form.vehicleModel,
          licensePlate: form.licensePlate,
          emergencyName: form.emergencyName,
          emergencyPhone: form.emergencyPhone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Rider account created! Pending review by Superadmin.', 'success');
        router.push('/login');
      } else {
        showToast(data.error || 'Registration failed', 'error');
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
              <span style={{ color: '#c3f400' }}>CREATE</span> RIDER ACCOUNT
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Deliver more. Earn more.
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
              <span style={{ fontSize: 10, color: stage >= 2 ? '#c3f400' : '#666', fontWeight: 700, fontFamily: 'var(--font-inter, sans-serif)', whiteSpace: 'nowrap' }}>Documents</span>
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
            {/* ── STAGE 1: PERSONAL INFORMATION ── */}
            {stage === 1 && (
              <div>
                {sectionHead('person', 'PERSONAL INFORMATION')}

                {/* Full Name */}
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>person</span>
                    </span>
                    <input id="rider-name" type="text" placeholder="Enter your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} autoComplete="name"
                      style={{ ...inputBase, borderColor: errors.fullName ? '#f87171' : 'rgba(255,255,255,0.12)' }} />
                  </div>
                  {errors.fullName && <p style={errStyle}>{errors.fullName}</p>}
                </div>

                {/* Email Address & Ghana Phone Number Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
                      </span>
                      <input id="rider-email" type="email" placeholder="Enter your email address" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email"
                        style={{ ...inputBase, padding: '12px 10px 12px 32px', borderColor: errors.email ? '#f87171' : 'rgba(255,255,255,0.12)' }} />
                    </div>
                    {errors.email && <p style={errStyle}>{errors.email}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>Ghana Phone Number</label>
                    <div style={{ display: 'flex', borderRadius: 10, border: `1px solid ${errors.phone ? '#f87171' : 'rgba(255,255,255,0.12)'}`, overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 6px', borderRight: '1px solid rgba(255,255,255,0.12)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <span style={{ fontSize: 13 }}>🇬🇭</span>
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>+233</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#888' }}>expand_more</span>
                      </div>
                      <input id="rider-phone" type="tel" placeholder="24 123 4567" value={form.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 12, padding: '12px 6px', fontFamily: 'var(--font-inter, sans-serif)', width: '100%', minWidth: 0 }} />
                    </div>
                    {errors.phone && <p style={errStyle}>{errors.phone}</p>}
                  </div>
                </div>

                {/* Password & Confirm Password Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                      </span>
                      <input id="rider-password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password"
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
                      <input id="rider-confirm-password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} autoComplete="new-password"
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
                  CONTINUE TO DOCUMENTS
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontWeight: 900 }}>arrow_forward</span>
                </button>
              </div>
            )}

            {/* ── STAGE 2: VEHICLE & EMERGENCY CONTACT INFORMATION ── */}
            {stage === 2 && (
              <div>
                {sectionHead('pedal_bike', 'VEHICLE INFORMATION')}

                {/* Vehicle Type & Vehicle Brand Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Vehicle Type</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pedal_bike</span>
                      </span>
                      <select id="rider-vehicle-type" value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}
                        style={{ ...inputBase, padding: '12px 28px 12px 32px', appearance: 'none', cursor: 'pointer', color: form.vehicleType ? '#fff' : '#666', borderColor: errors.vehicleType ? '#f87171' : 'rgba(255,255,255,0.12)' }}>
                        <option value="" disabled>Select vehicle type</option>
                        <option value="motorcycle">Motorcycle</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="tricycle">Tricycle</option>
                        <option value="car">Car</option>
                      </select>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#666', pointerEvents: 'none' }}>expand_more</span>
                    </div>
                    {errors.vehicleType && <p style={errStyle}>{errors.vehicleType}</p>}
                  </div>

                  <div>
                    <label style={labelStyle}>Vehicle Brand</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pedal_bike</span>
                      </span>
                      <input id="rider-vehicle-brand" type="text" placeholder="Enter brand" value={form.vehicleBrand} onChange={e => set('vehicleBrand', e.target.value)}
                        style={{ ...inputBase, padding: '12px 10px 12px 32px' }} />
                    </div>
                  </div>
                </div>

                {/* Model & License Plate Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>Model</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pedal_bike</span>
                      </span>
                      <input id="rider-vehicle-model" type="text" placeholder="Enter model" value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)}
                        style={{ ...inputBase, padding: '12px 10px 12px 32px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>License Plate Number</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>badge</span>
                      </span>
                      <input id="rider-license-plate" type="text" placeholder="Enter license plate" value={form.licensePlate} onChange={e => set('licensePlate', e.target.value)}
                        style={{ ...inputBase, padding: '12px 10px 12px 32px' }} />
                    </div>
                  </div>
                </div>

                {/* EMERGENCY CONTACT SECTION */}
                {sectionHead('call', 'EMERGENCY CONTACT')}

                {/* Contact Person Name & Relationship Side-by-Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={labelStyle}>Contact Person Name</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                      </span>
                      <input id="rider-emergency-name" type="text" placeholder="Enter contact person name" value={form.emergencyName} onChange={e => set('emergencyName', e.target.value)}
                        style={{ ...inputBase, padding: '12px 10px 12px 32px' }} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Relationship</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none', display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
                      </span>
                      <select id="rider-relationship" value={form.emergencyRelationship} onChange={e => set('emergencyRelationship', e.target.value)}
                        style={{ ...inputBase, padding: '12px 28px 12px 32px', appearance: 'none', cursor: 'pointer', color: form.emergencyRelationship ? '#fff' : '#666' }}>
                        <option value="" disabled>Select relationship</option>
                        <option value="parent">Parent</option>
                        <option value="spouse">Spouse</option>
                        <option value="sibling">Sibling</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </select>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#666', pointerEvents: 'none' }}>expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Phone Number */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Contact Phone Number</label>
                  <div style={{ display: 'flex', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', borderRight: '1px solid rgba(255,255,255,0.12)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <span style={{ fontSize: 15 }}>🇬🇭</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, fontFamily: 'var(--font-inter, sans-serif)' }}>+233</span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#888' }}>expand_more</span>
                    </div>
                    <input id="rider-emergency-phone" type="tel" placeholder="24 123 4567" value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, padding: '12px 12px', fontFamily: 'var(--font-inter, sans-serif)' }} />
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
                  <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#c3f400', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-lexend, sans-serif)' }}>Rider Summary Review</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#ccc', fontFamily: 'var(--font-inter, sans-serif)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Full Name:</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{form.fullName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Email / Phone:</span>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{form.email} · +233 {form.phone}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Vehicle:</span>
                      <span style={{ fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{form.vehicleType} {form.vehicleBrand && `(${form.vehicleBrand})`}</span>
                    </div>
                    {form.emergencyName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#888' }}>Emergency Contact:</span>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{form.emergencyName}</span>
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
                    I agree to the Africart <Link href="/terms" style={{ color: '#c3f400', textDecoration: 'none', fontWeight: 600 }}>Rider Agreement</Link> and <Link href="/privacy" style={{ color: '#c3f400', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</Link>
                  </span>
                </label>
                {errors.agreed && <p style={{ ...errStyle, marginBottom: 16 }}>{errors.agreed}</p>}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setStage(2)}
                    style={{ flex: 1, padding: '15px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-lexend, sans-serif)', cursor: 'pointer' }}>
                    BACK
                  </button>
                  <button id="rider-create-account-btn" type="submit" disabled={loading}
                    style={{ flex: 2, padding: '15px', background: loading ? '#8ba800' : '#c3f400', color: '#000', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'var(--font-lexend, sans-serif)', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                    {loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>}
                    {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Note */}
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#666', fontFamily: 'var(--font-inter, sans-serif)' }}>
              Already a rider?{' '}
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
