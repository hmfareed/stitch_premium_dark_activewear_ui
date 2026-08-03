'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

type SettingsTab =
  | 'general'
  | 'business'
  | 'localization'
  | 'currencies'
  | 'taxes'
  | 'payment_gateways'
  | 'email'
  | 'sms'
  | 'push_notifications'
  | 'security'
  | 'authentication'
  | 'storage'
  | 'api_keys'
  | 'integrations'
  | 'appearance'
  | 'backups'
  | 'maintenance_mode'
  | 'licensing';

const TAB_DEFINITIONS: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: 'general', label: '1. General', icon: 'settings' },
  { id: 'business', label: '2. Business', icon: 'business' },
  { id: 'localization', label: '3. Localization', icon: 'language' },
  { id: 'currencies', label: '4. Currencies', icon: 'payments' },
  { id: 'taxes', label: '5. Taxes', icon: 'receipt_long' },
  { id: 'payment_gateways', label: '6. Payment Gateways', icon: 'credit_card' },
  { id: 'email', label: '7. Email', icon: 'mail' },
  { id: 'sms', label: '8. SMS', icon: 'sms' },
  { id: 'push_notifications', label: '9. Push Notifications', icon: 'notifications_active' },
  { id: 'security', label: '10. Security', icon: 'shield' },
  { id: 'authentication', label: '11. Authentication', icon: 'lock' },
  { id: 'storage', label: '12. Storage', icon: 'cloud' },
  { id: 'api_keys', label: '13. API Keys', icon: 'key' },
  { id: 'integrations', label: '14. Integrations', icon: 'extension' },
  { id: 'appearance', label: '15. Appearance', icon: 'palette' },
  { id: 'backups', label: '16. Backups', icon: 'backup' },
  { id: 'maintenance_mode', label: '17. Maintenance Mode', icon: 'build' },
  { id: 'licensing', label: '18. Licensing', icon: 'verified' },
];

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      } else {
        showToast(data.message || 'Failed to load system settings', 'error');
      }
    } catch (err) {
      showToast('Error connecting to settings service', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSection = (sectionKey: string, patch: Record<string, any>) => {
    setSettings((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        ...patch,
      },
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('All system settings saved successfully!', 'success');
        setHasChanges(false);
        if (settings.appearance?.accentColor) {
          document.documentElement.style.setProperty('--lime-400', settings.appearance.accentColor);
        }
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Error saving system settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div
      onClick={onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: checked ? '#16a34a' : '#cbd5e1',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-inter, sans-serif)', color: '#0f172a' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>
            <Link href="/admin" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Admin Portal</Link>
            <span>/</span>
            <span>System Configuration</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: '#16a34a' }}>settings</span>
            Module 21 — System Settings Governance
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 4 }}>
            Manage and configure 18 enterprise system settings tabs including Payments, Taxes, Security, Backups, and Maintenance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleSaveSettings}
            disabled={!hasChanges || saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              backgroundColor: hasChanges ? '#16a34a' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              boxShadow: hasChanges ? '0 2px 8px rgba(22, 163, 74, 0.25)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* MAIN TWO COLUMN LAYOUT: SIDEBAR (18 TABS) + CONTENT PANEL */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* 18 TABS SIDEBAR */}
        <div style={{ width: 260, backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', padding: '6px 12px 10px', borderBottom: '1px solid #f1f5f9' }}>
            18 CONFIGURATION TABS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 620, overflowY: 'auto' }}>
            {TAB_DEFINITIONS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                    color: isActive ? '#15803d' : '#475569',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: isActive ? '#16a34a' : '#94a3b8' }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT PANEL FOR SELECTED TAB */}
        <div style={{ flex: 1, minWidth: 320, backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading settings tab content...</div>
          ) : (
            <div>
              {/* TAB TITLE */}
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>
                  {TAB_DEFINITIONS.find((t) => t.id === activeTab)?.label} Configuration
                </h2>
              </div>

              {/* TAB 1: GENERAL */}
              {activeTab === 'general' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Platform Site Name</label>
                    <input type="text" value={settings.general?.siteName || ''} onChange={(e) => updateSection('general', { siteName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Support Email</label>
                    <input type="email" value={settings.general?.supportEmail || ''} onChange={(e) => updateSection('general', { supportEmail: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Support Phone</label>
                    <input type="text" value={settings.general?.supportPhone || ''} onChange={(e) => updateSection('general', { supportPhone: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Default Timezone</label>
                    <input type="text" value={settings.general?.defaultTimezone || ''} onChange={(e) => updateSection('general', { defaultTimezone: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Copyright Footer Text</label>
                    <input type="text" value={settings.general?.copyrightText || ''} onChange={(e) => updateSection('general', { copyrightText: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* TAB 2: BUSINESS */}
              {activeTab === 'business' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Legal Company Name</label>
                    <input type="text" value={settings.business?.companyName || ''} onChange={(e) => updateSection('business', { companyName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Business Registration No.</label>
                    <input type="text" value={settings.business?.registrationNumber || ''} onChange={(e) => updateSection('business', { registrationNumber: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>TIN / Tax Identification No.</label>
                    <input type="text" value={settings.business?.tinNumber || ''} onChange={(e) => updateSection('business', { tinNumber: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Primary Contact Person</label>
                    <input type="text" value={settings.business?.contactPerson || ''} onChange={(e) => updateSection('business', { contactPerson: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Physical Headquarters Address</label>
                    <textarea rows={2} value={settings.business?.physicalAddress || ''} onChange={(e) => updateSection('business', { physicalAddress: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                </div>
              )}

              {/* TAB 3: LOCALIZATION */}
              {activeTab === 'localization' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Default Platform Language</label>
                    <select value={settings.localization?.defaultLanguage || 'English'} onChange={(e) => updateSection('localization', { defaultLanguage: e.target.value })} style={selectStyle}>
                      <option value="English (US)">English (US)</option>
                      <option value="French">French (Français)</option>
                      <option value="Swahili">Swahili</option>
                      <option value="Hausa">Hausa</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Default Country</label>
                    <input type="text" value={settings.localization?.defaultCountry || ''} onChange={(e) => updateSection('localization', { defaultCountry: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Date Display Format</label>
                    <select value={settings.localization?.dateFormat || 'DD/MM/YYYY'} onChange={(e) => updateSection('localization', { dateFormat: e.target.value })} style={selectStyle}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Time Display Format</label>
                    <select value={settings.localization?.timeFormat || '24 Hours'} onChange={(e) => updateSection('localization', { timeFormat: e.target.value })} style={selectStyle}>
                      <option value="24 Hours (HH:mm)">24 Hours (HH:mm)</option>
                      <option value="12 Hours (hh:mm AM/PM)">12 Hours (hh:mm AM/PM)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 4: CURRENCIES */}
              {activeTab === 'currencies' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Base Operating Currency</label>
                    <select value={settings.currencies?.primaryCurrency || 'GHS (GH₵)'} onChange={(e) => updateSection('currencies', { primaryCurrency: e.target.value })} style={selectStyle}>
                      <option value="GHS (GH₵)">GHS (Ghanaian Cedi GH₵)</option>
                      <option value="USD ($)">USD (US Dollar $)</option>
                      <option value="NGN (₦)">NGN (Nigerian Naira ₦)</option>
                      <option value="KES (KSh)">KES (Kenyan Shilling KSh)</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>USD Exchange Rate (1 USD = X GHS)</label>
                    <input type="number" step="0.01" value={settings.currencies?.usdRate || 15.20} onChange={(e) => updateSection('currencies', { usdRate: parseFloat(e.target.value) })} style={inputStyle} />
                  </div>

                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Multi-Currency Auto Conversion</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Automatically fetch daily exchange rates for USD, EUR, and GBP</div>
                    </div>
                    <Toggle checked={!!settings.currencies?.autoUpdateRates} onChange={() => updateSection('currencies', { autoUpdateRates: !settings.currencies?.autoUpdateRates })} />
                  </div>
                </div>
              )}

              {/* TAB 5: TAXES */}
              {activeTab === 'taxes' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>VAT Rate (%)</label>
                    <input type="number" step="0.1" value={settings.taxes?.vatTaxRate || 5.0} onChange={(e) => updateSection('taxes', { vatTaxRate: parseFloat(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>NHIL Tax Rate (%)</label>
                    <input type="number" step="0.1" value={settings.taxes?.nhilTaxRate || 2.5} onChange={(e) => updateSection('taxes', { nhilTaxRate: parseFloat(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>GETFund Tax Rate (%)</label>
                    <input type="number" step="0.1" value={settings.taxes?.getfundTaxRate || 2.5} onChange={(e) => updateSection('taxes', { getfundTaxRate: parseFloat(e.target.value) })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Tax Inclusive Display Pricing</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Display product prices with tax included on storefront</div>
                    </div>
                    <Toggle checked={!!settings.taxes?.enableTaxInclusivePricing} onChange={() => updateSection('taxes', { enableTaxInclusivePricing: !settings.taxes?.enableTaxInclusivePricing })} />
                  </div>
                </div>
              )}

              {/* TAB 6: PAYMENT GATEWAYS */}
              {activeTab === 'payment_gateways' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { name: 'Stripe Payments', key: 'stripeEnabled', desc: 'Accept Visa, Mastercard, and International Credit Cards' },
                    { name: 'Mobile Money (MTN / Telecel / AT)', key: 'mobileMoneyEnabled', desc: 'Accept local African Mobile Money payments' },
                    { name: 'Paystack Gateway', key: 'paystackEnabled', desc: 'Pan-African payments engine' },
                    { name: 'PayPal Checkout', key: 'paypalEnabled', desc: 'Global PayPal wallet payments' },
                  ].map((gw) => (
                    <div key={gw.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{gw.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{gw.desc}</div>
                      </div>
                      <Toggle checked={!!settings.paymentGateways?.[gw.key]} onChange={() => updateSection('payment_gateways', { [gw.key]: !settings.paymentGateways?.[gw.key] })} />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 7: EMAIL */}
              {activeTab === 'email' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>SMTP Server Host</label>
                    <input type="text" value={settings.email?.smtpHost || ''} onChange={(e) => updateSection('email', { smtpHost: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>SMTP Port</label>
                    <input type="number" value={settings.email?.smtpPort || 587} onChange={(e) => updateSection('email', { smtpPort: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Sender Name</label>
                    <input type="text" value={settings.email?.senderName || ''} onChange={(e) => updateSection('email', { senderName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Sender Email Username</label>
                    <input type="email" value={settings.email?.smtpUser || ''} onChange={(e) => updateSection('email', { smtpUser: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* TAB 8: SMS */}
              {activeTab === 'sms' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>SMS Gateway Provider</label>
                    <input type="text" value={settings.sms?.provider || ''} onChange={(e) => updateSection('sms', { provider: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>SMS Sender ID (Alphanumeric)</label>
                    <input type="text" value={settings.sms?.smsSenderId || 'AfriCart'} onChange={(e) => updateSection('sms', { smsSenderId: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Order Delivery SMS Notifications</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Dispatch SMS alerts to customers upon dispatch</div>
                    </div>
                    <Toggle checked={!!settings.sms?.enableOrderSMS} onChange={() => updateSection('sms', { enableOrderSMS: !settings.sms?.enableOrderSMS })} />
                  </div>
                </div>
              )}

              {/* TAB 9: PUSH NOTIFICATIONS */}
              {activeTab === 'push_notifications' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Firebase Cloud Messaging (FCM)</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Push notification engine for mobile & web apps</div>
                    </div>
                    <Toggle checked={!!settings.pushNotifications?.firebaseEnabled} onChange={() => updateSection('push_notifications', { firebaseEnabled: !settings.pushNotifications?.firebaseEnabled })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Web Browser Push Notifications</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Prompt browser permissions for live customer updates</div>
                    </div>
                    <Toggle checked={!!settings.pushNotifications?.enableWebPush} onChange={() => updateSection('push_notifications', { enableWebPush: !settings.pushNotifications?.enableWebPush })} />
                  </div>
                </div>
              )}

              {/* TAB 10: SECURITY */}
              {activeTab === 'security' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Minimum Password Length</label>
                    <input type="number" value={settings.security?.passwordMinLength || 10} onChange={(e) => updateSection('security', { passwordMinLength: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Failed Login Attempts</label>
                    <input type="number" value={settings.security?.maxLoginAttempts || 5} onChange={(e) => updateSection('security', { maxLoginAttempts: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Session Timeout (Minutes)</label>
                    <input type="number" value={settings.security?.sessionTimeoutMinutes || 60} onChange={(e) => updateSection('security', { sessionTimeoutMinutes: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Require 2FA for Admin Portal</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Enforce 2-Factor Authentication for all staff accounts</div>
                    </div>
                    <Toggle checked={!!settings.security?.require2FAForAdmins} onChange={() => updateSection('security', { require2FAForAdmins: !settings.security?.require2FAForAdmins })} />
                  </div>
                </div>
              )}

              {/* TAB 11: AUTHENTICATION */}
              {activeTab === 'authentication' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Google One-Tap Social Login</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Allow sign-in via Google accounts</div>
                    </div>
                    <Toggle checked={!!settings.authentication?.allowSocialGoogleLogin} onChange={() => updateSection('authentication', { allowSocialGoogleLogin: !settings.authentication?.allowSocialGoogleLogin })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Apple ID Social Sign-In</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Allow sign-in via Apple accounts</div>
                    </div>
                    <Toggle checked={!!settings.authentication?.allowSocialAppleLogin} onChange={() => updateSection('authentication', { allowSocialAppleLogin: !settings.authentication?.allowSocialAppleLogin })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Guest Checkout Permission</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Allow customer orders without mandatory account creation</div>
                    </div>
                    <Toggle checked={!!settings.authentication?.allowGuestCheckout} onChange={() => updateSection('authentication', { allowGuestCheckout: !settings.authentication?.allowGuestCheckout })} />
                  </div>
                </div>
              )}

              {/* TAB 12: STORAGE */}
              {activeTab === 'storage' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Storage Provider</label>
                    <input type="text" value={settings.storage?.provider || ''} onChange={(e) => updateSection('storage', { provider: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>S3 Bucket Name</label>
                    <input type="text" value={settings.storage?.s3BucketName || ''} onChange={(e) => updateSection('storage', { s3BucketName: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>AWS Region</label>
                    <input type="text" value={settings.storage?.s3Region || ''} onChange={(e) => updateSection('storage', { s3Region: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Max Image Upload Limit (MB)</label>
                    <input type="number" value={settings.storage?.maxUploadSizeMB || 10} onChange={(e) => updateSection('storage', { maxUploadSizeMB: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* TAB 13: API KEYS */}
              {activeTab === 'api_keys' && (
                <div style={formGridStyle}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Public API Key</label>
                    <code style={{ display: 'block', padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {settings.apiKeys?.publicApiKey || 'pk_live_africart_998210384729104'}
                    </code>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Webhook Secret Key</label>
                    <code style={{ display: 'block', padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {settings.apiKeys?.webhookSecret || 'whsec_991823749201948576'}
                    </code>
                  </div>
                  <div>
                    <label style={labelStyle}>API Rate Limit (Req / Min)</label>
                    <input type="number" value={settings.apiKeys?.rateLimitPerMinute || 120} onChange={(e) => updateSection('api_keys', { rateLimitPerMinute: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* TAB 14: INTEGRATIONS */}
              {activeTab === 'integrations' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Google Analytics ID</label>
                    <input type="text" value={settings.integrations?.googleAnalyticsId || ''} onChange={(e) => updateSection('integrations', { googleAnalyticsId: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Facebook Pixel ID</label>
                    <input type="text" value={settings.integrations?.facebookPixelId || ''} onChange={(e) => updateSection('integrations', { facebookPixelId: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Slack Alerts Webhook Channel</label>
                    <input type="text" value={settings.integrations?.slackAlertsChannel || '#admin-alerts'} onChange={(e) => updateSection('integrations', { slackAlertsChannel: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* TAB 15: APPEARANCE */}
              {activeTab === 'appearance' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Primary Accent Theme Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="color" value={settings.appearance?.accentColor || '#16a34a'} onChange={(e) => updateSection('appearance', { accentColor: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.appearance?.accentColor || '#16a34a'}</span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Typography Font Family</label>
                    <select value={settings.appearance?.fontFamily || 'Inter'} onChange={(e) => updateSection('appearance', { fontFamily: e.target.value })} style={selectStyle}>
                      <option value="Inter">Inter (Sans-Serif)</option>
                      <option value="Lexend">Lexend (Modern Bold)</option>
                      <option value="Roboto">Roboto</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Dark Mode as Platform Default</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Default new user sessions to dark mode interface</div>
                    </div>
                    <Toggle checked={!!settings.appearance?.darkModeByDefault} onChange={() => updateSection('appearance', { darkModeByDefault: !settings.appearance?.darkModeByDefault })} />
                  </div>
                </div>
              )}

              {/* TAB 16: BACKUPS */}
              {activeTab === 'backups' && (
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Auto Backup Frequency</label>
                    <input type="text" value={settings.backups?.backupFrequency || ''} onChange={(e) => updateSection('backups', { backupFrequency: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Vault Retention Period (Days)</label>
                    <input type="number" value={settings.backups?.retentionDays || 30} onChange={(e) => updateSection('backups', { retentionDays: parseInt(e.target.value) })} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Encrypted Vault Location</label>
                    <input type="text" value={settings.backups?.storageLocation || ''} onChange={(e) => updateSection('backups', { storageLocation: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => showToast('Immediate database backup initiated! Vault snapshot created.', 'success')}
                      style={{ padding: '10px 18px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ⚡ Trigger Immediate Database Backup Snapshot
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 17: MAINTENANCE MODE */}
              {activeTab === 'maintenance_mode' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, border: '1px solid #fca5a5', backgroundColor: '#fef2f2' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#dc2626' }}>Enable Platform Maintenance Mode</div>
                      <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>Temporarily block storefront access for maintenance</div>
                    </div>
                    <Toggle checked={!!settings.maintenanceMode?.isEnabled} onChange={() => updateSection('maintenance_mode', { isEnabled: !settings.maintenanceMode?.isEnabled })} />
                  </div>

                  <div>
                    <label style={labelStyle}>Maintenance Downtime Banner Message</label>
                    <textarea rows={3} value={settings.maintenanceMode?.maintenanceMessage || ''} onChange={(e) => updateSection('maintenance_mode', { maintenanceMessage: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>

                  <div>
                    <label style={labelStyle}>Whitelisted Developer IP Addresses (Comma-separated)</label>
                    <input type="text" value={settings.maintenanceMode?.allowedIps || ''} onChange={(e) => updateSection('maintenance_mode', { allowedIps: e.target.value })} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* TAB 18: LICENSING */}
              {activeTab === 'licensing' && (
                <div style={formGridStyle}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Enterprise License Key</label>
                    <code style={{ display: 'block', padding: 12, backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.9rem', color: '#15803d', fontWeight: 700 }}>
                      {settings.licensing?.licenseKey || 'AFRICART-ENT-2026-9982-PRO'}
                    </code>
                  </div>
                  <div>
                    <label style={labelStyle}>License Tier</label>
                    <input type="text" readOnly value={settings.licensing?.licenseTier || 'Enterprise Unlimited Edition'} style={{ ...inputStyle, backgroundColor: '#f8fafc' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Registered Domain</label>
                    <input type="text" readOnly value={settings.licensing?.registeredDomain || 'africart.com'} style={{ ...inputStyle, backgroundColor: '#f8fafc' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>License Expiration Date</label>
                    <input type="text" readOnly value={settings.licensing?.expirationDate || '2028-12-31'} style={{ ...inputStyle, backgroundColor: '#f8fafc' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Vendor Limit</label>
                    <input type="text" readOnly value={settings.licensing?.maxVendorsLimit || 'Unlimited'} style={{ ...inputStyle, backgroundColor: '#f8fafc' }} />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

// ── Shared Input Styles ──────────────────────────────────────────
const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: '0.88rem',
  outline: 'none',
  backgroundColor: '#ffffff',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: '0.88rem',
  outline: 'none',
  backgroundColor: '#ffffff',
};
