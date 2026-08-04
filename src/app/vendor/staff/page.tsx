'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorStaffDirectoryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('POS Cashier');
  const [branch, setBranch] = useState('Accra Central Hub');
  const [shift, setShift] = useState('Morning Shift (8AM - 4PM)');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/staff');
      const data = await res.json();
      if (res.ok) setStaffMembers(data.staffMembers || []);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Staff name and email are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_staff',
          staff: { name: name.trim(), email: email.trim(), role, branch, shift },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Employee ${name} added to directory!`, 'success');
      setStaffMembers(data.staffMembers || []);
      setShowAddModal(false);
      setName('');
      setEmail('');
    } catch (err: any) {
      showToast(err.message || 'Error adding staff', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 11 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Employees Directory', path: '/vendor/staff', active: true, icon: 'badge' },
          { label: 'Roles & Shifts', path: '/vendor/staff/roles', active: false, icon: 'admin_panel_settings' },
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

      {/* Main Staff Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Employee Workforce Directory
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Manage employee profiles, assign store branches, set shifts, and monitor individual sales performance.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 18px',
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            Add New Employee
          </button>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading employee directory...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Employee</th>
                  <th style={{ padding: '10px 8px' }}>Role</th>
                  <th style={{ padding: '10px 8px' }}>Assigned Branch</th>
                  <th style={{ padding: '10px 8px' }}>Shift Schedule</th>
                  <th style={{ padding: '10px 8px' }}>Sales Revenue</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    
                    {/* Name & Avatar */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: '#061d13', color: '#a3e635', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                          <div style={{ fontSize: 10, color: '#64748b' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6, backgroundColor: s.role === 'Store Manager' ? '#fef3c7' : s.role === 'POS Cashier' ? '#dbeafe' : '#f1f5f9', color: s.role === 'Store Manager' ? '#d97706' : s.role === 'POS Cashier' ? '#2563eb' : '#475569' }}>
                        {s.role}
                      </span>
                    </td>

                    {/* Branch */}
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#334155' }}>
                      🏢 {s.branch}
                    </td>

                    {/* Shift */}
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>
                      {s.shift}
                    </td>

                    {/* Sales Performance */}
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: s.salesPerformance > 0 ? '#10b981' : '#94a3b8' }}>
                      GH₵ {(s.salesPerformance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6, backgroundColor: '#dcfce7', color: '#16a34a' }}>
                        ACTIVE
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Add / Invite New Employee</h3>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Full Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Abena Serwaa" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="abena@africart.com" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Assigned Role</label>
                  <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
                    <option value="Store Manager">Store Manager</option>
                    <option value="POS Cashier">POS Cashier</option>
                    <option value="Inventory Specialist">Inventory Specialist</option>
                    <option value="Fulfillment Agent">Fulfillment Agent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Assigned Branch</label>
                  <select value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
                    <option value="Accra Central Hub">Accra Central Hub</option>
                    <option value="Osu Branch">Osu Branch</option>
                    <option value="East Legon Warehouse">East Legon Warehouse</option>
                    <option value="Kumasi Retail Hub">Kumasi Retail Hub</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Shift Schedule</label>
                <select value={shift} onChange={e => setShift(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="Morning Shift (8AM - 4PM)">Morning Shift (8AM - 4PM)</option>
                  <option value="Evening Shift (4PM - 10PM)">Evening Shift (4PM - 10PM)</option>
                  <option value="Full Day Shift (8AM - 8PM)">Full Day Shift (8AM - 8PM)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
