'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorStockPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalItems: 0,
    totalValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    damagedCount: 0,
    expiredCount: 0,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState('stock_in'); // stock_in | stock_out | damaged | expired
  const [adjustQty, setAdjustQty] = useState('10');
  const [adjustReason, setAdjustReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/inventory');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats || {});
        setProducts(data.products || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjustModal = (product: any) => {
    setSelectedProduct(product);
    setAdjustType('stock_in');
    setAdjustQty('10');
    setAdjustReason('Restock shipment');
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!adjustQty || Number(adjustQty) <= 0) {
      showToast('Please enter a valid positive quantity', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct._id,
          type: adjustType,
          quantity: Number(adjustQty),
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed');

      showToast(data.message || 'Inventory updated!', 'success');
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err: any) {
      showToast(err.message || 'Adjustment error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 6 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Stock & Audit Log', path: '/vendor/inventory', active: true, icon: 'inventory' },
          { label: 'Warehouses', path: '/vendor/inventory/warehouses', active: false, icon: 'warehouse' },
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

      {/* Top 6 Inventory Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { title: 'Total Products', value: stats.totalItems, icon: 'inventory_2', bg: '#dcfce7', color: '#16a34a' },
          { title: 'Inventory Valuation', value: `GH₵ ${stats.totalValuation?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'payments', bg: '#dbeafe', color: '#2563eb' },
          { title: 'Low Stock Alerts', value: stats.lowStockCount, icon: 'warning', bg: stats.lowStockCount > 0 ? '#fee2e2' : '#dcfce7', color: stats.lowStockCount > 0 ? '#dc2626' : '#16a34a' },
          { title: 'Out of Stock', value: stats.outOfStockCount, icon: 'block', bg: '#f1f5f9', color: '#64748b' },
          { title: 'Damaged Stock', value: stats.damagedCount || 0, icon: 'broken_image', bg: '#fef3c7', color: '#d97706' },
          { title: 'Expired Products', value: stats.expiredCount || 0, icon: 'event_busy', bg: '#f1f5f9', color: '#475569' },
        ].map((card, idx) => (
          <div key={idx} style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: '14px 16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{card.title}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{card.icon}</span>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              {loading ? '...' : card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Stock Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Live Stock Inventory
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Monitor inventory levels across all warehouse storage facilities and perform manual Stock In / Stock Out adjustments.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading stock levels...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Product</th>
                  <th style={{ padding: '10px 8px' }}>SKU</th>
                  <th style={{ padding: '10px 8px' }}>Unit Price</th>
                  <th style={{ padding: '10px 8px' }}>Stock Qty</th>
                  <th style={{ padding: '10px 8px' }}>Total Stock Value</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Quick Adjust</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const title = p.title || p.name;
                  const img = p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200';
                  const totalVal = (p.price || 0) * (p.stock || 0);

                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, backgroundColor: '#f1f5f9' }}>
                            <Image src={img} alt={title} fill style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>{p.sku || 'AFR-PRD-101'}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>GH₵ {(p.price || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 900, color: p.stock <= 5 ? '#dc2626' : '#0f172a' }}>{p.stock} units</td>
                      <td style={{ padding: '10px 8px', fontWeight: 800, color: '#10b981' }}>GH₵ {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: p.stock <= 0 ? '#fee2e2' : p.stock <= 5 ? '#fef3c7' : '#dcfce7',
                          color: p.stock <= 0 ? '#dc2626' : p.stock <= 5 ? '#d97706' : '#16a34a',
                        }}>
                          {p.stock <= 0 ? 'OUT OF STOCK' : p.stock <= 5 ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenAdjustModal(p)}
                          style={{ padding: '5px 10px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Inventory Audit Trail Log */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
          Inventory Audit Trail History
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {auditLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 20,
                  color: log.type === 'Stock In' ? '#16a34a' : log.type === 'Damaged' || log.type === 'Expired' ? '#dc2626' : '#2563eb',
                }}>
                  {log.type === 'Stock In' ? 'add_circle' : 'remove_circle'}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{log.product} — <span style={{ color: log.type === 'Stock In' ? '#16a34a' : '#dc2626' }}>{log.quantity} units ({log.type})</span></div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Reason: {log.reason} • By {log.user}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{log.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Adjust Stock Level</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 16, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8 }}>
              Product: {selectedProduct.title || selectedProduct.name} (Current Stock: {selectedProduct.stock})
            </div>

            <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Adjustment Action</label>
                <select value={adjustType} onChange={e => setAdjustType(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="stock_in">Stock In (+ Restock)</option>
                  <option value="stock_out">Stock Out (- Sale/Shrinkage)</option>
                  <option value="damaged">Damaged Goods (- Write-Off)</option>
                  <option value="expired">Expired Products (- Write-Off)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Quantity Units *</label>
                <input type="number" min={1} value={adjustQty} onChange={e => setAdjustQty(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Adjustment Reason / Note</label>
                <input type="text" placeholder="e.g. Restock PO-1002 received from Accra Textiles" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  {submitting ? 'Applying...' : 'Apply Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
