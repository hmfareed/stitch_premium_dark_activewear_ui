'use client';

import React, { useState, useEffect, useCallback } from 'react';

type DrawerTab = 'profile' | 'orders' | 'points' | 'wallet' | 'addresses' | 'reviews' | 'tickets' | 'blacklist';

export default function AdminCustomersPage() {
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blacklisted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Customer Drawer & Tab State
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('profile');
  const [customerDetail, setCustomerDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals & Action States
  const [modalType, setModalType] = useState<'create' | 'points' | 'wallet' | 'blacklist' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const [formPointsDelta, setFormPointsDelta] = useState('100');
  const [formWalletDelta, setFormWalletDelta] = useState('50.00');
  const [formBlacklistReason, setFormBlacklistReason] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Customers List
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/customers?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setCustomersList(data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch Full Customer Details for 8 Feature Tabs
  const openCustomerDrawer = async (customer: any) => {
    setSelectedCustomer(customer);
    setDrawerTab('profile');
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`);
      const data = await res.json();
      if (data.success) {
        setCustomerDetail(data);
      }
    } catch (err) {
      console.error('Error fetching customer detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Action: Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, phone: formPhone, email: formEmail }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchCustomers();
      } else {
        alert(data.message || 'Creation failed');
      }
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Adjust Loyalty Points
  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adjust_points', pointsDelta: formPointsDelta }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        openCustomerDrawer(selectedCustomer);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Adjust points error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Adjust Wallet Balance
  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adjust_wallet', walletDelta: formWalletDelta }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        openCustomerDrawer(selectedCustomer);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Adjust wallet error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Blacklist / Ban
  const handleToggleBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_blacklist', blacklistReason: formBlacklistReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormBlacklistReason('');
        openCustomerDrawer(selectedCustomer);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Toggle blacklist error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormPhone(''); setFormEmail('');
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
            Customer Governance Portal
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Customer profiles, order history, loyalty rewards, wallet balance, address book, reviews & blacklisting
          </p>
        </div>

        {/* Action Button */}
        <button onClick={() => { resetForm(); setModalType('create'); }} style={btnPrimaryStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Telemetry Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Total Registered Customers</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{customersList.length} Buyers</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Total Loyalty Points Issued</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>
            {customersList.reduce((sum, c) => sum + (c.points || 0), 0).toLocaleString()} PTS
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Total Customer Wallet Balances</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
            {formatGhs(customersList.reduce((sum, c) => sum + (c.walletBalance || 0), 0))}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'active', label: 'Active Buyers' },
            { id: 'blacklisted', label: 'Blacklisted / Banned' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              style={{
                background: statusFilter === f.id ? '#0f172a' : '#ffffff',
                color: statusFilter === f.id ? '#ffffff' : '#64748b',
                fontWeight: statusFilter === f.id ? 800 : 600,
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                border: statusFilter === f.id ? '1px solid #0f172a' : '1px solid #cbd5e1',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            placeholder="Search name, phone, email..."
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

      {/* Master Data Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading customer directory...</p>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Customer Name</th>
                  <th style={{ padding: 10 }}>Phone & Email</th>
                  <th style={{ padding: 10 }}>Loyalty Points</th>
                  <th style={{ padding: 10 }}>Wallet Balance</th>
                  <th style={{ padding: 10 }}>Account Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customersList.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>
                      {c.name}
                    </td>
                    <td style={{ padding: 12, color: '#475569' }}>
                      <div style={{ fontWeight: 700 }}>{c.phone}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.email}</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#7c3aed' }}>
                      {c.points} PTS
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>
                      {formatGhs(c.walletBalance)}
                    </td>
                    <td style={{ padding: 12 }}>
                      {c.isBlacklisted ? (
                        <span style={badgeStyle('#dc2626', '#fee2e2')}>BLACKLISTED</span>
                      ) : (
                        <span style={badgeStyle('#166534', '#dcfce7')}>ACTIVE</span>
                      )}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => openCustomerDrawer(c)} style={{ border: 'none', background: '#f1f5f9', color: '#0f172a', padding: '6px 12px', borderRadius: 8, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
                        View 8-Tab Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 8-TAB CUSTOMER DETAILS DRAWER ────────────────────────────── */}
      {selectedCustomer && (
        <div style={modalBackdropStyle} onClick={() => setSelectedCustomer(null)}>
          <div style={{ ...modalContentStyle, maxWidth: 840, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedCustomer.name}</h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>{selectedCustomer.email} • {selectedCustomer.phone}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 800 }}>✕</button>
            </div>

            {/* 8 Feature Sub-Tabs Header */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', borderBottom: '1px solid #e2e8f0', paddingBottom: 10, marginBottom: 16 }}>
              {[
                { id: 'profile', label: 'Profiles', icon: 'badge' },
                { id: 'orders', label: 'Purchase History', icon: 'shopping_bag' },
                { id: 'points', label: 'Loyalty Points', icon: 'stars' },
                { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
                { id: 'addresses', label: 'Addresses', icon: 'location_on' },
                { id: 'reviews', label: 'Reviews', icon: 'star' },
                { id: 'tickets', label: 'Support Tickets', icon: 'support_agent' },
                { id: 'blacklist', label: 'Blacklist', icon: 'block' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDrawerTab(t.id as DrawerTab)}
                  style={{
                    border: 'none',
                    background: drawerTab === t.id ? '#0f172a' : 'transparent',
                    color: drawerTab === t.id ? '#ffffff' : '#64748b',
                    fontWeight: drawerTab === t.id ? 800 : 600,
                    fontSize: 11,
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Sub-Tab Content */}
            {detailLoading ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#64748b' }}>Loading customer details...</div>
            ) : customerDetail && (
              <div>
                
                {/* TAB 1: CUSTOMER PROFILES */}
                {drawerTab === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div><strong>Primary Name:</strong> {customerDetail.customer.name}</div>
                      <div><strong>Primary Phone:</strong> {customerDetail.customer.phone}</div>
                      <div><strong>Email Address:</strong> {customerDetail.customer.email}</div>
                      <div><strong>Member Since:</strong> {customerDetail.customer.createdAt}</div>
                      <div><strong>2FA Security:</strong> {customerDetail.customer.twoFactorEnabled ? 'Enabled' : 'Disabled'}</div>
                      <div><strong>Blacklist Status:</strong> {customerDetail.customer.isBlacklisted ? 'Blacklisted' : 'Clean / Active'}</div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PURCHASE HISTORY */}
                {drawerTab === 'orders' && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Customer Purchase Orders ({customerDetail.orders?.length || 0})</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                            <th style={{ padding: 6 }}>Order ID</th>
                            <th style={{ padding: 6 }}>Total</th>
                            <th style={{ padding: 6 }}>Items</th>
                            <th style={{ padding: 6 }}>Status</th>
                            <th style={{ padding: 6 }}>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDetail.orders?.map((o: any) => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: 6, fontWeight: 800 }}>#{o.orderId}</td>
                              <td style={{ padding: 6, fontWeight: 800, color: '#16a34a' }}>{formatGhs(o.total)}</td>
                              <td style={{ padding: 6 }}>{o.itemCount} items</td>
                              <td style={{ padding: 6 }}><span style={badgeStyle('#2563eb', '#dbeafe')}>{o.status}</span></td>
                              <td style={{ padding: 6, color: '#64748b' }}>{o.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 3: LOYALTY POINTS */}
                {drawerTab === 'points' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: '#f3e8ff', border: '1px solid #c084fc', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 800 }}>Loyalty Balance</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#6b21a8' }}>{customerDetail.customer.points} Points</div>
                      </div>
                      <button onClick={() => setModalType('points')} style={btnPrimaryStyle}>+ Adjust Points</button>
                    </div>
                  </div>
                )}

                {/* TAB 4: WALLET */}
                {drawerTab === 'wallet' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#166534', fontWeight: 800 }}>Virtual Wallet Balance</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#14532d' }}>{formatGhs(customerDetail.customer.walletBalance)}</div>
                      </div>
                      <button onClick={() => setModalType('wallet')} style={btnPrimaryStyle}>+ Topup / Debit Wallet</button>
                    </div>
                  </div>
                )}

                {/* TAB 5: ADDRESSES */}
                {drawerTab === 'addresses' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Saved Delivery Address Book</h4>
                    {customerDetail.customer.savedAddresses?.map((a: any, idx: number) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: 12, fontSize: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{a.label} — {a.fullName} ({a.phone})</div>
                        <div style={{ color: '#475569', marginTop: 4 }}>{a.address}, {a.city}, {a.region}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 6: REVIEWS */}
                {drawerTab === 'reviews' && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Product Reviews Submitted ({customerDetail.reviews?.length || 0})</h4>
                    {customerDetail.reviews?.map((r: any) => (
                      <div key={r.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.productName} — ⭐ {r.rating}/5</div>
                        <div style={{ color: '#475569', marginTop: 4 }}>"{r.comment}"</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 7: SUPPORT TICKETS */}
                {drawerTab === 'tickets' && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Support Tickets ({customerDetail.tickets?.length || 0})</h4>
                    {customerDetail.tickets?.map((t: any) => (
                      <div key={t.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.ticketNumber}: {t.subject}</div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>Category: {t.category} • Status: {t.status}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 8: BLACKLIST */}
                {drawerTab === 'blacklist' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ background: customerDetail.customer.isBlacklisted ? '#fee2e2' : '#f8fafc', border: '1px solid #fca5a5', padding: 16, borderRadius: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 6px', color: customerDetail.customer.isBlacklisted ? '#dc2626' : '#0f172a' }}>
                        Account Blacklist & Ban Controls
                      </h4>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
                        Blacklisting immediately suspends customer login access and blocks checkout.
                      </p>
                      <button onClick={() => setModalType('blacklist')} style={{ ...btnPrimaryStyle, background: customerDetail.customer.isBlacklisted ? '#16a34a' : '#dc2626' }}>
                        {customerDetail.customer.isBlacklisted ? 'Restore Customer Account' : 'Blacklist Customer'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* ── ACTION MODALS ─────────────────────────────────────────────── */}

      {/* Modal: Create Customer */}
      {modalType === 'create' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Register Customer Profile</h3>
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required placeholder="Kofi Mensah" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Primary Phone Number *</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} required placeholder="0241234567" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="kofi@mensah.com" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Loyalty Points */}
      {modalType === 'points' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Adjust Loyalty Points</h3>
            <form onSubmit={handleAdjustPoints} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Points Delta (+ to add, - to deduct) *</label>
                <input type="number" value={formPointsDelta} onChange={e => setFormPointsDelta(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Apply Points</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust Wallet Balance */}
      {modalType === 'wallet' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Adjust Wallet Balance</h3>
            <form onSubmit={handleAdjustWallet} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Wallet Amount (GH₵, + to credit, - to debit) *</label>
                <input type="number" step="0.01" value={formWalletDelta} onChange={e => setFormWalletDelta(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Apply Balance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Blacklist / Ban */}
      {modalType === 'blacklist' && selectedCustomer && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
              {selectedCustomer.isBlacklisted ? 'Restore Customer Account' : 'Blacklist Customer Account'}
            </h3>
            <form onSubmit={handleToggleBlacklist} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!selectedCustomer.isBlacklisted && (
                <div>
                  <label style={labelStyle}>Audit Blacklist Reason *</label>
                  <input type="text" value={formBlacklistReason} onChange={e => setFormBlacklistReason(e.target.value)} placeholder="e.g. Fraudulent transaction / chargeback abuse" required style={inputStyle} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={{ ...btnPrimaryStyle, background: selectedCustomer.isBlacklisted ? '#16a34a' : '#dc2626' }}>
                  Confirm {selectedCustomer.isBlacklisted ? 'Restoration' : 'Blacklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 18,
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
