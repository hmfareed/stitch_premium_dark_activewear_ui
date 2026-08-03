'use client';

import React, { useState, useEffect, useCallback } from 'react';

type DeliveryTab = 'partners' | 'drivers' | 'regions' | 'rates' | 'tracking' | 'stations';

export default function AdminDeliveryPage() {
  const [activeTab, setActiveTab] = useState<DeliveryTab>('partners');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Data Arrays
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const [driversList, setDriversList] = useState<any[]>([]);
  const [regionsList, setRegionsList] = useState<any[]>([]);
  const [trackingList, setTrackingList] = useState<any[]>([]);
  const [stationsList, setStationsList] = useState<any[]>([]);

  // Modal Operation State
  const [modalType, setModalType] = useState<'create_partner' | 'create_station' | 'create_region' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formPartnerName, setFormPartnerName] = useState('');
  const [formPartnerEmail, setFormPartnerEmail] = useState('');
  const [formPartnerPhone, setFormPartnerPhone] = useState('');

  const [formStationName, setFormStationName] = useState('');
  const [formStationCity, setFormStationCity] = useState('Accra');
  const [formStationAddress, setFormStationAddress] = useState('');
  const [formStationGps, setFormStationGps] = useState('');
  const [formStationPhone, setFormStationPhone] = useState('');

  const [formRegionName, setFormRegionName] = useState('');
  const [formBaseRate, setFormBaseRate] = useState('15');
  const [formPerKmRate, setFormPerKmRate] = useState('1.5');
  const [formHours, setFormHours] = useState('24 - 48 Hours');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Delivery Telemetry
  const fetchDeliveryData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delivery');
      const data = await res.json();
      if (data.success) {
        setPartnersList(data.partners || []);
        setDriversList(data.drivers || []);
        setRegionsList(data.regions || []);
        setTrackingList(data.tracking || []);
        setStationsList(data.stations || []);
      }
    } catch (err) {
      console.error('Error fetching delivery data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryData();
  }, [fetchDeliveryData]);

  // Action: Create Partner
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_partner', name: formPartnerName, contactEmail: formPartnerEmail, contactPhone: formPartnerPhone }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchDeliveryData();
      }
    } catch (err) {
      console.error('Create partner error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Station
  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_station', name: formStationName, city: formStationCity, address: formStationAddress, gpsCode: formStationGps, contactPhone: formStationPhone }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchDeliveryData();
      }
    } catch (err) {
      console.error('Create station error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Region
  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_region', name: formRegionName, baseRate: formBaseRate, perKmRate: formPerKmRate, estimatedHours: formHours }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchDeliveryData();
      }
    } catch (err) {
      console.error('Create region error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Active Status
  const handleToggleActive = async (id: string, targetType: string) => {
    try {
      const res = await fetch(`/api/admin/delivery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchDeliveryData();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const resetForm = () => {
    setFormPartnerName(''); setFormPartnerEmail(''); setFormPartnerPhone('');
    setFormStationName(''); setFormStationAddress(''); setFormStationGps('');
    setFormRegionName(''); setFormBaseRate('15'); setFormPerKmRate('1.5');
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
            Delivery & Logistics Governance Portal
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            3PL logistics partners, fleet drivers, coverage regions, shipping rate formulas, live order tracking & pickup lockers
          </p>
        </div>

        {/* Global Action Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { resetForm(); setModalType('create_partner'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>local_shipping</span>
            <span>+ Add Partner</span>
          </button>
          <button onClick={() => { resetForm(); setModalType('create_station'); }} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>storefront</span>
            <span>+ Pickup Station</span>
          </button>
          <button onClick={() => { resetForm(); setModalType('create_region'); }} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>map</span>
            <span>+ Add Region</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Logistics Partners</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{partnersList.length} Partners</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Active Fleet Drivers</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{driversList.length} Drivers</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Self-Service Pickup Stations</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>{stationsList.length} Lockers</div>
        </div>
      </div>

      {/* 6 Sub-View Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { id: 'partners', label: 'Delivery Partners', icon: 'local_shipping' },
          { id: 'drivers', label: 'Drivers & Riders', icon: 'two_wheeler' },
          { id: 'regions', label: 'Coverage Regions', icon: 'map' },
          { id: 'rates', label: 'Shipping Rates Engine', icon: 'calculate' },
          { id: 'tracking', label: 'Live Tracking Stream', icon: 'near_me' },
          { id: 'stations', label: 'Pickup Stations', icon: 'storefront' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DeliveryTab)}
            style={{
              border: 'none',
              background: activeTab === tab.id ? '#0f172a' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#64748b',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading logistics telemetry...</p>
        </div>
      ) : activeTab === 'partners' ? (

        /* SUB-VIEW 1: DELIVERY PARTNERS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Logistics Company Partners ({partnersList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Partner Company</th>
                  <th style={{ padding: 10 }}>Contact Email & Phone</th>
                  <th style={{ padding: 10 }}>API Integration</th>
                  <th style={{ padding: 10 }}>Performance Rating</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {partnersList.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{p.name}</td>
                    <td style={{ padding: 12, color: '#475569' }}>{p.contactEmail} • {p.contactPhone}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#2563eb', '#dbeafe')}>{p.apiIntegration ? 'CONNECTED (REST API)' : 'MANUAL'}</span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#eab308' }}>⭐ {p.rating} / 5.0</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(p.isActive ? '#166534' : '#991b1b', p.isActive ? '#dcfce7' : '#fee2e2')}>
                        {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => handleToggleActive(p.id, 'partner')} style={{ border: 'none', background: '#f1f5f9', color: '#0f172a', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                        {p.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'drivers' ? (

        /* SUB-VIEW 2: DRIVERS & RIDERS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Fleet Drivers & Dispatch Riders ({driversList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Driver Name</th>
                  <th style={{ padding: 10 }}>Phone & Email</th>
                  <th style={{ padding: 10 }}>Vehicle Type</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {driversList.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{d.name}</td>
                    <td style={{ padding: 12, color: '#475569' }}>{d.phone} • {d.email}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{d.vehicleType}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#166534', '#dcfce7')}>{d.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'regions' || activeTab === 'rates' ? (

        /* SUB-VIEW 3 & 4: REGIONS & SHIPPING RATES ENGINE */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Coverage Regions & Shipping Rate Formulas ({regionsList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Region Name</th>
                  <th style={{ padding: 10 }}>Base Delivery Fee</th>
                  <th style={{ padding: 10 }}>Per KM Distance Rate</th>
                  <th style={{ padding: 10 }}>Estimated Time</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {regionsList.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{r.name}</td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>{formatGhs(r.baseRate)}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{formatGhs(r.perKmRate)} / km</td>
                    <td style={{ padding: 12, color: '#64748b' }}>{r.estimatedHours}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(r.isActive ? '#166534' : '#991b1b', r.isActive ? '#dcfce7' : '#fee2e2')}>
                        {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'tracking' ? (

        /* SUB-VIEW 5: LIVE TRACKING STREAM */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Live Order Tracking Stream ({trackingList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Tracking # & Order</th>
                  <th style={{ padding: 10 }}>Customer & Phone</th>
                  <th style={{ padding: 10 }}>Delivery Destination</th>
                  <th style={{ padding: 10 }}>Assigned Rider</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {trackingList.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{t.trackingNumber}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Order: #{t.orderId}</div>
                    </td>
                    <td style={{ padding: 12, color: '#334155' }}>
                      <div style={{ fontWeight: 700 }}>{t.customerName}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{t.customerPhone}</div>
                    </td>
                    <td style={{ padding: 12, color: '#475569' }}>{t.deliveryAddress}</td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#2563eb' }}>{t.assignedRider}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#166534', '#dcfce7')}>{t.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* SUB-VIEW 6: PICKUP STATIONS & LOCKERS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Self-Service Pickup Stations & Lockers ({stationsList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Station Name & ID</th>
                  <th style={{ padding: 10 }}>Ghana Post GPS</th>
                  <th style={{ padding: 10 }}>Address & City</th>
                  <th style={{ padding: 10 }}>Operating Hours</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stationsList.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>ID: {s.stationId}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#7c3aed', '#f3e8ff')}>{s.gpsCode}</span>
                    </td>
                    <td style={{ padding: 12, color: '#475569' }}>{s.address}, {s.city}</td>
                    <td style={{ padding: 12, color: '#64748b' }}>{s.operatingHours}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(s.isActive ? '#166534' : '#991b1b', s.isActive ? '#dcfce7' : '#fee2e2')}>
                        {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => handleToggleActive(s.id, 'station')} style={{ border: 'none', background: '#f1f5f9', color: '#0f172a', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                        {s.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS FOR CREATING LOGISTICS ITEMS ───────────────────────── */}

      {/* Modal: Create Partner */}
      {modalType === 'create_partner' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Add Logistics Delivery Partner</h3>
            <form onSubmit={handleCreatePartner} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Company Partner Name *</label>
                <input type="text" value={formPartnerName} onChange={e => setFormPartnerName(e.target.value)} placeholder="e.g. Speedaf Ghana Logistics" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Contact Email</label>
                  <input type="email" value={formPartnerEmail} onChange={e => setFormPartnerEmail(e.target.value)} placeholder="dispatch@speedaf.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Phone *</label>
                  <input type="text" value={formPartnerPhone} onChange={e => setFormPartnerPhone(e.target.value)} required placeholder="0241234567" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Pickup Station */}
      {modalType === 'create_station' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Add Self-Service Pickup Station / Locker</h3>
            <form onSubmit={handleCreateStation} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Station Name *</label>
                <input type="text" value={formStationName} onChange={e => setFormStationName(e.target.value)} placeholder="e.g. Accra Mall Self-Service Locker" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input type="text" value={formStationCity} onChange={e => setFormStationCity(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ghana Post GPS Code *</label>
                  <input type="text" value={formStationGps} onChange={e => setFormStationGps(e.target.value)} required placeholder="GA-183-9021" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Street Address *</label>
                <input type="text" value={formStationAddress} onChange={e => setFormStationAddress(e.target.value)} required placeholder="Tetteh Quarshie Interchange" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Station</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Region */}
      {modalType === 'create_region' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Add Coverage Region & Shipping Rates</h3>
            <form onSubmit={handleCreateRegion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Region Name *</label>
                <input type="text" value={formRegionName} onChange={e => setFormRegionName(e.target.value)} placeholder="e.g. Ashanti Region (Kumasi)" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Base Delivery Fee (GH₵) *</label>
                  <input type="number" step="0.5" value={formBaseRate} onChange={e => setFormBaseRate(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Per KM Distance Rate (GH₵) *</label>
                  <input type="number" step="0.1" value={formPerKmRate} onChange={e => setFormPerKmRate(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Estimated Delivery Window</label>
                <input type="text" value={formHours} onChange={e => setFormHours(e.target.value)} placeholder="24 - 48 Hours" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Region</button>
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
