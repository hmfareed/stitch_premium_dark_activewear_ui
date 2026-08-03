'use client';

import React, { useState, useEffect, useCallback } from 'react';

type ViewMode = 'all' | 'pending' | 'verified' | 'suspended' | 'applications';
type DetailTab = 'overview' | 'stores' | 'employees' | 'products' | 'orders' | 'customers' | 'payments' | 'subscription' | 'documents' | 'activity';

export default function AdminVendorsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Vendor Detail Drawer State
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [vendorDetailData, setVendorDetailData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal States
  const [modalType, setModalType] = useState<'create' | 'edit' | 'subscription' | 'reset_password' | 'upload_docs' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStoreName, setFormStoreName] = useState('');
  const [formBusinessType, setFormBusinessType] = useState('individual');
  const [formPlanTier, setFormPlanTier] = useState('basic');
  const [formDocUrl, setFormDocUrl] = useState('');
  const [formProofAddress, setFormProofAddress] = useState('');
  const [formRegNumber, setFormRegNumber] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Vendors / Applications by View
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors?view=${viewMode}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        if (viewMode === 'applications') {
          setApplicationsList(data.applications || []);
        } else {
          setVendorsList(data.vendors || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, searchQuery]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Fetch Full Vendor Details (10 Tabs Data)
  const fetchVendorDetail = async (id: string) => {
    setSelectedVendorId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`);
      const data = await res.json();
      if (data.success) {
        setVendorDetailData(data);
      }
    } catch (err) {
      console.error('Failed to fetch vendor detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Action: Create Vendor
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          email: formEmail,
          password: formPassword,
          storeName: formStoreName,
          businessType: formBusinessType,
          planTier: formPlanTier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchVendors();
      } else {
        alert(data.message || 'Creation failed');
      }
    } catch (err) {
      console.error('Error creating vendor:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Suspend / Activate Vendor
  const handleToggleStatus = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchVendors();
        if (selectedVendorId === vendorId) fetchVendorDetail(vendorId);
      }
    } catch (err) {
      console.error('Error toggling vendor status:', err);
    }
  };

  // Action: Verify Identity Toggle
  const handleVerifyIdentity = async (vendorId: string, isVerified: boolean) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_identity', isVerified: !isVerified }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchVendors();
        if (selectedVendorId === vendorId) fetchVendorDetail(vendorId);
      }
    } catch (err) {
      console.error('Error verifying identity:', err);
    }
  };

  // Action: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !formPassword) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${selectedVendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', newPassword: formPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormPassword('');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Assign Subscription
  const handleAssignSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${selectedVendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_subscription', planTier: formPlanTier, durationDays: 30 }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchVendorDetail(selectedVendorId);
      }
    } catch (err) {
      console.error('Error assigning subscription:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Upload KYC Documents
  const handleUploadDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${selectedVendorId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentUrl: formDocUrl,
          proofOfAddress: formProofAddress,
          businessRegNumber: formRegNumber,
          verifyImmediately: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchVendorDetail(selectedVendorId);
      }
    } catch (err) {
      console.error('Error uploading docs:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Login as Vendor (Impersonate)
  const handleImpersonateVendor = async (vendorId: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}/impersonate`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('africart_impersonated_vendor', JSON.stringify(data.vendor));
        localStorage.setItem('token', data.token);
        showToast(`Impersonating ${data.vendor.name}... Redirecting to Vendor Portal`);
        setTimeout(() => {
          window.location.href = data.redirectUrl || '/vendor';
        }, 1200);
      } else {
        alert(data.message || 'Impersonation failed');
      }
    } catch (err) {
      console.error('Impersonate Error:', err);
    }
  };

  // Action: Delete Vendor
  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to suspend/remove vendor "${vendorName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchVendors();
        if (selectedVendorId === vendorId) setSelectedVendorId(null);
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
    }
  };

  // Action: Application Approve/Reject
  const handleApproveApplication = async (id: string, actionType: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/vendor-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: actionType }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Vendor application ${actionType} successfully!`);
        fetchVendors();
      }
    } catch (err) {
      console.error('Application decision error:', err);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormPhone(''); setFormEmail(''); setFormPassword(''); setFormStoreName('');
    setFormBusinessType('individual'); setFormPlanTier('basic'); setFormDocUrl(''); setFormProofAddress(''); setFormRegNumber('');
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div style={toastStyle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Title & Main Actions Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Vendor Management Module
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Comprehensive vendor lifecycle control, KYC verification, subscription assignment & portal impersonation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Create Vendor Button */}
          <button
            onClick={() => { resetForm(); setModalType('create'); }}
            style={btnPrimaryStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            <span>+ Create Vendor</span>
          </button>
        </div>
      </div>

      {/* 5 Sub-Page View Navigation Tabs Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Vendors', icon: 'storefront' },
            { id: 'pending', label: 'Pending Approval', icon: 'schedule' },
            { id: 'verified', label: 'Verified Vendors', icon: 'verified' },
            { id: 'suspended', label: 'Suspended Vendors', icon: 'block' },
            { id: 'applications', label: 'Vendor Applications', icon: 'assignment' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              style={{
                border: 'none',
                background: viewMode === tab.id ? '#0f172a' : 'transparent',
                color: viewMode === tab.id ? '#ffffff' : '#64748b',
                fontWeight: viewMode === tab.id ? 800 : 600,
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

        {/* Search Input */}
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            placeholder="Search vendor, store, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
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
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading vendor management data...</p>
        </div>
      ) : viewMode === 'applications' ? (

        /* View: Vendor Applications Table */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Vendor KYC Applications ({applicationsList.length})
          </h3>
          {applicationsList.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13, padding: 20, textAlign: 'center' }}>No vendor applications found matching criteria.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Applicant</th>
                    <th style={{ padding: 10 }}>Store / Business</th>
                    <th style={{ padding: 10 }}>Contact</th>
                    <th style={{ padding: 10 }}>Applied Date</th>
                    <th style={{ padding: 10 }}>Status</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicationsList.map(app => (
                    <tr key={app._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{app.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{app.role}</div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{app.storeName || 'Store'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{app.businessType}</div>
                      </td>
                      <td style={{ padding: 12, color: '#475569' }}>
                        <div>{app.phone}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{app.email}</div>
                      </td>
                      <td style={{ padding: 12, color: '#64748b' }}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={badgeStyle(app.status === 'approved' ? '#166534' : app.status === 'rejected' ? '#991b1b' : '#b45309', app.status === 'approved' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#fef3c7')}>
                          {app.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        {app.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleApproveApplication(app._id, 'approved')}
                              style={{ border: 'none', background: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveApplication(app._id, 'rejected')}
                              style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (

        /* View: Vendors List Table */
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Registered Vendors ({vendorsList.length})
            </h3>
          </div>

          {vendorsList.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13, padding: 20, textAlign: 'center' }}>No vendors found matching your filter criteria.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Vendor</th>
                    <th style={{ padding: 10 }}>Store Name</th>
                    <th style={{ padding: 10 }}>Subscription Plan</th>
                    <th style={{ padding: 10 }}>KYC Status</th>
                    <th style={{ padding: 10 }}>Account Status</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorsList.map(v => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{v.email} • {v.phone}</div>
                      </td>
                      <td style={{ padding: 12, fontWeight: 700, color: '#334155' }}>
                        {v.storeName}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={badgeStyle('#4338ca', '#e0e7ff')}>{v.planName}</span>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Ends: {v.subscriptionEndDate}</div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={badgeStyle(v.isVerified ? '#166534' : '#b45309', v.isVerified ? '#dcfce7' : '#fef3c7')}>
                          {v.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={badgeStyle(v.isActive ? '#166534' : '#991b1b', v.isActive ? '#dcfce7' : '#fee2e2')}>
                          {v.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {/* View Details Drawer Trigger */}
                          <button
                            onClick={() => fetchVendorDetail(v.id)}
                            style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '5px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                          >
                            Details
                          </button>

                          {/* Login as Vendor */}
                          <button
                            onClick={() => handleImpersonateVendor(v.id)}
                            style={{ border: 'none', background: '#f3e8ff', color: '#7c3aed', padding: '5px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                            title="Impersonate & Login as Vendor"
                          >
                            Login As
                          </button>

                          {/* Suspend / Activate Toggle */}
                          <button
                            onClick={() => handleToggleStatus(v.id)}
                            style={{ border: 'none', background: v.isActive ? '#fee2e2' : '#dcfce7', color: v.isActive ? '#dc2626' : '#16a34a', padding: '5px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                          >
                            {v.isActive ? 'Suspend' : 'Activate'}
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
      )}

      {/* ── 10-TAB VENDOR DETAILS INSPECTION DRAWER ─────────────────────── */}
      {selectedVendorId && vendorDetailData && (
        <div style={modalBackdropStyle} onClick={() => setSelectedVendorId(null)}>
          <div style={drawerContentStyle} onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {vendorDetailData.vendor.name} ({vendorDetailData.vendor.storeName})
                  </h2>
                  <span style={badgeStyle(vendorDetailData.vendor.isActive ? '#166534' : '#991b1b', vendorDetailData.vendor.isActive ? '#dcfce7' : '#fee2e2')}>
                    {vendorDetailData.vendor.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {vendorDetailData.vendor.email} • {vendorDetailData.vendor.phone} • Joined: {vendorDetailData.vendor.joinedAt}
                </div>
              </div>

              {/* Quick Action Toolbar in Drawer */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleImpersonateVendor(selectedVendorId)} style={{ border: 'none', background: '#7c3aed', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Login As Vendor
                </button>
                <button onClick={() => handleVerifyIdentity(selectedVendorId, vendorDetailData.vendor.isVerified)} style={{ border: 'none', background: '#16a34a', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  {vendorDetailData.vendor.isVerified ? 'Mark Unverified' : 'Verify Identity'}
                </button>
                <button onClick={() => setModalType('subscription')} style={{ border: 'none', background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Assign Sub
                </button>
                <button onClick={() => setModalType('reset_password')} style={{ border: 'none', background: '#ea580c', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Reset Password
                </button>
                <button onClick={() => setSelectedVendorId(null)} style={{ border: 'none', background: 'transparent', fontSize: 24, fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>×</button>
              </div>
            </div>

            {/* 10 Navigation Tabs */}
            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              {([
                'overview', 'stores', 'employees', 'products', 'orders', 'customers', 'payments', 'subscription', 'documents', 'activity'
              ] as DetailTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    border: 'none',
                    background: activeTab === tab ? '#1e293b' : '#f1f5f9',
                    color: activeTab === tab ? '#ffffff' : '#64748b',
                    fontWeight: activeTab === tab ? 800 : 600,
                    fontSize: 12,
                    padding: '6px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ paddingTop: 16, overflowY: 'auto', maxHeight: '65vh' }}>
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Total Gross Sales</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
                        {formatGhs(vendorDetailData.tabs.overview.totalSales)}
                      </div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Total Orders</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                        {vendorDetailData.tabs.overview.totalOrders}
                      </div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Catalog Products</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                        {vendorDetailData.tabs.overview.totalProducts}
                      </div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Commission Rate</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                        {vendorDetailData.tabs.overview.commissionRate}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Stores */}
              {activeTab === 'stores' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Managed Stores ({vendorDetailData.tabs.stores.length})</h4>
                  {vendorDetailData.tabs.stores.map((s: any) => (
                    <div key={s.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{s.name} ({s.slug})</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Category: {s.category} • Status: {s.status}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Employees */}
              {activeTab === 'employees' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Vendor Staff ({vendorDetailData.tabs.employees.length})</h4>
                  {vendorDetailData.tabs.employees.map((e: any) => (
                    <div key={e.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{e.name} ({e.role})</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{e.email} • {e.phone}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Products */}
              {activeTab === 'products' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Catalog Listings ({vendorDetailData.tabs.products.length})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {vendorDetailData.tabs.products.map((p: any) => (
                      <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{formatGhs(p.price)}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Stock: {p.stock} • Category: {p.category}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 5: Orders */}
              {activeTab === 'orders' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Order History ({vendorDetailData.tabs.orders.length})</h4>
                  {vendorDetailData.tabs.orders.map((o: any) => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{o.id} - {o.customerName}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Date: {o.date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#0f172a' }}>{formatGhs(o.total)}</div>
                        <span style={badgeStyle('#166534', '#dcfce7')}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 6: Customers */}
              {activeTab === 'customers' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Vendor Customer Base ({vendorDetailData.tabs.customers.length})</h4>
                  {vendorDetailData.tabs.customers.map((c: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{c.email} • {c.phone}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: '#16a34a' }}>{formatGhs(c.totalSpent)}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{c.totalOrders} order(s)</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 7: Payments */}
              {activeTab === 'payments' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Payout History ({vendorDetailData.tabs.payments.length})</h4>
                  {vendorDetailData.tabs.payments.map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{formatGhs(p.amount)}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Method: {p.method} • {p.accountDetails}</div>
                      </div>
                      <span style={badgeStyle('#166534', '#dcfce7')}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 8: Subscription */}
              {activeTab === 'subscription' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Active Subscription</h4>
                  <div style={statBoxStyle}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: '#2563eb' }}>{vendorDetailData.tabs.subscription.planName}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                      Valid: {vendorDetailData.tabs.subscription.startDate} — {vendorDetailData.tabs.subscription.endDate}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Amount Paid: {formatGhs(vendorDetailData.tabs.subscription.amountPaid)}</div>
                  </div>
                </div>
              )}

              {/* Tab 9: Documents */}
              {activeTab === 'documents' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>KYC & Verification Documents</h4>
                    <button onClick={() => setModalType('upload_docs')} style={{ border: 'none', background: '#16a34a', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                      Upload Documents
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569' }}>
                    <div>Business Reg #: <strong>{vendorDetailData.tabs.documents.businessRegNumber}</strong></div>
                    <div style={{ marginTop: 8 }}>ID Document URL: {vendorDetailData.tabs.documents.idDocument || 'Not submitted'}</div>
                    <div style={{ marginTop: 4 }}>Proof of Address: {vendorDetailData.tabs.documents.proofOfAddress || 'Not submitted'}</div>
                  </div>
                </div>
              )}

              {/* Tab 10: Activity */}
              {activeTab === 'activity' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Audit Logs & Activity</h4>
                  {vendorDetailData.tabs.activity.map((l: any) => (
                    <div key={l.id} style={{ fontSize: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{l.action} — {l.target}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>By: {l.adminName} • {l.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── MODALS FOR ACTIONS ────────────────────────────────────────── */}

      {/* Modal: Create Vendor */}
      {modalType === 'create' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Create New Vendor</h3>
              <button onClick={() => setModalType(null)} style={closeBtnStyle}>×</button>
            </div>
            <form onSubmit={handleCreateVendor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Store Name</label>
                  <input type="text" value={formStoreName} onChange={e => setFormStoreName(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Plan Tier</label>
                  <select value={formPlanTier} onChange={e => setFormPlanTier(e.target.value)} style={inputStyle}>
                    <option value="basic">Basic (GH₵ 50/mo)</option>
                    <option value="plus">Plus (GH₵ 100/mo)</option>
                    <option value="pro">Pro Enterprise (GH₵ 250/mo)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Initial Password</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Vendor123!" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Create Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {modalType === 'reset_password' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Reset Vendor Password</h3>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} required minLength={6} placeholder="Enter new password..." style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Subscription */}
      {modalType === 'subscription' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Assign Subscription Plan</h3>
            <form onSubmit={handleAssignSubscription} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Plan Tier</label>
                <select value={formPlanTier} onChange={e => setFormPlanTier(e.target.value)} style={inputStyle}>
                  <option value="basic">Basic Plan (GH₵ 50/mo)</option>
                  <option value="plus">Plus Plan (GH₵ 100/mo)</option>
                  <option value="pro">Pro Enterprise (GH₵ 250/mo)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Assign Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Documents */}
      {modalType === 'upload_docs' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Upload & Verify KYC Documents</h3>
            <form onSubmit={handleUploadDocs} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Ghana Card / ID Document URL</label>
                <input type="text" value={formDocUrl} onChange={e => setFormDocUrl(e.target.value)} placeholder="https://..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Proof of Address URL</label>
                <input type="text" value={formProofAddress} onChange={e => setFormProofAddress(e.target.value)} placeholder="https://..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Business Registration #</label>
                <input type="text" value={formRegNumber} onChange={e => setFormRegNumber(e.target.value)} placeholder="RGD-89321" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Upload & Verify</button>
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

const statBoxStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 14,
};
