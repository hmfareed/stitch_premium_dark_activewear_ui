'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/context/AppContext';
import Link from 'next/link';

const STORAGE_KEY = 'africart-platform-settings';

interface PlatformSettings {
  appName: string;
  accentColor: string;
  lightLogo: string | null;
  darkLogo: string | null;
  defaultDarkMode: boolean;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  baseCurrency: string;
  taxRate: string;
  gateways: { name: string; status: string; icon: string }[];
  deliveryFee: string;
  freeDeliveryMin: string;
  estimatedDays: string;
  deliveryZones: string;
  enableTracking: boolean;
  features: { name: string; desc: string; active: boolean }[];
}

const defaults: PlatformSettings = {
  appName: 'AfriCart',
  accentColor: '#00E5FF',
  lightLogo: null,
  darkLogo: null,
  defaultDarkMode: true,
  supportEmail: 'support@africart.com',
  supportPhone: '+1 (800) 123-4567',
  maintenanceMode: false,
  baseCurrency: 'GHS (GH₵)',
  taxRate: '8.5',
  gateways: [
    { name: 'Stripe', status: 'Connected', icon: 'credit_card' },
    { name: 'PayPal', status: 'Connected', icon: 'account_balance_wallet' },
    { name: 'Apple Pay', status: 'Disconnected', icon: 'phone_iphone' },
  ],
  deliveryFee: '15.00',
  freeDeliveryMin: '200.00',
  estimatedDays: '3-5',
  deliveryZones: 'Greater Accra, Ashanti, Western, Eastern',
  enableTracking: true,
  features: [
    { name: 'Vendor Registration', desc: 'Allow new vendors to sign up', active: true },
    { name: 'Customer Reviews', desc: 'Enable product reviews and ratings', active: true },
    { name: 'Live Chat', desc: 'Enable real-time customer support chat', active: false },
    { name: 'Guest Checkout', desc: 'Allow purchases without an account', active: true },
    { name: 'Crypto Payments', desc: 'Accept BTC and ETH via Coinbase', active: false },
  ],
};

