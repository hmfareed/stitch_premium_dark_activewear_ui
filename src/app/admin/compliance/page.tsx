'use client';

import React, { useState } from 'react';

interface BuyerData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    isVerified: boolean;
    points: number;
    referralCode?: string;
    createdAt: string;
  };
  savedAddresses: any[];
  orderHistory: Array<{
    orderId: string;
    date: string;
    status: string;
    total: number;
    paymentMethod?: string;
    products?: Array<{ name: string; quantity: number; price: number }>;
  }>;
  exportDate: string;
  regulatoryBasis: string;
}

function downloadJSON(data: BuyerData, email: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `africart-data-${email}-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminCompliancePage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [buyerData, setBuyerData] = useState<BuyerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [erasureConfirm, setErasureConfirm] = useState('');
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureDone, setErasureDone] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'erasure'>('export');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setLoading(true);
    setError('');
    setBuyerData(null);
    setErasureDone(false);
    try {
      const res = await fetch(`/api/compliance?email=${encodeURIComponent(searchEmail.trim())}&format=json`);
      const data = await res.json();
      if (data.success) {
        setBuyerData(data.data);
      } else {
        setError(data.error || 'User not found.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleCSVExport = async () => {
    if (!searchEmail.trim()) return;
    window.open(`/api/compliance?email=${encodeURIComponent(searchEmail.trim())}&format=csv`, '_blank');
  };

  const handleErasure = async () => {
    if (erasureConfirm !== searchEmail.trim()) {
      setError('Email confirmation does not match. Please type the exact email to confirm erasure.');
      return;
    }
    if (!confirm(`FINAL WARNING: This will permanently anonymise all PII for ${searchEmail}. This cannot be undone. Proceed?`)) return;
    setErasureLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/compliance?email=${encodeURIComponent(searchEmail.trim())}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setErasureDone(true);
        setBuyerData(null);
        setErasureConfirm('');
      } else {
        setError(data.error || 'Erasure failed.');
      }
    } catch {
      setError('Network error during erasure. Please try again.');
    }
    setErasureLoading(false);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'color-mix(in srgb, #7c4dff 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c4dff' }}>
            <span className="material-symbols-outlined">gavel</span>
          </div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', margin: 0 }}>Data Compliance</h1>
        </div>
        <p style={{ color: 'var(--on-surface-variant)', maxWidth: 680 }}>
          Ghana Data Protection Act 2012 compliance tools. Export buyer data or exercise the Right to Erasure (Art. 22). All actions are logged in the Audit Log.
        </p>
      </div>

      {/* Info Banner */}
      <div style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid color-mix(in srgb, #7c4dff 30%, transparent)', backgroundColor: 'color-mix(in srgb, #7c4dff 8%, transparent)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span className="material-symbols-outlined" style={{ color: '#7c4dff', fontSize: 22, marginTop: 2 }}>info</span>
        <div>
          <strong style={{ fontSize: '0.95rem' }}>Ghana DPA 2012 — Data Subject Rights</strong>
          <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
            Under Section 18 of the Ghana Data Protection Act 2012, data subjects have the right to access their personal data, and the right to have inaccurate data corrected or erased. Erasure anonymises PII; order records are retained for accounting and tax compliance.
          </p>
        </div>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['export', 'erasure'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setError(''); }}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
              backgroundColor: activeTab === tab ? (tab === 'erasure' ? 'color-mix(in srgb, var(--error) 90%, transparent)' : 'var(--lime-400)') : 'var(--surface)',
              color: activeTab === tab ? (tab === 'erasure' ? 'white' : 'black') : 'var(--on-surface-variant)',
              transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 8 }}>
              {tab === 'export' ? 'download' : 'delete_forever'}
            </span>
            {tab === 'export' ? 'Data Export' : 'Right to Erasure'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', padding: '24px' }}>
        <h3 className="font-lexend" style={{ fontSize: '1.1rem', marginBottom: 16 }}>
          {activeTab === 'export' ? 'Search Buyer by Email' : 'Identify Account for Erasure'}
        </h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="buyer@email.com"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            required
            style={{
              flex: '1 1 300px', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--outline)',
              background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '1rem', boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.6 : 1
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
        {error && (
          <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)', fontSize: '0.9rem', border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)' }}>
            {error}
          </div>
        )}
      </div>

      {/* Erasure Done Banner */}
      {erasureDone && (
        <div style={{ padding: '20px 24px', borderRadius: 12, border: '1px solid color-mix(in srgb, var(--lime-400) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--lime-400) 8%, transparent)', display: 'flex', gap: 14, alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 28 }}>check_circle</span>
          <div>
            <strong>Erasure Complete</strong>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '4px 0 0 0' }}>
              All personally identifiable information for <strong>{searchEmail}</strong> has been anonymised in compliance with Ghana DPA 2012. Order records are retained for accounting purposes.
            </p>
          </div>
        </div>
      )}

      {/* Data Export Results */}
      {activeTab === 'export' && buyerData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Profile Card */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>person</span>
                Buyer Profile
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => downloadJSON(buyerData, searchEmail)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                  Export JSON
                </button>
                <button onClick={handleCSVExport} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>table_view</span>
                  Export CSV
                </button>
              </div>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              {[
                { label: 'Full Name', value: buyerData.profile.name, icon: 'person' },
                { label: 'Email', value: buyerData.profile.email, icon: 'mail' },
                { label: 'Phone', value: buyerData.profile.phone || 'Not provided', icon: 'phone' },
                { label: 'Account Role', value: buyerData.profile.role, icon: 'badge' },
                { label: 'Verified', value: buyerData.profile.isVerified ? 'Yes' : 'No', icon: 'verified' },
                { label: 'Loyalty Points', value: String(buyerData.profile.points || 0), icon: 'stars' },
                { label: 'Referral Code', value: buyerData.profile.referralCode || 'None', icon: 'share' },
                { label: 'Registered', value: new Date(buyerData.profile.createdAt).toLocaleDateString(), icon: 'calendar_today' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)', marginTop: 2 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{f.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order History */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)' }}>
              <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ color: '#00e5ff' }}>shopping_bag</span>
                Order History ({buyerData.orderHistory.length} orders)
              </h3>
            </div>
            {buyerData.orderHistory.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>No orders found for this account.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', fontSize: '0.78rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 20px', fontWeight: 600, textAlign: 'left' }}>Order ID</th>
                      <th style={{ padding: '10px 20px', fontWeight: 600, textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '10px 20px', fontWeight: 600, textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '10px 20px', fontWeight: 600, textAlign: 'left' }}>Total</th>
                      <th style={{ padding: '10px 20px', fontWeight: 600, textAlign: 'left' }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyerData.orderHistory.map((order, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                        <td style={{ padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.orderId || '—'}</td>
                        <td style={{ padding: '12px 20px', fontSize: '0.9rem' }}>{new Date(order.date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)' }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: 700 }}>GH₵{(order.total || 0).toFixed(2)}</td>
                        <td style={{ padding: '12px 20px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{order.paymentMethod || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Saved Addresses */}
          {buyerData.savedAddresses?.length > 0 && (
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', padding: '24px' }}>
              <h3 className="font-lexend" style={{ fontSize: '1.1rem', marginBottom: 16 }}>Saved Addresses</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {buyerData.savedAddresses.map((addr: any, i: number) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: 10, backgroundColor: 'var(--surface-container)', fontSize: '0.9rem' }}>
                    {addr.address}, {addr.city}, {addr.region} {addr.isDefault && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)', fontWeight: 600 }}>Default</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Right to Erasure Tab */}
      {activeTab === 'erasure' && (
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)', padding: '32px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>delete_forever</span>
            </div>
            <div>
              <h2 className="font-lexend" style={{ fontSize: '1.4rem', margin: '0 0 8px 0', color: 'var(--error)' }}>Right to Erasure</h2>
              <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, margin: 0 }}>
                Anonymise all personally identifiable information for a buyer. This action is <strong>irreversible</strong>. Order records are retained for accounting and tax compliance. All PII fields (name, email, phone, addresses) are replaced with anonymised placeholders.
              </p>
            </div>
          </div>

          {buyerData && (
            <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 12, backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8 }}>Account Found:</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}><strong>{buyerData.profile.name}</strong> — {buyerData.profile.email}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>{buyerData.orderHistory.length} order(s) on record</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase' }}>
              Type the buyer's email to confirm erasure
            </label>
            <input
              type="email"
              placeholder={searchEmail || 'buyer@email.com'}
              value={erasureConfirm}
              onChange={e => setErasureConfirm(e.target.value)}
              style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid color-mix(in srgb, var(--error) 40%, transparent)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '1rem' }}
            />
            <button
              onClick={handleErasure}
              disabled={!buyerData || erasureLoading || erasureConfirm !== searchEmail.trim()}
              style={{
                padding: '14px 24px', borderRadius: 10, border: 'none',
                background: !buyerData || erasureLoading || erasureConfirm !== searchEmail.trim() ? 'var(--surface-container-high)' : 'var(--error)',
                color: !buyerData || erasureLoading || erasureConfirm !== searchEmail.trim() ? 'var(--on-surface-variant)' : 'white',
                fontWeight: 700, cursor: erasureLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
                transition: 'all 0.2s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {erasureLoading ? 'progress_activity' : 'delete_forever'}
              </span>
              {erasureLoading ? 'Anonymising…' : 'Permanently Anonymise Account'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
