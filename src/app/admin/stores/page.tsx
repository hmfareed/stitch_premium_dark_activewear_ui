'use client';

import React, { useState, useEffect, useCallback } from 'react';

type ViewMode = 'stores' | 'branches' | 'warehouses';
type DetailTab = 'overview' | 'inventory' | 'orders' | 'employees' | 'branches';

export default function AdminStoresPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('stores');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [storesList, setStoresList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Store Detail Drawer State
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeDetailData, setStoreDetailData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal States
  const [modalType, setModalType] = useState<'create_store' | 'edit_store' | 'assign_manager' | 'create_branch' | 'create_warehouse' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formVendorEmail, setFormVendorEmail] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formBusinessType, setFormBusinessType] = useState('individual');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCity, setFormCity] = useState('Accra');
  const [formRegion, setFormRegion] = useState('Greater Accra');
  const [formManagerName, setFormManagerName] = useState('');
  const [formManagerEmail, setFormManagerEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Data based on active ViewMode
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'stores') {
        const res = await fetch(`/api/admin/stores?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setStoresList(data.stores || []);
      } else if (viewMode === 'branches') {
        const res = await fetch(`/api/admin/stores/branches?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setBranchesList(data.branches || []);
      } else if (viewMode === 'warehouses') {
        const res = await fetch(`/api/admin/stores/warehouses?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.success) setWarehousesList(data.warehouses || []);
      }
    } catch (err) {
      console.error('Error fetching stores data:', err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Store Details (Overview, Inventory, Orders, Employees, Branches)
  const fetchStoreDetail = async (id: string) => {
    setSelectedStoreId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/stores/${id}`);
      const data = await res.json();
      if (data.success) {
        setStoreDetailData(data);
      }
    } catch (err) {
      console.error('Failed to fetch store detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Action: Create Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          vendorEmail: formVendorEmail,
          category: formCategory,
          businessType: formBusinessType,
          contactPhone: formPhone,
          contactEmail: formEmail,
          city: formCity,
          region: formRegion,
          managerName: formManagerName,
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
      console.error('Error creating store:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Activate / Suspend Store
  const handleToggleStoreStatus = async (storeId: string, currentStatus: string) => {
    const nextAction = currentStatus === 'active' ? 'suspend' : 'activate';
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction, reason: 'Status toggled by super admin' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        if (selectedStoreId === storeId) fetchStoreDetail(storeId);
      }
    } catch (err) {
      console.error('Error toggling store status:', err);
    }
  };

  // Action: Assign Manager
  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !formManagerName || !formManagerEmail) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/stores/${selectedStoreId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_manager',
          managerName: formManagerName,
          managerEmail: formManagerEmail,
          managerPhone: formPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchStoreDetail(selectedStoreId);
        fetchData();
      }
    } catch (err) {
      console.error('Error assigning manager:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/stores/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStoreId,
          name: formName,
          city: formCity,
          address: formAddress,
          phone: formPhone,
          managerName: formManagerName,
          managerEmail: formManagerEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchStoreDetail(selectedStoreId);
        fetchData();
      }
    } catch (err) {
      console.error('Error creating branch:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Warehouse
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/stores/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          city: formCity,
          address: formAddress,
          phone: formPhone,
          managerName: formManagerName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Error creating warehouse:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete Store
  const handleDeleteStore = async (storeId: string, storeName: string) => {
    if (!confirm(`Are you sure you want to suspend/archive store "${storeName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/stores/${storeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
        if (selectedStoreId === storeId) setSelectedStoreId(null);
      }
    } catch (err) {
      console.error('Error deleting store:', err);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormVendorEmail(''); setFormCategory('General'); setFormBusinessType('individual');
    setFormPhone(''); setFormEmail(''); setFormCity('Accra'); setFormRegion('Greater Accra');
    setFormManagerName(''); setFormManagerEmail(''); setFormAddress('');
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

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Store Management Module
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Storefront governance, branch networks, fulfillment warehouses & inventory control
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {viewMode === 'stores' && (
            <button onClick={() => { resetForm(); setModalType('create_store'); }} style={btnPrimaryStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>store</span>
              <span>+ Create Store</span>
            </button>
          )}
          {viewMode === 'warehouses' && (
            <button onClick={() => { resetForm(); setModalType('create_warehouse'); }} style={btnPrimaryStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warehouse</span>
              <span>+ Create Warehouse Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Sub-Page View Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'stores', label: 'Stores', icon: 'store' },
            { id: 'branches', label: 'Store Branches', icon: 'location_city' },
            { id: 'warehouses', label: 'Fulfillment Warehouses', icon: 'warehouse' },
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

        {/* Search Bar */}
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            placeholder="Search store, city, manager..."
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

      {/* Main Content Table Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading store management telemetry...</p>
        </div>
      ) : viewMode === 'stores' ? (

        /* VIEW 1: STORES TABLE */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Platform Stores Catalog ({storesList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Store Name & Slug</th>
                  <th style={{ padding: 10 }}>Vendor / Category</th>
                  <th style={{ padding: 10 }}>Manager</th>
                  <th style={{ padding: 10 }}>Location</th>
                  <th style={{ padding: 10 }}>Products / Orders</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {storesList.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: '#2563eb' }}>/{s.slug}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{s.vendorName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.category}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.managerName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.contactPhone}</div>
                    </td>
                    <td style={{ padding: 12, color: '#475569' }}>
                      {s.pickupAddress?.city || 'Accra'}, {s.pickupAddress?.region || 'Greater Accra'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.totalProducts} products</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.totalOrders} orders fulfilled</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(s.status === 'active' ? '#166534' : '#991b1b', s.status === 'active' ? '#dcfce7' : '#fee2e2')}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {/* View Store Details Trigger */}
                        <button
                          onClick={() => fetchStoreDetail(s.id)}
                          style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '5px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Store Details
                        </button>
                        {/* Activate / Suspend */}
                        <button
                          onClick={() => handleToggleStoreStatus(s.id, s.status)}
                          style={{ border: 'none', background: s.status === 'active' ? '#fee2e2' : '#dcfce7', color: s.status === 'active' ? '#dc2626' : '#16a34a', padding: '5px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                        >
                          {s.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'branches' ? (

        /* VIEW 2: STORE BRANCHES TABLE */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Physical Store Branches ({branchesList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Branch Code & Name</th>
                  <th style={{ padding: 10 }}>Store Handle</th>
                  <th style={{ padding: 10 }}>City & Address</th>
                  <th style={{ padding: 10 }}>Branch Manager</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {branchesList.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{b.name}</div>
                      <span style={badgeStyle('#4338ca', '#e0e7ff')}>{b.code}</span>
                    </td>
                    <td style={{ padding: 12, color: '#2563eb', fontWeight: 700 }}>/{b.storeSlug}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{b.city}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{b.address}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.managerName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.phone}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(b.isActive ? '#166534' : '#991b1b', b.isActive ? '#dcfce7' : '#fee2e2')}>
                        {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* VIEW 3: FULFILLMENT WAREHOUSES TABLE */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Fulfillment Warehouses & Central Logistics Hubs ({warehousesList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Hub Code & Name</th>
                  <th style={{ padding: 10 }}>City & Central Address</th>
                  <th style={{ padding: 10 }}>Hub Director / Manager</th>
                  <th style={{ padding: 10 }}>Coordinates (Lat / Long)</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {warehousesList.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{w.name}</div>
                      <span style={badgeStyle('#7c3aed', '#f3e8ff')}>{w.code}</span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{w.city} Hub</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{w.address}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{w.managerName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{w.phone}</div>
                    </td>
                    <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
                      {w.latitude?.toFixed(4)}, {w.longitude?.toFixed(4)}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(w.isActive ? '#166534' : '#991b1b', w.isActive ? '#dcfce7' : '#fee2e2')}>
                        {w.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STORE DETAILS INSPECTION DRAWER ──────────────────────────────── */}
      {selectedStoreId && storeDetailData && (
        <div style={modalBackdropStyle} onClick={() => setSelectedStoreId(null)}>
          <div style={drawerContentStyle} onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {storeDetailData.store.name} (/{storeDetailData.store.slug})
                  </h2>
                  <span style={badgeStyle(storeDetailData.store.status === 'active' ? '#166534' : '#991b1b', storeDetailData.store.status === 'active' ? '#dcfce7' : '#fee2e2')}>
                    {storeDetailData.store.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Owner: {storeDetailData.store.vendorName} ({storeDetailData.store.vendorEmail}) • Category: {storeDetailData.store.category}
                </div>
              </div>

              {/* Drawer Quick Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setModalType('assign_manager')} style={{ border: 'none', background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Assign Manager
                </button>
                <button onClick={() => setModalType('create_branch')} style={{ border: 'none', background: '#7c3aed', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  + Add Branch
                </button>
                <button onClick={() => handleToggleStoreStatus(selectedStoreId, storeDetailData.store.status)} style={{ border: 'none', background: storeDetailData.store.status === 'active' ? '#dc2626' : '#16a34a', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  {storeDetailData.store.status === 'active' ? 'Suspend Store' : 'Activate Store'}
                </button>
                <button onClick={() => setSelectedStoreId(null)} style={closeBtnStyle}>×</button>
              </div>
            </div>

            {/* Sub-Tabs Navigation */}
            <div style={{ display: 'flex', gap: 4, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              {(['overview', 'inventory', 'orders', 'employees', 'branches'] as DetailTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    border: 'none',
                    background: activeTab === tab ? '#1e293b' : '#f1f5f9',
                    color: activeTab === tab ? '#ffffff' : '#64748b',
                    fontWeight: activeTab === tab ? 800 : 600,
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'inventory' ? 'View Inventory' : tab === 'orders' ? 'View Orders' : tab === 'employees' ? 'View Employees' : tab}
                </button>
              ))}
            </div>

            {/* Sub-Tab Contents */}
            <div style={{ paddingTop: 16, overflowY: 'auto', maxHeight: '60vh' }}>
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Assigned Manager</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{storeDetailData.store.managerName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{storeDetailData.store.managerEmail}</div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Pickup Address</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>
                        {storeDetailData.store.pickupAddress?.street}, {storeDetailData.store.pickupAddress?.city}
                      </div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Total Inventory Stock</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{storeDetailData.inventory.length} items</div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Total Orders Fulfilled</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{storeDetailData.orders.length} orders</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: View Inventory */}
              {activeTab === 'inventory' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Store Product Inventory ({storeDetailData.inventory.length})</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {storeDetailData.inventory.map((item: any) => (
                      <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{formatGhs(item.price)}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Stock: {item.stock} • Status: {item.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: View Orders */}
              {activeTab === 'orders' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Store Orders History ({storeDetailData.orders.length})</h4>
                  {storeDetailData.orders.map((o: any) => (
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

              {/* Tab 4: View Employees */}
              {activeTab === 'employees' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Store Staff & Employees ({storeDetailData.employees.length})</h4>
                  {storeDetailData.employees.map((e: any) => (
                    <div key={e.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{e.name} ({e.role})</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{e.email} • {e.phone}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 5: Branches */}
              {activeTab === 'branches' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Store Physical Branches ({storeDetailData.branches.length})</h4>
                  {storeDetailData.branches.map((b: any) => (
                    <div key={b.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{b.name} ({b.code})</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{b.city} • Manager: {b.managerName}</div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── MODALS FOR STORE FUNCTIONS ────────────────────────────────────── */}

      {/* Modal: Create Store */}
      {modalType === 'create_store' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create New Store</h3>
            <form onSubmit={handleCreateStore} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Store Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Vendor Email *</label>
                  <input type="email" value={formVendorEmail} onChange={e => setFormVendorEmail(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Contact Phone</label>
                  <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input type="text" value={formCity} onChange={e => setFormCity(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Assign Store Manager Name</label>
                <input type="text" value={formManagerName} onChange={e => setFormManagerName(e.target.value)} placeholder="Manager Name" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Create Store</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Manager */}
      {modalType === 'assign_manager' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Assign Store Manager</h3>
            <form onSubmit={handleAssignManager} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Manager Full Name *</label>
                <input type="text" value={formManagerName} onChange={e => setFormManagerName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Manager Email *</label>
                <input type="email" value={formManagerEmail} onChange={e => setFormManagerEmail(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Manager Phone</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Assign Manager</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Branch */}
      {modalType === 'create_branch' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Physical Branch</h3>
            <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Branch Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Kumasi Mall Branch" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input type="text" value={formCity} onChange={e => setFormCity(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Phone</label>
                  <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Physical Address *</label>
                <input type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Warehouse */}
      {modalType === 'create_warehouse' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Fulfillment Warehouse Hub</h3>
            <form onSubmit={handleCreateWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Warehouse Hub Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="AfriCart Accra Central Hub" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input type="text" value={formCity} onChange={e => setFormCity(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Hub Contact Phone</label>
                  <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Central Address *</label>
                <input type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Operations Director / Manager Name</label>
                <input type="text" value={formManagerName} onChange={e => setFormManagerName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Create Warehouse Hub</button>
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
  maxWidth: 920,
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
