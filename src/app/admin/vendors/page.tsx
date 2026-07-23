'use client';

import React, { useState, useEffect, useCallback } from 'react';

type TrustTier = 'unverified' | 'verified' | 'featured';
type AppStatus = 'pending' | 'approved' | 'rejected';

interface Application {
  _id: string;
  name: string; email: string; phone: string; role: string;
  businessType?: string; businessRegNumber?: string;
  storeName?: string; storeHandle?: string; storeBio?: string;
  storeCategories?: string[];
  documentUrl?: string; proofOfAddress?: string;
  payoutMethod?: string; payoutDetails?: any;
  reason?: string;
  status: AppStatus;
  trustTier?: TrustTier;
  rejectionReason?: string;
  commissionRate?: number;
  appliedAt: string;
  reviewedAt?: string;
}

const TIER_INFO: Record<TrustTier, { label: string; color: string; desc: string }> = {
  unverified: { label: 'Unverified', color: '#fbbf24', desc: 'Limited listings, longer payout hold' },
  verified:   { label: 'Verified',   color: 'var(--lime-400)', desc: 'Full limits, "Verified" badge, faster payouts' },
  featured:   { label: 'Featured',   color: '#a855f7', desc: 'Homepage placement, lowest commission' },
};

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/* ── Single application card ── */
function AppCard({ app, onDecision }: { app: Application; onDecision: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [tier, setTier] = useState<TrustTier>('unverified');
  const [commission, setCommission] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [imgView, setImgView] = useState<string | null>(null);

  const submit = async () => {
    if (action === 'reject' && !reason.trim()) { alert('Please provide a rejection reason.'); return; }
    setLoading(true);
    try {
      const body: any = {
        id: app._id,
        status: action === 'approve' ? 'approved' : 'rejected',
      };
      if (action === 'approve') { body.trustTier = tier; if (commission) body.commissionRate = parseFloat(commission); }
      if (action === 'reject') body.rejectionReason = reason;

      const res = await fetch('/api/vendor-applications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Update failed');
      setAction(null);
      onDecision();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const statusColor: Record<AppStatus, string> = {
    pending:  '#fbbf24',
    approved: 'var(--lime-400)',
    rejected: 'var(--error)',
  };

  return (
    <>
      {/* Image lightbox */}
      {imgView && (
        <div onClick={() => setImgView(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
          <img src={imgView} alt="Document" style={{ maxWidth:'90vw', maxHeight:'90vh', borderRadius:12, objectFit:'contain' }} />
        </div>
      )}

      <div style={{ background:'var(--surface)', border:'1px solid var(--outline)', borderRadius:16, overflow:'hidden', marginBottom:12 }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', cursor:'pointer' }} onClick={() => setExpanded(e => !e)}>
          <div style={{ width:44, height:44, borderRadius:12, background:`color-mix(in srgb, ${statusColor[app.status]} 12%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span className="material-symbols-outlined" style={{ fontSize:22, color:statusColor[app.status] }}>
              {app.status === 'approved' ? 'check_circle' : app.status === 'rejected' ? 'cancel' : 'schedule'}
            </span>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:'var(--font-lexend)', fontSize:14, fontWeight:800, color:'var(--foreground)', marginBottom:2 }}>{app.name}</p>
            <p style={{ fontSize:11, color:'var(--on-surface-variant)' }}>{app.role} · {app.storeName || app.email}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:800, fontFamily:'var(--font-lexend)', background:`color-mix(in srgb, ${statusColor[app.status]} 12%, transparent)`, color:statusColor[app.status] }}>
              {app.status.toUpperCase()}
            </span>
            <span style={{ fontSize:10, color:'var(--on-surface-variant)' }}>{fmtDate(app.appliedAt)}</span>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize:20, color:'var(--on-surface-variant)', transition:'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
        </div>

        {/* Expanded */}
        {expanded && (
          <div style={{ borderTop:'1px solid var(--outline)', padding:'20px' }}>
            {/* Info grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {[
                { l:'Email',         v:app.email },
                { l:'Phone',         v:app.phone },
                { l:'Business Type', v:app.businessType?.replace('_',' ') || '—' },
                { l:'Reg. Number',   v:app.businessRegNumber || '—' },
                { l:'Store Handle',  v:app.storeHandle ? `/store/${app.storeHandle}` : '—' },
                { l:'Payout',        v:app.payoutMethod === 'momo' ? `MoMo · ${app.payoutDetails?.momoNumber || '—'}` : `Bank · ${app.payoutDetails?.bankName || '—'}` },
                { l:'Categories',    v:(app.storeCategories || []).slice(0,3).join(', ') || '—' },
                { l:'Trust Tier',    v:app.trustTier ? TIER_INFO[app.trustTier as TrustTier]?.label : '—' },
              ].map(({ l, v }) => (
                <div key={l} style={{ background:'var(--surface-container)', borderRadius:8, padding:'8px 12px' }}>
                  <p style={{ fontSize:9, fontWeight:800, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:2 }}>{l}</p>
                  <p style={{ fontSize:11, fontWeight:700, color:'var(--foreground)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</p>
                </div>
              ))}
            </div>

            {/* Bio / reason */}
            {(app.storeBio || app.reason) && (
              <div style={{ background:'var(--surface-container)', borderRadius:8, padding:'10px 12px', marginBottom:12, fontSize:12, color:'var(--on-surface-variant)', lineHeight:1.6 }}>
                <strong style={{ color:'var(--foreground)', display:'block', marginBottom:4, fontSize:11 }}>
                  {app.storeBio ? 'Store Bio' : 'Reason for Application'}
                </strong>
                {app.storeBio || app.reason}
              </div>
            )}

            {/* Document images */}
            {(app.documentUrl || app.proofOfAddress) && (
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {app.documentUrl && (
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:9, fontWeight:800, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>ID Document</p>
                    <div onClick={() => setImgView(app.documentUrl!)} style={{ width:'100%', height:100, borderRadius:10, overflow:'hidden', cursor:'zoom-in', border:'1px solid var(--outline)' }}>
                      <img src={app.documentUrl} alt="ID" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  </div>
                )}
                {app.proofOfAddress && (
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:9, fontWeight:800, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Proof of Address</p>
                    <div onClick={() => setImgView(app.proofOfAddress!)} style={{ width:'100%', height:100, borderRadius:10, overflow:'hidden', cursor:'zoom-in', border:'1px solid var(--outline)' }}>
                      <img src={app.proofOfAddress} alt="Address" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Decision panel (pending only) */}
            {app.status === 'pending' && (
              <>
                {!action && (
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setAction('approve')} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'color-mix(in srgb, var(--lime-400) 15%, transparent)', color:'var(--lime-400)', fontFamily:'var(--font-lexend)', fontWeight:800, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:16 }}>check_circle</span> Approve
                    </button>
                    <button onClick={() => setAction('reject')} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:'rgba(255,68,68,0.1)', color:'var(--error)', fontFamily:'var(--font-lexend)', fontWeight:800, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:16 }}>cancel</span> Reject
                    </button>
                  </div>
                )}

                {action === 'approve' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <p style={{ fontFamily:'var(--font-lexend)', fontSize:11, fontWeight:800, color:'var(--foreground)' }}>Select Trust Tier</p>
                    <div style={{ display:'flex', gap:6 }}>
                      {(Object.entries(TIER_INFO) as [TrustTier, typeof TIER_INFO[TrustTier]][]).map(([k, info]) => (
                        <button key={k} type="button" onClick={() => setTier(k)} style={{ flex:1, padding:'8px 6px', borderRadius:8, cursor:'pointer', textAlign:'center', border: tier === k ? `2px solid ${info.color}` : '1px solid var(--outline)', background: tier === k ? `color-mix(in srgb, ${info.color} 10%, transparent)` : 'var(--surface-container)', transition:'all 0.15s' }}>
                          <p style={{ fontSize:11, fontWeight:800, color: tier === k ? info.color : 'var(--on-surface-variant)', fontFamily:'var(--font-lexend)' }}>{info.label}</p>
                          <p style={{ fontSize:9, color:'var(--on-surface-variant)', marginTop:2, lineHeight:1.3 }}>{info.desc}</p>
                        </button>
                      ))}
                    </div>
                    <div>
                      <label style={{ fontSize:9, fontWeight:800, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Custom Commission Rate % (optional, leave blank for platform default)</label>
                      <input type="number" min="0" max="50" step="0.5" value={commission} onChange={e => setCommission(e.target.value)} placeholder="e.g. 8" style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--outline)', background:'var(--surface-container)', color:'var(--foreground)', fontSize:13, outline:'none' }} />
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => setAction(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid var(--outline)', background:'transparent', color:'var(--foreground)', fontFamily:'var(--font-lexend)', fontWeight:700, fontSize:12, cursor:'pointer' }}>Cancel</button>
                      <button onClick={submit} disabled={loading} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:'var(--lime-400)', color:'#000', fontFamily:'var(--font-lexend)', fontWeight:900, fontSize:12, cursor: loading ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        {loading ? <span className="material-symbols-outlined animate-spin" style={{ fontSize:16 }}>progress_activity</span> : <span className="material-symbols-outlined" style={{ fontSize:16 }}>check</span>}
                        Confirm Approval
                      </button>
                    </div>
                  </div>
                )}

                {action === 'reject' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    <div>
                      <label style={{ fontSize:9, fontWeight:800, color:'var(--on-surface-variant)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Rejection Reason (sent to applicant via SMS + email)</label>
                      <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Submitted ID is not clearly readable. Please reapply with a clearer photo of your Ghana Card." style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid var(--error)', background:'var(--surface-container)', color:'var(--foreground)', fontSize:12, outline:'none', resize:'vertical', fontFamily:'var(--font-inter)' }} />
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => setAction(null)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid var(--outline)', background:'transparent', color:'var(--foreground)', fontFamily:'var(--font-lexend)', fontWeight:700, fontSize:12, cursor:'pointer' }}>Cancel</button>
                      <button onClick={submit} disabled={loading} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', background:'var(--error)', color:'#fff', fontFamily:'var(--font-lexend)', fontWeight:900, fontSize:12, cursor: loading ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        {loading ? <span className="material-symbols-outlined animate-spin" style={{ fontSize:16 }}>progress_activity</span> : <span className="material-symbols-outlined" style={{ fontSize:16 }}>cancel</span>}
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Rejection reason display */}
            {app.status === 'rejected' && app.rejectionReason && (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,68,68,0.06)', border:'1px solid rgba(255,68,68,0.2)', fontSize:12, color:'var(--on-surface-variant)' }}>
                <strong style={{ color:'var(--error)', display:'block', marginBottom:4 }}>Rejection Reason</strong>
                {app.rejectionReason}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Main page ── */
export default function AdminVendorsPage() {
  const [activeTab, setActiveTab] = useState<AppStatus>('pending');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pending store go-live queue
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storeAction, setStoreAction] = useState<Record<string, { loading: boolean; reason: string }>>({});

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor-applications');
      const data = await res.json();
      if (data.success) setApplications(data.applications);
    } catch {}
    setLoading(false);
  }, []);

  const fetchPendingStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const res = await fetch('/api/stores?status=under_review');
      const data = await res.json();
      if (data.success) setPendingStores(data.stores || []);
    } catch {}
    setStoresLoading(false);
  }, []);

  useEffect(() => { fetchApps(); fetchPendingStores(); }, [fetchApps, fetchPendingStores]);

  const handleStoreDecision = async (storeId: string, action: 'approve' | 'reject') => {
    const reason = storeAction[storeId]?.reason || '';
    if (action === 'reject' && !reason.trim()) { alert('Please provide a rejection reason.'); return; }
    setStoreAction(prev => ({ ...prev, [storeId]: { ...prev[storeId], loading: true, reason: prev[storeId]?.reason || '' } }));
    try {
      const res = await fetch(`/api/stores/${storeId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchPendingStores();
    } catch (e: any) { alert(e.message); }
    finally { setStoreAction(prev => ({ ...prev, [storeId]: { loading: false, reason: '' } })); }
  };

  const filtered = applications.filter(a => {
    if (a.status !== activeTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.storeName || '').toLowerCase().includes(q);
  });

  const counts: Record<AppStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const TABS: { key: AppStatus; label: string; color: string }[] = [
    { key: 'pending',  label: 'Pending',  color: '#fbbf24' },
    { key: 'approved', label: 'Approved', color: 'var(--lime-400)' },
    { key: 'rejected', label: 'Rejected', color: 'var(--error)' },
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-lexend)', fontSize:22, fontWeight:900, marginBottom:4 }}>Vendor Management</h1>
          <p style={{ color:'var(--on-surface-variant)', fontSize:13 }}>Approve store go-live requests and manage vendor applications</p>
        </div>
        <button onClick={() => { fetchApps(); fetchPendingStores(); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 16px', borderRadius:10, border:'1px solid var(--outline)', background:'var(--surface-container)', color:'var(--foreground)', cursor:'pointer', fontFamily:'var(--font-lexend)', fontWeight:700, fontSize:12 }}>
          <span className="material-symbols-outlined" style={{ fontSize:16 }}>refresh</span>
          Refresh
        </button>
      </div>

      {/* ── Pending Store Go-Live Queue ── */}
      {(storesLoading || pendingStores.length > 0) && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <span className="material-symbols-outlined" style={{ color:'#00e5ff', fontSize:22 }}>rocket_launch</span>
            <h2 style={{ fontFamily:'var(--font-lexend)', fontSize:16, fontWeight:900, margin:0 }}>Stores Pending Go-Live</h2>
            <span style={{ padding:'2px 10px', borderRadius:20, background:'rgba(0,229,255,0.1)', color:'#00e5ff', fontSize:11, fontWeight:700 }}>{pendingStores.length}</span>
          </div>
          {storesLoading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...Array(2)].map((_,i) => <div key={i} className="shimmer" style={{ height:80, borderRadius:16 }} />)}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {pendingStores.map(store => (
                <div key={store._id} style={{ background:'var(--surface)', border:'1px solid rgba(0,229,255,0.2)', borderRadius:16, padding:'20px 24px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:12 }}>
                    <div>
                      <div style={{ fontFamily:'var(--font-lexend)', fontWeight:800, fontSize:15 }}>{store.name}</div>
                      <div style={{ fontSize:12, color:'var(--on-surface-variant)', marginTop:2 }}>
                        {store.vendorEmail} · /store/{store.slug} · {store.category} · {store.businessType}
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: store.paystackSubaccountStatus==='active'?'rgba(195,244,0,0.1)':'rgba(255,152,0,0.1)', color: store.paystackSubaccountStatus==='active'?'var(--lime-400)':'#ff9800' }}>
                          💳 Paystack: {store.paystackSubaccountStatus}
                        </span>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: store.phoneVerified?'rgba(195,244,0,0.1)':'rgba(244,67,54,0.1)', color: store.phoneVerified?'var(--lime-400)':'var(--error)' }}>
                          📱 Phone: {store.phoneVerified ? 'Verified' : 'Not Verified'}
                        </span>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: store.contentReviewed?'rgba(195,244,0,0.1)':'rgba(255,152,0,0.1)', color: store.contentReviewed?'var(--lime-400)':'#ff9800' }}>
                          🔍 Content: {store.contentReviewed ? 'Clean' : 'Flagged'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <button
                        onClick={() => handleStoreDecision(store._id, 'approve')}
                        disabled={storeAction[store._id]?.loading}
                        style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'var(--lime-400)', color:'#000', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'var(--font-lexend)', opacity: storeAction[store._id]?.loading ? 0.6 : 1 }}
                      >
                        {storeAction[store._id]?.loading ? '…' : '✓ Go Live'}
                      </button>
                      <button
                        onClick={() => handleStoreDecision(store._id, 'reject')}
                        disabled={storeAction[store._id]?.loading}
                        style={{ padding:'8px 18px', borderRadius:10, border:'1px solid var(--error)', background:'rgba(244,67,54,0.08)', color:'var(--error)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'var(--font-lexend)', opacity: storeAction[store._id]?.loading ? 0.6 : 1 }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                  {/* Rejection reason input */}
                  <input
                    type="text"
                    placeholder="Rejection reason (required to reject)…"
                    value={storeAction[store._id]?.reason || ''}
                    onChange={e => setStoreAction(prev => ({ ...prev, [store._id]: { ...prev[store._id], loading: prev[store._id]?.loading || false, reason: e.target.value } }))}
                    style={{ width:'100%', boxSizing:'border-box', padding:'8px 14px', borderRadius:8, border:'1px solid var(--outline)', background:'var(--surface-container)', color:'var(--on-surface)', fontSize:12, outline:'none', fontFamily:'var(--font-inter)' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <hr style={{ border:'none', borderTop:'1px solid var(--outline)', marginBottom:28 }} />
      <h2 style={{ fontFamily:'var(--font-lexend)', fontSize:16, fontWeight:900, marginBottom:20 }}>Vendor Applications</h2>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(tab => (
          <div key={tab.key} style={{ flex:'1 1 140px', background:'var(--surface)', border:`1px solid var(--outline)`, borderRadius:14, padding:'16px 20px' }}>
            <p style={{ fontSize:11, color:'var(--on-surface-variant)', marginBottom:4 }}>{tab.label}</p>
            <p style={{ fontFamily:'var(--font-lexend)', fontSize:28, fontWeight:900, color: tab.color }}>{counts[tab.key]}</p>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="responsive-tabs-row" style={{ background:'var(--surface-container)', borderRadius:12, padding:4 }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer',
              background: activeTab === tab.key ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.key ? tab.color : 'var(--on-surface-variant)',
              fontFamily:'var(--font-lexend)', fontWeight:800, fontSize:12,
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition:'all 0.2s',
            }}>
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>
        <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', gap:8, background:'var(--surface)', border:'1px solid var(--outline)', borderRadius:10, padding:'0 12px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:16, color:'var(--on-surface-variant)' }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, store..." style={{ flex:1, border:'none', background:'transparent', color:'var(--foreground)', fontSize:13, outline:'none', padding:'9px 0', fontFamily:'var(--font-inter)' }} />
        </div>
      </div>

      {/* Application list */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height:76, borderRadius:16 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize:48, opacity:0.3, display:'block', marginBottom:12 }}>inbox</span>
          <p style={{ fontFamily:'var(--font-lexend)', fontWeight:700 }}>
            {search ? 'No matching applications' : `No ${activeTab} applications`}
          </p>
        </div>
      ) : (
        filtered.map(app => (
          <AppCard key={app._id} app={app} onDecision={fetchApps} />
        ))
      )}
    </div>
  );
}
