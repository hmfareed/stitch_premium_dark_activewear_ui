'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorTransfersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [source, setSource] = useState('Accra Main Central Hub');
  const [destination, setDestination] = useState('Osu Branch Store');
  const [product, setProduct] = useState('Pro Compression Leggings');
  const [quantity, setQuantity] = useState('20');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/inventory/transfers');
      const data = await res.json();
      if (res.ok) {
        setTransfers(data.transfers || []);
        setWarehouses(data.warehouses || []);
      }
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination) { showToast('Source and destination required', 'error'); return; }
    if (source === destination) { showToast('Source and destination cannot be identical', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_transfer',
          source,
          destination,
          product,
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Transfer order created and dispatched!', 'success');
      setTransfers(data.transfers || []);
      setShowAddModal(false);
    } catch (err: any) {
      showToast(err.message || 'Transfer failed', 'error');
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
          { label: 'Warehouses', path: '/vendor/inventory/warehouses', active: false, icon: 'warehouse' },
          { label: 'Stock Adjustments', path: '/vendor/inventory/adjustments', active: false, icon: 'edit_note' },
          { label: 'Transfers', path: '/vendor/inventory/transfers', active: true, icon: 'swap_horiz' },
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

      {/* Main Transfers Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Inter-Branch & Warehouse Transfers
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Transfer goods between central fulfillment centers and retail store branches.
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_horiz</span>
            New Transfer Order
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading transfer orders...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Transfer ID</th>
                <th style={{ padding: '10px 8px' }}>Source Warehouse</th>
                <th style={{ padding: '10px 8px' }}>Destination Facility</th>
                <th style={{ padding: '10px 8px' }}>Product</th>
                <th style={{ padding: '10px 8px' }}>Quantity</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(tr => (
                <tr key={tr.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>#{tr.id}</td>
                  <td style={{ padding: '10px 8px', color: '#475569', fontWeight: 600 }}>{tr.source}</td>
                  <td style={{ padding: '10px 8px', color: '#10b981', fontWeight: 700 }}>{tr.destination}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0f172a' }}>{tr.product}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900 }}>{tr.quantity} units</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: tr.status === 'Completed' ? '#dcfce7' : '#dbeafe',
                      color: tr.status === 'Completed' ? '#16a34a' : '#2563eb',
                    }}>
                      {tr.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{tr.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Transfer Order Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Create Transfer Order</h3>
            <form onSubmit={handleCreateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Source Storage Facility *</label>
                <select value={source} onChange={e => setSource(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="Accra Main Central Hub">Accra Main Central Hub</option>
                  <option value="Osu Branch Depot">Osu Branch Depot</option>
                  <option value="East Legon Dispatch Warehouse">East Legon Dispatch Warehouse</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Destination Store Branch *</label>
                <select value={destination} onChange={e => setDestination(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="Osu Branch Store">Osu Branch Store</option>
                  <option value="East Legon Depot">East Legon Depot</option>
                  <option value="Accra Main Central Hub">Accra Main Central Hub</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Product Item</label>
                <input type="text" value={product} onChange={e => setProduct(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Transfer Quantity Units</label>
                <input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Dispatch Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
