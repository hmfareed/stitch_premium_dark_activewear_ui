'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorKnowledgeBasePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKB();
  }, []);

  const fetchKB = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/support');
      const data = await res.json();
      if (res.ok) setArticles(data.kbArticles || []);
    } catch (err) {
      console.error('Failed to load KB articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 19 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Support Tickets', path: '/vendor/support/tickets', active: false, icon: 'confirmation_number' },
          { label: 'Live Chat', path: '/vendor/support/chat', active: false, icon: 'chat' },
          { label: 'Knowledge Base', path: '/vendor/support/kb', active: true, icon: 'help' },
          { label: 'Contact Support', path: '/vendor/support/contact', active: false, icon: 'contact_support' },
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

      {/* Main Knowledge Base Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Knowledge Base & Merchant Help Center
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Search guides, FAQs, and step-by-step technical documentation.
          </p>

          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles e.g. Mobile Money, POS barcode, GRA VAT tax..."
            style={{ width: '100%', maxWidth: 500, padding: '12px 16px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, marginTop: 14 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading help articles...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {filteredArticles.map(a => (
              <div key={a.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
                <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: 6 }}>
                  {a.category.toUpperCase()}
                </span>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', margin: '10px 0 6px' }}>{a.title}</h3>
                <div style={{ fontSize: 11, color: '#64748b' }}>👁️ {a.views} merchant views</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
