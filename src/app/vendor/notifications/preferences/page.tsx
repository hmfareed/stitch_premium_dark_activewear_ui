'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorNotificationPreferencesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [preferences, setPreferences] = useState<Record<string, Record<string, boolean>>>({
    'New Orders': { email: true, sms: true, push: true, inApp: true },
    'Payment Receipts & Payouts': { email: true, sms: true, push: true, inApp: true },
    'Low Stock Alerts': { email: true, sms: false, push: true, inApp: true },
    'Customer Product Reviews': { email: false, sms: false, push: true, inApp: true },
    'Customer Direct Messages': { email: true, sms: true, push: true, inApp: true },
    'Subscription Renewal': { email: true, sms: false, push: true, inApp: true },
    'System Announcements': { email: true, sms: false, push: true, inApp: true },
  });

  const [saving, setSaving] = useState(false);

  const togglePref = (category: string, channel: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_preferences',
          preferences,
        }),
      });

      if (res.ok) {
        showToast('Notification channel preferences saved successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Sub Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Notifications Center', path: '/vendor/notifications', active: false, icon: 'notifications' },
          { label: 'Channel Preferences', path: '/vendor/notifications/preferences', active: true, icon: 'settings_suggest' },
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

      {/* Main Preferences Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Notification Channel Preferences
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Choose which channels (Email, SMS, Mobile Push, In-App Bell) send alerts for each notification event type.
            </p>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Preferences Matrix Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
              <th style={{ padding: '12px 10px' }}>Notification Category Event</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>📧 Email</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>📱 SMS Alert</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>🔔 Mobile Push</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>💻 In-App Bell</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(preferences).map(cat => (
              <tr key={cat} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '12px 10px', fontWeight: 800, color: '#0f172a' }}>{cat}</td>
                {['email', 'sms', 'push', 'inApp'].map(channel => (
                  <td key={channel} style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={preferences[cat][channel]}
                      onChange={() => togglePref(cat, channel)}
                      style={{ width: 18, height: 18, accentColor: '#10b981', cursor: 'pointer' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
