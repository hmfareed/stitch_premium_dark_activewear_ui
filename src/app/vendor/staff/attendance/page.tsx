'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorStaffAttendancePage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/staff');
      const data = await res.json();
      if (res.ok) setRoster(data.attendanceRoster || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockInOut = (attId: string) => {
    setRoster(prev => prev.map(a => {
      if (a.id === attId) {
        const isClockedIn = a.clockOut === 'In Shift';
        return {
          ...a,
          clockOut: isClockedIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Shift',
          hours: isClockedIn ? '8.0 hrs' : 'In Progress',
        };
      }
      return a;
    }));
    showToast('Attendance clock status updated!', 'success');
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
          { label: 'Attendance Roster', path: '/vendor/staff/attendance', active: true, icon: 'how_to_reg' },
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

      {/* Main Attendance Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Employee Clock-In / Clock-Out Attendance Roster
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Track daily staff check-ins, shift hours worked, and punctuality status.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading attendance roster...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Staff Member</th>
                <th style={{ padding: '10px 8px' }}>Date</th>
                <th style={{ padding: '10px 8px' }}>Clock In Time</th>
                <th style={{ padding: '10px 8px' }}>Clock Out Time</th>
                <th style={{ padding: '10px 8px' }}>Total Hours</th>
                <th style={{ padding: '10px 8px' }}>Punctuality Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roster.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{a.name}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{a.date}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#16a34a' }}>{a.clockIn}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: a.clockOut === 'In Shift' ? '#2563eb' : '#334155' }}>
                    {a.clockOut}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 800 }}>{a.hours}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: a.status === 'Present' ? '#dcfce7' : '#fef3c7',
                      color: a.status === 'Present' ? '#16a34a' : '#d97706',
                    }}>
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleClockInOut(a.id)}
                      style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                    >
                      {a.clockOut === 'In Shift' ? 'Clock Out' : 'Clock In'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
