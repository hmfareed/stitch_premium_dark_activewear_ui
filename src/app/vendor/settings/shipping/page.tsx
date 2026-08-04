'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorShippingSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [standardDeliveryFee, setStandardDeliveryFee] = useState('25.00');
  const [expressDeliveryFee, setExpressDeliveryFee] = useState('50.00');
  const [enableStorePickup, setEnableStorePickup] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setStandardDeliveryFee(String(data.settings.standardDeliveryFee || 25.00));
        setExpressDeliveryFee(String(data.settings.expressDeliveryFee || 50.00));
        setEnableStorePickup(data.settings.enableStorePickup ?? true);
      }
    } catch (err) {
      console.error('Failed to load shipping settings:', err);
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
          updates: {
            standardDeliveryFee: Number(standardDeliveryFee),
            expressDeliveryFee: Number(expressDeliveryFee),
            enableStorePickup,
          },
        }),
      });

      if (res.ok) {
        showToast('Shipping methods & delivery rates saved!', 'success');
      }
    } catch (err) {
      console.error('Error saving shipping settings:', err);
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
          { label: 'Shipping', path: '/vendor/settings/shipping', active: true, icon: 'local_shipping' },
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

      {/* Main Shipping Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Shipping Methods & Logistics Delivery Rates
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Configure default delivery rates, same-day express fees, and store pickup options.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading shipping settings...</div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Standard Door Delivery Fee (GH₵)</label>
                <input type="number" step="0.01" value={standardDeliveryFee} onChange={e => setStandardDeliveryFee(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Express Same-Day Delivery Fee (GH₵)</label>
                <input type="number" step="0.01" value={expressDeliveryFee} onChange={e => setExpressDeliveryFee(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Enable In-Store Self-Pickup</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Allow customers to pick up orders directly at branch locations for FREE</div>
              </div>

              <input
                type="checkbox"
                checked={enableStorePickup}
                onChange={e => setEnableStorePickup(e.target.checked)}
                style={{ width: 22, height: 22, accentColor: '#10b981', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button type="submit" disabled={saving} style={{ padding: '10px 24px', borderRadius: 10, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Save Shipping Settings'}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
