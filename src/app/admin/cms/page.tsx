'use client';

import React, { useState, useEffect, useCallback } from 'react';

type CmsTab = 'homepage' | 'about' | 'contact' | 'faq' | 'privacy' | 'terms' | 'blogs' | 'banners';

export default function AdminCmsPage() {
  const [activeTab, setActiveTab] = useState<CmsTab>('homepage');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Content Data States
  const [sectionsList, setSectionsList] = useState<any[]>([]);
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [bannersList, setBannersList] = useState<any[]>([]);

  // Editor Form States for Sections
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMetaTitle, setFormMetaTitle] = useState('');
  const [formMetaDesc, setFormMetaDesc] = useState('');

  // Blog Creation Modal States
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Marketplace Trends');
  const [blogSummary, setBlogSummary] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch CMS Data
  const fetchCmsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cms');
      const data = await res.json();
      if (data.success) {
        setSectionsList(data.sections || []);
        setBlogsList(data.blogs || []);
        setBannersList(data.banners || []);
      }
    } catch (err) {
      console.error('Error fetching CMS data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCmsData();
  }, [fetchCmsData]);

  // Load active section content into form when tab changes
  useEffect(() => {
    const slugMap: Record<string, string> = {
      homepage: 'homepage',
      about: 'about',
      contact: 'contact',
      faq: 'faq',
      privacy: 'privacy_policy',
      terms: 'terms',
    };

    const targetSlug = slugMap[activeTab];
    if (targetSlug) {
      const sec = sectionsList.find(s => s.slug === targetSlug);
      if (sec) {
        setFormTitle(sec.title || '');
        setFormContent(sec.content || '');
        setFormMetaTitle(sec.metaTitle || sec.title || '');
        setFormMetaDesc(sec.metaDescription || '');
      } else {
        setFormTitle(activeTab.toUpperCase() + ' Page');
        setFormContent(`Default content for ${activeTab}...`);
        setFormMetaTitle(`AfriCart | ${activeTab.toUpperCase()}`);
        setFormMetaDesc('');
      }
    }
  }, [activeTab, sectionsList]);

  // Action: Save Section Content
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const slugMap: Record<string, string> = {
      homepage: 'homepage',
      about: 'about',
      contact: 'contact',
      faq: 'faq',
      privacy: 'privacy_policy',
      terms: 'terms',
    };

    const slug = slugMap[activeTab] || activeTab;

    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_section',
          slug,
          title: formTitle,
          content: formContent,
          metaTitle: formMetaTitle,
          metaDescription: formMetaDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchCmsData();
      }
    } catch (err) {
      console.error('Save section error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Blog Post
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_blog',
          title: blogTitle,
          category: blogCategory,
          summary: blogSummary,
          content: blogContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowBlogModal(false);
        setBlogTitle(''); setBlogSummary(''); setBlogContent('');
        fetchCmsData();
      }
    } catch (err) {
      console.error('Create blog error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle Blog Published Status
  const handleTogglePublishBlog = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cms/${id}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchCmsData();
      }
    } catch (err) {
      console.error('Toggle blog error:', err);
    }
  };

  // Action: Delete Blog
  const handleDeleteBlog = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/cms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchCmsData();
      }
    } catch (err) {
      console.error('Delete blog error:', err);
    }
  };

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
            CMS & Storefront Content Governance
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Manage Homepage, About Us, Contact Info, FAQ, Privacy Policy, Terms of Service, Blogs & Banners
          </p>
        </div>
      </div>

      {/* 8 Sub-View Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { id: 'homepage', label: 'Homepage', icon: 'home' },
          { id: 'about', label: 'About Us', icon: 'info' },
          { id: 'contact', label: 'Contact Info', icon: 'contact_support' },
          { id: 'faq', label: 'FAQ', icon: 'quiz' },
          { id: 'privacy', label: 'Privacy Policy', icon: 'shield' },
          { id: 'terms', label: 'Terms of Service', icon: 'gavel' },
          { id: 'blogs', label: 'Blogs & Articles', icon: 'newspaper' },
          { id: 'banners', label: 'Hero Banners', icon: 'art_track' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CmsTab)}
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
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading CMS content...</p>
        </div>
      ) : activeTab === 'blogs' ? (

        /* SUB-VIEW: BLOGS & ARTICLES DIRECTORY */
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Published Articles & Blog Posts ({blogsList.length})</h3>
            <button onClick={() => setShowBlogModal(true)} style={btnPrimaryStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>post_add</span>
              <span>+ Publish New Article</span>
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Article Title & ID</th>
                  <th style={{ padding: 10 }}>Category</th>
                  <th style={{ padding: 10 }}>Author</th>
                  <th style={{ padding: 10 }}>Published Date</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogsList.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{b.title}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>ID: {b.postId}</div>
                    </td>
                    <td style={{ padding: 12 }}><span style={badgeStyle('#7c3aed', '#f3e8ff')}>{b.category}</span></td>
                    <td style={{ padding: 12, color: '#475569' }}>{b.author}</td>
                    <td style={{ padding: 12, color: '#64748b' }}>{b.createdAt}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(b.isPublished ? '#166534' : '#991b1b', b.isPublished ? '#dcfce7' : '#fee2e2')}>
                        {b.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleTogglePublishBlog(b.id)} style={{ border: 'none', background: '#f1f5f9', color: '#0f172a', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          {b.isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button onClick={() => handleDeleteBlog(b.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
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
      ) : activeTab === 'banners' ? (

        /* SUB-VIEW: BANNERS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Homepage Hero Banners ({bannersList.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {bannersList.map(b => (
              <div key={b.id} style={{ background: b.bannerGradient, borderRadius: 16, padding: 20, color: '#fff' }}>
                <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4 }}>HERO BANNER</span>
                <h4 style={{ fontSize: 18, fontWeight: 900, margin: '8px 0 4px' }}>{b.title}</h4>
                <div style={{ fontSize: 12, opacity: 0.9 }}>Target Link: {b.targetUrl}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (

        /* SUB-VIEW: SECTION CONTENT EDITOR (Homepage, About, Contact, FAQ, Privacy, Terms) */
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, textTransform: 'capitalize' }}>
              Edit {activeTab} Page Content
            </h3>
            <button onClick={handleSaveSection} disabled={actionLoading} style={btnPrimaryStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
              <span>Save Content Changes</span>
            </button>
          </div>

          <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Section Page Title *</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Page Content Body (HTML / Markdown Text) *</label>
              <textarea
                rows={12}
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                required
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>SEO Meta Title</label>
                <input type="text" value={formMetaTitle} onChange={e => setFormMetaTitle(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>SEO Meta Description</label>
                <input type="text" value={formMetaDesc} onChange={e => setFormMetaDesc(e.target.value)} style={inputStyle} />
              </div>
            </div>
          </form>
        </div>

      )}

      {/* ── MODAL FOR CREATING BLOG POST ──────────────────────────────── */}
      {showBlogModal && (
        <div style={modalBackdropStyle} onClick={() => setShowBlogModal(false)}>
          <div style={{ ...modalContentStyle, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Publish Blog Article</h3>
            <form onSubmit={handleCreateBlog} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Article Title *</label>
                <input type="text" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} required placeholder="e.g. Top 10 Ghanaian Fashion Trends of 2026" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input type="text" value={blogCategory} onChange={e => setBlogCategory(e.target.value)} placeholder="Fashion & Kente" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Executive Summary *</label>
                <input type="text" value={blogSummary} onChange={e => setBlogSummary(e.target.value)} required placeholder="Brief 1-sentence teaser..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Article Body Content *</label>
                <textarea rows={6} value={blogContent} onChange={e => setBlogContent(e.target.value)} required style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowBlogModal(false)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Publish Article</button>
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
