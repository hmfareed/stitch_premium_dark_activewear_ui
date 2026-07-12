'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

export default function VendorFinancePage() {
  const { user } = useAuth();
  const { allOrders, allPayouts, refreshData } = useAdmin();
  const [requestAmount, setRequestAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Mobile Money');
  const [accountDetails, setAccountDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user) return null;

  const commissionRate = 0.03; // 3% platform commission

  // Calculate total gross earnings for this vendor across non-cancelled orders
  let vendorTotalGross = 0;
  let vendorReleasedGross = 0;
  let vendorLockedGross = 0;

  allOrders.filter(o => o.status !== 'Cancelled').forEach(order => {
    const vendorItemsTotal = (order.products || [])
      .filter(p => p.vendorEmail === user.email)
      .reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);

    vendorTotalGross += vendorItemsTotal;
    
    if (order.paymentInfo?.escrowStatus === 'Released') {
      vendorReleasedGross += vendorItemsTotal;
    } else {
      vendorLockedGross += vendorItemsTotal;
    }
  });

  const availableFunds = vendorReleasedGross * (1 - commissionRate);
  const heldFunds = vendorLockedGross * (1 - commissionRate);
  const allTimeEarnings = vendorTotalGross * (1 - commissionRate);

  const vendorPayoutRequests = allPayouts.filter(p => p.vendorEmail === user.email);
  const totalRequested = vendorPayoutRequests
    .filter(p => p.status !== 'Rejected')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = vendorPayoutRequests.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);

  const currentBalance = availableFunds - totalRequested;

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const amount = parseFloat(requestAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (amount > currentBalance) {
      setError('Amount exceeds available balance.');
      return;
    }
    if (!accountDetails) {
      setError('Please provide account details.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorEmail: user.email,
          vendorName: user.name,
          amount,
          paymentMethod,
          accountDetails,
          notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Payout request submitted successfully.');
        setRequestAmount('');
        setAccountDetails('');
        setNotes('');
        refreshData();
      } else {
        setError(data.error || 'Failed to submit payout request.');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Finance & Payouts</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Manage your earnings, escrow balances, and request payouts.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--lime-400)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Current Balance</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>account_balance_wallet</span>
          </div>
          <div className="font-lexend" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>GH₵{currentBalance.toFixed(2)}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '8px' }}>Available for withdrawal</p>
        </div>

        <div style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#00e5ff' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Funds in Escrow</span>
            <span className="material-symbols-outlined" style={{ color: '#00e5ff' }}>lock</span>
          </div>
          <div className="font-lexend" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>GH₵{heldFunds.toFixed(2)}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '8px' }}>Pending delivery confirmation</p>
        </div>

        <div style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: 'var(--on-surface-variant)' }}>Total Withdrawn</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)' }}>payments</span>
          </div>
          <div className="font-lexend" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--on-surface)' }}>GH₵{totalPaid.toFixed(2)}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '8px' }}>All time payouts received</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', alignItems: 'start' }}>
        {/* Request Payout Form */}
        <div style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)' }}>
          <h2 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">request_quote</span>
            Request Payout
          </h2>

          <form onSubmit={handleRequestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', fontSize: '0.9rem' }}>{error}</div>}
            {success && <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)', fontSize: '0.9rem' }}>{success}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>Amount to Withdraw (GH₵)</label>
              <input 
                type="number" 
                max={currentBalance}
                step="0.01"
                value={requestAmount} 
                onChange={e => setRequestAmount(e.target.value)}
                style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', width: '100%', fontFamily: 'inherit' }}
                placeholder={`Max: ${currentBalance.toFixed(2)}`}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', width: '100%', fontFamily: 'inherit' }}
              >
                <option value="Mobile Money">Mobile Money (MTN, Telecel, AirtelTigo)</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>Account Details</label>
              <textarea 
                value={accountDetails} 
                onChange={e => setAccountDetails(e.target.value)}
                style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', width: '100%', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' }}
                placeholder="e.g. 024XXXXXXX (MTN) - John Doe"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || currentBalance <= 0}
              style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: '#000', border: 'none', fontWeight: 600, fontSize: '1rem', cursor: loading || currentBalance <= 0 ? 'not-allowed' : 'pointer', opacity: loading || currentBalance <= 0 ? 0.7 : 1, marginTop: '8px' }}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Payout History */}
        <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)' }}>
            <h2 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Payout History</h2>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="responsive-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Date</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Amount</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Method</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendorPayoutRequests.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                      No payout requests found.
                    </td>
                  </tr>
                ) : vendorPayoutRequests.map(payout => (
                  <tr key={payout._id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <td data-label="Date" style={{ padding: '16px 24px' }}>{new Date(payout.requestDate).toLocaleDateString()}</td>
                    <td data-label="Amount" style={{ padding: '16px 24px', fontWeight: 600 }}>GH₵{payout.amount.toFixed(2)}</td>
                    <td data-label="Method" style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: '0.9rem' }}>{payout.paymentMethod}</span>
                    </td>
                    <td data-label="Status" style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: payout.status === 'Paid' ? 'color-mix(in srgb, var(--lime-400) 15%, transparent)' : 
                                       payout.status === 'Rejected' ? 'color-mix(in srgb, var(--error) 15%, transparent)' :
                                       payout.status === 'Processing' ? 'color-mix(in srgb, #00e5ff 15%, transparent)' :
                                       'color-mix(in srgb, var(--warning) 15%, transparent)',
                        color: payout.status === 'Paid' ? 'var(--lime-400)' : 
                               payout.status === 'Rejected' ? 'var(--error)' :
                               payout.status === 'Processing' ? '#00e5ff' :
                               'var(--warning)'
                      }}>
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