function loadSettings(): PlatformSettings {
  if (typeof window === 'undefined') return defaults;
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? { ...defaults, ...JSON.parse(s) } : defaults; } catch { return defaults; }
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('branding');
  const [settings, setSettings] = useState<PlatformSettings>(defaults);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#00E5FF');
  const lightLogoRef = useRef<HTMLInputElement>(null);
  const darkLogoRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => { setSettings(loadSettings()); }, []);

  const update = (patch: Partial<PlatformSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
    setHasChanges(true);
  };

  const saveChanges = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      // Apply accent color globally
      document.documentElement.style.setProperty('--lime-400', settings.accentColor);
      localStorage.setItem('africart-accent-color', settings.accentColor);
      setSaving(false);
      setHasChanges(false);
      showToast('Settings saved successfully!');
    }, 600);
  };

  const handleLogoUpload = (type: 'lightLogo' | 'darkLogo') => {
    const ref = type === 'lightLogo' ? lightLogoRef : darkLogoRef;
    ref.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>, type: 'lightLogo' | 'darkLogo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { update({ [type]: ev.target?.result as string }); };
    reader.readAsDataURL(file);
  };

  const toggleFeature = (idx: number) => {
    const updated = [...settings.features];
    updated[idx] = { ...updated[idx], active: !updated[idx].active };
    update({ features: updated });
  };

  const toggleGateway = (idx: number) => {
    const updated = [...settings.gateways];
    updated[idx] = { ...updated[idx], status: updated[idx].status === 'Connected' ? 'Disconnected' : 'Connected' };
    update({ gateways: updated });
  };

  const tabs = [
    { id: 'branding', name: 'Branding & UI', icon: 'palette' },
    { id: 'general', name: 'General', icon: 'settings' },
    { id: 'payment', name: 'Payments', icon: 'payments' },
    { id: 'shipping', name: 'Delivery', icon: 'local_shipping' },
    { id: 'features', name: 'Features', icon: 'toggle_on' },
  ];

  const presetColors = [
    '#00E5FF', // Electric Cyan
    '#A855F7', // Royal Violet
    '#FF9100', // Sunset Orange
    '#6366F1', // Electric Indigo
    '#FB7185', // Rose Pink
    '#14B8A6', // Teal
    '#FBBF24', // Amber Gold
    '#10B981', // Emerald
    '#FF4081', // Pink Accent
    '#C3F400'  // Original Lime
  ];

  const inputStyle: React.CSSProperties = { width: '100%', maxWidth: '400px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.95rem' };

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <div onClick={onToggle} style={{ width: '48px', height: '26px', backgroundColor: on ? settings.accentColor : 'var(--outline-variant)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s', flexShrink: 0 }}>
      <div style={{ width: '22px', height: '22px', backgroundColor: on ? 'black' : 'var(--on-surface-variant)', borderRadius: '50%', position: 'absolute', top: '2px', left: on ? '24px' : '2px', transition: 'left 0.3s, background-color 0.3s' }} />
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Platform Settings</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Configure global platform behavior and appearance</p>
        </div>
        <button onClick={saveChanges} disabled={!hasChanges || saving} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: hasChanges ? settings.accentColor : 'var(--outline-variant)', color: hasChanges ? '#fff' : 'var(--on-surface-variant)', border: 'none', fontWeight: 600, cursor: hasChanges ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', opacity: hasChanges ? 1 : 0.5, transition: 'all 0.3s' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: saving ? 'spin 1s linear infinite' : 'none' }}>{saving ? 'progress_activity' : 'save'}</span>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--outline)' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === tab.id ? 'var(--surface-container-high)' : 'transparent', color: activeTab === tab.id ? settings.accentColor : 'var(--on-surface)', fontWeight: activeTab === tab.id ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}>
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, backgroundColor: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--outline)', minHeight: '500px', minWidth: '300px' }}>

          {/* ── BRANDING ── */}
          {activeTab === 'branding' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Branding & Appearance</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>App Name</label>
                <input type="text" value={settings.appName} onChange={e => update({ appName: e.target.value })} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Accent Color</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {presetColors.map(color => (
                    <button key={color} onClick={() => update({ accentColor: color })} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: color, border: settings.accentColor === color ? '3px solid white' : '2px solid transparent', cursor: 'pointer', outline: 'none', transition: 'transform 0.2s, border 0.2s', transform: settings.accentColor === color ? 'scale(1.15)' : 'scale(1)' }} />
                  ))}
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowColorPicker(!showColorPicker)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', border: !presetColors.includes(settings.accentColor) ? '3px solid white' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '18px' }}>add</span>
                    </button>
                    {showColorPicker && (
                      <div style={{ position: 'absolute', top: '50px', left: '-40px', zIndex: 100, backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: '12px', padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)} style={{ width: '100px', height: '40px', border: 'none', cursor: 'pointer', borderRadius: '8px' }} />
                        <button onClick={() => { update({ accentColor: customColor }); setShowColorPicker(false); }} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: customColor, color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Apply</button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: settings.accentColor }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontFamily: 'monospace' }}>{settings.accentColor}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ fontWeight: 500 }}>Logos</label>
                <input ref={lightLogoRef} type="file" accept="image/*" hidden onChange={e => onFileSelected(e, 'lightLogo')} />
                <input ref={darkLogoRef} type="file" accept="image/*" hidden onChange={e => onFileSelected(e, 'darkLogo')} />
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div onClick={() => handleLogoUpload('lightLogo')} style={{ padding: '24px', border: '1px dashed var(--outline-variant)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '200px', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                    {settings.lightLogo ? <img src={settings.lightLogo} alt="Light Logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} /> : <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--on-surface-variant)' }}>upload_file</span>}
                    <span style={{ fontSize: '0.9rem' }}>{settings.lightLogo ? 'Change Light Logo' : 'Upload Light Logo'}</span>
                    {settings.lightLogo && <button onClick={e => { e.stopPropagation(); update({ lightLogo: null }); }} style={{ fontSize: '0.8rem', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
                  </div>
                  <div onClick={() => handleLogoUpload('darkLogo')} style={{ padding: '24px', border: '1px dashed var(--outline-variant)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '200px', backgroundColor: 'var(--surface-container)', cursor: 'pointer' }}>
                    {settings.darkLogo ? <img src={settings.darkLogo} alt="Dark Logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} /> : <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--on-surface-variant)' }}>upload_file</span>}
                    <span style={{ fontSize: '0.9rem' }}>{settings.darkLogo ? 'Change Dark Logo' : 'Upload Dark Logo'}</span>
                    {settings.darkLogo && <button onClick={e => { e.stopPropagation(); update({ darkLogo: null }); }} style={{ fontSize: '0.8rem', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '8px', border: '1px solid var(--outline)', maxWidth: '400px' }}>
                <div>
                  <span style={{ fontWeight: 500, display: 'block' }}>Default Dark Mode</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Force dark mode for all new users</span>
                </div>
                <Toggle on={settings.defaultDarkMode} onToggle={() => update({ defaultDarkMode: !settings.defaultDarkMode })} />
              </div>
            </div>
          )}

          {/* ── GENERAL ── */}
          {activeTab === 'general' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>General Configuration</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Support Email</label>
                <input type="email" value={settings.supportEmail} onChange={e => update({ supportEmail: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Support Phone Number</label>
                <input type="tel" value={settings.supportPhone} onChange={e => update({ supportPhone: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline)', maxWidth: '400px' }}>
                <div>
                  <span style={{ fontWeight: 500, display: 'block', marginBottom: '4px' }}>Enable Maintenance</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Temporarily disable storefront access</span>
                </div>
                <Toggle on={settings.maintenanceMode} onToggle={() => update({ maintenanceMode: !settings.maintenanceMode })} />
              </div>
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {activeTab === 'payment' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Payment Gateways & Currency</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                  <label style={{ fontWeight: 500 }}>Base Currency</label>
                  <select value={settings.baseCurrency} onChange={e => update({ baseCurrency: e.target.value })} style={{ ...inputStyle, maxWidth: '250px' }}>
                    <option>GHS (GH₵)</option><option>USD ($)</option><option>EUR (€)</option><option>GBP (£)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                  <label style={{ fontWeight: 500 }}>Global Tax Rate (%)</label>
                  <input type="number" value={settings.taxRate} onChange={e => update({ taxRate: e.target.value })} style={{ ...inputStyle, maxWidth: '250px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <label style={{ fontWeight: 500 }}>Active Gateways</label>
                {settings.gateways.map((gw, idx) => (
                  <div key={gw.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline)', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${gw.status === 'Connected' ? settings.accentColor : 'var(--on-surface-variant)'} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: gw.status === 'Connected' ? settings.accentColor : 'var(--on-surface-variant)' }}>{gw.icon}</span>
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '1rem', display: 'block' }}>{gw.name}</span>
                        <span style={{ fontSize: '0.8rem', color: gw.status === 'Connected' ? settings.accentColor : 'var(--on-surface-variant)', fontWeight: 500 }}>{gw.status}</span>
                      </div>
                    </div>
                    <button onClick={() => toggleGateway(idx)} style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: gw.status === 'Connected' ? 'transparent' : `color-mix(in srgb, ${settings.accentColor} 15%, transparent)`, border: `1px solid ${gw.status === 'Connected' ? 'var(--outline-variant)' : settings.accentColor}`, color: gw.status === 'Connected' ? 'var(--on-surface)' : settings.accentColor, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                      {gw.status === 'Connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DELIVERY ── */}
          {activeTab === 'shipping' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Delivery Configuration</h2>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                  <label style={{ fontWeight: 500 }}>Standard Delivery Fee (GH₵)</label>
                  <input type="number" value={settings.deliveryFee} onChange={e => update({ deliveryFee: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
                  <label style={{ fontWeight: 500 }}>Free Delivery Minimum (GH₵)</label>
                  <input type="number" value={settings.freeDeliveryMin} onChange={e => update({ freeDeliveryMin: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Estimated Delivery Time (Days)</label>
                <input type="text" value={settings.estimatedDays} onChange={e => update({ estimatedDays: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Delivery Zones / Regions</label>
                <textarea value={settings.deliveryZones} onChange={e => update({ deliveryZones: e.target.value })} rows={3} style={{ ...inputStyle, maxWidth: '100%', resize: 'vertical' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Comma-separated list of regions you deliver to</span>
                <div style={{ marginTop: '8px' }}>
                  <Link href="/admin/settings/delivery-zones" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${settings.accentColor}`, color: settings.accentColor, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', backgroundColor: `color-mix(in srgb, ${settings.accentColor} 8%, transparent)`, transition: 'all 0.2s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>zone</span>
                    Configure Zone Rates & COD
                  </Link>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline)', maxWidth: '400px' }}>
                <div>
                  <span style={{ fontWeight: 500, display: 'block', marginBottom: '4px' }}>Order Tracking</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Allow customers to track deliveries</span>
                </div>
                <Toggle on={settings.enableTracking} onToggle={() => update({ enableTracking: !settings.enableTracking })} />
              </div>
            </div>
          )}

          {/* ── FEATURES ── */}
          {activeTab === 'features' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Feature Toggles</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {settings.features.map((feature, idx) => (
                  <div key={feature.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
                    <div>
                      <span style={{ fontWeight: 500, display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>{feature.name}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{feature.desc}</span>
                    </div>
                    <Toggle on={feature.active} onToggle={() => toggleFeature(idx)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {hasChanges && (
        <div className="animate-fade-in-up" style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 50 }}>
          <span className="material-symbols-outlined" style={{ color: '#ff9800' }}>warning</span>
          <span style={{ fontSize: '0.9rem' }}>You have unsaved changes</span>
          <button onClick={saveChanges} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: settings.accentColor, color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Now</button>
        </div>
      )}
    </div>
  );
}
