'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorTaxesReportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [taxData, setTaxData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/analytics');
      const data = await res.json();
      if (res.ok && data.taxes) setTaxData(data.taxes);
    } catch (err) {
      console.error('Failed to load taxes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportGRA = () => {
    showToast('Exporting GRA Tax Filing Return Statement (PDF)...', 'success');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 12 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Analytics Dashboard', path: '/vendor/analytics', active: false, icon: 'analytics' },
          { label: 'Operating Expenses', path: '/vendor/analytics/expenses', active: false, icon: 'payments' },
          { label: 'Profit & Loss P&L', path: '/vendor/analytics/profit', active: false, icon: 'trending_up' },
          { label: 'GRA Tax & VAT', path: '/vendor/analytics/taxes', active: true, icon: 'account_balance' },
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

      {/* Main Tax Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Ghana Revenue Authority (GRA) VAT & Tax Compliance
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Itemized tax withholdings including Standard Rate VAT (15%), NHIL (2.5%), GETFund (2.5%), and COVID Levy (1%).
            </p>
          </div>

          <button
            onClick={handleExportGRA}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>description</span>
            Export GRA Return Form
          </button>
        </div>

        {loading || !taxData ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading GRA tax calculations...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>TOTAL GRA TAX LIABILITY FOR PERIOD</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                  GH₵ {taxData.totalTaxLiability.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#64748b' }}>
                Taxable Sales Base: <strong>GH₵ {taxData.taxableAmount.toFixed(2)}</strong>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Ghana GRA Tax Component</th>
                  <th style={{ padding: '10px 8px' }}>Statutory Rate</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Tax Withheld Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>Standard Rate VAT</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>15.0%</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>GH₵ {taxData.graVat.toFixed(2)}</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>National Health Insurance Levy (NHIL)</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>2.5%</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>GH₵ {taxData.nhil.toFixed(2)}</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>GETFund Levy</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>2.5%</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>GH₵ {taxData.getfund.toFixed(2)}</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>COVID-19 Health Recovery Levy</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>1.0%</td>
                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>GH₵ {taxData.covidLevy.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

          </div>
        )}
      </div>

    </div>
  );
}
