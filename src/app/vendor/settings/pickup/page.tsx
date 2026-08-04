'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  landmark: string;
  contactPerson: string;
  phone: string;
  instructions: string;
}

const DEFAULT_POINTS: PickupPoint[] = [
  { id: 'p-1', name: 'Main Store Pickup Hub', address: 'Oxford Street, Osu, Accra', landmark: 'Opposite Shell Fuel Station', contactPerson: 'Kofi Mensah', phone: '+233 24 123 4567', instructions: 'Show Order ID at customer pickup desk.' },
  { id: 'p-2', name: 'East Legon Dispatch Depot', address: 'Boundary Road, East Legon', landmark: 'Near Anomo Restaurant', contactPerson: 'Ama Boateng', phone: '+233 20 999 0000', instructions: 'Pickups available between 9 AM and 6 PM.' },
];

export default function VendorPickupLocationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>(DEFAULT_POINTS);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [pointName, setPointName] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    fetchPickupPoints();
  }, []);

  const fetchPickupPoints = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/storefront');
      const data = await res.json();
      if (res.ok && data.store?.pickupPoints) {
        setPickupPoints(data.store.pickupPoints);
      }
    } catch (err) {
      console.error('Failed to load pickup points:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePoints = async (updated: PickupPoint[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/storefront', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupPoints: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update pickup points');

      setPickupPoints(updated);
      showToast('Pickup locations updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Save error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointName.trim()) { showToast('Point name is required', 'error'); return; }

    const newPoint: PickupPoint = {
      id: `p-${Date.now().toString(36)}`,
      name: pointName.trim(),
      address: address.trim() || 'Accra, Ghana',
      landmark: landmark.trim() || 'Central Landmark',
      contactPerson: contactPerson.trim() || user?.name || 'Store Agent',
      phone: phone.trim() || user?.phone || '+233 24 000 0000',
      instructions: instructions.trim() || 'Show Order ID upon arrival.',
    };

    const updatedList = [...pickupPoints, newPoint];
    await handleSavePoints(updatedList);

    setShowAddModal(false);
    setPointName('');
    setAddress('');
    setLandmark('');
    setContactPerson('');
    setPhone('');
    setInstructions('');
  };

  const handleDeletePoint = async (id: string) => {
    if (!confirm('Remove this pickup location?')) return;
    const updated = pickupPoints.filter(p => p.id !== id);
    await handleSavePoints(updated);
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Store Profile', path: '/vendor/settings', active: false, icon: 'storefront' },
          { label: 'Branches', path: '/vendor/settings/branches', active: false, icon: 'store' },
          { label: 'Business Hours', path: '/vendor/settings/hours', active: false, icon: 'schedule' },
          { label: 'Pickup Locations', path: '/vendor/settings/pickup', active: true, icon: 'location_on' },
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

      {/* Main Content Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Customer Self-Pickup Locations
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Set up customer self-pickup points where buyers can collect their orders directly.
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_location</span>
            Add Pickup Point
          </button>
        </div>

        {/* Pickup Points List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading pickup locations...</div>
        ) : pickupPoints.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No pickup points added yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {pickupPoints.map(point => (
              <div
                key={point.id}
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
                      <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 20 }}>location_on</span>
                      <span>{point.name}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569', marginTop: 10 }}>
                    <div><strong>Address:</strong> {point.address}</div>
                    <div><strong>Landmark:</strong> {point.landmark}</div>
                    <div><strong>Contact Person:</strong> {point.contactPerson} ({point.phone})</div>
                    <div style={{ marginTop: 4, padding: '8px 10px', backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', color: '#64748b', fontSize: 11 }}>
                      <strong>Instructions:</strong> {point.instructions}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleDeletePoint(point.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    Remove Point
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Pickup Point Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Add Pickup Location</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <form onSubmit={handleAddPoint} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Point Label Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Accra Central Hub"
                  value={pointName}
                  onChange={e => setPointName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Full Address</label>
                <input
                  type="text"
                  placeholder="Street & Suite Number"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Landmark</label>
                  <input
                    type="text"
                    placeholder="Near Shell Station"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Contact Person</label>
                  <input
                    type="text"
                    placeholder="Agent Name"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+233 24 123 4567"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Pickup Instructions for Customer</label>
                <input
                  type="text"
                  placeholder="Show Order ID & Ghana Card at counter"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  {saving ? 'Adding...' : 'Add Point'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
