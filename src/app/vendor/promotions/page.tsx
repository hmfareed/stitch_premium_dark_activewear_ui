'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';

export default function VendorPromotionsPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [form, setForm] = useState({
    code: '',
    discountValue: '',
    type: 'Percentage',
    limit: '',
    expiresAt: ''
  });

  const fetchPromos = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/promotions?vendorEmail=${user.email}`);
      const data = await res.json();
      if (data.success) {
        setPromos(data.promotions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, [user]);

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vendorEmail: user?.email,
          discountValue: Number(form.discountValue),
          limit: Number(form.limit)
        })
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ code: '', discountValue: '', type: 'Percentage', limit: '', expiresAt: '' });
        fetchPromos();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create promo');
      }
    } catch (err) {
      alert('Error creating promo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPromos();
      }
    } catch (err) {}
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Promotions</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Manage discounts and coupon codes</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>Create Promo
        </button>
      </div>
      {/* Create Promo Modal */}
      {showCreate && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={() => setShowCreate(false)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="animate-scale-in" 
            style={{ background: 'var(--surface)', borderRadius: '24px', padding: '32px', maxWidth: '500px', width: '90%', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 className="font-lexend" style={{ fontSize: '1.3rem', margin: 0, color: 'var(--foreground)' }}>Create Promo Coupon</h3>
              <button 
                onClick={() => setShowCreate(false)} 
                style={{ background: 'var(--surface-container-high)', border: 'none', cursor: 'pointer', color: 'var(--on-surface)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Coupon Code</label>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER20" style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', textTransform: 'uppercase' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Discount Value</label>
                <input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} placeholder="Value" style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Discount Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }}>
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed">Fixed Amount (GH₵)</option>
                  <option value="Shipping">Free Shipping</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Usage Limit</label>
                <input type="number" value={form.limit} onChange={e => setForm({...form, limit: e.target.value})} placeholder="Uses" style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Expiry Date</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleCreate} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Create Coupon</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Code</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Discount</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Uses</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Expires</th>
              <th style={{ padding: '14px 24px', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>No promotions yet.</td></tr>
            ) : promos.map((p, idx) => (
              <tr key={p._id} style={{ borderBottom: idx !== promos.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600, fontFamily: 'monospace' }}>{p.code}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: '#00e5ff' }}>
                  {p.type === 'Percentage' ? `${p.discountValue}%` : p.type === 'Fixed' ? `GH₵${p.discountValue}` : 'Free Shipping'}
                </td>
                <td style={{ padding: '16px 24px' }}>{p.uses}/{p.limit}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: `color-mix(in srgb, ${p.status === 'Active' ? 'var(--lime-400)' : 'var(--error)'} 20%, transparent)`, color: p.status === 'Active' ? 'var(--lime-400)' : 'var(--error)' }}>{p.status}</span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{new Date(p.expiresAt).toLocaleDateString()}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleDelete(p._id)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
