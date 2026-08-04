'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorContactSupportPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 19 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Support Tickets', path: '/vendor/support/tickets', active: false, icon: 'confirmation_number' },
          { label: 'Live Chat', path: '/vendor/support/chat', active: false, icon: 'chat' },
          { label: 'Knowledge Base', path: '/vendor/support/kb', active: false, icon: 'help' },
          { label: 'Contact Support', path: '/vendor/support/contact', active: true, icon: 'contact_support' },
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

      {/* Main Contact Support Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Contact Merchant Support & Escalation Hotlines
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Direct channels for merchant assistance, emergency payout escalation, and account managers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#10b981' }}>call</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Emergency Merchant Hotline</h3>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>+233 24 123 4567</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Available Mon - Sat (8:00 AM - 8:00 PM GMT)</div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#2563eb' }}>mail</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>Merchant Support Email</h3>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>vendors@africart.com</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Average email response time: &lt; 2 hours</div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#16a34a' }}>chat</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>WhatsApp Business Support</h3>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>+233 20 987 6543</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Instant WhatsApp chat with merchant support</div>
          </div>

        </div>
      </div>

    </div>
  );
}
