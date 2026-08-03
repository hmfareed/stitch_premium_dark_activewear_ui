'use client';

import React, { useState, useEffect, useCallback } from 'react';

type SubTab = 'plans' | 'subscriptions' | 'coupons';

export default function AdminSubscriptionsPage() {
  const [subTab, setSubTab] = useState<SubTab>('plans');
  const [loading, setLoading] = useState(true);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>([]);
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal Operation States
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'create_plan' | 'edit_plan' | 'upgrade' | 'downgrade' | 'create_coupon' | 'assign_vendor' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formTier, setFormTier] = useState('starter');
  const [formMonthlyPrice, setFormMonthlyPrice] = useState('15');
  const [formAnnualPrice, setFormAnnualPrice] = useState('140');
  const [formMaxProducts, setFormMaxProducts] = useState('100');
  const [formMaxStaff, setFormMaxStaff] = useState('2');
  
  const [formCouponCode, setFormCouponCode] = useState('');
  const [formCouponDiscount, setFormCouponDiscount] = useState('20');
  const [formCouponMaxUses, setFormCouponMaxUses] = useState('100');

  const [formVendorEmail, setFormVendorEmail] = useState('');
  const [formTargetTier, setFormTargetTier] = useState('plus');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      const data = await res.json();
      if (data.success) {
        setPlansList(data.plans || []);
        setSubscriptionsList(data.subscriptions || []);
        setCouponsList(data.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action: Create Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_plan',
          name: formName,
          tier: formTier,
          monthlyPrice: formMonthlyPrice,
          annualPrice: formAnnualPrice,
          maxProducts: formMaxProducts,
          maxStaff: formMaxStaff,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchData();
      } else {
        alert(data.message || 'Creation failed');
      }
    } catch (err) {
      console.error('Error creating plan:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Discount Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formCouponCode,
          discountPercent: formCouponDiscount,
          maxUses: formCouponMaxUses,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormCouponCode('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating coupon:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Assign Vendor Subscription
  const handleAssignVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendorEmail) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'override_vendor',
          vendorEmail: formVendorEmail,
          planTier: formTargetTier,
          extendDays: 365,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormVendorEmail('');
        fetchData();
      }
    } catch (err) {
      console.error('Error assigning subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Upgrade Subscription Tier
  const handleUpgradeVendor = async (subId: string, tier?: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', targetTier: tier }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchData();
      }
    } catch (err) {
      console.error('Upgrade error:', err);
    }
  };

  // Action: Downgrade Subscription Tier
  const handleDowngradeVendor = async (subId: string, tier?: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'downgrade', targetTier: tier }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchData();
      }
    } catch (err) {
      console.error('Downgrade error:', err);
    }
  };

  // Action: Pause Subscription
  const handlePauseSub = async (subId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  // Action: Cancel Subscription
  const handleCancelSub = async (subId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  // Action: Toggle Auto Renewal
  const handleToggleAutoRenew = async (subId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${subId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_autorenew' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Auto renew error:', err);
    }
  };

  // Action: Delete Coupon
  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/coupons?id=${couponId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Delete coupon error:', err);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormTier('starter'); setFormMonthlyPrice('15'); setFormAnnualPrice('140');
    setFormMaxProducts('100'); setFormMaxStaff('2');
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
            Subscription Governance Engine
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Multi-tier plan definitions, vendor lifecycle upgrades, auto renewals & discount coupons
          </p>
        </div>

        {/* Global Action Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { resetForm(); setModalType('create_plan'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_card</span>
            <span>+ Create Plan</span>
          </button>
          <button onClick={() => { resetForm(); setModalType('assign_vendor'); }} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            <span>Assign Vendor Sub</span>
          </button>
          <button onClick={() => setModalType('create_coupon')} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>confirmation_number</span>
            <span>+ Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Configured Plans</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{plansList.length} Tiers</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Active Vendor Subscriptions</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{subscriptionsList.length} Vendors</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Active Discount Coupons</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>{couponsList.length} Coupons</div>
        </div>
      </div>

      {/* 3 Sub-View Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        {[
          { id: 'plans', label: 'Subscription Plans', icon: 'auto_awesome' },
          { id: 'subscriptions', label: 'Vendor Subscriptions', icon: 'card_membership' },
          { id: 'coupons', label: 'Discount Coupons', icon: 'confirmation_number' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as SubTab)}
            style={{
              border: 'none',
              background: subTab === tab.id ? '#0f172a' : 'transparent',
              color: subTab === tab.id ? '#ffffff' : '#64748b',
              fontWeight: subTab === tab.id ? 800 : 600,
              fontSize: 13,
              padding: '8px 16px',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading subscription telemetry...</p>
        </div>
      ) : subTab === 'plans' ? (

        /* SUB-VIEW 1: SUBSCRIPTION PLANS */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {plansList.map((p, idx) => (
            <div key={idx} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={badgeStyle('#4338ca', '#e0e7ff')}>{p.tier.toUpperCase()}</span>
                <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 800 }}>ACTIVE</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '10px 0 4px' }}>{p.name}</h3>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
                {formatGhs(p.monthlyPrice)} <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>/ mo</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Annual: {formatGhs(p.annualPrice)} / year
              </div>

              <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><strong>Max Catalog Products:</strong> {p.maxProducts ? `${p.maxProducts} items` : 'Unlimited'}</div>
                <div><strong>Max Staff Accounts:</strong> {p.maxStaff ? `${p.maxStaff} staff` : 'Unlimited'}</div>
                <div><strong>Commission Fee:</strong> 0% (Growth Phase)</div>
              </div>
            </div>
          ))}
        </div>
      ) : subTab === 'subscriptions' ? (

        /* SUB-VIEW 2: VENDOR SUBSCRIPTIONS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Vendor Active Subscriptions ({subscriptionsList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Vendor Email</th>
                  <th style={{ padding: 10 }}>Active Plan</th>
                  <th style={{ padding: 10 }}>Auto Renewal</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Validity Period</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Subscription Controls</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionsList.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>
                      {s.vendorEmail}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#4338ca', '#e0e7ff')}>{s.planName}</span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => handleToggleAutoRenew(s.id)}
                        style={{
                          border: 'none',
                          background: s.autoRenew ? '#dcfce7' : '#fee2e2',
                          color: s.autoRenew ? '#166534' : '#dc2626',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        {s.autoRenew ? 'AUTO RENEW ON' : 'AUTO RENEW OFF'}
                      </button>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(s.status === 'active' ? '#166534' : s.status === 'paused' ? '#b45309' : '#991b1b', s.status === 'active' ? '#dcfce7' : s.status === 'paused' ? '#fef3c7' : '#fee2e2')}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: '#64748b' }}>
                      {s.startDate} - {s.endDate}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Upgrade */}
                        <button onClick={() => { setSelectedSub(s); setModalType('upgrade'); }} style={{ border: 'none', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Upgrade
                        </button>
                        {/* Downgrade */}
                        <button onClick={() => { setSelectedSub(s); setModalType('downgrade'); }} style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Downgrade
                        </button>
                        {/* Pause / Resume */}
                        <button onClick={() => handlePauseSub(s.id)} style={{ border: 'none', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          {s.status === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                        {/* Cancel */}
                        <button onClick={() => handleCancelSub(s.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* SUB-VIEW 3: DISCOUNT COUPONS */
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Discount Coupon Directory ({couponsList.length})
            </h3>
            <button onClick={() => setModalType('create_coupon')} style={btnPrimaryStyle}>
              + Add Coupon Code
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Coupon Code</th>
                  <th style={{ padding: 10 }}>Discount (%)</th>
                  <th style={{ padding: 10 }}>Usage Tracking</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {couponsList.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#7c3aed', '#f3e8ff')}>{c.code}</span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a', fontSize: 14 }}>
                      {c.discountPercent}% OFF
                    </td>
                    <td style={{ padding: 12, color: '#475569', fontWeight: 700 }}>
                      {c.usedCount} / {c.maxUses} used
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(c.isActive ? '#166534' : '#991b1b', c.isActive ? '#dcfce7' : '#fee2e2')}>
                        {c.isActive ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => handleDeleteCoupon(c.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS FOR SUBSCRIPTION ACTIONS ────────────────────────────── */}

      {/* Modal: Create Plan */}
      {modalType === 'create_plan' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Subscription Plan</h3>
            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Plan Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Starter Enterprise" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Tier Code *</label>
                  <input type="text" value={formTier} onChange={e => setFormTier(e.target.value)} placeholder="starter" required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Monthly Price (GH₵) *</label>
                  <input type="number" value={formMonthlyPrice} onChange={e => setFormMonthlyPrice(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Annual Price (GH₵) *</label>
                  <input type="number" value={formAnnualPrice} onChange={e => setFormAnnualPrice(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Max Product Catalog</label>
                  <input type="text" value={formMaxProducts} onChange={e => setFormMaxProducts(e.target.value)} placeholder="100 or unlimited" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Discount Coupon */}
      {modalType === 'create_coupon' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Discount Coupon Code</h3>
            <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Coupon Code (Uppercase) *</label>
                <input type="text" value={formCouponCode} onChange={e => setFormCouponCode(e.target.value)} placeholder="e.g. AFRICART20" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Discount Percentage (%) *</label>
                  <input type="number" value={formCouponDiscount} onChange={e => setFormCouponDiscount(e.target.value)} min={1} max={100} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Maximum Usage Limit</label>
                  <input type="number" value={formCouponMaxUses} onChange={e => setFormCouponMaxUses(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Vendor Subscription */}
      {modalType === 'assign_vendor' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Assign Vendor Subscription</h3>
            <form onSubmit={handleAssignVendor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Vendor Email Address *</label>
                <input type="email" value={formVendorEmail} onChange={e => setFormVendorEmail(e.target.value)} required placeholder="vendor@africart.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Assign Tier Plan *</label>
                <select value={formTargetTier} onChange={e => setFormTargetTier(e.target.value)} style={inputStyle}>
                  <option value="basic">Basic Plan</option>
                  <option value="plus">Plus Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="trial">Free Trial</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Assign Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upgrade / Downgrade Confirm */}
      {(modalType === 'upgrade' || modalType === 'downgrade') && selectedSub && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, textTransform: 'capitalize' }}>
              {modalType} Subscription: {selectedSub.vendorEmail}
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Current Plan: <strong>{selectedSub.planName}</strong></p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={labelStyle}>Select Target Tier *</label>
              <select value={formTargetTier} onChange={e => setFormTargetTier(e.target.value)} style={inputStyle}>
                <option value="basic">Basic Tier</option>
                <option value="plus">Plus Tier</option>
                <option value="pro">Pro Tier</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
              <button
                onClick={() => modalType === 'upgrade' ? handleUpgradeVendor(selectedSub.id, formTargetTier) : handleDowngradeVendor(selectedSub.id, formTargetTier)}
                style={btnPrimaryStyle}
              >
                Confirm {modalType}
              </button>
            </div>
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
