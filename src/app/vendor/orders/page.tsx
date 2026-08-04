'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('all');
  const [search, setSearch] = useState('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [vendorNotes, setVendorNotes] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showWaybillModal, setShowWaybillModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/vendor/orders?status=${statusTab}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, action?: string) => {
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Order status updated to ${newStatus}`, 'success');
      fetchOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleAssignCourier = async (orderId: string, courier: string) => {
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          courier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Courier set to ${courier}`, 'info');
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Courier update failed', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          vendorNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Vendor notes saved!', 'success');
      setSelectedOrder({ ...selectedOrder, notes: vendorNotes });
      fetchOrders();
    } catch (err: any) {
      showToast(err.message || 'Error saving notes', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 8 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Orders', path: '/vendor/orders', active: true, icon: 'shopping_bag' },
          { label: 'Returns Management', path: '/vendor/orders/returns', active: false, icon: 'assignment_return' },
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

      {/* Main Order Pipeline Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Order Fulfillment & Lifecycle Processing
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Accept pending orders, manage packing/shipping pipeline, assign couriers, and print commercial waybills.
            </p>
          </div>
        </div>

        {/* 7 Lifecycle Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 6 }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'processing', label: 'Processing' },
            { id: 'packed', label: 'Packed' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusTab(f.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                fontWeight: statusTab === f.id ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: statusTab === f.id ? '#10b981' : '#ffffff',
                color: statusTab === f.id ? '#ffffff' : '#475569',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading order queue...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>No orders found in this category.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Order ID</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Items Purchased</th>
                  <th style={{ padding: '10px 8px' }}>Total Amount</th>
                  <th style={{ padding: '10px 8px' }}>Assigned Courier</th>
                  <th style={{ padding: '10px 8px' }}>Status Lifecycle</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    
                    {/* Order ID & Date */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 900, color: '#0f172a' }}>{o.orderId}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{o.date}</div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 800, color: '#334155' }}>{o.customerName}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{o.customerPhone}</div>
                    </td>

                    {/* Items */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {o.products.map((p: any, idx: number) => (
                          <span key={idx} style={{ color: '#475569', fontWeight: 600 }}>
                            {p.quantity}x {p.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>
                      GH₵ {o.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Courier Selector */}
                    <td style={{ padding: '10px 8px' }}>
                      <select
                        value={o.courier}
                        onChange={e => handleAssignCourier(o._id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11, color: '#0f172a', fontWeight: 700 }}
                      >
                        <option value="AfriCart Dedicated Rider">AfriCart Dedicated Rider</option>
                        <option value="Yango Express Courier">Yango Express Courier</option>
                        <option value="FedEx Ghana Logistics">FedEx Ghana Logistics</option>
                      </select>
                    </td>

                    {/* Lifecycle Status Dropdown */}
                    <td style={{ padding: '10px 8px' }}>
                      <select
                        value={o.status}
                        onChange={e => handleUpdateStatus(o._id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 900,
                          border: 'none',
                          backgroundColor: o.status === 'Delivered' ? '#dcfce7' : o.status === 'Processing' ? '#dbeafe' : o.status === 'Packed' ? '#fef3c7' : o.status === 'Shipped' ? '#e0e7ff' : '#f1f5f9',
                          color: o.status === 'Delivered' ? '#16a34a' : o.status === 'Processing' ? '#2563eb' : o.status === 'Packed' ? '#d97706' : o.status === 'Shipped' ? '#4f46e5' : '#475569',
                        }}
                      >
                        <option value="Pending">PENDING</option>
                        <option value="Processing">PROCESSING</option>
                        <option value="Packed">PACKED</option>
                        <option value="Shipped">SHIPPED</option>
                        <option value="Delivered">DELIVERED</option>
                        <option value="Cancelled">CANCELLED</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {o.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(o._id, 'Processing', 'accept')}
                              style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(o._id, 'Cancelled', 'reject')}
                              style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => { setSelectedOrder(o); setVendorNotes(o.notes || ''); }}
                          style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                        >
                          Details
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Order Details Modal Drawer with Timeline & Printing */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 640, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Order Details: {selectedOrder.orderId}</h3>
                <div style={{ fontSize: 12, color: '#64748b' }}>Placed on {selectedOrder.date} • Courier: {selectedOrder.courier}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Visual Step Timeline */}
            <div style={{ marginBottom: 24, backgroundColor: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Visual Order Status Timeline</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {[
                  { step: 'Placed', icon: 'shopping_cart' },
                  { step: 'Processing', icon: 'check_circle' },
                  { step: 'Packed', icon: 'inventory_2' },
                  { step: 'Shipped', icon: 'local_shipping' },
                  { step: 'Delivered', icon: 'task_alt' },
                ].map((s, idx) => {
                  const active = selectedOrder.status === s.step || (idx === 0) || (selectedOrder.status === 'Delivered');
                  return (
                    <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 2 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: active ? '#10b981' : '#cbd5e1', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{s.icon}</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: active ? '#10b981' : '#94a3b8' }}>{s.step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer & Shipping Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>CUSTOMER DETAILS</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{selectedOrder.customerName}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{selectedOrder.customerEmail}</div>
                <div style={{ fontSize: 12, color: '#475569' }}>{selectedOrder.customerPhone}</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>SHIPPING ADDRESS</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{selectedOrder.shippingAddress}</div>
                <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800, marginTop: 4 }}>Tracking #: {selectedOrder.trackingNumber}</div>
              </div>
            </div>

            {/* Items Summary */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Order Items</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedOrder.products.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: '#f8fafc' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{item.quantity}x {item.name}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#10b981' }}>GH₵ {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Vendor Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Private Vendor Notes</label>
              <textarea
                rows={2}
                placeholder="Add fulfillment notes, courier tracking details, or packaging notes..."
                value={vendorNotes}
                onChange={e => setVendorNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontFamily: 'inherit' }}
              />
              <button
                onClick={handleSaveNotes}
                disabled={submitting}
                style={{ marginTop: 6, padding: '6px 12px', borderRadius: 6, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
              >
                Save Notes
              </button>
            </div>

            {/* Print Invoices & Shipping Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                  Print Invoice
                </button>
                <button
                  onClick={() => setShowWaybillModal(true)}
                  style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>qr_code_2</span>
                  Print Shipping Label
                </button>
              </div>

              <button onClick={() => setSelectedOrder(null)} style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Close</button>
            </div>

          </div>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {showInvoiceModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', padding: 36, borderRadius: 16, maxWidth: 580, width: '100%', color: '#0f172a', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontWeight: 900 }}>COMMERCIAL INVOICE</h2>
                <div style={{ fontSize: 12, color: '#64748b' }}>AfriCart Vendor Store</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800 }}>Invoice #: {selectedOrder.orderId}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Date: {selectedOrder.date}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, marginBottom: 20 }}>
              <strong>Billed To:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})<br />
              <strong>Shipping Address:</strong> {selectedOrder.shippingAddress}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: 6 }}>Item</th>
                  <th style={{ padding: 6 }}>Qty</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.products.map((item: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 6 }}>{item.name}</td>
                    <td style={{ padding: 6 }}>{item.quantity}</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>GH₵ {(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', fontWeight: 900, fontSize: 15, marginBottom: 24 }}>
              TOTAL: GH₵ {selectedOrder.totalAmount.toFixed(2)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowInvoiceModal(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Close</button>
              <button onClick={() => window.print()} style={{ padding: '8px 18px', borderRadius: 6, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Print Now</button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Shipping Label Modal */}
      {showWaybillModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', padding: 28, borderRadius: 16, maxWidth: 420, width: '100%', border: '2px solid #000', color: '#0f172a', fontFamily: 'monospace' }}>
            <div style={{ borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 14, textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontFamily: 'sans-serif' }}>AFRICART EXPRESS WAYBILL</h3>
              <div style={{ fontSize: 11 }}>Courier: {selectedOrder.courier}</div>
            </div>

            <div style={{ fontSize: 12, marginBottom: 14, lineHeight: 1.5 }}>
              <div><strong>SHIP TO:</strong></div>
              <div style={{ fontSize: 14, fontWeight: 900 }}>{selectedOrder.customerName}</div>
              <div>{selectedOrder.customerPhone}</div>
              <div>{selectedOrder.shippingAddress}</div>
            </div>

            {/* Barcode Mock */}
            <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '14px 0', textAlign: 'center', margin: '14px 0' }}>
              <div style={{ fontSize: 24, letterSpacing: 4, fontFamily: 'monospace' }}>||| | |||| || | |||| ||</div>
              <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4 }}>{selectedOrder.trackingNumber}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowWaybillModal(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontFamily: 'sans-serif' }}>Close</button>
              <button onClick={() => window.print()} style={{ padding: '8px 18px', borderRadius: 6, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'sans-serif' }}>Print Label</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
