'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorStockAdjustmentsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/inventory');
      const data = await res.json();
      if (res.ok) setLogs(data.auditLogs || []);
    } catch (err) {
      console.error('Failed to fetch adjustments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (filterType === 'all') return true;
    if (filterType === 'in') return l.type === 'Stock In';
    if (filterType === 'out') return l.type === 'Stock Out';
    if (filterType === 'damaged') return l.type === 'Damaged';
    if (filterType === 'expired') return l.type === 'Expired';
    return true;
  });

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 6 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Stock & Audit Log', path: '/vendor/inventory', active: false, icon: 'inventory' },
          { label: 'Warehouses', path: '/vendor/inventory/warehouses', active: false, icon: 'warehouse' },
          { label: 'Stock Adjustments', path: '/vendor/inventory/adjustments', active: true, icon: 'edit_note' },
          { label: 'Transfers', path: '/vendor/inventory/transfers', active: false, icon: 'swap_horiz' },
          { label: 'Suppliers', path: '/vendor/inventory/suppliers', active: false, icon: 'local_shipping' },
          { label: 'Purchase Orders', path: '/vendor/inventory/purchase-orders', active: false, icon: 'receipt_long' },
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

      {/* Main Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Stock Adjustments Log
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Record of manual Stock In, Stock Out, Damaged Stock, and Expired Goods write-offs.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all', label: 'All Adjustments' },
              { id: 'in', label: 'Stock In' },
              { id: 'out', label: 'Stock Out' },
              { id: 'damaged', label: 'Damaged' },
              { id: 'expired', label: 'Expired' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: filterType === f.id ? '#10b981' : '#ffffff',
                  color: filterType === f.id ? '#ffffff' : '#475569',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading adjustment logs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Date</th>
                <th style={{ padding: '10px 8px' }}>Product Title</th>
                <th style={{ padding: '10px 8px' }}>Adjustment Type</th>
                <th style={{ padding: '10px 8px' }}>Quantity</th>
                <th style={{ padding: '10px 8px' }}>Reason / Notes</th>
                <th style={{ padding: '10px 8px' }}>Logged By</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600, color: '#64748b' }}>{l.date}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{l.product}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: l.type === 'Stock In' ? '#dcfce7' : l.type === 'Damaged' || l.type === 'Expired' ? '#fee2e2' : '#dbeafe',
                      color: l.type === 'Stock In' ? '#16a34a' : l.type === 'Damaged' || l.type === 'Expired' ? '#dc2626' : '#2563eb',
                    }}>
                      {l.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: l.quantity.startsWith('+') ? '#16a34a' : '#dc2626' }}>
                    {l.quantity} units
                  </td>
                  <td style={{ padding: '10px 8px', color: '#475569' }}>{l.reason}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b', fontWeight: 600 }}>{l.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
