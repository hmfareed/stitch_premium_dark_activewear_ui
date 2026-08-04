'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorAppearanceSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [theme, setTheme] = useState('emerald');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          updates: { theme, accentColor },
        }),
      });

      if (res.ok) {
        showToast('Storefront theme & appearance preferences saved!', 'success');
      }
    } catch (err) {
      console.error('Error saving appearance:', err);
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
          { label: 'Business Profile', path: '/vendor/settings/business', active: false, icon: 'storefront' },
          { label: 'Branches', path: '/vendor/settings/branches', active: false, icon: 'store' },
          { label: 'Payments', path: '/vendor/settings/payments', active: false, icon: 'payments' },
          { label: 'Taxes', path: '/vendor/settings/taxes', active: false, icon: 'account_balance' },
          { label: 'Shipping', path: '/vendor/settings/shipping', active: false, icon: 'local_shipping' },
          { label: 'Notifications', path: '/vendor/notifications/preferences', active: false, icon: 'notifications' },
          { label: 'Security', path: '/vendor/settings/security', active: false, icon: 'security' },
          { label: 'Appearance', path: '/vendor/settings/appearance', active: true, icon: 'palette' },
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

      {/* Main Appearance Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Storefront Theme & Branding Appearance
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Select store color themes and custom primary accent colors for online storefront pages.
            </p>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Appearance'}
          </button>
        </div>

        {/* Theme Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div
            onClick={() => setTheme('emerald')}
            style={{
              padding: 20,
              borderRadius: 16,
              border: theme === 'emerald' ? '2px solid #10b981' : '1px solid #e2e8f0',
              backgroundColor: '#061d13',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: '#a3e635' }}>Emerald Premium Dark</div>
            <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>Deep emerald dark mode aesthetics tailored for activewear and premium retail.</p>
          </div>

          <div
            onClick={() => setTheme('light')}
            style={{
              padding: 20,
              borderRadius: 16,
              border: theme === 'light' ? '2px solid #10b981' : '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800 }}>Clean Modern Light</div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Minimalist high-contrast light layout designed for clarity and speed.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
