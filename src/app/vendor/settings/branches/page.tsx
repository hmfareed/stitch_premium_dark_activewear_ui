'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

interface Branch {
  id: string;
  name: string;
  address: string;
  manager: string;
  phone: string;
  isMain: boolean;
  status: string;
}

export default function VendorBranchesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New branch modal state
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/branches');
      const data = await res.json();
      if (res.ok) {
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) { showToast('Branch name is required', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: branchName.trim(),
          address: address.trim() || 'Accra, Ghana',
          manager: manager.trim() || user?.name,
          phone: phone.trim() || user?.phone,
          status: 'active',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create branch');

      showToast('New branch created successfully!', 'success');
      setBranches(data.branches || []);
      setShowAddModal(false);
      setBranchName('');
      setAddress('');
      setManager('');
      setPhone('');
    } catch (err: any) {
      showToast(err.message || 'Branch creation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      const res = await fetch(`/api/vendor/branches?branchId=${encodeURIComponent(branchId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete branch');

      showToast('Branch deleted.', 'info');
      setBranches(data.branches || []);
    } catch (err: any) {
      showToast(err.message || 'Deletion error', 'error');
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Store Profile', path: '/vendor/settings', active: false, icon: 'storefront' },
          { label: 'Branches', path: '/vendor/settings/branches', active: true, icon: 'store' },
          { label: 'Business Hours', path: '/vendor/settings/hours', active: false, icon: 'schedule' },
          { label: 'Pickup Locations', path: '/vendor/settings/pickup', active: false, icon: 'location_on' },
          { label: 'Delivery Settings', path: '/vendor/settings/delivery', active: false, icon: 'local_shipping' },
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

      {/* Main Content Area */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Multi-Branch Store Locations
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Manage physical store branches, branch managers, and active status.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add New Branch
          </button>
        </div>

        {/* Branches Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading branches...</div>
        ) : branches.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No branches configured.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {branches.map(b => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{b.name}</span>
                      {b.isMain && (
                        <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 4 }}>
                          MAIN
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: b.status === 'active' ? '#16a34a' : '#94a3b8', backgroundColor: b.status === 'active' ? '#dcfce7' : '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                      {b.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569', marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>location_on</span>
                      <span>{b.address}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>person</span>
                      <span>Manager: {b.manager}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748b' }}>call</span>
                      <span>{b.phone}</span>
                    </div>
                  </div>
                </div>

                {!b.isMain && (
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleDeleteBranch(b.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      Remove Branch
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add New Store Branch</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Branch Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Mart - Osu Branch"
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. Oxford Street, Osu, Accra"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Branch Manager</label>
                  <input
                    type="text"
                    placeholder="Manager Name"
                    value={manager}
                    onChange={e => setManager(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+233 24 000 0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  {submitting ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
