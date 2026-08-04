'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorDeliverySettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deliveryRadius, setDeliveryRadius] = useState(25);
  const [flatRateFee, setFlatRateFee] = useState(15.00);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(250.00);
  const [enableSelfPickup, setEnableSelfPickup] = useState(true);
  const [courierYango, setCourierYango] = useState(true);
  const [courierFedEx, setCourierFedEx] = useState(false);
  const [courierLocalRider, setCourierLocalRider] = useState(true);

  useEffect(() => {
    fetchDeliverySettings();
  }, []);

  const fetchDeliverySettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/storefront');
      const data = await res.json();
      if (res.ok && data.store?.deliverySettings) {
        const ds = data.store.deliverySettings;
        setDeliveryRadius(ds.deliveryRadius || 25);
        setFlatRateFee(ds.flatRateFee || 15.00);
        setFreeDeliveryThreshold(ds.freeDeliveryThreshold || 250.00);
        setEnableSelfPickup(ds.enableSelfPickup !== false);
        setCourierYango(ds.courierYango !== false);
        setCourierFedEx(!!ds.courierFedEx);
        setCourierLocalRider(ds.courierLocalRider !== false);
      }
    } catch (err) {
      console.error('Failed to fetch delivery settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/vendor/storefront', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverySettings: {
            deliveryRadius,
            flatRateFee,
            freeDeliveryThreshold,
            enableSelfPickup,
            courierYango,
            courierFedEx,
            courierLocalRider,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save delivery settings');

      showToast('Delivery settings and dispatch rules saved!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Save error', 'error');
    } finally {
      setSaving(false);
    }
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
          { label: 'Pickup Locations', path: '/vendor/settings/pickup', active: false, icon: 'location_on' },
          { label: 'Delivery Settings', path: '/vendor/settings/delivery', active: true, icon: 'local_shipping' },
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

      {/* Main Settings Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Delivery Areas & Logistics Dispatch Settings
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Set coverage radius, delivery fees, free shipping thresholds, and courier integrations.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading delivery settings...</div>
        ) : (
          <form onSubmit={handleSaveDelivery} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Delivery Fees & Radius */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Delivery Radius Coverage (km)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={deliveryRadius}
                    onChange={e => setDeliveryRadius(Number(e.target.value))}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>km</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Flat Rate Delivery Fee (GH₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={flatRateFee}
                  onChange={e => setFlatRateFee(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Free Delivery Threshold (GH₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={freeDeliveryThreshold}
                  onChange={e => setFreeDeliveryThreshold(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>
            </div>

            {/* Self-Pickup Toggle Card */}
            <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Enable Self-Pickup Option for Customers</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Allow buyers to select store pickup at checkout instead of courier delivery.</div>
              </div>
              <input
                type="checkbox"
                checked={enableSelfPickup}
                onChange={e => setEnableSelfPickup(e.target.checked)}
                style={{ accentColor: '#10b981', width: 20, height: 20, cursor: 'pointer' }}
              />
            </div>

            {/* Courier Dispatch Integration Cards */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Automated Courier Partner Dispatch</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                
                {/* Yango Delivery */}
                <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#ef4444' }}>two_wheeler</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Yango Delivery</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Intra-city express</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={courierYango}
                    onChange={e => setCourierYango(e.target.checked)}
                    style={{ accentColor: '#10b981', width: 18, height: 18, cursor: 'pointer' }}
                  />
                </div>

                {/* Local Dedicated Rider */}
                <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#10b981' }}>pedal_bike</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>AfriCart Dedicated Rider</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Platform courier network</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={courierLocalRider}
                    onChange={e => setCourierLocalRider(e.target.checked)}
                    style={{ accentColor: '#10b981', width: 18, height: 18, cursor: 'pointer' }}
                  />
                </div>

                {/* FedEx Ghana */}
                <div style={{ padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#2563eb' }}>local_shipping</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>FedEx / DHL Ghana</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>Inter-regional shipping</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={courierFedEx}
                    onChange={e => setCourierFedEx(e.target.checked)}
                    style={{ accentColor: '#10b981', width: 18, height: 18, cursor: 'pointer' }}
                  />
                </div>

              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  borderRadius: 10,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-lexend, sans-serif)',
                  boxShadow: '0 3px 10px rgba(16,185,129,0.3)',
                }}
              >
                {saving ? 'SAVING LOGISTICS RULES...' : 'SAVE DELIVERY SETTINGS'}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
