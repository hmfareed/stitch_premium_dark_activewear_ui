'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorRatingAnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/reviews?stars=all');
      const data = await res.json();
      if (res.ok) setAnalytics(data.analytics);
    } catch (err) {
      console.error('Failed to load rating analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 18 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Reviews & Ratings Hub', path: '/vendor/reviews', active: false, icon: 'star' },
          { label: 'Rating Analytics', path: '/vendor/reviews/analytics', active: true, icon: 'insights' },
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

      {/* Main Analytics Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Product Rating Leaderboard & Sentiment Analytics
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Detailed rating scores and review volume analytics across catalog products.
          </p>
        </div>

        {loading || !analytics ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading rating analytics...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>TOTAL REVIEWS RECEIVED</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
                {analytics.totalCount} Reviews
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>FIVE STAR REVIEWS RATIO</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', marginTop: 4 }}>
                {analytics.totalCount > 0 ? ((analytics.distribution.fiveStar / analytics.totalCount) * 100).toFixed(0) : 0}%
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>RESPONSE TIME AVERAGE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                &lt; 2.4 Hours
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
