'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorWarehousesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('5,000 units');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/inventory/transfers');
      const data = await res.json();
      if (res.ok) setWarehouses(data.warehouses || []);
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Warehouse name is required', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_warehouse', name: name.trim(), location, capacity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Warehouse center registered!', 'success');
      setWarehouses(data.warehouses || []);
      setShowAddModal(false);
      setName('');
      setLocation('');
    } catch (err: any) {
      showToast(err.message || 'Error creating warehouse', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 6 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Stock & Audit Log', path: '/vendor/inventory', active: false, icon: 'inventory' },
          { label: 'Warehouses', path: '/vendor/inventory/warehouses', active: true, icon: 'warehouse' },
          { label: 'Stock Adjustments', path: '/vendor/inventory/adjustments', active: false, icon: 'edit_note' },
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

      {/* Main Warehouses Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Warehouse Storage Centers
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Manage physical warehouse facilities, storage capacities, and fulfillment hubs.
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add Warehouse
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading warehouses...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {warehouses.map(wh => (
              <div key={wh.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 22 }}>warehouse</span>
                    <span>{wh.name}</span>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                    ACTIVE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569', marginBottom: 16 }}>
                  <div><strong>Location:</strong> {wh.location}</div>
                  <div><strong>Manager:</strong> {wh.manager}</div>
                  <div><strong>Capacity:</strong> {wh.capacity}</div>
                </div>

                {/* Capacity Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
                    <span>Storage Utilization</span>
                    <span>64% Occupied</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '64%', backgroundColor: '#10b981', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Add Storage Warehouse</h3>
            <form onSubmit={handleAddWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Facility Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tema Port Logistics Hub" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Physical Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Tema Industrial Area" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Storage Capacity Limit</label>
                <input type="text" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="10,000 units" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Register Warehouse</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
