'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorReviewsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [starFilter, setStarFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Reply Modal State
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [starFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/reviews?stars=${starFilter}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReplyModal = (rev: any) => {
    setSelectedReview(rev);
    setReplyText(rev.vendorReply || '');
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      showToast('Reply text is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          reviewId: selectedReview.id,
          replyText: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Official vendor response published!', 'success');
      setReviews(data.reviews || []);
      setSelectedReview(null);
      setReplyText('');
    } catch (err: any) {
      showToast(err.message || 'Error posting reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportAbusive = async (revId: string) => {
    try {
      const res = await fetch('/api/vendor/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_abusive',
          reviewId: revId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Review reported to Superadmin moderation team!', 'info');
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Error reporting abusive review:', err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 18 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Reviews & Ratings Hub', path: '/vendor/reviews', active: true, icon: 'star' },
          { label: 'Rating Analytics', path: '/vendor/reviews/analytics', active: false, icon: 'insights' },
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

      {/* Analytics Banner */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div style={{ backgroundColor: '#061d13', borderRadius: 16, padding: 22, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#a3e635', lineHeight: 1 }}>{analytics.avgRating.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: '#facc15', marginTop: 4 }}>★★★★★</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#a3e635' }}>STORE RATING SCORE</div>
              <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 2 }}>Based on {analytics.totalCount} customer reviews</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>STAR RATING BREAKDOWN</div>
            {Object.keys(analytics.distribution).reverse().map((key, idx) => {
              const stars = 5 - idx;
              const count = analytics.distribution[key];
              const pct = analytics.totalCount > 0 ? (count / analytics.totalCount) * 100 : 0;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 3 }}>
                  <span style={{ width: 24, fontWeight: 700 }}>{stars}★</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#f59e0b' }}></div>
                  </div>
                  <span style={{ width: 24, color: '#64748b', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>VENDOR RESPONSE RATE</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', marginTop: 4 }}>
              {analytics.responseRate.toFixed(0)}%
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Public vendor replies published</div>
          </div>
        </div>
      )}

      {/* Main Reviews List Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Customer Reviews & Ratings Feed
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Respond to customer feedback, flag abusive reviews, and manage store reputation.
            </p>
          </div>

          {/* Star Filter Pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'all', label: 'All Reviews' },
              { id: '5', label: '5★' },
              { id: '4', label: '4★' },
              { id: '3', label: '3★' },
              { id: '2', label: '2★' },
              { id: '1', label: '1★' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStarFilter(f.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  fontWeight: starFilter === f.id ? 800 : 600,
                  cursor: 'pointer',
                  backgroundColor: starFilter === f.id ? '#061d13' : '#ffffff',
                  color: starFilter === f.id ? '#a3e635' : '#475569',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 42, color: '#cbd5e1', marginBottom: 8 }}>rate_review</span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>No reviews found for this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.map(rev => (
              <div key={rev.id} style={{ backgroundColor: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{rev.customerName}</span>
                      {rev.verifiedPurchase && (
                        <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                          ✓ VERIFIED PURCHASE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Product: <strong>{rev.productTitle}</strong></div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, color: '#f59e0b', fontWeight: 800 }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{rev.date}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: 0 }}>{rev.title}</h4>
                  <p style={{ fontSize: 13, color: '#334155', marginTop: 4, margin: 0, lineHeight: 1.4 }}>{rev.comment}</p>
                </div>

                {/* Vendor Reply Display */}
                {rev.vendorReply && (
                  <div style={{ marginTop: 14, backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981', padding: '10px 14px', borderRadius: '0 10px 10px 0' }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#166534' }}>OFFICIAL VENDOR RESPONSE</div>
                    <p style={{ fontSize: 12, color: '#14532d', margin: '4px 0 0', fontWeight: 600 }}>{rev.vendorReply}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                  <button
                    onClick={() => handleReportAbusive(rev.id)}
                    disabled={rev.isAbusiveReported}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: rev.isAbusiveReported ? 'default' : 'pointer',
                      backgroundColor: rev.isAbusiveReported ? '#fee2e2' : '#f1f5f9',
                      color: rev.isAbusiveReported ? '#dc2626' : '#64748b',
                    }}
                  >
                    {rev.isAbusiveReported ? 'FLAGGED ABUSIVE' : 'Report Abusive'}
                  </button>

                  <button
                    onClick={() => handleOpenReplyModal(rev)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {rev.vendorReply ? 'Edit Reply' : 'Reply to Review'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official Reply Modal */}
      {selectedReview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Publish Official Vendor Response</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
              Replying to <strong>{selectedReview.customerName}</strong> on <em>{selectedReview.productTitle}</em>
            </p>

            <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={4}
                placeholder="Write your public vendor response to the customer review..."
                style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13 }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setSelectedReview(null)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Publish Response</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
