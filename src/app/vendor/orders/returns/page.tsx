'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorReturnsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [returns, setReturns] = useState([
    { id: 'ret-1', orderId: '#ORD-9812', customer: 'Esi Mansa', product: 'Pro Compression Leggings', reason: 'Incorrect Size (Requested L instead of M)', status: 'Pending Review', date: 'Aug 3, 2026' },
    { id: 'ret-2', orderId: '#ORD-9640', customer: 'Kofi Owusu', product: 'Training Gym Gloves', reason: 'Minor stitching defect', status: 'Approved', date: 'Jul 28, 2026' },
  ]);

  const handleActionReturn = (retId: string, newStatus: string) => {
    setReturns(prev => prev.map(r => r.id === retId ? { ...r, status: newStatus } : r));
    showToast(`Return request ${newStatus.toLowerCase()}!`, newStatus === 'Approved' ? 'success' : 'info');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 8 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Orders', path: '/vendor/orders', active: false, icon: 'shopping_bag' },
          { label: 'Returns Management', path: '/vendor/orders/returns', active: true, icon: 'assignment_return' },
          { label: 'Refunds Processing', path: '/vendor/orders/refunds', active: false, icon: 'currency_exchange' },
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

      {/* Main Returns Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Customer Returns & Inspection Log
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Review buyer return requests, inspect returned goods, and approve or reject refunds.
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
              <th style={{ padding: '10px 8px' }}>Order ID</th>
              <th style={{ padding: '10px 8px' }}>Customer</th>
              <th style={{ padding: '10px 8px' }}>Product Item</th>
              <th style={{ padding: '10px 8px' }}>Return Reason</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{r.orderId}</td>
                <td style={{ padding: '10px 8px', fontWeight: 700, color: '#334155' }}>{r.customer}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{r.product}</td>
                <td style={{ padding: '10px 8px', color: '#64748b' }}>{r.reason}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: 6,
                    backgroundColor: r.status === 'Approved' ? '#dcfce7' : r.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                    color: r.status === 'Approved' ? '#16a34a' : r.status === 'Rejected' ? '#dc2626' : '#d97706',
                  }}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  {r.status === 'Pending Review' ? (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleActionReturn(r.id, 'Approved')} style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => handleActionReturn(r.id, 'Rejected')} style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Reject</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
