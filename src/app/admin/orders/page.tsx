'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin, PlatformOrder } from '@/context/AdminContext';
import { useAuth, useToast } from '@/context/AppContext';
import './orders.css';

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    Delivered: 'var(--lime-400)', Processing: '#00e5ff', Shipped: 'var(--secondary)',
    Pending: '#ff9800', Cancelled: 'var(--error)', Ongoing: '#00e5ff',
  };
  const c = colorMap[status] || 'var(--on-surface-variant)';
  return (
    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
      backgroundColor: `color-mix(in srgb, ${c} 20%, transparent)`, color: c
    }}>{status}</span>
  );
};

export default function AdminOrdersPage() {
  const { allOrders, pendingOrders, shippedOrders, deliveredOrders, cancelledOrders, totalOrderCount, updateOrderStatus, refreshData } = useAdmin();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PlatformOrder | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{ orderId: string, newStatus: string, currentStatus: string, note: string } | null>(null);

  const handleDeleteAllOrders = async () => {
    if (!user || user.role !== 'super_admin') {
      showToast('Only Super Admins can clear all orders', 'error');
      return;
    }

    if (!confirm('WARNING: This will permanently delete ALL orders from the database. This action cannot be undone. Proceed?')) {
      return;
    }

    setIsDeletingAll(true);
    try {
      const res = await fetch('/api/orders', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('All orders have been deleted.', 'success');
        refreshData();
      } else {
        showToast(`Failed: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  useEffect(() => {
    if (selectedOrder || statusUpdateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedOrder, statusUpdateModal]);

  const tabs = ['all', 'processing', 'shipped', 'delivered', 'cancelled', 'disputed'];

  const filtered = allOrders.filter(o => {
    const status = o.status.toLowerCase();
    const escrowStatus = o.paymentInfo?.escrowStatus?.toLowerCase();
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'disputed' && escrowStatus === 'disputed') ||
                      (activeTab !== 'disputed' && status === activeTab) || 
                      (activeTab === 'processing' && (status === 'ongoing' || status === 'pending'));
    const matchesSearch = !searchQuery ||
      (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((o as any).orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handleResolveDispute = async (orderId: string, resolution: 'Release' | 'Refund') => {
    if (!confirm(`Are you sure you want to resolve this dispute by ${resolution === 'Release' ? 'releasing funds to the vendor' : 'refunding the customer'}?`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: resolution === 'Refund' ? 'Cancelled' : 'Delivered',
          // Admin-authorized dispute resolution — bypasses customer confirmation guard
          customerConfirmed: resolution === 'Release' ? true : undefined,
          'paymentInfo.escrowStatus': resolution === 'Release' ? 'Released' : 'Refunded' 
        })
      });
      if (res.ok) {
        showToast(`Dispute resolved. Funds ${resolution === 'Release' ? 'released' : 'refunded'}.`, 'success');
        setSelectedOrder(null);
        refreshData();
      } else {
        showToast('Failed to resolve dispute.', 'error');
      }
    } catch (err) {
      showToast('Network error.', 'error');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="orders-container animate-fade-in-up">
      <div className="orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Order Control Center</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Real-time orders from customers across the platform</p>
        </div>
        {user?.role === 'super_admin' && (
          <button 
            onClick={handleDeleteAllOrders} 
            disabled={isDeletingAll}
            style={{ 
              padding: '10px 20px', borderRadius: '8px', background: 'var(--error)', border: 'none', 
              color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: isDeletingAll ? 'not-allowed' : 'pointer',
              opacity: isDeletingAll ? 0.6 : 1, transition: 'all 0.2s', fontFamily: 'var(--font-lexend)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete_forever</span>
            {isDeletingAll ? 'CLEARING...' : 'CLEAR ALL ORDERS'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Orders', val: totalOrderCount, icon: 'receipt_long', color: 'var(--lime-400)' },
          { label: 'Processing', val: pendingOrders, icon: 'pending', color: '#ff9800' },
          { label: 'Shipped', val: shippedOrders, icon: 'local_shipping', color: 'var(--secondary)' },
          { label: 'Delivered', val: deliveredOrders, icon: 'check_circle', color: 'var(--lime-400)' },
          { label: 'Cancelled', val: cancelledOrders, icon: 'cancel', color: 'var(--error)' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <div className="font-lexend" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stat.val}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="table-container">
        {/* Tabs & Search */}
        <div className="table-header">
          <div className="tabs-container">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: activeTab === tab ? 600 : 400, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'capitalize',
                  backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface-container)',
                  color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}>
                {tab}
              </button>
            ))}
          </div>
          <div className="search-container">
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: '20px' }}>search</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search ID, name, email..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.4 }}>receipt_long</span>
            <p style={{ fontSize: '1rem', marginBottom: '4px', fontWeight: 500 }}>No orders found</p>
            <p style={{ fontSize: '0.85rem' }}>Orders placed by customers will appear here in real time.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th className="mobile-hide">Vendors</th>
                    <th>Products</th>
                    <th className="mobile-hide">Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="mobile-hide">Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, idx) => (
                    <tr key={order.id + idx} className="order-row">
                      <td data-label="Order ID" style={{ fontWeight: 600 }}>{order.id || (order as any).orderId}</td>
                      <td data-label="Customer">
                        <div style={{ textAlign: 'inherit' }}>
                          <span style={{ fontWeight: 500 }}>{order.customerName || 'Unknown'}</span>
                          <br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{order.customerEmail || ''}</span>
                        </div>
                      </td>
                      <td data-label="Vendors" className="mobile-hide">
                        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {Array.from(new Set((order.products || []).map(p => p.vendorStoreName || p.vendorEmail || 'Platform'))).map((vendor, i) => (
                            <span key={i} style={{ background: 'var(--surface-container-high)', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', width: 'fit-content' }}>{vendor}</span>
                          ))}
                        </div>
                      </td>
                      <td data-label="Products">
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'inherit' }}>
                          {(order.products || []).slice(0, 3).map((p, i) => (
                            <div key={i} style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--surface-container-highest)' }}>
                              {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                          ))}
                          {(order.products || []).length > 3 && <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>+{order.products.length - 3}</div>}
                        </div>
                      </td>
                      <td data-label="Items" className="mobile-hide">{order.items || (order as any).itemsCount}</td>
                      <td data-label="Amount" style={{ fontWeight: 600 }}>GH₵{(order.total || 0).toFixed(2)}</td>
                      <td data-label="Status">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <StatusBadge status={order.status} />
                          {order.paymentInfo?.escrowStatus === 'Disputed' && (
                            <span style={{ 
                              padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, 
                              backgroundColor: 'var(--error)', color: 'white', textTransform: 'uppercase' 
                            }}>
                              DISPUTED
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Date" className="mobile-hide" style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>{order.date}</td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'inherit' }}>
                          <button onClick={() => setSelectedOrder(order)} style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)', color: '#00e5ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="View Details">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                          </button>
                          <select 
                            value={order.status} 
                            onChange={e => setStatusUpdateModal({
                              orderId: order.id || (order as any).orderId || (order as any)._id,
                              newStatus: e.target.value,
                              currentStatus: order.status,
                              note: ''
                            })}
                            disabled={order.status === 'Cancelled'}
                            style={{ 
                              padding: '8px 12px', borderRadius: '10px', backgroundColor: 'var(--surface-container)', 
                              border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', 
                              fontSize: '0.85rem', cursor: (order.status === 'Cancelled') ? 'not-allowed' : 'pointer',
                              opacity: (order.status === 'Cancelled') ? 0.6 : 1
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--outline)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
              Showing {filtered.length} of {totalOrderCount} orders
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div 
          className="order-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="order-detail-modal"
          >
            {/* Modal Header - Fixed */}
            <div className="order-modal-header">
              <div>
                <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Order Detail</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>ID: {selectedOrder.id || (selectedOrder as any).orderId}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'var(--surface-container-high)', border: 'none', cursor: 'pointer', color: 'var(--on-surface)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Content - ONLY this area scrolls */}
            <div className="order-modal-body">
              {/* Quick Info Grid */}
              <div className="order-quick-info">
                <div style={{ padding: '16px', background: 'var(--surface-container)', borderRadius: '20px', border: '1px solid var(--outline)' }}>
                  <span className="detail-label" style={{ fontSize: '0.7rem' }}>Status</span>
                  <div style={{ marginTop: '8px' }}>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'color-mix(in srgb, var(--price-color) 8%, var(--surface-container))', borderRadius: '20px', border: '1px solid color-mix(in srgb, var(--price-color) 20%, var(--outline))' }}>
                  <span className="detail-label" style={{ fontSize: '0.7rem', color: 'var(--price-color)' }}>Total</span>
                  <div className="font-lexend" style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '4px', color: 'var(--price-color)' }}>GH₵{(selectedOrder.total || 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="order-sections-grid">
                {/* Customer */}
                <section className="detail-section">
                  <h4 className="detail-section-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                    Customer
                  </h4>
                  <div className="detail-card">
                    <div className="detail-row">
                      <span className="detail-label">Name</span>
                      <span className="detail-value">{selectedOrder.customerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="detail-value" style={{ fontSize: '0.8rem' }}>{selectedOrder.customerEmail}</span>
                        <button className="copy-btn" onClick={() => copyToClipboard(selectedOrder.customerEmail, 'custemail')}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{copiedId === 'custemail' ? 'check' : 'content_copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Shipping */}
                <section className="detail-section">
                  <h4 className="detail-section-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_shipping</span>
                    Shipping
                  </h4>
                  <div className="detail-card">
                    <div className="detail-row">
                      <span className="detail-label">Recipient</span>
                      <span className="detail-value">{selectedOrder.shippingAddress?.fullName || selectedOrder.customerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Phone</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="detail-value">{selectedOrder.shippingAddress?.phone || 'N/A'}</span>
                        {selectedOrder.shippingAddress?.phone && (
                          <button className="copy-btn" onClick={() => copyToClipboard(selectedOrder.shippingAddress!.phone, 'shipphone')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{copiedId === 'shipphone' ? 'check' : 'content_copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Address</span>
                      <span className="detail-value">{selectedOrder.shippingAddress?.address || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">City</span>
                      <span className="detail-value">{selectedOrder.shippingAddress?.city}</span>
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section className="detail-section">
                  <h4 className="detail-section-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                    Payment
                  </h4>
                  <div className="detail-card">
                    <div className="detail-row">
                      <span className="detail-label">Method</span>
                      <span className="detail-value" style={{ color: 'var(--lime-400)' }}>{selectedOrder.paymentInfo?.method || 'Momo'}</span>
                    </div>
                    {selectedOrder.paymentInfo?.momoPhone && (
                      <div className="detail-row">
                        <span className="detail-label">MoMo No.</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="detail-value">{selectedOrder.paymentInfo.momoPhone}</span>
                          <button className="copy-btn" onClick={() => copyToClipboard(selectedOrder.paymentInfo!.momoPhone!, 'momophone')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{copiedId === 'momophone' ? 'check' : 'content_copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Products List */}
              <section className="detail-section" style={{ marginTop: '12px' }}>
                <h4 className="detail-section-title">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>inventory_2</span>
                  Items ({selectedOrder.products?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedOrder.products || []).map((p, i) => (
                    <div key={i} className="order-product-item">
                      <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Qty: {p.quantity}</span>
                          {p.selectedSize && <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Size: {p.selectedSize}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className="font-lexend" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--on-surface)' }}>GH₵{(p.price * p.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Action Footer - Fixed at bottom */}
            <div className="order-modal-footer">
              <button onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--outline)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
              {selectedOrder.paymentInfo?.escrowStatus === 'Disputed' ? (
                <div style={{ display: 'flex', gap: '8px', flex: 2 }}>
                  <button onClick={() => handleResolveDispute(selectedOrder.id || (selectedOrder as any).orderId || (selectedOrder as any)._id, 'Release')} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--lime-400)', color: 'black', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                    Release Funds
                  </button>
                  <button onClick={() => handleResolveDispute(selectedOrder.id || (selectedOrder as any).orderId || (selectedOrder as any)._id, 'Refund')} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--error)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                    Refund
                  </button>
                </div>
              ) : (
                <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontWeight: 700, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
                  Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {statusUpdateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', borderRadius: 24, padding: 24, border: '1px solid var(--outline)', position: 'relative' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 12, color: 'var(--foreground)' }}>Update Order Status</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: 20 }}>
              You are changing the status of order <strong style={{ color: 'var(--foreground)' }}>#{statusUpdateModal.orderId}</strong> from <span style={{ color: 'var(--secondary)' }}>{statusUpdateModal.currentStatus}</span> to <span style={{ color: 'var(--lime-400)', fontWeight: 700 }}>{statusUpdateModal.newStatus}</span>.
            </p>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: 8 }}>Custom Timeline Note (Optional)</label>
              <textarea 
                placeholder="e.g. Items packed and handed over to courier."
                value={statusUpdateModal.note}
                onChange={e => setStatusUpdateModal({ ...statusUpdateModal, note: e.target.value })}
                style={{ width: '100%', padding: '12px', background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 12, color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none', minHeight: 80, resize: 'vertical', fontFamily: 'var(--font-inter)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="button" 
                onClick={() => setStatusUpdateModal(null)} 
                style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                CANCEL
              </button>
              <button 
                type="button" 
                onClick={() => {
                  updateOrderStatus(statusUpdateModal.orderId, statusUpdateModal.newStatus, statusUpdateModal.note);
                  setStatusUpdateModal(null);
                }} 
                style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'var(--lime-400)', color: '#000', border: 'none', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
