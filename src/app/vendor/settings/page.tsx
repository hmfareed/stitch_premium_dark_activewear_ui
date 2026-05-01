'use client';
import React, { useState } from 'react';

export default function VendorSettingsPage() {
  const [activeTab, setActiveTab] = useState('store');
  const tabs = [
    { id: 'store', name: 'Store Info', icon: 'storefront' },
    { id: 'shipping', name: 'Shipping', icon: 'local_shipping' },
    { id: 'notifications', name: 'Notifications', icon: 'notifications' },
  ];

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Store Settings</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Configure your store preferences</p>
      </div>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--surface)', padding: '12px', borderRadius: '16px', border: '1px solid var(--outline)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === t.id ? 'var(--surface-container-high)' : 'transparent', color: activeTab === t.id ? '#00e5ff' : 'var(--on-surface)', fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{t.icon}</span>{t.name}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, backgroundColor: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--outline)', minHeight: '400px' }}>
          {activeTab === 'store' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Store Information</h2>
              {[{ label: 'Store Name', val: 'Nike Official', type: 'text' }, { label: 'Store Email', val: 'store@nike.com', type: 'email' }, { label: 'Phone', val: '+1 (555) 123-4567', type: 'tel' }].map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500 }}>{f.label}</label>
                  <input type={f.type} defaultValue={f.val} style={{ maxWidth: '400px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Store Description</label>
                <textarea rows={3} defaultValue="Premium activewear and athletic essentials" style={{ maxWidth: '400px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', resize: 'vertical' }} />
              </div>
              <button style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
            </div>
          )}
          {activeTab === 'shipping' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Shipping Settings</h2>
              {[{ label: 'Standard (5-7 days)', fee: '$4.99' }, { label: 'Express (2-3 days)', fee: '$9.99' }, { label: 'Free over $75', fee: '$0.00' }].map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '10px' }}>
                  <span>{s.label}</span><span style={{ fontWeight: 600, color: '#00e5ff' }}>{s.fee}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Notification Preferences</h2>
              {[{ name: 'New Orders', on: true }, { name: 'Low Stock Alerts', on: true }, { name: 'Customer Messages', on: true }, { name: 'Weekly Reports', on: false }].map(n => (
                <div key={n.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: 'var(--surface-container)', borderRadius: '10px' }}>
                  <span style={{ fontWeight: 500 }}>{n.name}</span>
                  <div style={{ width: '44px', height: '24px', backgroundColor: n.on ? '#00e5ff' : 'var(--outline-variant)', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: n.on ? 'black' : 'var(--on-surface-variant)', borderRadius: '50%', position: 'absolute', top: '2px', left: n.on ? '22px' : '2px', transition: 'left 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
