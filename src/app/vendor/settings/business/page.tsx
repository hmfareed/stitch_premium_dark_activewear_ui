'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorBusinessSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [tinNumber, setTinNumber] = useState('');
  const [regNumber, setRegNumber] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        const s = data.settings;
        setLogoUrl(s.logoUrl || '');
        setBannerUrl(s.bannerUrl || '');
        setTinNumber(s.tinNumber || '');
        setRegNumber(s.regNumber || '');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          updates: { logoUrl, bannerUrl, tinNumber, regNumber },
        }),
      });

      if (res.ok) {
        showToast('Business profile & branding saved!', 'success');
      }
    } catch (err) {
      console.error('Error saving business profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 16 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'General', path: '/vendor/settings', active: false, icon: 'settings' },
          { label: 'Business Profile', path: '/vendor/settings/business', active: true, icon: 'storefront' },
          { label: 'Branches', path: '/vendor/settings/branches', active: false, icon: 'store' },
          { label: 'Payments', path: '/vendor/settings/payments', active: false, icon: 'payments' },
          { label: 'Taxes', path: '/vendor/settings/taxes', active: false, icon: 'account_balance' },
          { label: 'Shipping', path: '/vendor/settings/shipping', active: false, icon: 'local_shipping' },
          { label: 'Notifications', path: '/vendor/notifications/preferences', active: false, icon: 'notifications' },
          { label: 'Security', path: '/vendor/settings/security', active: false, icon: 'security' },
          { label: 'Appearance', path: '/vendor/settings/appearance', active: false, icon: 'palette' },
          { label: 'Integrations', path: '/vendor/settings/integrations', active: false, icon: 'extension' },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#ffffff' : '#475569',
              backgroundColor: tab.active ? '#10b981' : '#ffffff',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Business Profile Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Business Profile & Store Logo Branding
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Upload store logos, hero banners, and maintain statutory TIN registration details.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading profile...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Logo & Banner Previews */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Business Logo URL</label>
                <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 8 }} />
                {logoUrl && (
                  <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <Image src={logoUrl} alt="Store Logo" fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Store Hero Banner Image URL</label>
                <input type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 8 }} />
                {bannerUrl && (
                  <div style={{ position: 'relative', width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <Image src={bannerUrl} alt="Store Banner" fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Legal Identification */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Ghana Tax Identification Number (TIN)</label>
                <input type="text" value={tinNumber} onChange={e => setTinNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Business Registration Certificate No.</label>
                <input type="text" value={regNumber} onChange={e => setRegNumber(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Business Profile'}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
