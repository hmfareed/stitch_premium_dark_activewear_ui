'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorInvoicesPage() {
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/payments');
      const data = await res.json();
      if (res.ok) setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 10 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Transactions Ledger', path: '/vendor/payments/transactions', active: false, icon: 'receipt' },
          { label: 'Payouts & Withdrawals', path: '/vendor/payments/payouts', active: false, icon: 'account_balance' },
          { label: 'Invoices & Billing', path: '/vendor/payments/invoices', active: true, icon: 'description' },
          { label: 'Settlement & Bank Rec', path: '/vendor/payments/settlement', active: false, icon: 'account_balance_wallet' },
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
            Vendor Platform Fee Invoices & Statements
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Download commercial invoices and tax receipts for platform commissions and store subscription fees.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading fee invoices...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Invoice ID</th>
                <th style={{ padding: '10px 8px' }}>Issue Date</th>
                <th style={{ padding: '10px 8px' }}>Billing Statement Period</th>
                <th style={{ padding: '10px 8px' }}>Total Amount</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#0f172a' }}>{inv.id}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{inv.date}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#334155' }}>{inv.period}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {inv.amount.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      style={{ padding: '5px 12px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                    >
                      Download Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>AFRICART BILLING STATEMENT</h3>
              <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ fontSize: 12, color: '#475569', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div><strong>Invoice Reference:</strong> {selectedInvoice.id}</div>
              <div><strong>Issue Date:</strong> {selectedInvoice.date}</div>
              <div><strong>Period Covered:</strong> {selectedInvoice.period}</div>
              <div><strong>Platform Commission (5%):</strong> GH₵ {selectedInvoice.amount.toFixed(2)}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981', paddingTop: 8, borderTop: '1px solid #cbd5e1' }}>
                Total Paid: GH₵ {selectedInvoice.amount.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelectedInvoice(null)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12 }}>Close</button>
              <button onClick={() => window.print()} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12 }}>Print Invoice PDF</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
