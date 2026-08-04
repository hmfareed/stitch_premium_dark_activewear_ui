'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorCategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/accounting');
      const data = await res.json();
      if (res.ok) setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 14 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Expenses Ledger', path: '/vendor/accounting/expenses', active: false, icon: 'receipt_long' },
          { label: 'Income & Revenue', path: '/vendor/accounting/income', active: false, icon: 'attach_money' },
          { label: 'Daily Cashbook', path: '/vendor/accounting/cashbook', active: false, icon: 'menu_book' },
          { label: 'Account Categories', path: '/vendor/accounting/categories', active: true, icon: 'category' },
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

      {/* Main Categories Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Expense & Income Chart of Accounts
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Manage accounting ledger categories for operating overhead, revenue streams, and payroll.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading account categories...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {categories.map(c => (
              <div key={c.name} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.count} recorded entries</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6, backgroundColor: c.type === 'Income' ? '#dcfce7' : '#fee2e2', color: c.type === 'Income' ? '#16a34a' : '#dc2626' }}>
                  {c.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
