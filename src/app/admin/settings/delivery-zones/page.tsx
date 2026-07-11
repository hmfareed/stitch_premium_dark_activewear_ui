'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/context/AppContext';
import Link from 'next/link';

interface ZoneRate {
  _id?: string;
  region: string;
  zone: string;
  fee: number;
  estimatedDays: string;
  coversCOD: boolean;
  isActive: boolean;
}

const ZONE_LABELS: Record<string, { label: string; color: string }> = {
  accra_metro:  { label: 'Accra Metro',  color: '#4caf50' },
  kumasi_metro: { label: 'Kumasi Metro', color: '#2196f3' },
  tamale_metro: { label: 'Tamale Metro', color: '#9c27b0' },
  regional:     { label: 'Regional',     color: '#ff9800' },
  rural:        { label: 'Rural',        color: '#f44336' },
};

export default function DeliveryZonesPage() {
  const { showToast } = useToast();
  const [rates, setRates] = useState<ZoneRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<ZoneRate | null>(null);

  useEffect(() => {
    fetch('/api/shipping-rates')
      .then(r => r.json())
      .then(data => {
        if (data.success) setRates(data.rates);
      })
      .catch(() => showToast('Failed to load delivery zones', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (rate: ZoneRate) => {
    setSaving(rate.region);
    try {
      const res = await fetch('/api/shipping-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rate),
      });
      const data = await res.json();
      if (data.success) {
        setRates(prev => prev.map(r => r.region === rate.region ? { ...r, ...data.rate } : r));
        setEditingRate(null);
        showToast(`${rate.region} delivery zone saved!`, 'success');
      } else {
        showToast('Failed to save rate', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSaving(null);
    }
  };

  const grouped = rates.reduce((acc: Record<string, ZoneRate[]>, r) => {
    const z = r.zone || 'regional';
    if (!acc[z]) acc[z] = [];
    acc[z].push(r);
    return acc;
  }, {});

  const INPUT: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid var(--outline)',
    background: 'var(--surface-container)', color: 'var(--foreground)',
    fontSize: 13, fontFamily: 'var(--font-inter)', outline: 'none', width: '100%',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/admin/settings" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontSize: 13 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          Settings
        </Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)', marginBottom: 4 }}>
            Delivery Zones
          </h1>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)' }}>
            Configure zone-based delivery fees, estimated times, and Cash on Delivery availability.
          </p>
        </div>
      </div>

      {/* Zone Legend */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {Object.entries(ZONE_LABELS).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: `${val.color}18`, border: `1px solid ${val.color}44` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: val.color }} />
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: val.color, textTransform: 'uppercase' }}>{val.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(grouped).map(([zone, zoneRates]) => {
            const zoneInfo = ZONE_LABELS[zone] || { label: zone, color: '#888' };
            return (
              <div key={zone}>
                {/* Zone group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: zoneInfo.color }} />
                  <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 900, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {zoneInfo.label}
                  </h2>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>({zoneRates.length} region{zoneRates.length !== 1 ? 's' : ''})</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {zoneRates.map(rate => {
                    const isEditing = editingRate?.region === rate.region;
                    const current = isEditing ? editingRate! : rate;
                    return (
                      <div
                        key={rate.region}
                        style={{
                          background: 'var(--surface)', borderRadius: 14,
                          border: isEditing ? `1px solid ${zoneInfo.color}66` : '1px solid var(--outline)',
                          padding: '14px 18px',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          {/* Region name */}
                          <div style={{ minWidth: 130 }}>
                            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 800, color: 'var(--foreground)' }}>{rate.region}</p>
                          </div>

                          {/* Fee */}
                          <div style={{ flex: 1, minWidth: 90 }}>
                            {isEditing ? (
                              <>
                                <label style={{ fontSize: 9, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fee (GH₵)</label>
                                <input
                                  type="number"
                                  value={current.fee}
                                  onChange={e => setEditingRate(prev => prev ? { ...prev, fee: Number(e.target.value) } : null)}
                                  style={{ ...INPUT, width: 80 }}
                                />
                              </>
                            ) : (
                              <div>
                                <p style={{ fontSize: 9, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Fee</p>
                                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 900, color: 'var(--lime-400)' }}>GH₵{rate.fee}</p>
                              </div>
                            )}
                          </div>

                          {/* Est. Days */}
                          <div style={{ flex: 2, minWidth: 140 }}>
                            {isEditing ? (
                              <>
                                <label style={{ fontSize: 9, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Estimated Days</label>
                                <input
                                  type="text"
                                  value={current.estimatedDays}
                                  onChange={e => setEditingRate(prev => prev ? { ...prev, estimatedDays: e.target.value } : null)}
                                  style={INPUT}
                                  placeholder="e.g. 2-4 business days"
                                />
                              </>
                            ) : (
                              <div>
                                <p style={{ fontSize: 9, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Delivery Time</p>
                                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--foreground)' }}>{rate.estimatedDays}</p>
                              </div>
                            )}
                          </div>

                          {/* CoD toggle */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                            <p style={{ fontSize: 9, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>Cash on Delivery</p>
                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setEditingRate(prev => prev ? { ...prev, coversCOD: !prev.coversCOD } : null);
                                } else {
                                  // Quick toggle without entering full edit mode
                                  const updated = { ...rate, coversCOD: !rate.coversCOD };
                                  handleSave(updated);
                                }
                              }}
                              style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: current.coversCOD ? 'var(--lime-400)' : 'var(--surface-container-highest)',
                                padding: 2, border: 'none', cursor: 'pointer',
                                position: 'relative', transition: 'background 0.2s',
                              }}
                            >
                              <div style={{
                                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                transition: 'transform 0.2s',
                                transform: current.coversCOD ? 'translateX(20px)' : 'translateX(0)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              }} />
                            </button>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 6 }}>
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSave(current)}
                                  disabled={saving === rate.region}
                                  style={{
                                    padding: '8px 14px', borderRadius: 8, border: 'none',
                                    background: 'var(--lime-400)', color: '#000',
                                    fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  {saving === rate.region ? (
                                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>
                                  ) : (
                                    <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span> Save</>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRate(null)}
                                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--outline)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer' }}
                                >
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingRate({ ...rate })}
                                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface-variant)', cursor: 'pointer' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
