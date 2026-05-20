'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import { useAdmin, PlatformOrder } from '@/context/AdminContext';
import { OrderChat } from '@/components/OrderChat';
import './orders.css';

const StatusBadge = ({ status }: { status: string }) => {
  const colorMap: Record<string, string> = {
    Delivered: 'var(--lime-400)', Processing: '#00e5ff', Shipped: 'var(--secondary)',
    Pending: '#ff9800', Cancelled: 'var(--error)', Ongoing: '#00e5ff',
    'Picked Up': '#26a69a',
  };
  const c = colorMap[status] || 'var(--on-surface-variant)';
  return (
    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
      backgroundColor: `color-mix(in srgb, ${c} 20%, transparent)`, color: c
    }}>{status}</span>
  );
};

export default function VendorOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<(PlatformOrder & { vendorItemsTotal: number; vendorItemsCount: number }) | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{ orderId: string, newStatus: string, currentStatus: string, note: string } | null>(null);
  const { user } = useAuth();
  const { allOrders, updateOrderStatus } = useAdmin();

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedOrder]);

  if (!user) return null;

  // Filter orders to only those containing this vendor's products
  const vendorOrders = allOrders.filter(o => o.products.some(p => p.vendorEmail === user.email)).map(o => {
    const vendorItemsTotal = o.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const vendorItemsCount = o.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((sum, p) => sum + p.quantity, 0);
    return { ...o, vendorItemsTotal, vendorItemsCount };
  });

  const tabs = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const filtered = vendorOrders.filter(o => {
    const status = o.status.toLowerCase();
    const matchesTab = activeTab === 'all' || 
                      status === activeTab || 
                      (activeTab === 'processing' && (status === 'ongoing' || status === 'pending'));
    const matchesSearch = !searchQuery ||
      (o.id || (o as any).orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalRevenue = vendorOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.vendorItemsTotal, 0);
  const pendingCount = vendorOrders.filter(o => o.status === 'Pending').length;
  const processingCount = vendorOrders.filter(o => o.status === 'Processing' || o.status === 'Ongoing').length;

  return (
    <div className="orders-container animate-fade-in-up">
      <div className="orders-header">
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Store Orders</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Manage your store's orders and fulfillment</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Orders', val: vendorOrders.length, icon: 'receipt_long', color: 'var(--lime-400)' },
          { label: 'Pending', val: pendingCount, icon: 'pending', color: '#ff9800' },
          { label: 'Processing', val: processingCount, icon: 'autorenew', color: '#00e5ff' },
          { label: 'Revenue', val: `GH₵${totalRevenue.toFixed(2)}`, icon: 'payments', color: 'var(--lime-400)' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <div className="font-lexend" style={{ fontSize: '1.4rem', fontWeight: 600 }}>{stat.val}</div>
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
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search ID, customer..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.4 }}>receipt_long</span>
            <p style={{ fontSize: '1rem', marginBottom: '4px', fontWeight: 500 }}>No orders found</p>
            <p style={{ fontSize: '0.85rem' }}>Your store's orders will appear here.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="order-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
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
                          <span style={{ fontWeight: 500 }}>{order.customerName}</span>
                          <br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{order.customerEmail}</span>
                        </div>
                      </td>
                      <td data-label="Items">
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'inherit' }}>
                          {order.products.map((p, i) => (
                            <div key={i} style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--surface-container-highest)', border: p.vendorEmail === user.email ? '2px solid var(--lime-400)' : 'none' }}>
                              {p.image && <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                          )).slice(0, 4)}
                          {order.products.length > 4 && <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600 }}>+{order.products.length - 4}</div>}
                        </div>
                      </td>
                      <td data-label="Amount" style={{ fontWeight: 600 }}>GH₵{order.total.toFixed(2)}</td>
                      <td data-label="Status"><StatusBadge status={order.status} /></td>
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
            {/* Modal Header */}
            <div className="order-modal-header">
              <div>
                <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Order Detail</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>ID: {selectedOrder.id || (selectedOrder as any).orderId}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'var(--surface-container-high)', border: 'none', cursor: 'pointer', color: 'var(--on-surface)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ padding: '0 24px 16px' }}>
              <button 
                onClick={() => setShowChat(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: '1px solid #00e5ff', background: 'rgba(0,229,255,0.05)', color: '#00e5ff', fontWeight: 700, cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
                Chat with Customer
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="order-modal-body">
              {/* Quick Info Grid */}
              <div className="order-quick-info">
                <div style={{ padding: '16px', background: 'var(--surface-container)', borderRadius: '20px', border: '1px solid var(--outline)' }}>
                  <span className="detail-label" style={{ fontSize: '0.7rem' }}>Order Status</span>
                  <div style={{ marginTop: '8px' }}>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                </div>
                <div style={{ padding: '16px', background: 'color-mix(in srgb, var(--lime-400) 8%, var(--surface-container))', borderRadius: '20px', border: '1px solid color-mix(in srgb, var(--lime-400) 20%, var(--outline))' }}>
                  <span className="detail-label" style={{ fontSize: '0.7rem', color: 'var(--lime-400)' }}>Total Paid Amount</span>
                  <div className="font-lexend" style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '4px', color: 'var(--lime-400)' }}>GH₵{selectedOrder.total.toFixed(2)}</div>
                </div>
              </div>

              {/* Extra Info for Vendor */}
              <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'var(--surface-container-high)', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--lime-400)' }}>storefront</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your Store Earnings</span>
                </div>
                <span className="font-lexend" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--lime-400)' }}>GH₵{selectedOrder.vendorItemsTotal.toFixed(2)}</span>
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
                    Shipping Details
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
                      <span className="detail-label">City / Town</span>
                      <span className="detail-value">{selectedOrder.shippingAddress?.city}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Region</span>
                      <span className="detail-value">{selectedOrder.shippingAddress?.region || 'N/A'}</span>
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section className="detail-section">
                  <h4 className="detail-section-title">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                    Payment Information
                  </h4>
                  <div className="detail-card">
                    <div className="detail-row">
                      <span className="detail-label">Method</span>
                      <span className="detail-value" style={{ color: 'var(--lime-400)' }}>{selectedOrder.paymentInfo?.method || 'Mobile Money'}</span>
                    </div>
                    {selectedOrder.paymentInfo?.network && (
                      <div className="detail-row">
                        <span className="detail-label">Network</span>
                        <span className="detail-value">{selectedOrder.paymentInfo.network}</span>
                      </div>
                    )}
                    {selectedOrder.paymentInfo?.momoPhone && (
                      <div className="detail-row">
                        <span className="detail-label">Account No.</span>
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
                  Order Items ({selectedOrder.products.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedOrder.products.map((p, i) => (
                    <div key={i} className="order-product-item" style={{ border: p.vendorEmail === user.email ? '1px solid var(--lime-400)' : '1px solid var(--outline)' }}>
                      <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Qty: {p.quantity}</span>
                          {p.selectedSize && <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Size: {p.selectedSize}</span>}
                          {p.vendorEmail === user.email && <span style={{ fontSize: '0.75rem', color: 'var(--lime-400)', fontWeight: 600 }}>(Your Item)</span>}
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

            {/* Action Footer */}
            <div className="order-modal-footer">
              <button onClick={() => setSelectedOrder(null)} style={{ flex: 1, padding: '14px', borderRadius: '16px', border: '1px solid var(--outline)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
              <button onClick={() => window.print()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '16px', border: 'none', background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontWeight: 700, cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
                Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      {showChat && selectedOrder && (
        <OrderChat 
          orderId={selectedOrder.id || (selectedOrder as any).orderId}
          receiverEmail={selectedOrder.customerEmail}
          onClose={() => setShowChat(false)}
        />
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
