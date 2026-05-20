'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AdminApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Vendor' as string, storeName: '', reason: '', documentUrl: '' });

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1024; // slightly larger for documents
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height = Math.round((height * MAX_SIZE) / width); width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width = Math.round((width * MAX_SIZE) / height); height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/webp', 0.85);
            setForm(prev => ({ ...prev, documentUrl: compressed }));
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/vendor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application');
      
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
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
            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--on-lime-400)' }}>check</span>
          </div>
          <h1 className="font-lexend" style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Application Submitted!</h1>
          <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '32px' }}>
            Your application to become a <strong>{form.role}</strong> has been submitted. The Super Admin will review your application and you&apos;ll be notified once approved.
          </p>
          <Link href="/" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: '10px', backgroundColor: 'var(--lime-400)', color: 'var(--on-lime-400)', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-lexend)', fontSize: '0.9rem' }}>
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
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--on-lime-400)' }}>shield_person</span>
          </div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Become a Vendor</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Submit your application to become a vendor on AfriCart</p>
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
              <option value="Vendor">Vendor — Sell products on the platform</option>
              <option value="Support Admin">Support Admin — Handle customer support</option>
              <option value="Finance Admin">Finance Admin — Manage financial reports</option>
            </select>
          </div>
          {form.role === 'Vendor' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Store Name</label>
                <input required value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} placeholder="Your store name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Business Verification Document (ID or Registration)</label>
                {form.documentUrl ? (
                  <div style={{ position: 'relative', width: '100%', height: '120px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--outline)' }}>
                    <img src={form.documentUrl} alt="Document Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                    <button type="button" onClick={() => setForm({ ...form, documentUrl: '' })} style={{ position: 'absolute', top: 8, right: 8, background: 'var(--error)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>Document Uploaded</div>
                  </div>
                ) : (
                  <label style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--lime-400)', borderStyle: 'dashed' }}>
                    <span className="material-symbols-outlined">upload_file</span>
                    Upload Image Document
                    <input type="file" accept="image/*" onChange={handleDocumentUpload} style={{ display: 'none' }} required />
                  </label>
                )}
              </div>
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
            Already have access? <Link href="/login" style={{ color: 'var(--lime-400)', fontWeight: 600 }}>Go to Dashboard</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
