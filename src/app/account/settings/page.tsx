'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast, useTheme, ThemeMode, useNotifications } from '@/context/AppContext';

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

export default function SettingsPage() {
  const { user, updateName, updateEmail } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { pushEnabled, pushPermission, requestPushPermission } = useNotifications();
  const [language, setLanguage] = useState('en');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailUpdating, setEmailUpdating] = useState(false);

  // Address Manager States (Phase 6)
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrFullName, setAddrFullName] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrAddress, setAddrAddress] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrRegion, setAddrRegion] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [shippingRegions, setShippingRegions] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setNewName(user.name);
      setNewEmail(user.email);

      // Load saved addresses (Phase 6)
      fetch(`/api/addresses?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setAddresses(data.addresses || []);
        })
        .catch(err => console.error('Failed to load saved addresses:', err));
    }
    // Load regions (Phase 6)
    fetch('/api/shipping-rates')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShippingRegions(data.rates.map((r: any) => r.region));
        }
      })
      .catch(() => {});

    // Load local preferences
    const prefs = localStorage.getItem('africart-preferences');
    if (prefs) {
      const p = JSON.parse(prefs);
      setLanguage(p.language ?? 'en');
    }
  }, [user]);

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddrLabel('Home');
    setAddrFullName(user?.name || '');
    setAddrPhone(user?.phone || '');
    setAddrAddress('');
    setAddrCity('');
    setAddrRegion('');
    setAddrIsDefault(addresses.length === 0); // auto-set default for first entry
    setShowAddressModal(true);
  };

  const openEditAddress = (addr: any) => {
    setEditingAddress(addr);
    setAddrLabel(addr.label || 'Home');
    setAddrFullName(addr.fullName);
    setAddrPhone(addr.phone);
    setAddrAddress(addr.address);
    setAddrCity(addr.city);
    setAddrRegion(addr.region);
    setAddrIsDefault(addr.isDefault || false);
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!addrFullName || !addrPhone || !addrAddress || !addrCity || !addrRegion) {
      showToast('Please fill all fields', 'error');
      return;
    }
    setAddressLoading(true);
    try {
      const addressPayload = {
        label: addrLabel,
        fullName: addrFullName,
        phone: addrPhone,
        address: addrAddress,
        city: addrCity,
        region: addrRegion,
        isDefault: addrIsDefault,
        ...(editingAddress?._id ? { _id: editingAddress._id } : {})
      };

      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, address: addressPayload })
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        setShowAddressModal(false);
        showToast(editingAddress ? 'Address updated!' : 'Address added!');
      } else {
        showToast(data.error || 'Failed to save address', 'error');
      }
    } catch (err) {
      showToast('Error saving address', 'error');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addr: any) => {
    if (!user) return;
    try {
      const updatedAddr = { ...addr, isDefault: true };
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, address: updatedAddr })
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        showToast('Default address updated!');
      }
    } catch (err) {
      showToast('Error setting default address', 'error');
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!user) return;
    if (!window.confirm('Delete this saved address?')) return;
    try {
      const res = await fetch('/api/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, addressId: addrId })
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(data.addresses);
        showToast('Address deleted', 'info');
      }
    } catch (err) {
      showToast('Error deleting address', 'error');
    }
  };

  if (!user) return null;

  const handleSave = async () => {
    if (!user) return;
    if (newName && newName !== user.name) {
      await updateName(newName);
    }
    const prefs = { language };
    localStorage.setItem('africart-preferences', JSON.stringify(prefs));
    showToast('Settings updated successfully!');
    setTimeout(() => router.back(), 500);
  };

  const handleEmailChange = async () => {
    if (!user) return;
    if (!newEmail || newEmail === user.email) {
      showToast('Please enter a different email', 'info');
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setEmailUpdating(true);
    const result = await updateEmail(newEmail);
    setEmailUpdating(false);
    if (result.success) {
      showToast('Email updated successfully! 🎉');
      setShowEmailModal(false);
    } else {
      showToast(result.error || 'Failed to update email', 'error');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPasswordModal(false);
    showToast('Password changed successfully');
  };

  const ToggleSwitch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button onClick={onClick} style={{
      width: 44, height: 24, borderRadius: 12, background: active ? 'var(--lime-400)' : 'var(--outline)',
      border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'var(--foreground)', position: 'absolute', top: 2,
        left: active ? 22 : 2, transition: 'left 0.3s'
      }} />
    </button>
  );

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
        {/* Account Info */}
        <div className="animate-fade-in-up stagger-1">
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: 'var(--foreground)', marginBottom: 16 }}>Account Information</h2>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block' }}>Name</label>
              <input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Your Name"
                style={{ 
                  width: '100%', padding: 12, background: 'var(--surface-container)', 
                  border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)',
                  outline: 'none', fontFamily: 'var(--font-inter)'
                }} 
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block' }}>Email</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  disabled 
                  value={user.email} 
                  style={{ 
                    flex: 1, padding: 12, background: 'var(--surface-container)', 
                    border: '1px solid var(--outline)', borderRadius: 8, 
                    color: 'var(--on-surface-variant)', cursor: 'not-allowed',
                    fontFamily: 'var(--font-inter)', fontSize: 14,
                  }} 
                />
                <button 
                  onClick={() => { setNewEmail(user.email); setShowEmailModal(true); }}
                  style={{
                    background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)', 
                    color: '#00e5ff', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', 
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  Change
                </button>
              </div>
            </div>
            <div>
              <button onClick={() => setShowPasswordModal(true)} style={{
                background: 'transparent', border: '1px solid var(--outline)', color: 'var(--foreground)', padding: '10px 16px',
                borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-lexend)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Shipping Addresses (Phase 6) */}
        <div className="animate-fade-in-up stagger-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: 'var(--foreground)' }}>Shipping Addresses</h2>
            <button 
              onClick={openAddAddress}
              style={{
                background: 'rgba(195,244,0,0.1)', border: '1px solid rgba(195,244,0,0.3)', 
                color: 'var(--lime-400)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', 
                fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_location</span>
              Add Address
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {addresses.length === 0 ? (
              <div style={{ 
                background: 'var(--surface)', border: '1px dotted var(--outline)', borderRadius: 12, 
                padding: '32px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', gap: 12 
              }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-container)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' 
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>location_off</span>
                </div>
                <div>
                  <p style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-lexend)' }}>No Saved Addresses</p>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginTop: 4 }}>Add a shipping address for a faster checkout experience.</p>
                </div>
                <button 
                  onClick={openAddAddress}
                  style={{
                    background: 'var(--lime-400)', border: 'none', color: '#000', 
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer', 
                    fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-lexend)',
                    marginTop: 8
                  }}
                >
                  Add First Address
                </button>
              </div>
            ) : (
              addresses.map((addr) => (
                <div 
                  key={addr._id}
                  style={{ 
                    background: 'var(--surface)', border: addr.isDefault ? '1px solid var(--lime-400)' : '1px solid var(--outline)', 
                    borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  {addr.isDefault && (
                    <div style={{ 
                      position: 'absolute', top: 0, right: 0, background: 'var(--lime-400)', 
                      color: '#000', fontSize: 9, fontWeight: 900, fontFamily: 'var(--font-lexend)',
                      padding: '4px 8px', borderBottomLeftRadius: 8, textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      Default Address
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ 
                      fontSize: 18, color: addr.isDefault ? 'var(--lime-400)' : '#00e5ff' 
                    }}>
                      {addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'work' : 'location_on'}
                    </span>
                    <span style={{ 
                      fontSize: 12, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-lexend)',
                      background: 'var(--surface-container)', padding: '2px 8px', borderRadius: 4
                    }}>
                      {addr.label}
                    </span>
                  </div>

                  <div>
                    <p style={{ color: 'var(--foreground)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>{addr.fullName}</p>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>phone</span>
                      {addr.phone}
                    </p>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, marginTop: 8, lineHeight: '1.4' }}>
                      {addr.address}, {addr.city}, <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{addr.region}</span>
                    </p>
                  </div>

                  <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    borderTop: '1px solid var(--outline)', paddingTop: 12, marginTop: 4 
                  }}>
                    {addr.isDefault ? (
                      <span style={{ fontSize: 11, color: 'var(--lime-400)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                        Preferred shipping destination
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleSetDefaultAddress(addr)}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', 
                          cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                          padding: 0
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>star_border</span>
                        Set as Default
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => openEditAddress(addr)}
                        style={{
                          background: 'var(--surface-container)', border: '1px solid var(--outline)', 
                          color: 'var(--foreground)', width: 32, height: 32, borderRadius: 8, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                        title="Edit Address"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(addr._id)}
                        style={{
                          background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.2)', 
                          color: '#ff1744', width: 32, height: 32, borderRadius: 8, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                        title="Delete Address"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="animate-fade-in-up stagger-3">
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: 'var(--foreground)', marginBottom: 16 }}>Preferences</h2>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ color: 'var(--foreground)', fontSize: 14 }}>Theme Appearance 🌓</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>
                  {theme === 'system' ? 'Follows device setting' : `Manually set to ${theme}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['light', 'dark', 'system'] as ThemeMode[]).map(t => (
                  <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{
                      padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                      background: theme === t ? 'var(--lime-400)' : 'var(--surface-container)',
                      color: theme === t ? '#000' : 'var(--foreground)',
                      border: '1px solid var(--outline)', cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {t === 'system' ? '⚙ Auto' : t === 'light' ? '☀ Light' : '🌙 Dark'}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Accent Color */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--outline-variant)', paddingTop: 20, marginBottom: 20 }}>
              <div>
                <p style={{ color: 'var(--foreground)', fontSize: 14 }}>Theme Color Palette 🎨</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Current accent: <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: accentColor }} />
                  <span style={{ fontFamily: 'monospace' }}>{accentColor}</span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {presetColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      backgroundColor: color,
                      border: accentColor === color ? '2px solid white' : '1px solid var(--outline)',
                      cursor: 'pointer', outline: 'none', transition: 'transform 0.1s',
                      transform: accentColor === color ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: accentColor === color ? '0 0 6px var(--lime-400)' : 'none'
                    }}
                    title={color}
                  />
                ))}
                
                {/* Inline Color Picker */}
                <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: !presetColors.includes(accentColor) ? '2px solid white' : '1px solid var(--outline)', boxShadow: !presetColors.includes(accentColor) ? '0 0 6px var(--lime-400)' : 'none' }} title="Custom Accent Color">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    style={{
                      position: 'absolute',
                      width: '140%',
                      height: '140%',
                      cursor: 'pointer',
                      border: 'none',
                      padding: 0,
                      backgroundColor: 'transparent'
                    }}
                  />
                  <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '12px', pointerEvents: 'none', zIndex: 1, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>palette</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--outline-variant)', paddingTop: 20, marginBottom: 20 }}>
              <div>
                <p style={{ color: 'var(--foreground)', fontSize: 14 }}>Push Notifications 🔔</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 12 }}>Real-time order status alerts</p>
              </div>
              
              {pushPermission === 'unsupported' ? (
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Unsupported</span>
              ) : pushEnabled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 10, padding: '6px 12px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00e5ff' }}>notifications_active</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#00e5ff', fontFamily: 'var(--font-lexend)' }}>Active</span>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    const granted = await requestPushPermission();
                    showToast(granted ? 'Push notifications enabled! 🔔' : 'Permission denied. Check browser settings.', granted ? 'success' : 'info');
                  }}
                  style={{ padding: '8px 14px', borderRadius: 10, background: '#00e5ff', color: '#000', border: 'none', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                >
                  Enable
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--foreground)', fontSize: 14 }}>Language</p>
              </div>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                background: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--foreground)', padding: '8px 12px', borderRadius: 8, outline: 'none'
              }}>
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
              </select>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up stagger-3">
          <button onClick={handleSave} style={{
            width: '100%', padding: '16px', background: 'var(--lime-400)', border: 'none', color: 'var(--on-lime-400)', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-lexend)', textTransform: 'uppercase'
          }}>Save Changes</button>
        </div>
      </div>

      {/* Change Email Modal */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }} onClick={() => setShowEmailModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{
            background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--outline)', width: '100%', maxWidth: 380
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,229,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#00e5ff' }}>mail</span>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)', fontSize: 16, fontWeight: 800 }}>Change Email</h3>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Enter your new email address</p>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Current Email</label>
              <div style={{ padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--on-surface-variant)', fontSize: 13 }}>
                {user.email}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block', fontWeight: 600 }}>New Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your@newemail.com"
                autoFocus
                style={{ 
                  width: '100%', padding: 12, background: 'var(--surface-container)', 
                  border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)',
                  outline: 'none', fontFamily: 'var(--font-inter)', fontSize: 14,
                }}
              />
            </div>

            {/* Warning */}
            <div style={{
              background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: 10,
              padding: 12, marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff9800', flexShrink: 0, marginTop: 1 }}>warning</span>
              <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                Changing your email will update your login credentials. You&apos;ll need to use the new email to sign in.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="button" 
                onClick={() => setShowEmailModal(false)} 
                style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid var(--outline)', color: 'var(--on-surface-variant)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleEmailChange} 
                disabled={emailUpdating || newEmail === user.email}
                style={{ 
                  flex: 1, padding: 12, background: emailUpdating ? 'var(--outline)' : '#00e5ff', border: 'none', 
                  color: '#000', borderRadius: 8, fontWeight: 700, cursor: emailUpdating ? 'wait' : 'pointer',
                  fontFamily: 'var(--font-lexend)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: (emailUpdating || newEmail === user.email) ? 0.5 : 1,
                }}
              >
                {emailUpdating ? (
                  <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Updating...</>
                ) : (
                  'Update Email'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <form onSubmit={handleChangePassword} className="animate-scale-in" style={{
            background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--outline)', width: '100%', maxWidth: 340
          }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)', marginBottom: 16 }}>Change Password</h3>
            <input required type="password" placeholder="Current Password" style={{ width: '100%', padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', marginBottom: 12 }} />
            <input required type="password" placeholder="New Password" style={{ width: '100%', padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', marginBottom: 12 }} />
            <input required type="password" placeholder="Confirm New Password" style={{ width: '100%', padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', marginBottom: 24 }} />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid var(--outline)', color: 'var(--on-surface-variant)', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: 12, background: 'var(--lime-400)', border: 'none', color: 'var(--on-lime-400)', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Update</button>
            </div>
          </form>
        </div>
      )}

      {/* Saved Addresses Edit/Add Modal (Phase 6) */}
      {showAddressModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }} onClick={() => setShowAddressModal(false)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{
            background: 'var(--surface)', padding: 24, borderRadius: 16, border: '1px solid var(--outline)', width: '100%', maxWidth: 440,
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(195,244,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)' }}>edit_location_alt</span>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)', fontSize: 16, fontWeight: 800 }}>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h3>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Set your preferred delivery coordinates</p>
              </div>
            </div>

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Address Label selection pills */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 6, display: 'block', fontWeight: 600 }}>Address Label</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Home', 'Work', 'Other'].map(label => {
                    const isSelected = addrLabel === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAddrLabel(label)}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: isSelected ? 'var(--lime-400)' : 'var(--surface-container)',
                          color: isSelected ? '#000' : 'var(--foreground)',
                          border: isSelected ? '1px solid var(--lime-400)' : '1px solid var(--outline)',
                          cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-lexend)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          {label === 'Home' ? 'home' : label === 'Work' ? 'work' : 'location_on'}
                        </span>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Full Name</label>
                <input
                  required
                  type="text"
                  value={addrFullName}
                  onChange={e => setAddrFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%', padding: 12, background: 'var(--surface-container)',
                    border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)',
                    outline: 'none', fontFamily: 'var(--font-inter)', fontSize: 14
                  }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Phone Number</label>
                <input
                  required
                  type="tel"
                  value={addrPhone}
                  onChange={e => setAddrPhone(e.target.value)}
                  placeholder="e.g. +234 803 123 4567"
                  style={{
                    width: '100%', padding: 12, background: 'var(--surface-container)',
                    border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)',
                    outline: 'none', fontFamily: 'var(--font-inter)', fontSize: 14
                  }}
                />
              </div>

              {/* Street Address */}
              <div>
                <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Street Address</label>
                <input
                  required
                  type="text"
                  value={addrAddress}
                  onChange={e => setAddrAddress(e.target.value)}
                  placeholder="e.g. Suite B2, 45 Activewear Avenue"
                  style={{
                    width: '100%', padding: 12, background: 'var(--surface-container)',
                    border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)',
                    outline: 'none', fontFamily: 'var(--font-inter)', fontSize: 14
                  }}
                />
              </div>

              {/* City & Region Row */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block', fontWeight: 600 }}>City</label>
                  <input
                    required
                    type="text"
                    value={addrCity}
                    onChange={e => setAddrCity(e.target.value)}
                    placeholder="e.g. Ikeja"
                    style={{
                      width: '100%', padding: 12, background: 'var(--surface-container)',
                      border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)',
                      outline: 'none', fontFamily: 'var(--font-inter)', fontSize: 14
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 4, display: 'block', fontWeight: 600 }}>Region</label>
                  <select
                    required
                    value={addrRegion}
                    onChange={e => setAddrRegion(e.target.value)}
                    style={{
                      width: '100%', padding: 12, background: 'var(--surface-container)',
                      border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)',
                      outline: 'none', fontFamily: 'var(--font-inter)', fontSize: 14, height: 45
                    }}
                  >
                    <option value="" disabled>Select Region</option>
                    {shippingRegions.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Default Address Checkbox Styled Switch */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--surface-container)', padding: '12px 16px', borderRadius: 10,
                border: '1px solid var(--outline)', marginTop: 4
              }}>
                <div>
                  <p style={{ color: 'var(--foreground)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>Set as Default Address</p>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: 11 }}>Automatically select at checkout</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddrIsDefault(!addrIsDefault)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, background: addrIsDefault ? 'var(--lime-400)' : 'var(--outline)',
                    border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: addrIsDefault ? '#000' : 'var(--foreground)', position: 'absolute', top: 2,
                    left: addrIsDefault ? 22 : 2, transition: 'left 0.3s'
                  }} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  style={{
                    flex: 1, padding: 12, background: 'transparent', border: '1px solid var(--outline)',
                    color: 'var(--on-surface-variant)', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                    fontFamily: 'var(--font-lexend)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressLoading}
                  style={{
                    flex: 1, padding: 12, background: addressLoading ? 'var(--outline)' : 'var(--lime-400)', border: 'none',
                    color: '#000', borderRadius: 8, fontWeight: 800, cursor: addressLoading ? 'wait' : 'pointer',
                    fontFamily: 'var(--font-lexend)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    opacity: addressLoading ? 0.7 : 1
                  }}
                >
                  {addressLoading ? (
                    <><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span> Saving...</>
                  ) : (
                    'Save Address'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
