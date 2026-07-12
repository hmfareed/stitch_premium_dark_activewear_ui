'use client';
import React, { useState, useEffect } from 'react';
import { useAuth, useStore, useToast, VendorSettings } from '@/context/AppContext';

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Northern', 'Volta', 'Upper East', 'Upper West', 'Bono',
  'Bono East', 'Ahafo', 'Western North', 'Oti', 'Savannah',
  'North East'
];

export default function VendorSettingsPage() {
  const { user } = useAuth();
  const { getVendorSettings, saveVendorSettings } = useStore();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('store');
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [newPlace, setNewPlace] = useState('');

  useEffect(() => {
    if (user) {
      setSettings(getVendorSettings(user.email));
    }
  }, [user, getVendorSettings]);

  if (!user || !settings) return null;

  const handleSave = () => {
    saveVendorSettings(user.email, settings);
    showToast('Settings saved successfully!');
  };

  const update = (key: keyof VendorSettings, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    // Auto-save instantly
    saveVendorSettings(user.email, updated);
  };

  const addDeliveryPlace = (place: string) => {
    if (!place.trim()) return;
    if (settings.deliveryPlaces.includes(place.trim())) return;
    const updated = { ...settings, deliveryPlaces: [...settings.deliveryPlaces, place.trim()] };
    setSettings(updated);
    saveVendorSettings(user.email, updated);
    setNewPlace('');
  };

  const removeDeliveryPlace = (place: string) => {
    const updated = { ...settings, deliveryPlaces: settings.deliveryPlaces.filter(p => p !== place) };
    setSettings(updated);
    saveVendorSettings(user.email, updated);
  };

  const toggleNotif = (key: 'notifNewOrders' | 'notifLowStock' | 'notifCustomerMessages' | 'notifWeeklyReports') => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveVendorSettings(user.email, updated);
  };

  const tabs = [
    { id: 'store', name: 'Store Settings', icon: 'storefront' },
    { id: 'delivery', name: 'Delivery', icon: 'local_shipping' },
    { id: 'notifications', name: 'Notifications', icon: 'notifications' },
  ];

  const inputStyle: React.CSSProperties = {
    maxWidth: '400px', width: '100%', padding: '12px 16px', borderRadius: '8px',
    backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)',
    color: 'var(--on-surface)', outline: 'none', fontSize: '0.95rem',
    fontFamily: 'inherit', transition: 'border-color 0.2s',
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Store Settings</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Configure your store preferences — changes save instantly</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
        {/* Tabs */}
        <div className="responsive-tab-sidebar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === t.id ? 'var(--surface-container-high)' : 'transparent', color: activeTab === t.id ? '#00e5ff' : 'var(--on-surface)', fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', fontSize: '0.95rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{t.icon}</span>{t.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, backgroundColor: 'var(--surface)', padding: '24px 20px', borderRadius: '16px', border: '1px solid var(--outline)', minHeight: '400px', minWidth: '280px' }}>
          
          {/* ─── STORE SETTINGS ─── */}
          {activeTab === 'store' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Store Information</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Store Name</label>
                <input 
                  type="text" 
                  value={settings.storeName} 
                  onChange={e => update('storeName', e.target.value)}
                  placeholder="Enter your store name"
                  style={inputStyle} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>This name will appear on your store profile</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Store Email</label>
                <input 
                  type="email" 
                  value={settings.storeEmail} 
                  onChange={e => update('storeEmail', e.target.value)}
                  placeholder="store@example.com"
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Contact Number</label>
                <input 
                  type="tel" 
                  value={settings.storeContact} 
                  onChange={e => update('storeContact', e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  style={inputStyle} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>This number will be visible to customers on your profile</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Store Description</label>
                <textarea 
                  rows={3} 
                  value={settings.storeDescription} 
                  onChange={e => update('storeDescription', e.target.value)}
                  placeholder="Describe your store..."
                  style={{ ...inputStyle, resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Return Policy</label>
                <textarea 
                  rows={3} 
                  value={settings.returnPolicy} 
                  onChange={e => update('returnPolicy', e.target.value)}
                  placeholder="Describe your return policy..."
                  style={{ ...inputStyle, resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'color-mix(in srgb, var(--lime-400) 10%, transparent)', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--lime-400) 30%, transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 20 }}>check_circle</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>Changes are saved automatically</span>
              </div>
            </div>
          )}

          {/* ─── DELIVERY SETTINGS ─── */}
          {activeTab === 'delivery' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Delivery Settings</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Delivery Fee (GH₵)</label>
                <input 
                  type="text" 
                  value={settings.deliveryFee} 
                  onChange={e => update('deliveryFee', e.target.value)}
                  placeholder="e.g. 20.00"
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500 }}>Estimated Delivery Time</label>
                <input 
                  type="text" 
                  value={settings.estimatedTime} 
                  onChange={e => update('estimatedTime', e.target.value)}
                  placeholder="e.g. 2-3 business days"
                  style={inputStyle} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontWeight: 500 }}>Delivery Places in Ghana</label>
                
                {/* Current delivery places */}
                {settings.deliveryPlaces.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {settings.deliveryPlaces.map((place, i) => (
                      <div key={i} style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                        borderRadius: '20px', backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)',
                        border: '1px solid color-mix(in srgb, #00e5ff 30%, transparent)', fontSize: '0.85rem', color: '#00e5ff'
                      }}>
                        <span>{place}</span>
                        <button 
                          onClick={() => removeDeliveryPlace(place)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00e5ff', display: 'flex', padding: 0 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick add Ghana regions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Quick Add Regions</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {GHANA_REGIONS.filter(r => !settings.deliveryPlaces.includes(r)).map((region, i) => (
                      <button 
                        key={i} 
                        onClick={() => addDeliveryPlace(region)}
                        style={{ 
                          padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--outline)', 
                          backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)', 
                          fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        + {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom place input */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={newPlace} 
                    onChange={e => setNewPlace(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDeliveryPlace(newPlace); } }}
                    placeholder="Add custom location..."
                    style={{ ...inputStyle, maxWidth: '300px' }} 
                  />
                  <button 
                    onClick={() => addDeliveryPlace(newPlace)}
                    style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'color-mix(in srgb, var(--lime-400) 10%, transparent)', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--lime-400) 30%, transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 20 }}>check_circle</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>Changes are saved automatically</span>
              </div>
            </div>
          )}

          {/* ─── NOTIFICATION SETTINGS ─── */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 className="font-lexend" style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--outline)', paddingBottom: '16px' }}>Notification Preferences</h2>
              {[
                { key: 'notifNewOrders' as const, name: 'New Orders', desc: 'Get notified when a new order is placed', icon: 'shopping_bag' },
                { key: 'notifLowStock' as const, name: 'Low Stock Alerts', desc: 'Alerts when product stock is running low', icon: 'inventory' },
                { key: 'notifCustomerMessages' as const, name: 'Customer Messages', desc: 'Notifications for incoming customer messages', icon: 'chat' },
                { key: 'notifWeeklyReports' as const, name: 'Weekly Reports', desc: 'Receive weekly sales and performance reports', icon: 'analytics' },
              ].map(n => (
                <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: settings[n.key] ? '#00e5ff' : 'var(--on-surface-variant)' }}>{n.icon}</span>
                    <div>
                      <span style={{ fontWeight: 500, display: 'block' }}>{n.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{n.desc}</span>
                    </div>
                  </div>
                  <div 
                    onClick={() => toggleNotif(n.key)} 
                    style={{ 
                      width: '44px', height: '24px', 
                      backgroundColor: settings[n.key] ? '#00e5ff' : 'var(--outline-variant)', 
                      borderRadius: '12px', position: 'relative', cursor: 'pointer',
                      transition: 'background-color 0.3s'
                    }}
                  >
                    <div style={{ 
                      width: '20px', height: '20px', 
                      backgroundColor: settings[n.key] ? 'black' : 'var(--on-surface-variant)', 
                      borderRadius: '50%', position: 'absolute', top: '2px', 
                      left: settings[n.key] ? '22px' : '2px', 
                      transition: 'left 0.3s, background-color 0.3s' 
                    }} />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'color-mix(in srgb, var(--lime-400) 10%, transparent)', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--lime-400) 30%, transparent)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 20 }}>check_circle</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--on-surface)' }}>Changes are saved automatically</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
