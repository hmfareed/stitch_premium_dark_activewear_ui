'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/AppContext';

interface RiderDoc {
  type: string;
  url: string;
  verified: boolean;
}

interface RiderItem {
  id: string;
  userId?: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  onlineStatus: 'offline' | 'online' | 'on_delivery';
  vehicleType: string;
  vehicleModel?: string;
  vehicleRegistration?: string;
  vehicleYear?: number;
  preferredZones: string[];
  momoNumber?: string;
  momoNetwork?: string;
  documents: RiderDoc[];
  totalEarnings: number;
  totalDeliveries: number;
  averageRating: number;
  applicationSubmittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt?: string;
}

export default function AdminRidersPage() {
  const { showToast } = useToast();
  const [riders, setRiders] = useState<RiderItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, underReview: 0, approved: 0, rejected: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Selected Rider Modal
  const [selectedRider, setSelectedRider] = useState<RiderItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchRiders();
  }, [activeTab, selectedVehicle]);

  const fetchRiders = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('africart-token') : null;
    try {
      const queryParams = new URLSearchParams();
      if (activeTab !== 'all') queryParams.set('status', activeTab);
      if (selectedVehicle) queryParams.set('vehicleType', selectedVehicle);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res = await fetch(`/api/admin/riders?${queryParams.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRiders(data.riders || []);
        if (data.stats) setStats(data.stats);
      } else {
        showToast(data.message || 'Failed to load rider applications', 'error');
      }
    } catch (err) {
      console.error('Error fetching riders:', err);
      showToast('Error loading riders list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRiders();
  };

  const handleUpdateStatus = async (riderId: string, actionStatus: string, reason?: string) => {
    setIsUpdating(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('africart-token') : null;
    try {
      const res = await fetch(`/api/admin/riders/${riderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: actionStatus,
          rejectionReason: reason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Rider application status updated to ${actionStatus.toUpperCase()}`, 'success');
        setShowRejectModal(false);
        setRejectReasonInput('');
        setSelectedRider(null);
        fetchRiders();
      } else {
        showToast(data.message || 'Failed to update rider status', 'error');
      }
    } catch (err) {
      console.error('Status update error:', err);
      showToast('Error updating rider status', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'rgba(195, 244, 0, 0.15)', color: 'var(--lime-400)', border: '1px solid var(--lime-400)', label: 'Approved' };
      case 'rejected':
        return { bg: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', border: '1px solid #ff4444', label: 'Rejected' };
      case 'under_review':
        return { bg: 'rgba(255, 170, 0, 0.15)', color: '#ffaa00', border: '1px solid #ffaa00', label: 'Under Review' };
      case 'suspended':
        return { bg: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', border: '1px solid #ff4444', label: 'Suspended' };
      default:
        return { bg: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', border: '1px solid #00e5ff', label: 'Pending' };
    }
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 32 }}>two_wheeler</span>
            Rider Onboarding & Fleet Management
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Audit verification documents, approve delivery applicants, and manage nationwide rider operations.
          </p>
        </div>

        <button
          onClick={fetchRiders}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            background: 'var(--surface-container-high)',
            border: '1px solid var(--outline)',
            color: 'var(--foreground)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Refresh Fleet
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: 20 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total Fleet</span>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '2rem', fontWeight: 900, margin: '8px 0 0 0', color: 'var(--foreground)' }}>{stats.total}</h2>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: 20 }}>
          <span style={{ fontSize: '0.8rem', color: '#00e5ff', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Pending Review</span>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '2rem', fontWeight: 900, margin: '8px 0 0 0', color: '#00e5ff' }}>{stats.pending}</h2>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: 20 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--lime-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Approved Active</span>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '2rem', fontWeight: 900, margin: '8px 0 0 0', color: 'var(--lime-400)' }}>{stats.approved}</h2>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: 20 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Rejected / Suspended</span>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '2rem', fontWeight: 900, margin: '8px 0 0 0', color: 'var(--error)' }}>{stats.rejected + stats.suspended}</h2>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${stats.total})` },
              { id: 'pending', label: `Pending (${stats.pending})` },
              { id: 'approved', label: `Approved (${stats.approved})` },
              { id: 'rejected', label: `Rejected (${stats.rejected})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: activeTab === tab.id ? '1px solid var(--lime-400)' : '1px solid var(--outline)',
                  background: activeTab === tab.id ? 'rgba(195, 244, 0, 0.12)' : 'var(--surface-container)',
                  color: activeTab === tab.id ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Vehicle Filter */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, maxWidth: 480 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search name, phone, plate, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: 10,
                  background: 'var(--surface-container)',
                  border: '1px solid var(--outline)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: 18 }}>
                search
              </span>
            </div>

            <select
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">All Vehicles</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="bicycle">Bicycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="walking">Walking</option>
            </select>
          </form>

        </div>
      </div>

      {/* Main Riders Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <div className="animate-pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime-400)', margin: '0 auto 16px' }} />
            <p style={{ margin: 0 }}>Loading rider applications...</p>
          </div>
        ) : riders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>two_wheeler</span>
            <h3 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-lexend)', color: 'var(--foreground)' }}>No Rider Records Found</h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>No rider applications matching the selected criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '16px 20px' }}>Rider / Applicant</th>
                  <th style={{ padding: '16px 20px' }}>Vehicle & Plate</th>
                  <th style={{ padding: '16px 20px' }}>Mobile Money</th>
                  <th style={{ padding: '16px 20px' }}>Ghana Card ID</th>
                  <th style={{ padding: '16px 20px' }}>Documents</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {riders.map(rider => {
                  const b = getStatusBadge(rider.status);
                  return (
                    <tr key={rider.id} style={{ borderBottom: '1px solid var(--outline)', transition: 'background 0.2s' }}>

                      {/* Name & Phone */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.925rem' }}>{rider.fullName}</div>
                        <div style={{ color: 'var(--on-surface-variant)', fontSize: '0.8rem', marginTop: 2 }}>{rider.email} • {rider.phone}</div>
                      </td>

                      {/* Vehicle */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)' }}>
                            {rider.vehicleType === 'motorcycle' ? 'two_wheeler' : rider.vehicleType === 'car' ? 'directions_car' : rider.vehicleType === 'bicycle' ? 'pedal_bike' : 'directions_walk'}
                          </span>
                          {rider.vehicleType}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>
                          {rider.vehicleRegistration || 'No Plate'} {rider.vehicleModel ? `(${rider.vehicleModel})` : ''}
                        </div>
                      </td>

                      {/* Momo */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600 }}>{rider.momoNetwork || 'MTN'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{rider.momoNumber || rider.phone}</div>
                      </td>

                      {/* Ghana Card */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{rider.nationalId || 'N/A'}</div>
                      </td>

                      {/* Documents */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            background: rider.documents.some(d => d.type === 'id_card') ? 'rgba(195, 244, 0, 0.15)' : 'var(--surface-container-high)',
                            color: rider.documents.some(d => d.type === 'id_card') ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                            fontWeight: 600
                          }}>
                            Card
                          </span>
                          {(['car', 'van'].includes(rider.vehicleType) || rider.documents.some(d => d.type === 'license')) && (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              background: rider.documents.some(d => d.type === 'license') ? 'rgba(195, 244, 0, 0.15)' : 'var(--surface-container-high)',
                              color: rider.documents.some(d => d.type === 'license') ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                              fontWeight: 600
                            }}>
                              License
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          background: b.bg,
                          color: b.color,
                          border: b.border,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase'
                        }}>
                          {b.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            onClick={() => setSelectedRider(rider)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              background: 'var(--surface-container-high)',
                              border: '1px solid var(--outline)',
                              color: 'var(--foreground)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Inspect Audit
                          </button>

                          {rider.status !== 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(rider.id, 'approved')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'var(--lime-400)',
                                border: 'none',
                                color: '#000',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {rider.status !== 'rejected' && (
                            <button
                              onClick={() => { setSelectedRider(rider); setShowRejectModal(true); }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: 'rgba(255,68,68,0.15)',
                                border: '1px solid var(--error)',
                                color: 'var(--error)',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRider && !showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass animate-scale-in" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 28, position: 'relative' }}>

            <button
              onClick={() => setSelectedRider(null)}
              style={{ position: 'absolute', right: 20, top: 20, background: 'var(--surface-container)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>

            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0' }}>
              Rider Application Audit
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
              Submitted on {selectedRider.applicationSubmittedAt ? new Date(selectedRider.applicationSubmittedAt).toLocaleString() : 'N/A'}
            </p>

            <div style={{ display: 'grid', gap: 20 }}>

              {/* Applicant Info */}
              <div style={{ background: 'var(--surface-container-low)', padding: 18, borderRadius: 14, border: '1px solid var(--outline)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontFamily: 'var(--font-lexend)', fontSize: '0.95rem', color: 'var(--lime-400)' }}>Applicant Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.875rem' }}>
                  <div><strong>Full Name:</strong> {selectedRider.fullName}</div>
                  <div><strong>Email:</strong> {selectedRider.email}</div>
                  <div><strong>Phone:</strong> {selectedRider.phone}</div>
                  <div><strong>Ghana Card:</strong> {selectedRider.nationalId || 'N/A'}</div>
                  <div><strong>Emergency Contact:</strong> {selectedRider.emergencyContactName || 'N/A'} ({selectedRider.emergencyContactPhone || 'N/A'})</div>
                </div>
              </div>

              {/* Vehicle & Payout */}
              <div style={{ background: 'var(--surface-container-low)', padding: 18, borderRadius: 14, border: '1px solid var(--outline)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontFamily: 'var(--font-lexend)', fontSize: '0.95rem', color: 'var(--lime-400)' }}>Vehicle & Mobile Money Payout</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.875rem' }}>
                  <div><strong>Vehicle Type:</strong> {selectedRider.vehicleType}</div>
                  <div><strong>Plate Number:</strong> {selectedRider.vehicleRegistration || 'N/A'}</div>
                  <div><strong>Model / Year:</strong> {selectedRider.vehicleModel || 'N/A'} ({selectedRider.vehicleYear || 'N/A'})</div>
                  <div><strong>MoMo Payout:</strong> {selectedRider.momoNetwork} - {selectedRider.momoNumber}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Preferred Hubs:</strong> {selectedRider.preferredZones.join(', ') || 'All zones'}</div>
                </div>
              </div>

              {/* Documents Uploaded */}
              <div style={{ background: 'var(--surface-container-low)', padding: 18, borderRadius: 14, border: '1px solid var(--outline)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontFamily: 'var(--font-lexend)', fontSize: '0.95rem', color: 'var(--lime-400)' }}>Uploaded Verification Documents</h4>
                {selectedRider.documents.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>No document photos uploaded yet.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    {selectedRider.documents.map((doc, idx) => (
                      <div key={idx} style={{ background: 'var(--surface)', padding: 10, borderRadius: 10, border: '1px solid var(--outline)', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6 }}>
                          {doc.type.replace('_', ' ')}
                        </span>
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          <img src={doc.url} alt={doc.type} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--outline)' }} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                {selectedRider.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRider.id, 'approved')}
                    disabled={isUpdating}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 10,
                      background: 'var(--lime-400)',
                      color: '#000',
                      fontFamily: 'var(--font-lexend)',
                      fontWeight: 800,
                      fontSize: 14,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Approve Application
                  </button>
                )}

                {selectedRider.status !== 'rejected' && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={isUpdating}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 10,
                      background: 'var(--error)',
                      color: '#fff',
                      fontFamily: 'var(--font-lexend)',
                      fontWeight: 800,
                      fontSize: 14,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Reject Application
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {showRejectModal && selectedRider && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass animate-scale-in" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, maxWidth: 500, width: '100%', padding: 28 }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--error)' }}>
              Reject Rider Application
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', margin: '0 0 18px 0' }}>
              Please state the reason for rejecting {selectedRider.fullName}&apos;s application. This message will be displayed to the applicant.
            </p>

            <textarea
              rows={4}
              value={rejectReasonInput}
              onChange={e => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Ghana Card image is unreadable, or vehicle registration expired."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                background: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                outline: 'none',
                marginBottom: 20
              }}
            />

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ padding: '10px 18px', borderRadius: 8, background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedRider.id, 'rejected', rejectReasonInput)}
                disabled={isUpdating}
                style={{ padding: '10px 18px', borderRadius: 8, background: 'var(--error)', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
              >
                {isUpdating ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
