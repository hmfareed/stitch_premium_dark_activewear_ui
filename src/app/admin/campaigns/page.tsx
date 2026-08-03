'use client';

import React, { useState, useEffect, useCallback } from 'react';

type PromoTab = 'all' | 'coupon' | 'promo_code' | 'flash_sale' | 'banner' | 'featured_product' | 'featured_vendor';

const PRESET_GRADIENTS = [
  { name: 'Sunset Fusion', css: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' },
  { name: 'Neon Cyberpunk', css: 'linear-gradient(135deg, #f107a3 0%, #7b2ff7 100%)' },
  { name: 'Teal Surge', css: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Oceanic Wave', css: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
  { name: 'Solar Gold', css: 'linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%)' },
];

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<PromoTab>('all');
  const [loading, setLoading] = useState(true);
  const [promotionsList, setPromotionsList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal Operation State
  const [modalType, setModalType] = useState<PromoTab | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDiscountValue, setFormDiscountValue] = useState('20');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formBannerGradient, setFormBannerGradient] = useState(PRESET_GRADIENTS[0].css);
  const [formTargetUrl, setFormTargetUrl] = useState('/');
  const [formTargetProductId, setFormTargetProductId] = useState('');
  const [formTargetVendorEmail, setFormTargetVendorEmail] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Promotions Data
  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/promotions?type=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setPromotionsList(data.promotions || []);
        setProductsList(data.products || []);
        setVendorsList(data.vendors || []);
      }
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // Action: Create Promotion (Handles all 6 promo types)
  const handleCreatePromotion = async (typeToCreate: PromoTab) => {
    if (!formTitle) {
      alert('Promotion title is required');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeToCreate,
          title: formTitle,
          code: formCode,
          discountValue: formDiscountValue,
          discountType: formDiscountType,
          bannerGradient: formBannerGradient,
          targetUrl: formTargetUrl,
          targetProductId: formTargetProductId,
          targetVendorEmail: formTargetVendorEmail,
          startDate: formStartDate,
          endDate: formEndDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchPromotions();
      } else {
        alert(data.message || 'Creation failed');
      }
    } catch (err) {
      console.error('Create promo error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Active Status
  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchPromotions();
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  // Action: Delete Promotion
  const handleDeletePromo = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchPromotions();
      }
    } catch (err) {
      console.error('Delete promo error:', err);
    }
  };

  const resetForm = () => {
    setFormTitle(''); setFormCode(''); setFormDiscountValue('20');
    setFormTargetUrl('/'); setFormTargetProductId(''); setFormTargetVendorEmail('');
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={toastStyle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Promotions & Marketing Suite
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Coupons, promo codes, flash sales, homepage banners, featured products & featured vendor badges
          </p>
        </div>

        {/* Global Action Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => { resetForm(); setModalType('coupon'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>confirmation_number</span>
            <span>+ Coupon</span>
          </button>
          <button onClick={() => { resetForm(); setModalType('flash_sale'); }} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bolt</span>
            <span>+ Flash Sale</span>
          </button>
          <button onClick={() => { resetForm(); setModalType('banner'); }} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>art_track</span>
            <span>+ Banner</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Total Promotions</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{promotionsList.length} Campaigns</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Active Hero Banners</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>
            {promotionsList.filter(p => p.type === 'banner' && p.isActive).length} Banners
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Featured Products Spotlight</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
            {productsList.filter(p => p.isFeatured).length} Items Featured
          </div>
        </div>
      </div>

      {/* 6 Sub-View Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { id: 'all', label: 'All Promotions', icon: 'auto_awesome' },
          { id: 'coupon', label: 'Coupons', icon: 'confirmation_number' },
          { id: 'promo_code', label: 'Promo Codes', icon: 'sell' },
          { id: 'flash_sale', label: 'Flash Sales', icon: 'bolt' },
          { id: 'banner', label: 'Banners', icon: 'art_track' },
          { id: 'featured_product', label: 'Featured Products', icon: 'star' },
          { id: 'featured_vendor', label: 'Featured Vendors', icon: 'workspace_premium' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as PromoTab)}
            style={{
              border: 'none',
              background: activeTab === tab.id ? '#0f172a' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#64748b',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 10,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading marketing telemetry...</p>
        </div>
      ) : (

        /* Master Data Table & Cards Grid */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Active Banner Carousel Cards Preview */}
          {(activeTab === 'all' || activeTab === 'banner') && promotionsList.some(p => p.type === 'banner') && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Promotional Hero Banners</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {promotionsList.filter(p => p.type === 'banner').map(b => (
                  <div key={b.id} style={{ background: b.bannerGradient, borderRadius: 16, padding: 20, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>PROMO BANNER</span>
                      <h4 style={{ fontSize: 18, fontWeight: 900, margin: '8px 0 4px' }}>{b.title}</h4>
                      <p style={{ fontSize: 12, opacity: 0.9, margin: 0 }}>Target URL: {b.targetUrl}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{b.isActive ? 'LIVE ON HOMEPAGE' : 'DISABLED'}</span>
                      <button onClick={() => handleToggleActive(b.id)} style={{ border: 'none', background: '#fff', color: '#0f172a', padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                        {b.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Table for Coupons, Flash Sales, Promo Codes & Spotlights */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
              Promotional Campaigns Directory ({promotionsList.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: 10 }}>Title & Code</th>
                    <th style={{ padding: 10 }}>Type</th>
                    <th style={{ padding: 10 }}>Discount / Target</th>
                    <th style={{ padding: 10 }}>Validity Dates</th>
                    <th style={{ padding: 10 }}>Status</th>
                    <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promotionsList.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: 12 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.title}</div>
                        {p.code !== 'N/A' && <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 800 }}>Code: {p.code}</div>}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={badgeStyle('#4338ca', '#e0e7ff')}>{p.type.replace('_', ' ').toUpperCase()}</span>
                      </td>
                      <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>
                        {p.discountValue ? `${p.discountValue}% OFF` : 'Spotlight Flag'}
                      </td>
                      <td style={{ padding: 12, color: '#64748b' }}>
                        {p.startDate} - {p.endDate}
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={badgeStyle(p.isActive ? '#166534' : '#991b1b', p.isActive ? '#dcfce7' : '#fee2e2')}>
                          {p.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleToggleActive(p.id)} style={{ border: 'none', background: '#f1f5f9', color: '#0f172a', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            {p.isActive ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeletePromo(p.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── MODALS FOR CREATING ALL 6 PROMOTION TYPES ─────────────────── */}

      {/* Modal: Create Coupon / Promo Code */}
      {(modalType === 'coupon' || modalType === 'promo_code') && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create {modalType === 'coupon' ? 'Coupon' : 'Promo Code'}</h3>
            <form onSubmit={e => { e.preventDefault(); handleCreatePromotion(modalType); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Title / Campaign Name *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required placeholder="e.g. Welcome 20% Discount" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Discount Code (Uppercase) *</label>
                  <input type="text" value={formCode} onChange={e => setFormCode(e.target.value)} required placeholder="AFRICART20" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Discount Percentage (%) *</label>
                  <input type="number" value={formDiscountValue} onChange={e => setFormDiscountValue(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Promotion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Flash Sale */}
      {modalType === 'flash_sale' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Flash Sale Campaign</h3>
            <form onSubmit={e => { e.preventDefault(); handleCreatePromotion('flash_sale'); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Flash Sale Event Title *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required placeholder="e.g. Midnight Kente Flash Sale" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Flash Sale Markdown (%) *</label>
                <input type="number" value={formDiscountValue} onChange={e => setFormDiscountValue(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Launch Flash Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Banner */}
      {modalType === 'banner' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Homepage Hero Banner</h3>
            <form onSubmit={e => { e.preventDefault(); handleCreatePromotion('banner'); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Banner Headline *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required placeholder="e.g. 50% Off Authentic Ghanaian Crafts" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Target Destination Link *</label>
                <input type="text" value={formTargetUrl} onChange={e => setFormTargetUrl(e.target.value)} required placeholder="/category/crafts" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Gradient Style Preset</label>
                <select value={formBannerGradient} onChange={e => setFormBannerGradient(e.target.value)} style={inputStyle}>
                  {PRESET_GRADIENTS.map((g, idx) => (
                    <option key={idx} value={g.css}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Publish Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  background: '#0f172a',
  color: '#38bdf8',
  padding: '12px 20px',
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  fontSize: 13,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #0284c7',
};

const btnPrimaryStyle: React.CSSProperties = {
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondaryStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#475569',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 6,
  textTransform: 'uppercase',
});

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 20,
  padding: 24,
  width: '100%',
  maxWidth: 520,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  outline: 'none',
};
