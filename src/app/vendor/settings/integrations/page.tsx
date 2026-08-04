'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorIntegrationsSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [whatsappNumber, setWhatsappNumber] = useState('+233241234567');
  const [enableThermalPrinter, setEnableThermalPrinter] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_settings',
          updates: { whatsappNumber, enableThermalPrinter },
        }),
      });

      if (res.ok) {
        showToast('Third-party integrations updated!', 'success');
      }
    } catch (err) {
      console.error('Error saving integrations:', err);
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
          { label: 'Appearance', path: '/vendor/settings/appearance', active: false, icon: 'palette' },
          { label: 'Integrations', path: '/vendor/settings/integrations', active: true, icon: 'extension' },
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

      {/* Main Integrations Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Third-Party Integrations & App Connectors
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Connect WhatsApp Chat Order notifications, POS thermal receipt printers, and webhook listeners.
            </p>
          </div>

          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            {saving ? 'Saving...' : 'Save Integrations'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>💬 WhatsApp Direct Chat & Order Dispatch</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Allow buyers to initiate direct WhatsApp customer support chats</div>
              <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, width: 260 }} />
            </div>

            <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6, backgroundColor: '#dcfce7', color: '#16a34a' }}>CONNECTED</span>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: 18, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>🖨️ POS 80mm Thermal Receipt Printer Driver</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Enable auto-print popup dialogs for thermal receipt printers after POS checkout</div>
            </div>

            <input
              type="checkbox"
              checked={enableThermalPrinter}
              onChange={e => setEnableThermalPrinter(e.target.checked)}
              style={{ width: 22, height: 22, accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
