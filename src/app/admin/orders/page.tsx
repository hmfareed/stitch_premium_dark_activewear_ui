'use client';

import React, { useState, useEffect, useCallback } from 'react';

type StatusTab = 'all' | 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Order Drawer / Modal States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetailData, setOrderDetailData] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalType, setModalType] = useState<'update_status' | 'assign_delivery' | 'print_invoice' | 'refund' | 'cancel' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formStatus, setFormStatus] = useState('Confirmed');
  const [formNote, setFormNote] = useState('');
  const [formRiderName, setFormRiderName] = useState('');
  const [formRiderPhone, setFormRiderPhone] = useState('');
  const [formTracking, setFormTracking] = useState('');
  const [formRefundReason, setFormRefundReason] = useState('');
  const [formRefundAmount, setFormRefundAmount] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Orders List by Status Tab
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${activeTab}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setOrdersList(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch Full Order Details & Invoice Metadata
  const fetchOrderDetail = async (id: string) => {
    setSelectedOrderId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrderDetailData(data.order);
      }
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Action: Update Status
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: formStatus, note: formNote }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormNote('');
        fetchOrders();
        if (selectedOrderId) fetchOrderDetail(selectedOrderId);
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Assign Delivery Rider
  const handleAssignDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !formRiderName || !formRiderPhone) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_delivery',
          riderName: formRiderName,
          riderPhone: formRiderPhone,
          trackingNumber: formTracking,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchOrders();
        if (selectedOrderId) fetchOrderDetail(selectedOrderId);
      }
    } catch (err) {
      console.error('Assign delivery error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Issue Refund
  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refund',
          refundReason: formRefundReason,
          refundAmount: formRefundAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchOrders();
        if (selectedOrderId) fetchOrderDetail(selectedOrderId);
      }
    } catch (err) {
      console.error('Refund error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Cancel Order
  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${selectedOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', note: formNote }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormNote('');
        fetchOrders();
        if (selectedOrderId) fetchOrderDetail(selectedOrderId);
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={toastStyle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Order Processing & Fulfillment Hub
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Lifecycle order tracking, status advancement, rider assignments, invoices & customer refunds
          </p>
        </div>
      </div>

      {/* 9 Status Navigation Sub-View Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Orders', icon: 'list_alt' },
            { id: 'pending', label: 'Pending', icon: 'hourglass_empty' },
            { id: 'confirmed', label: 'Confirmed', icon: 'check_circle' },
            { id: 'processing', label: 'Processing', icon: 'sync' },
            { id: 'packed', label: 'Packed', icon: 'package_2' },
            { id: 'shipped', label: 'Shipped', icon: 'local_shipping' },
            { id: 'delivered', label: 'Delivered', icon: 'task_alt' },
            { id: 'cancelled', label: 'Cancelled', icon: 'cancel' },
            { id: 'returned', label: 'Returned', icon: 'keyboard_return' },
            { id: 'refunded', label: 'Refunded', icon: 'payments' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as StatusTab)}
              style={{
                border: 'none',
                background: activeTab === tab.id ? '#0f172a' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: 240 }}>
          <input
            type="text"
            placeholder="Search order ID, customer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: 9, fontSize: 18, color: '#94a3b8' }}>
            search
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading order telemetry...</p>
        </div>
      ) : (

        /* Master Orders Data Table */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Orders ({ordersList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Order ID & Date</th>
                  <th style={{ padding: 10 }}>Customer</th>
                  <th style={{ padding: 10 }}>Items</th>
                  <th style={{ padding: 10 }}>Total Amount</th>
                  <th style={{ padding: 10 }}>Order Status</th>
                  <th style={{ padding: 10 }}>Payment & Escrow</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>#{o.orderId}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{o.date}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{o.customerName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{o.customerEmail}</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 700, color: '#475569' }}>
                      {o.itemsCount} item(s)
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>
                      {formatGhs(o.total)}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(getStatusColor(o.status), getStatusBg(o.status))}>
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                        Payment: <span style={{ color: '#16a34a' }}>{o.paymentInfo?.paymentStatus || 'Paid'}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>
                        Escrow: {o.paymentInfo?.escrowStatus || 'Locked'}
                      </div>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* View Order Drawer */}
                        <button onClick={() => fetchOrderDetail(o.orderId)} style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          View Order
                        </button>
                        {/* Update Status */}
                        <button onClick={() => { setSelectedOrderId(o.orderId); setFormStatus(o.status); setModalType('update_status'); }} style={{ border: 'none', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          Update Status
                        </button>
                        {/* Assign Delivery */}
                        <button onClick={() => { setSelectedOrderId(o.orderId); setFormRiderName(o.assignedRiderName || ''); setFormRiderPhone(o.assignedRiderPhone || ''); setFormTracking(o.trackingNumber || ''); setModalType('assign_delivery'); }} style={{ border: 'none', background: '#f3e8ff', color: '#7c3aed', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          Assign Rider
                        </button>
                        {/* Print Invoice */}
                        <button onClick={() => { setSelectedOrderId(o.orderId); setModalType('print_invoice'); }} style={{ border: 'none', background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          Invoice
                        </button>
                        {/* Refund */}
                        <button onClick={() => { setSelectedOrderId(o.orderId); setFormRefundAmount(o.total.toString()); setModalType('refund'); }} style={{ border: 'none', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          Refund
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ORDER DETAILS & TIMELINE TRACKING DRAWER ─────────────────────── */}
      {selectedOrderId && orderDetailData && !modalType && (
        <div style={modalBackdropStyle} onClick={() => setSelectedOrderId(null)}>
          <div style={drawerContentStyle} onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Order #{orderDetailData.orderId}
                  </h2>
                  <span style={badgeStyle(getStatusColor(orderDetailData.status), getStatusBg(orderDetailData.status))}>
                    {orderDetailData.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Date: {orderDetailData.date} • Customer: {orderDetailData.customerName} ({orderDetailData.customerEmail})
                </div>
              </div>

              {/* Drawer Controls */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setFormStatus(orderDetailData.status); setModalType('update_status'); }} style={btnPrimaryStyle}>
                  Update Status
                </button>
                <button onClick={() => setModalType('print_invoice')} style={btnSecondaryStyle}>
                  Print Invoice
                </button>
                <button onClick={() => setSelectedOrderId(null)} style={closeBtnStyle}>×</button>
              </div>
            </div>

            {/* Drawer Body Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 16 }}>
              
              {/* Left Column: Order Items & Delivery Address */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Purchased Items ({orderDetailData.products?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {orderDetailData.products?.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
                      <img src={item.image || '/images/placeholder.png'} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Store: {item.vendorStoreName || 'AfriCart Store'} • Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 900, color: '#16a34a', fontSize: 13 }}>
                        {formatGhs(item.price * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Shipping Address & Rider</h4>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, fontSize: 12 }}>
                  <div><strong>Full Name:</strong> {orderDetailData.shippingAddress?.fullName || orderDetailData.customerName}</div>
                  <div><strong>Address:</strong> {orderDetailData.shippingAddress?.address || 'Independence Ave'}, {orderDetailData.shippingAddress?.city || 'Accra'}</div>
                  <div><strong>Phone:</strong> {orderDetailData.shippingAddress?.phone || '+233 24 000 0000'}</div>
                  {orderDetailData.assignedRiderName && (
                    <div style={{ marginTop: 8, borderTop: '1px solid #e2e8f0', paddingTop: 6, color: '#7c3aed', fontWeight: 800 }}>
                      Assigned Rider: {orderDetailData.assignedRiderName} ({orderDetailData.assignedRiderPhone}) • Tracking: {orderDetailData.trackingNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Timeline Tracking Visual Stream */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Timeline Tracking Stream</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', paddingLeft: 16 }}>
                  {orderDetailData.timeline?.map((t: any, idx: number) => (
                    <div key={idx} style={{ position: 'relative', borderLeft: '2px solid #2563eb', paddingLeft: 14 }}>
                      <div style={{ position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%', background: '#2563eb' }} />
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{t.status.toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{t.description}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{new Date(t.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── MODALS FOR ACTIONS ────────────────────────────────────────── */}

      {/* Modal: Update Status */}
      {modalType === 'update_status' && selectedOrderId && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Update Order Lifecycle Status</h3>
            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Select New Status *</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value)} style={inputStyle}>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Status Note / Audit Reason</label>
                <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="e.g. Items verified at warehouse" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Delivery Rider */}
      {modalType === 'assign_delivery' && selectedOrderId && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Assign Delivery Rider & Tracking</h3>
            <form onSubmit={handleAssignDelivery} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Rider / Driver Name *</label>
                <input type="text" value={formRiderName} onChange={e => setFormRiderName(e.target.value)} placeholder="e.g. Kwame Asante" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Rider Phone Number *</label>
                <input type="text" value={formRiderPhone} onChange={e => setFormRiderPhone(e.target.value)} placeholder="+233 24 555 0192" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Courier Tracking Code</label>
                <input type="text" value={formTracking} onChange={e => setFormTracking(e.target.value)} placeholder="TRK-983210" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Assign & Ship</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Print Invoice */}
      {modalType === 'print_invoice' && selectedOrderId && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={{ ...modalContentStyle, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Tax Invoice #{selectedOrderId}</h3>
              <button onClick={() => window.print()} style={btnPrimaryStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
                <span>Print Invoice</span>
              </button>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: 20, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: '#16a34a' }}>AfriCart Platforms Ltd</div>
                  <div>Ridge, Accra, Ghana</div>
                  <div>Tax ID: GHA-TIN-893201948</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>Invoice: INV-{selectedOrderId}</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ padding: '12px 0' }}>
                <div><strong>Bill To:</strong> {orderDetailData?.customerName || 'Customer'} ({orderDetailData?.customerEmail})</div>
                <div><strong>Delivery Address:</strong> {orderDetailData?.shippingAddress?.address || 'Independence Ave, Accra'}</div>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderBottom: '1px solid #e2e8f0', paddingBottom: 6 }}>
                  <span>Item Description</span>
                  <span>Total (GH₵)</span>
                </div>
                {orderDetailData?.products?.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatGhs(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 14, borderTop: '2px solid #0f172a', paddingTop: 8, marginTop: 8 }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#16a34a' }}>{formatGhs(orderDetailData?.total || 0)}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button onClick={() => setModalType(null)} style={btnSecondaryStyle}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Refund */}
      {modalType === 'refund' && selectedOrderId && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Issue Customer Refund</h3>
            <form onSubmit={handleRefund} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Refund Amount (GH₵) *</label>
                <input type="number" step="0.01" value={formRefundAmount} onChange={e => setFormRefundAmount(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Refund Reason *</label>
                <input type="text" value={formRefundReason} onChange={e => setFormRefundReason(e.target.value)} placeholder="e.g. Returned item in good condition" required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ ...btnPrimaryStyle, background: '#ea580c' }}>Process Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper Color functions
const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    Pending: '#b45309', Confirmed: '#2563eb', Processing: '#0284c7', Packed: '#4338ca',
    Shipped: '#7c3aed', Delivered: '#166534', Cancelled: '#991b1b', Returned: '#dc2626', Refunded: '#ea580c',
  };
  return map[status] || '#475569';
};

const getStatusBg = (status: string) => {
  const map: Record<string, string> = {
    Pending: '#fef3c7', Confirmed: '#dbeafe', Processing: '#e0f2fe', Packed: '#e0e7ff',
    Shipped: '#f3e8ff', Delivered: '#dcfce7', Cancelled: '#fee2e2', Returned: '#fee2e2', Refunded: '#ffedd5',
  };
  return map[status] || '#f1f5f9';
};

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  background: '#0f172a',
  color: '#38bdf8',
  padding: '12px 20px',
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  fontSize: 13,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #0284c7',
};

const btnPrimaryStyle: React.CSSProperties = {
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondaryStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#475569',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 6,
  textTransform: 'uppercase',
});

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 20,
  padding: 24,
  width: '100%',
  maxWidth: 520,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

const drawerContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 24,
  padding: 28,
  width: '100%',
  maxWidth: 960,
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
};

const closeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 24,
  fontWeight: 700,
  color: '#64748b',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  outline: 'none',
};
