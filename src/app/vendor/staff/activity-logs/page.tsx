'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorStaffActivityLogsPage() {
  const { user } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/staff');
      const data = await res.json();
      if (res.ok) setLogs(data.activityLogs || []);
    } catch (err) {
      console.error('Failed to load logs:', err);
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
          { label: 'Roles & Shifts', path: '/vendor/staff/roles', active: false, icon: 'admin_panel_settings' },
          { label: 'Permissions Matrix', path: '/vendor/staff/permissions', active: false, icon: 'key' },
          { label: 'Attendance Roster', path: '/vendor/staff/attendance', active: false, icon: 'how_to_reg' },
          { label: 'Activity Logs', path: '/vendor/staff/activity-logs', active: true, icon: 'history' },
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

      {/* Main Activity Logs Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Employee Activity Audit Trail & Login History
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Real-time security log tracking staff system actions, checkout events, device footprints, and IP addresses.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading activity logs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Staff Member</th>
                <th style={{ padding: '10px 8px' }}>Action Performed</th>
                <th style={{ padding: '10px 8px' }}>Device & OS</th>
                <th style={{ padding: '10px 8px' }}>IP Address</th>
                <th style={{ padding: '10px 8px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{l.name}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#334155' }}>{l.action}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{l.device}</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#475569' }}>{l.ip}</td>
                  <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{l.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
