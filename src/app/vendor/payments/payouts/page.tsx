'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorPayoutsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [availableBalance, setAvailableBalance] = useState(0);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Request Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('500.00');
  const [payoutMethod, setPayoutMethod] = useState('MTN Mobile Money (+233 24 111 2222)');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayoutsData();
  }, []);

  const fetchPayoutsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/payments');
      const data = await res.json();
      if (res.ok) {
        setAvailableBalance(data.netAvailablePayout || 0);
        setPayouts(data.payouts || []);
      }
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payoutAmount);
    if (!amt || amt <= 0) { showToast('Enter a valid payout amount', 'error'); return; }
    if (amt > availableBalance) { showToast('Payout amount exceeds available balance', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_payout',
          amount: amt,
          method: payoutMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Payout request for GH₵ ${amt.toFixed(2)} submitted!`, 'success');
      setPayouts(data.payouts || []);
      setAvailableBalance(prev => prev - amt);
      setShowPayoutModal(false);
    } catch (err: any) {
      showToast(err.message || 'Payout request failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 10 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Transactions Ledger', path: '/vendor/payments/transactions', active: false, icon: 'receipt' },
          { label: 'Payouts & Withdrawals', path: '/vendor/payments/payouts', active: true, icon: 'account_balance' },
          { label: 'Invoices & Billing', path: '/vendor/payments/invoices', active: false, icon: 'description' },
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

      {/* Balance Summary Header Card */}
      <div style={{ backgroundColor: '#061d13', borderRadius: 20, padding: 28, color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: '#a3e635', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AVAILABLE PAYOUT BALANCE</div>
          <div style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '2.5rem', fontWeight: 900, marginTop: 4 }}>
            GH₵ {availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Ready for instant withdrawal to Mobile Money or Ghana Bank accounts.</div>
        </div>

        <button
          onClick={() => setShowPayoutModal(true)}
          disabled={availableBalance <= 0}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            fontWeight: 900,
            fontSize: 14,
            cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
            opacity: availableBalance > 0 ? 1 : 0.6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>account_balance_wallet</span>
          Request Instant Payout
        </button>
      </div>

      {/* Historical Payout Logs Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Payout & Withdrawal History
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Log of all completed and processing payout transfers.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading payout logs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Payout Ref ID</th>
                <th style={{ padding: '10px 8px' }}>Date</th>
                <th style={{ padding: '10px 8px' }}>Amount Withdrawn</th>
                <th style={{ padding: '10px 8px' }}>Payout Destination</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#0f172a' }}>{p.id}</td>
                  <td style={{ padding: '10px 8px', color: '#64748b' }}>{p.date}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {p.amount.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700, color: '#334155' }}>{p.method}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: p.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                      color: p.status === 'Completed' ? '#16a34a' : '#d97706',
                    }}>
                      {p.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Request Payout Modal */}
      {showPayoutModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Request Payout Withdrawal</h3>
            <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Payout Amount (Max: GH₵ {availableBalance.toFixed(2)})</label>
                <input
                  type="number"
                  step="0.01"
                  max={availableBalance}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Select Registered Account</label>
                <select value={payoutMethod} onChange={e => setPayoutMethod(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="MTN Mobile Money (+233 24 111 2222)">MTN Mobile Money (+233 24 111 2222)</option>
                  <option value="Telecel Cash (+233 20 888 9999)">Telecel Cash (+233 20 888 9999)</option>
                  <option value="GCB Bank Ghana (Acc #1029384756)">GCB Bank Ghana (Acc #1029384756)</option>
                  <option value="Ecobank Ghana (Acc #4409128374)">Ecobank Ghana (Acc #4409128374)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowPayoutModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Confirm Payout</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
