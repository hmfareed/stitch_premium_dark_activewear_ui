'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

interface DaySchedule {
  day: string;
  isOpen: boolean;
  is24Hours: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_HOURS: DaySchedule[] = [
  { day: 'Monday', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  { day: 'Tuesday', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  { day: 'Wednesday', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  { day: 'Thursday', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  { day: 'Friday', isOpen: true, is24Hours: false, openTime: '08:00', closeTime: '18:00' },
  { day: 'Saturday', isOpen: true, is24Hours: false, openTime: '09:00', closeTime: '17:00' },
  { day: 'Sunday', isOpen: false, is24Hours: false, openTime: '10:00', closeTime: '15:00' },
];

export default function VendorBusinessHoursPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [hours, setHours] = useState<DaySchedule[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHours();
  }, []);

  const fetchHours = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/storefront');
      const data = await res.json();
      if (res.ok && data.store?.businessHours) {
        setHours(data.store.businessHours);
      }
    } catch (err) {
      console.error('Failed to load business hours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (idx: number, field: keyof DaySchedule, val: any) => {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, [field]: val } : h));
  };

  const handleSaveHours = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/storefront', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHours: hours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save business hours');

      showToast('Weekly business hours saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Save error', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Store Profile', path: '/vendor/settings', active: false, icon: 'storefront' },
          { label: 'Branches', path: '/vendor/settings/branches', active: false, icon: 'store' },
          { label: 'Business Hours', path: '/vendor/settings/hours', active: true, icon: 'schedule' },
          { label: 'Pickup Locations', path: '/vendor/settings/pickup', active: false, icon: 'location_on' },
          { label: 'Delivery Settings', path: '/vendor/settings/delivery', active: false, icon: 'local_shipping' },
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

      {/* Main Schedule Matrix Form */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Business & Working Hours Schedule
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Set opening & closing times for each day of the week to inform customers when store order fulfillment is active.
            </p>
          </div>

          <button
            onClick={handleSaveHours}
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
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
            {saving ? 'SAVING...' : 'SAVE SCHEDULE'}
          </button>
        </div>

        {/* Schedule Rows */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading business schedule...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hours.map((item, idx) => (
              <div
                key={item.day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 12,
                  backgroundColor: item.isOpen ? '#f8fafc' : '#fff1f2',
                  border: item.isOpen ? '1px solid #e2e8f0' : '1px solid #fecdd3',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                {/* Left: Day Label & Open Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 160 }}>
                  <input
                    type="checkbox"
                    checked={item.isOpen}
                    onChange={e => handleToggleDay(idx, 'isOpen', e.target.checked)}
                    style={{ accentColor: '#10b981', width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 800, color: item.isOpen ? '#0f172a' : '#94a3b8' }}>
                    {item.day}
                  </span>
                </div>

                {/* Center: Open 24 Hours Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    disabled={!item.isOpen}
                    checked={item.is24Hours}
                    onChange={e => handleToggleDay(idx, 'is24Hours', e.target.checked)}
                    style={{ accentColor: '#3b82f6', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Open 24 Hours</span>
                </div>

                {/* Right: Time Pickers */}
                {item.isOpen && !item.is24Hours ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="time"
                      value={item.openTime}
                      onChange={e => handleToggleDay(idx, 'openTime', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a' }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>to</span>
                    <input
                      type="time"
                      value={item.closeTime}
                      onChange={e => handleToggleDay(idx, 'closeTime', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a' }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 800, color: item.isOpen ? '#16a34a' : '#dc2626' }}>
                    {item.isOpen ? 'OPEN 24 HOURS' : 'CLOSED ALL DAY'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
