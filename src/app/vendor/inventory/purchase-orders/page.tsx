'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorPurchaseOrdersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [supplier, setSupplier] = useState('Accra Textile & Activewear Supplies');
  const [itemsCount, setItemsCount] = useState('100');
  const [totalCost, setTotalCost] = useState('8500.00');
  const [expectedDelivery, setExpectedDelivery] = useState('Aug 12, 2026');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/inventory/suppliers');
      const data = await res.json();
      if (res.ok) {
        setPurchaseOrders(data.purchaseOrders || []);
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error('Failed to load POs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_po',
          purchaseOrder: {
            supplier,
            itemsCount: Number(itemsCount),
            totalCost: Number(totalCost),
            expectedDelivery,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Purchase Order generated and sent to supplier!', 'success');
      setPurchaseOrders(data.purchaseOrders || []);
      setShowAddModal(false);
    } catch (err: any) {
      showToast(err.message || 'PO creation error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveGoods = async (po: any) => {
    try {
      const res = await fetch('/api/vendor/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'receive_po',
          purchaseOrder: po,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Goods received! Inventory automatically replenished.', 'success');
      setPurchaseOrders(data.purchaseOrders || []);
    } catch (err: any) {
      showToast(err.message || 'Receipt error', 'error');
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
          { label: 'Transfers', path: '/vendor/inventory/transfers', active: false, icon: 'swap_horiz' },
          { label: 'Suppliers', path: '/vendor/inventory/suppliers', active: false, icon: 'local_shipping' },
          { label: 'Purchase Orders', path: '/vendor/inventory/purchase-orders', active: true, icon: 'receipt_long' },
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

      {/* Main PO Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Purchase Orders & Stock Replenishment
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Generate POs for suppliers, track expected delivery dates, and confirm goods receipt.
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
            Create Purchase Order
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading purchase orders...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>PO Number</th>
                <th style={{ padding: '10px 8px' }}>Supplier Company</th>
                <th style={{ padding: '10px 8px' }}>Items</th>
                <th style={{ padding: '10px 8px' }}>Total Cost</th>
                <th style={{ padding: '10px 8px' }}>Expected Delivery</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map(po => (
                <tr key={po.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>#{po.id}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#475569' }}>{po.supplier}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800 }}>{po.itemsCount} units</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#10b981' }}>GH₵ {po.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{po.expectedDelivery}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: po.status === 'Received' ? '#dcfce7' : '#fef3c7',
                      color: po.status === 'Received' ? '#16a34a' : '#d97706',
                    }}>
                      {po.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    {po.status !== 'Received' ? (
                      <button
                        onClick={() => handleReceiveGoods(po)}
                        style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                      >
                        Receive Goods
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>✓ Fulfilled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add PO Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Generate Purchase Order</h3>
            <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Select Supplier *</label>
                <select value={supplier} onChange={e => setSupplier(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.companyName}>{s.companyName}</option>
                  ))}
                  <option value="Accra Textile & Activewear Supplies">Accra Textile & Activewear Supplies</option>
                  <option value="West Africa Athletic Footwear Ltd">West Africa Athletic Footwear Ltd</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Items Count Units</label>
                  <input type="number" min={1} value={itemsCount} onChange={e => setItemsCount(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Total Cost (GH₵)</label>
                  <input type="number" step="0.01" value={totalCost} onChange={e => setTotalCost(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Expected Delivery Date</label>
                <input type="text" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} placeholder="e.g. Aug 12, 2026" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Dispatch PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
