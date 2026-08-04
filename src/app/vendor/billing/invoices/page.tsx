'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorBillingInvoicesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/billing');
      const data = await res.json();
      if (res.ok) setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (invNumber: string) => {
    showToast(`Downloading subscription PDF tax invoice ${invNumber}...`, 'success');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 17 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Current Plan', path: '/vendor/billing', active: false, icon: 'workspace_premium' },
          { label: 'Upgrade Plan', path: '/vendor/billing/upgrade', active: false, icon: 'rocket_launch' },
          { label: 'Billing History', path: '/vendor/billing/history', active: false, icon: 'history' },
          { label: 'Invoices', path: '/vendor/billing/invoices', active: true, icon: 'receipt' },
          { label: 'Usage Quotas', path: '/vendor/billing/usage', active: false, icon: 'data_usage' },
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

      {/* Main Invoices Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Subscription Tax Invoices & VAT Statements
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Download official PDF tax invoices including itemized GRA VAT withholdings.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading invoices...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Invoice Number</th>
                <th style={{ padding: '10px 8px' }}>Issue Date</th>
                <th style={{ padding: '10px 8px' }}>Subscription Plan</th>
                <th style={{ padding: '10px 8px' }}>GRA VAT (15%)</th>
                <th style={{ padding: '10px 8px' }}>Total Amount</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>📄 {inv.number}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{inv.date}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{inv.plan}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>GH₵ {inv.vat.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {inv.total.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDownloadPdf(inv.number)}
                      style={{ padding: '4px 10px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#10b981', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
