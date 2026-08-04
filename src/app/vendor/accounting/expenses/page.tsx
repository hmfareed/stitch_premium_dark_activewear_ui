'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorExpensesLedgerPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Store Rent & Utilities');
  const [amount, setAmount] = useState('');
  const [supplier, setSupplier] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/accounting');
      const data = await res.json();
      if (res.ok) setExpenses(data.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      showToast('Title and amount are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/accounting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_expense',
          expense: { title: title.trim(), category, amount: Number(amount), supplier, receiptUrl },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Expense "${title}" recorded in ledger!`, 'success');
      setExpenses(data.expenses || []);
      setShowAddModal(false);
      setTitle('');
      setAmount('');
      setReceiptUrl('');
    } catch (err: any) {
      showToast(err.message || 'Error recording expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 14 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Expenses Ledger', path: '/vendor/accounting/expenses', active: true, icon: 'receipt_long' },
          { label: 'Income & Revenue', path: '/vendor/accounting/income', active: false, icon: 'attach_money' },
          { label: 'Daily Cashbook', path: '/vendor/accounting/cashbook', active: false, icon: 'menu_book' },
          { label: 'Account Categories', path: '/vendor/accounting/categories', active: false, icon: 'category' },
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

      {/* Main Expenses Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Store Expenses & Outflow Ledger
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Record operating expenses, attach digital receipts, and track supplier payables.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
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
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Record Expense
          </button>
        </div>

        {/* Expenses Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading expense ledger...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Expense Title</th>
                  <th style={{ padding: '10px 8px' }}>Category</th>
                  <th style={{ padding: '10px 8px' }}>Supplier / Beneficiary</th>
                  <th style={{ padding: '10px 8px' }}>Amount Spent</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Receipt Attachment</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(ex => (
                  <tr key={ex.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{ex.title}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 6, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                        {ex.category}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', color: '#475569', fontWeight: 600 }}>{ex.supplier}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: '#dc2626' }}>GH₵ {ex.amount.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>{ex.date}</td>
                    <td style={{ padding: '10px 8px' }}>
                      {ex.receiptUrl ? (
                        <a href={ex.receiptUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textDecoration: 'none' }}>
                          📎 View Receipt
                        </a>
                      ) : (
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>No receipt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Record Store Expense</h3>
            <form onSubmit={handleRecordExpense} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Expense Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Monthly Store Electricity Bill" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
                    <option value="Store Rent & Utilities">Store Rent & Utilities</option>
                    <option value="Packaging & Supplies">Packaging & Supplies</option>
                    <option value="Staff Payroll">Staff Payroll</option>
                    <option value="Courier Logistics">Courier Logistics</option>
                    <option value="Marketing & Ads">Marketing & Ads</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Amount (GH₵) *</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="350.00" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Supplier / Beneficiary</label>
                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="ECG Ghana" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Attach Receipt Image URL</label>
                <input type="text" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
