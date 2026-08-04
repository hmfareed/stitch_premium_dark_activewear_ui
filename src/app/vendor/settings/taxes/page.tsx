'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorTaxSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enableVat, setEnableVat] = useState(true);
  const [customTaxRate, setCustomTaxRate] = useState('0');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setEnableVat(data.settings.enableVat ?? true);
        setCustomTaxRate(String(data.settings.customTaxRate || 0));
      }
    } catch (err) {
      console.error('Failed to load tax settings:', err);
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
          updates: { enableVat, customTaxRate: Number(customTaxRate) },
        }),
      });

      if (res.ok) {
        showToast('Tax rates & GRA settings updated!', 'success');
      }
    } catch (err) {
      console.error('Error saving tax settings:', err);
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
          { label: 'Taxes', path: '/vendor/settings/taxes', active: true, icon: 'account_balance' },
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

      {/* Main Tax Settings Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Tax Rates & Ghana GRA VAT Compliance Rules
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Enable statutory VAT, NHIL, GETFund tax levies or define custom tax rules for checkout.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading tax settings...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Statutory GRA Standard Rate VAT Withholding</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Automatically apply 15% VAT + 2.5% NHIL + 2.5% GETFund + 1% COVID Levy at checkout</div>
              </div>

              <input
                type="checkbox"
                checked={enableVat}
                onChange={e => setEnableVat(e.target.checked)}
                style={{ width: 22, height: 22, accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Custom Tax Rate (%) (Optional)</label>
              <input type="number" step="0.1" value={customTaxRate} onChange={e => setCustomTaxRate(e.target.value)} placeholder="0.0" style={{ width: '100%', maxWidth: 300, padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Tax Rates'}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
