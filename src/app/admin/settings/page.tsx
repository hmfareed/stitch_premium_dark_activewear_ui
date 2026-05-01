'use client';

import React, { useState } from 'react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('branding');

  const tabs = [
    { id: 'branding', name: 'Branding & UI', icon: 'palette' },
    { id: 'general', name: 'General', icon: 'settings' },
    { id: 'payment', name: 'Payments', icon: 'payments' },
    { id: 'shipping', name: 'Delivery', icon: 'local_shipping' },
    { id: 'integrations', name: 'Integrations', icon: 'extension' },
    { id: 'features', name: 'Features', icon: 'toggle_on' },
  ];

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Platform Settings</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Configure global platform behavior and appearance</p>
        </div>
        <button style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'var(--on-primary-container)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
          Save Changes
        </button>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '16px', border: '1px solid var(--outline)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--surface-container-high)' : 'transparent',
                color: activeTab === tab.id ? 'var(--lime-400)' : 'var(--on-surface)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, backgroundColor: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--outline)', minHeight: '500px' }}>
          {activeTab === 'branding' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Branding & Appearance</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>App Name</label>
                <input type="text" defaultValue="REED STORE" style={{ width: '100%', maxWidth: '400px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Accent Color</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {['#c3f400', '#00e5ff', '#ff5e07', '#ff4081', '#7c4dff'].map(color => (
                    <button key={color} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: color, border: color === '#c3f400' ? '3px solid white' : 'none', cursor: 'pointer', outline: 'none' }}></button>
                  ))}
                  <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '18px' }}>add</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ fontWeight: 500 }}>Logos</label>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ padding: '24px', border: '1px dashed var(--outline-variant)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '200px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--on-surface-variant)' }}>upload_file</span>
                    <span style={{ fontSize: '0.9rem' }}>Upload Light Logo</span>
                  </div>
                  <div style={{ padding: '24px', border: '1px dashed var(--outline-variant)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '200px', backgroundColor: 'var(--surface-container)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--on-surface-variant)' }}>upload_file</span>
                    <span style={{ fontSize: '0.9rem' }}>Upload Dark Logo</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '8px', border: '1px solid var(--outline)', maxWidth: '400px' }}>
                <div>
                  <span style={{ fontWeight: 500, display: 'block' }}>Default Dark Mode</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Force dark mode for all new users</span>
                </div>
                <div style={{ width: '44px', height: '24px', backgroundColor: 'var(--lime-400)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                  <div style={{ width: '20px', height: '20px', backgroundColor: 'black', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Feature Toggles</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { name: 'Vendor Registration', desc: 'Allow new vendors to sign up', active: true },
                  { name: 'Customer Reviews', desc: 'Enable product reviews and ratings', active: true },
                  { name: 'Live Chat', desc: 'Enable real-time customer support chat', active: false },
                  { name: 'Guest Checkout', desc: 'Allow purchases without an account', active: true },
                  { name: 'Crypto Payments', desc: 'Accept BTC and ETH via Coinbase', active: false },
                ].map(feature => (
                  <div key={feature.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
                    <div>
                      <span style={{ fontWeight: 500, display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>{feature.name}</span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{feature.desc}</span>
                    </div>
                    <div style={{ width: '48px', height: '26px', backgroundColor: feature.active ? 'var(--lime-400)' : 'var(--outline-variant)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s' }}>
                      <div style={{ width: '22px', height: '22px', backgroundColor: feature.active ? 'black' : 'var(--on-surface-variant)', borderRadius: '50%', position: 'absolute', top: '2px', left: feature.active ? '24px' : '2px', transition: 'left 0.3s, background-color 0.3s' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.5rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Payment Gateways & Currency</h2>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500 }}>Base Currency</label>
                  <select style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }}>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500 }}>Global Tax Rate (%)</label>
                  <input type="number" defaultValue="8.5" style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <label style={{ fontWeight: 500 }}>Active Gateways</label>
                {[
                  { name: 'Stripe', status: 'Connected', icon: 'credit_card' },
                  { name: 'PayPal', status: 'Connected', icon: 'account_balance_wallet' },
                  { name: 'Apple Pay', status: 'Disconnected', icon: 'phone_iphone' },
                ].map(gateway => (
                  <div key={gateway.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--on-surface-variant)' }}>{gateway.icon}</span>
                      <span style={{ fontWeight: 500, fontSize: '1.1rem' }}>{gateway.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '0.9rem', color: gateway.status === 'Connected' ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>{gateway.status}</span>
                      <button style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'transparent', border: '1px solid var(--outline-variant)', color: 'var(--on-surface)', cursor: 'pointer' }}>
                        {gateway.status === 'Connected' ? 'Configure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab !== 'branding' && activeTab !== 'features' && activeTab !== 'payment' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>build</span>
              <p>This settings section is under construction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
