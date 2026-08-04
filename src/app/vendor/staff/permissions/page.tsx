'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorStaffPermissionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    'Product Catalog Management': { 'Store Manager': true, 'POS Cashier': false, 'Inventory Specialist': true },
    'POS Terminal Checkout': { 'Store Manager': true, 'POS Cashier': true, 'Inventory Specialist': false },
    'Order Fulfillment & Shipping': { 'Store Manager': true, 'POS Cashier': false, 'Inventory Specialist': true },
    'Inventory Stock Adjustments': { 'Store Manager': true, 'POS Cashier': false, 'Inventory Specialist': true },
    'Payout Withdrawals & Banking': { 'Store Manager': true, 'POS Cashier': false, 'Inventory Specialist': false },
    'Store Settings & Logistics': { 'Store Manager': true, 'POS Cashier': false, 'Inventory Specialist': false },
  });

  const togglePermission = (moduleName: string, role: string) => {
    setPermissions(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [role]: !prev[moduleName][role],
      },
    }));
    showToast(`Updated ${role} permission for ${moduleName}`, 'info');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 11 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Employees Directory', path: '/vendor/staff', active: false, icon: 'badge' },
          { label: 'Roles & Shifts', path: '/vendor/staff/roles', active: false, icon: 'admin_panel_settings' },
          { label: 'Permissions Matrix', path: '/vendor/staff/permissions', active: true, icon: 'key' },
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

      {/* Main Permissions Matrix Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Granular Role Access Permissions Matrix
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Enable or restrict employee access rights across portal modules.
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
              <th style={{ padding: '12px 10px' }}>Module Area</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>Store Manager</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>POS Cashier</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>Inventory Specialist</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(permissions).map(mod => (
              <tr key={mod} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '12px 10px', fontWeight: 800, color: '#0f172a' }}>{mod}</td>
                {['Store Manager', 'POS Cashier', 'Inventory Specialist'].map(role => (
                  <td key={role} style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={permissions[mod][role]}
                      onChange={() => togglePermission(mod, role)}
                      style={{ width: 18, height: 18, accentColor: '#10b981', cursor: 'pointer' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
