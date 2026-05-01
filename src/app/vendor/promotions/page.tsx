'use client';
import React, { useState } from 'react';

export default function VendorPromotionsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const promos = [
    { code: 'SUMMER25', discount: '25%', type: 'Percentage', uses: 142, limit: 500, status: 'Active', expires: 'Jun 30, 2025' },
    { code: 'NEWUSER10', discount: '10%', type: 'Percentage', uses: 89, limit: 200, status: 'Active', expires: 'Dec 31, 2025' },
    { code: 'FLASH50', discount: '$50', type: 'Fixed', uses: 50, limit: 50, status: 'Expired', expires: 'Apr 15, 2025' },
    { code: 'FREESHIP', discount: 'Free Ship', type: 'Shipping', uses: 320, limit: 1000, status: 'Active', expires: 'Dec 31, 2025' },
  ];
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
      {showCreate && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <input placeholder="Coupon Code" style={{ flex: '1 1 150px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
          <input placeholder="Discount Value" style={{ flex: '1 1 120px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
          <select style={{ flex: '1 1 120px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)' }}>
            <option>Percentage</option><option>Fixed Amount</option><option>Free Shipping</option>
          </select>
          <input type="date" style={{ flex: '1 1 140px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
          <button style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Save</button>
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
            {promos.map((p, idx) => (
              <tr key={p.code} style={{ borderBottom: idx !== promos.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                <td style={{ padding: '16px 24px', fontWeight: 600, fontFamily: 'monospace' }}>{p.code}</td>
                <td style={{ padding: '16px 24px', fontWeight: 600, color: '#00e5ff' }}>{p.discount}</td>
                <td style={{ padding: '16px 24px' }}>{p.uses}/{p.limit}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: `color-mix(in srgb, ${p.status === 'Active' ? 'var(--lime-400)' : 'var(--error)'} 20%, transparent)`, color: p.status === 'Active' ? 'var(--lime-400)' : 'var(--error)' }}>{p.status}</span>
                </td>
                <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{p.expires}</td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span></button>
                    <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span></button>
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
