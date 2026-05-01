'use client';
import React from 'react';

export default function VendorAnalyticsPage() {
  const dailyData = [30, 45, 38, 55, 42, 60, 75, 68, 80, 72, 90, 85, 95, 88];
  const max = Math.max(...dailyData);

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Analytics</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Track your store performance</p>
        </div>
        <select style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface)' }}>
          <option>Last 14 Days</option><option>Last 30 Days</option><option>This Year</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Revenue', val: '$42,500', trend: '+18.5%', color: '#00e5ff' },
          { label: 'Orders', val: '340', trend: '+12.2%', color: 'var(--lime-400)' },
          { label: 'Conversion', val: '4.2%', trend: '+0.8%', color: 'var(--secondary)' },
          { label: 'Avg Rating', val: '4.8', trend: '+0.1', color: '#ffc107' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 180px', padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>{s.label}</div>
            <div className="font-lexend" style={{ fontSize: '1.8rem', fontWeight: 600 }}>{s.val}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--lime-400)', fontWeight: 600, marginTop: '4px' }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Sales Chart */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
        <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Daily Sales (Last 14 Days)</h3>
        <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {dailyData.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '100%', maxWidth: '28px', height: `${(v / max) * 190}px`, backgroundColor: i === dailyData.length - 1 ? '#00e5ff' : 'var(--surface-container-highest)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{i + 17}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products + Traffic */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 350px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Top Products</h3>
          {[
            { name: 'AeroFlex Running Tee', sales: 124, pct: 100 },
            { name: 'Velocity Track Pants', sales: 89, pct: 72 },
            { name: 'Titanium Gym Duffle', sales: 65, pct: 52 },
            { name: 'Pro Compression Socks', sales: 45, pct: 36 },
          ].map(p => (
            <div key={p.name} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                <span>{p.name}</span><span style={{ fontWeight: 600 }}>{p.sales} sold</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--surface-container)', borderRadius: '3px' }}>
                <div style={{ width: `${p.pct}%`, height: '100%', backgroundColor: '#00e5ff', borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 350px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Traffic Sources</h3>
          {[
            { source: 'Direct', pct: 42, color: '#00e5ff' },
            { source: 'Search', pct: 28, color: 'var(--lime-400)' },
            { source: 'Social Media', pct: 18, color: 'var(--secondary)' },
            { source: 'Referral', pct: 12, color: '#ffc107' },
          ].map(t => (
            <div key={t.source} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                <span>{t.source}</span><span style={{ fontWeight: 600, color: t.color }}>{t.pct}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--surface-container)', borderRadius: '3px' }}>
                <div style={{ width: `${t.pct}%`, height: '100%', backgroundColor: t.color, borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
