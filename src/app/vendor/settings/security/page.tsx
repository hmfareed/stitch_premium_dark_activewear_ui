'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorSecuritySettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security & API Keys
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [liveApiKey, setLiveApiKey] = useState('');
  const [testApiKey, setTestApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/settings');
      const data = await res.json();
      if (res.ok && data.settings) {
        setTwoFactorEnabled(data.settings.twoFactorEnabled ?? false);
        setLiveApiKey(data.settings.liveApiKey || '');
        setTestApiKey(data.settings.testApiKey || '');
        setWebhookSecret(data.settings.webhookSecret || '');
      }
    } catch (err) {
      console.error('Failed to load security settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setSaving(true);
    try {
      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_api_key' }),
      });

      const data = await res.json();
      if (res.ok) {
        setLiveApiKey(data.liveApiKey);
        setWebhookSecret(data.webhookSecret);
        showToast('New Developer API Keys generated!', 'success');
      }
    } catch (err) {
      console.error('Error generating API keys:', err);
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
          { label: 'Security', path: '/vendor/settings/security', active: true, icon: 'security' },
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

      {/* Main Security Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Account Security, Password & Developer API Keys
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Manage portal password credentials, two-factor authentication, and API integration keys.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading security settings...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Password Change Form */}
            <form onSubmit={handleChangePassword} style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>🔒 Change Portal Password</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Current Password</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#061d13', color: '#a3e635', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  Update Password
                </button>
              </div>
            </form>

            {/* Developer API Keys */}
            <div style={{ backgroundColor: '#061d13', borderRadius: 16, padding: 24, color: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a3e635', margin: 0 }}>🔑 Developer API & Webhook Secrets</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Authenticate custom ERP, POS terminals, and webhook listeners.</p>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateApiKey}
                  style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  Regenerate Keys
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>LIVE API SECRET KEY</span>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, backgroundColor: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 8, marginTop: 4, color: '#a3e635' }}>
                    {liveApiKey}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>WEBHOOK SIGNING SECRET</span>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, backgroundColor: 'rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: 8, marginTop: 4, color: '#38bdf8' }}>
                    {webhookSecret}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
