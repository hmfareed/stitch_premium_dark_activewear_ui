'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ApplicationStatusPage() {
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; bg: string }> = {
    pending:  { label: 'Under Review',  color: '#fbbf24', icon: 'schedule',     bg: 'rgba(251,191,36,0.08)'  },
    approved: { label: 'Approved',       color: 'var(--lime-400)', icon: 'check_circle', bg: 'rgba(0,229,255,0.08)' },
    rejected: { label: 'Not Approved',  color: 'var(--error)', icon: 'cancel',      bg: 'rgba(255,68,68,0.08)'   },
  };

  const TIMELINE_STEPS = [
    { key: 'submitted', label: 'Submitted',    icon: 'upload_file'   },
    { key: 'pending',   label: 'Under Review', icon: 'manage_search' },
    { key: 'decision',  label: 'Decision',     icon: 'gavel'         },
    { key: 'live',      label: 'Store Live',   icon: 'storefront'    },
  ];

  function getTimelineIndex(status: string) {
    if (status === 'approved') return 3;
    if (status === 'rejected') return 2;
    return 1; // pending
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/vendor-applications?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      } else {
        setError('Could not fetch applications');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px 120px' }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, var(--lime-400)22, var(--lime-400)11)', border: '1px solid var(--lime-400)33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--lime-400)' }}>track_changes</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
          APPLICATION STATUS
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
          Enter your email address to check the status of your AfriCart partner application.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '24px 20px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 12, padding: '0 14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>mail</span>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--foreground)', padding: '13px 0', fontSize: 14, fontFamily: 'var(--font-inter)' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{
          padding: '0 20px', borderRadius: 12, border: 'none',
          background: loading ? 'var(--surface-container-high)' : 'var(--lime-400)',
          color: loading ? 'var(--on-surface-variant)' : '#000',
          fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 13,
          cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
        }}>
          {loading
            ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span>
            : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>search</span> Check</>
          }
        </button>
      </form>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', color: 'var(--error)', fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, flexShrink: 0 }}>error</span>
          {error}
        </div>
      )}

      {/* No results */}
      {searched && !loading && !error && applications.length === 0 && (
        <div className="animate-fade-in" style={{ marginTop: 28, textAlign: 'center', padding: '40px 24px', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--on-surface-variant)', opacity: 0.4, display: 'block', marginBottom: 12 }}>inbox</span>
          <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>No Applications Found</p>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 20 }}>No applications found for <strong>{email}</strong>.</p>
          <Link href="/apply" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px',
            borderRadius: 12, background: 'var(--lime-400)', color: '#000',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12,
            textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>storefront</span>
            Apply Now
          </Link>
        </div>
      )}

      {/* Results */}
      {applications.map((app, idx) => {
        const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
        const timelineIdx = getTimelineIndex(app.status);

        return (
          <div key={app._id || idx} className="animate-fade-in-up" style={{
            marginTop: 20, background: 'var(--surface)', border: '1px solid var(--outline)',
            borderRadius: 20, overflow: 'hidden',
          }}>
            {/* Status header */}
            <div style={{ padding: '20px', background: cfg.bg, borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Application Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: cfg.color, fontVariationSettings:"'FILL' 1" }}>{cfg.icon}</span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, color: cfg.color }}>{cfg.label.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginBottom: 2 }}>Applied</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'var(--font-lexend)' }}>
                  {app.appliedAt ? fmtDate(app.appliedAt) : '—'}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--outline)' }}>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Journey</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {TIMELINE_STEPS.map((s, i) => {
                  const done = i <= timelineIdx;
                  const curr = i === timelineIdx && app.status !== 'rejected';
                  const isRejected = app.status === 'rejected' && i === 2;
                  const isLast = i === TIMELINE_STEPS.length - 1;
                  // Hide 'Store Live' step if rejected
                  if (isLast && app.status === 'rejected') return null;
                  return (
                    <React.Fragment key={s.key}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: isRejected ? 'var(--error)' : done ? 'var(--lime-400)' : 'var(--surface-container)',
                          border: isRejected ? '2px solid var(--error)' : done ? '2px solid var(--lime-400)' : '2px solid var(--outline)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: curr ? '0 0 14px rgba(0,229,255,0.3)' : 'none',
                          transition: 'all 0.4s',
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: done ? '#000' : 'var(--on-surface-variant)', fontVariationSettings:"'FILL' 1" }}>{s.icon}</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 9, fontWeight: 800, color: done ? 'var(--foreground)' : 'var(--on-surface-variant)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {s.label}
                        </span>
                      </div>
                      {!isLast && app.status !== 'rejected' && (
                        <div style={{ flex: 1, height: 2, background: i < timelineIdx ? 'var(--lime-400)' : 'var(--outline)', margin: '0 4px', marginBottom: 22, transition: 'background 0.5s' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Application details */}
            <div style={{ padding: '20px' }}>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Applicant',  val: app.name },
                  { label: 'Role',       val: app.role },
                  { label: 'Store Name', val: app.storeName || '—' },
                  { label: 'Reference',  val: String(app._id).slice(-8).toUpperCase() },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
                    <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Rejection reason */}
              {app.status === 'rejected' && app.rejectionReason && (
                <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  <strong style={{ color: 'var(--error)', display: 'block', marginBottom: 4 }}>Reason</strong>
                  {app.rejectionReason}
                </div>
              )}

              {/* Pending note */}
              {app.status === 'pending' && (
                <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  ⏱ Our team usually responds within <strong>24–48 hours</strong>. You will receive an SMS and email once a decision is made.
                </div>
              )}

              {/* Approved — go to vendor dashboard */}
              {app.status === 'approved' && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <Link href="/vendor" style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px', borderRadius: 12, background: 'var(--lime-400)', color: '#000',
                    fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12,
                    textDecoration: 'none', textTransform: 'uppercase',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>storefront</span>
                    Open Vendor Dashboard
                  </Link>
                </div>
              )}

              {/* Rejected — reapply */}
              {app.status === 'rejected' && (
                <div style={{ marginTop: 14 }}>
                  <Link href="/apply" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px', borderRadius: 12, border: '1px solid var(--outline)',
                    background: 'transparent', color: 'var(--foreground)',
                    fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12,
                    textDecoration: 'none', textTransform: 'uppercase',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                    Submit a New Application
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
