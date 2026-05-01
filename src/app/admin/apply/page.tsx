'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Vendor Admin' as string, storeName: '', reason: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    const apps = JSON.parse(localStorage.getItem('reed-admin-applications') || '[]');
    apps.push({
      id: `APP-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      storeName: form.role === 'Vendor Admin' ? form.storeName.trim() : undefined,
      reason: form.reason.trim(),
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0],
    });
    localStorage.setItem('reed-admin-applications', JSON.stringify(apps));
    setLoading(false);
    setSubmitted(true);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '10px',
    border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)',
    color: 'var(--on-surface)', fontSize: '0.95rem', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-lexend)', fontSize: '0.8rem', fontWeight: 700,
    color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '8px', display: 'block',
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--background)' }}>
        <div className="animate-fade-in-up" style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'black' }}>check</span>
          </div>
          <h1 className="font-lexend" style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Application Submitted!</h1>
          <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '32px' }}>
            Your application to become a <strong>{form.role}</strong> has been submitted. The Super Admin will review your application and you&apos;ll be notified once approved.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: '10px', backgroundColor: 'var(--lime-400)', color: 'black', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-lexend)', fontSize: '0.9rem' }}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--background)' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--lime-400), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'black' }}>shield_person</span>
          </div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Apply for Admin Access</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Submit your application to become an admin or vendor on REED Store</p>
        </div>

        <form onSubmit={handleSubmit} style={{ backgroundColor: 'var(--surface)', padding: '32px', borderRadius: '20px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="050 000 0000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Role You&apos;re Applying For</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="Vendor Admin">Vendor Admin — Sell products on the platform</option>
              <option value="Support Admin">Support Admin — Handle customer support</option>
              <option value="Finance Admin">Finance Admin — Manage financial reports</option>
            </select>
          </div>
          {form.role === 'Vendor Admin' && (
            <div className="animate-fade-in">
              <label style={labelStyle}>Store Name</label>
              <input required value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} placeholder="Your store name" style={inputStyle} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Why should you be approved?</label>
            <textarea required value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Tell us about your experience and why you'd be a great addition..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '16px', borderRadius: '10px', backgroundColor: loading ? 'var(--surface-container-high)' : 'var(--lime-400)', color: loading ? 'var(--on-surface-variant)' : 'black', border: 'none', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
            {loading ? 'Submitting...' : (
              <><span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>Submit Application</>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
            Already have access? <Link href="/admin" style={{ color: 'var(--lime-400)', fontWeight: 600 }}>Go to Admin Panel</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
