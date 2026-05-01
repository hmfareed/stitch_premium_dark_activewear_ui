'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // Load local preferences
    const prefs = localStorage.getItem('reed-preferences');
    if (prefs) {
      const p = JSON.parse(prefs);
      setNotifications(p.notifications ?? true);
      setDarkMode(p.darkMode ?? true);
      setLanguage(p.language ?? 'en');
    }
  }, []);

  if (!user) return null;

  const handleSave = () => {
    const prefs = { notifications, darkMode, language };
    localStorage.setItem('reed-preferences', JSON.stringify(prefs));
    // Apply dark mode to document if we had a light mode, but currently app is hardcoded dark.
    // This is a UI simulation of the toggle.
    if (!darkMode) {
      document.documentElement.style.setProperty('--background', '#ffffff');
      document.documentElement.style.setProperty('--foreground', '#000000');
    } else {
      document.documentElement.style.setProperty('--background', '#0a0a0a');
      document.documentElement.style.setProperty('--foreground', '#e2e2e2');
    }
    showToast('Settings updated successfully!');
    setTimeout(() => router.back(), 500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPasswordModal(false);
    showToast('Password changed successfully');
  };

  const ToggleSwitch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button onClick={onClick} style={{
      width: 44, height: 24, borderRadius: 12, background: active ? 'var(--lime-400)' : '#333',
      border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2,
        left: active ? 22 : 2, transition: 'left 0.3s'
      }} />
    </button>
  );

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: '#fff' }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
        {/* Account Info */}
        <div className="animate-fade-in-up stagger-1">
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: '#fff', marginBottom: 16 }}>Account Information</h2>
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Name</label>
              <input disabled value={user.name} style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#888', cursor: 'not-allowed' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Email</label>
              <input disabled value={user.email} style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#888', cursor: 'not-allowed' }} />
            </div>
            <div>
              <button onClick={() => setShowPasswordModal(true)} style={{
                background: 'transparent', border: '1px solid #333', color: '#fff', padding: '10px 16px',
                borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-lexend)', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="animate-fade-in-up stagger-2">
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: '#fff', marginBottom: 16 }}>Preferences</h2>
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ color: '#fff', fontSize: 14 }}>Dark Mode 🌙</p>
                <p style={{ color: '#888', fontSize: 12 }}>Toggle app theme</p>
              </div>
              <ToggleSwitch active={darkMode} onClick={() => setDarkMode(!darkMode)} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ color: '#fff', fontSize: 14 }}>Notifications 🔔</p>
                <p style={{ color: '#888', fontSize: 12 }}>Order updates & promos</p>
              </div>
              <ToggleSwitch active={notifications} onClick={() => setNotifications(!notifications)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#fff', fontSize: 14 }}>Language</p>
              </div>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={{
                background: '#1a1a1a', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: 8, outline: 'none'
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
            width: '100%', padding: '16px', background: 'var(--lime-400)', border: 'none', color: '#000', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-lexend)', textTransform: 'uppercase'
          }}>Save Changes</button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 24
        }}>
          <form onSubmit={handleChangePassword} className="animate-scale-in" style={{
            background: '#111', padding: 24, borderRadius: 16, border: '1px solid #222', width: '100%', maxWidth: 340
          }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', color: '#fff', marginBottom: 16 }}>Change Password</h3>
            <input required type="password" placeholder="Current Password" style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', marginBottom: 12 }} />
            <input required type="password" placeholder="New Password" style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', marginBottom: 12 }} />
            <input required type="password" placeholder="Confirm New Password" style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', marginBottom: 24 }} />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: 12, background: 'var(--lime-400)', border: 'none', color: '#000', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Update</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
