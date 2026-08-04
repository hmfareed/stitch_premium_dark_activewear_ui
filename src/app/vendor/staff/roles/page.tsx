'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorStaffRolesPage() {
  const { user } = useAuth();

  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRolesData();
  }, []);

  const fetchRolesData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/staff');
      const data = await res.json();
      if (res.ok) setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to load roles:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 11 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Employees Directory', path: '/vendor/staff', active: false, icon: 'badge' },
          { label: 'Roles & Shifts', path: '/vendor/staff/roles', active: true, icon: 'admin_panel_settings' },
          { label: 'Permissions Matrix', path: '/vendor/staff/permissions', active: false, icon: 'key' },
          { label: 'Attendance Roster', path: '/vendor/staff/attendance', active: false, icon: 'how_to_reg' },
          { label: 'Activity Logs', path: '/vendor/staff/activity-logs', active: false, icon: 'history' },
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

      {/* Roles Cards */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Employee Roles & Shift Schedules
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Define custom staff operational roles and schedule morning / evening branch shifts.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading roles...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
            {roles.map(r => (
              <div key={r.name} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{r.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                    {r.count} STAFF
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', minHeight: 36 }}>{r.description}</p>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>🔑 {r.permissionsCount} Granted Permissions</div>
              </div>
            ))}
          </div>
        )}

        {/* Shift Schedule Table */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 14px' }}>Standard Shift Rosters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 18, borderRadius: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#166534' }}>☀️ Morning Shift</div>
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>08:00 AM - 04:00 PM (Mon - Sat)</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 10 }}>Assigned: Kojo Mensah, Yaw Boateng</div>
          </div>

          <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: 18, borderRadius: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#1e40af' }}>🌙 Evening Shift</div>
            <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 4 }}>04:00 PM - 10:00 PM (Mon - Sat)</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 10 }}>Assigned: Esi Addo</div>
          </div>
        </div>
      </div>

    </div>
  );
}
