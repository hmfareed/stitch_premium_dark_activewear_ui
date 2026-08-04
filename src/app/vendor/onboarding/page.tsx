'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';
import VendorOnboardingProgress from '@/components/VendorOnboardingProgress';

export default function BusinessInfoStepPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200');
  const [category, setCategory] = useState('Fashion & Activewear');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Accra');
  const [region, setRegion] = useState('Greater Accra');
  const [businessType, setBusinessType] = useState('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if ((user as any).storeName && !name) setName((user as any).storeName);
      if (user.phone && !phone) setPhone(user.phone);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Business name is required'); return; }
    if (!phone.trim()) { setError('Contact phone number is required'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/vendor/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo,
          banner,
          category,
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim() || 'Accra, Ghana',
          city,
          region,
          businessType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save business info');

      showToast('Business information saved! Moving to Step 2.', 'success');
      router.push('/vendor/onboarding/verification');
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#061d13', color: '#ffffff', fontFamily: 'var(--font-inter, sans-serif)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Progress Header Step Bar */}
        <VendorOnboardingProgress currentStep={1} />

        <div style={{
          backgroundColor: '#0a291b',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Step 1: Business Information
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, margin: 0 }}>
              Configure your store branding, category, and official contact details.
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Business Name & Slug */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Business / Store Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Mart Activewear"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Store URL Slug</label>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '0 12px' }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>africart.com/store/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="fresh-mart"
                    style={{ width: '100%', padding: '12px 0 12px 4px', backgroundColor: 'transparent', border: 'none', color: '#a3e635', fontSize: 13, outline: 'none', fontWeight: 700 }}
                  />
                </div>
              </div>
            </div>

            {/* Logo & Banner Preview Picker */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Store Logo URL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '2px solid #10b981', flexShrink: 0, backgroundColor: '#061d13' }}>
                    <Image src={logo} alt="Logo Preview" fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                  <input
                    type="text"
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    placeholder="Image URL"
                    style={{ flex: 1, padding: '10px', borderRadius: 8, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Store Banner Image URL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, height: 44, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0, backgroundColor: '#061d13' }}>
                    <Image src={banner} alt="Banner Preview" fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                  <input
                    type="text"
                    value={banner}
                    onChange={e => setBanner(e.target.value)}
                    placeholder="Banner Image URL"
                    style={{ flex: 1, padding: '10px', borderRadius: 8, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Category & Business Structure */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Industry Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Fashion & Activewear">Fashion & Activewear</option>
                  <option value="Electronics & Tech">Electronics & Tech</option>
                  <option value="Groceries & Food">Groceries & Food</option>
                  <option value="Beauty & Health">Beauty & Health</option>
                  <option value="Home & Living">Home & Living</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Business Entity Type</label>
                <select
                  value={businessType}
                  onChange={e => setBusinessType(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="individual">Sole Proprietorship / Individual</option>
                  <option value="company">Registered Limited Liability Company (LLC)</option>
                  <option value="partnership">Partnership Business</option>
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Official Store Phone *</label>
                <input
                  type="text"
                  placeholder="+233 24 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Official Store Email</label>
                <input
                  type="email"
                  placeholder="contact@store.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Physical Address */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Physical Store Address</label>
                <input
                  type="text"
                  placeholder="Street Name, House / Suite No."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>City</label>
                <input
                  type="text"
                  placeholder="Accra"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Region</label>
                <input
                  type="text"
                  placeholder="Greater Accra"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, backgroundColor: '#061d13', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-lexend, sans-serif)',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{loading ? 'SAVING...' : 'NEXT: BUSINESS VERIFICATION'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
