'use client';

import React, { useState, useEffect, useCallback } from 'react';

type SubTab = 'rules' | 'calculator' | 'history' | 'payouts';

export default function AdminCommissionsPage() {
  const [subTab, setSubTab] = useState<SubTab>('rules');
  const [loading, setLoading] = useState(true);
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal Operation States
  const [modalType, setModalType] = useState<'create_rule' | 'manual_adjustment' | 'process_payout' | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States for Rule Creation
  const [formRuleName, setFormRuleName] = useState('');
  const [formRuleType, setFormRuleType] = useState<'percentage' | 'fixed' | 'vendor_specific' | 'category_specific'>('percentage');
  const [formRuleRate, setFormRuleRate] = useState('5');
  const [formTargetVendor, setFormTargetVendor] = useState('');
  const [formTargetCategory, setFormTargetCategory] = useState('');

  // Form States for Manual Adjustment
  const [formAdjVendor, setFormAdjVendor] = useState('');
  const [formAdjAmount, setFormAdjAmount] = useState('20');
  const [formAdjReason, setFormAdjReason] = useState('');

  // Form States for Auto Calculator Simulator
  const [calcOrderAmount, setCalcOrderAmount] = useState('250.00');
  const [calcVendorEmail, setCalcVendorEmail] = useState('ashanti@africart.com');
  const [calcCategory, setCalcCategory] = useState('Apparel');
  const [calcResult, setCalcResult] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/commissions');
      const data = await res.json();
      if (data.success) {
        setRulesList(data.rules || []);
        setHistoryList(data.history || []);
        setPayoutsList(data.payouts || []);
      }
    } catch (err) {
      console.error('Error fetching commission data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action: Create Commission Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_rule',
          name: formRuleName,
          type: formRuleType,
          rate: formRuleRate,
          targetVendorEmail: formTargetVendor,
          targetCategory: formTargetCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetRuleForm();
        fetchData();
      } else {
        alert(data.message || 'Rule creation failed');
      }
    } catch (err) {
      console.error('Create rule error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Auto Calculate Simulation
  const handleAutoCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto_calculate',
          grossAmount: calcOrderAmount,
          vendorEmail: calcVendorEmail,
          category: calcCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCalcResult(data.calculation);
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Auto calculate error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Manual Adjustment
  const handleManualAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAdjVendor || !formAdjAmount) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_adjustment',
          vendorEmail: formAdjVendor,
          adjustmentAmount: formAdjAmount,
          reason: formAdjReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetAdjForm();
        fetchData();
      }
    } catch (err) {
      console.error('Manual adjustment error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Approve & Process Payout
  const handleProcessPayout = async (payoutId: string, status: 'Paid' | 'Rejected') => {
    try {
      const res = await fetch('/api/admin/commissions/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchData();
      }
    } catch (err) {
      console.error('Process payout error:', err);
    }
  };

  const resetRuleForm = () => {
    setFormRuleName(''); setFormRuleType('percentage'); setFormRuleRate('5');
    setFormTargetVendor(''); setFormTargetCategory('');
  };

  const resetAdjForm = () => {
    setFormAdjVendor(''); setFormAdjAmount('20'); setFormAdjReason('');
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
            Commission Engine & Payout Queue
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Multi-rule commission calculations (Percentage, Fixed, Vendor/Category specific) & vendor payouts
          </p>
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { resetRuleForm(); setModalType('create_rule'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_task</span>
            <span>+ Add Commission Rule</span>
          </button>
          <button onClick={() => { resetAdjForm(); setModalType('manual_adjustment'); }} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
            <span>Manual Adjustment</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Active Commission Rules</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{rulesList.length} Rules</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Calculated Platform Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>
            {formatGhs(historyList.reduce((sum, h) => sum + (h.commissionAmount || 0), 0))}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Pending Vendor Payout Queue</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ea580c', marginTop: 4 }}>
            {payoutsList.filter(p => p.status === 'Pending').length} Pending Requests
          </div>
        </div>
      </div>

      {/* 4 Sub-View Navigation Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        {[
          { id: 'rules', label: 'Commission Rules', icon: 'gavel' },
          { id: 'calculator', label: 'Auto Calculator', icon: 'calculate' },
          { id: 'history', label: 'Commission History', icon: 'history' },
          { id: 'payouts', label: 'Payout Queue', icon: 'payments' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as SubTab)}
            style={{
              border: 'none',
              background: subTab === tab.id ? '#0f172a' : 'transparent',
              color: subTab === tab.id ? '#ffffff' : '#64748b',
              fontWeight: subTab === tab.id ? 800 : 600,
              fontSize: 13,
              padding: '8px 16px',
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Sub-View Content */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading commission engine telemetry...</p>
        </div>
      ) : subTab === 'rules' ? (

        /* SUB-VIEW 1: COMMISSION RULES */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Configured Commission Rules ({rulesList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Rule Name & ID</th>
                  <th style={{ padding: 10 }}>Type</th>
                  <th style={{ padding: 10 }}>Commission Rate</th>
                  <th style={{ padding: 10 }}>Target Scope</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rulesList.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>ID: {r.ruleId}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#4338ca', '#e0e7ff')}>
                        {r.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a', fontSize: 13 }}>
                      {r.type === 'fixed' ? formatGhs(r.rate) : `${r.rate}%`}
                    </td>
                    <td style={{ padding: 12, color: '#475569' }}>
                      {r.type === 'vendor_specific' ? r.targetVendorEmail : r.type === 'category_specific' ? r.targetCategory : 'Global Baseline'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(r.isActive ? '#166534' : '#991b1b', r.isActive ? '#dcfce7' : '#fee2e2')}>
                        {r.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : subTab === 'calculator' ? (

        /* SUB-VIEW 2: AUTO CALCULATOR & SIMULATOR */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Live Commission Auto Calculator</h3>
            <form onSubmit={handleAutoCalculate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Order Gross Amount (GH₵) *</label>
                <input type="number" step="0.01" value={calcOrderAmount} onChange={e => setCalcOrderAmount(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Vendor Email Address</label>
                <input type="email" value={calcVendorEmail} onChange={e => setCalcVendorEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Product Category</label>
                <input type="text" value={calcCategory} onChange={e => setCalcCategory(e.target.value)} style={inputStyle} />
              </div>
              <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>
                Run Auto Calculation
              </button>
            </form>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Calculation Simulation Output</h3>
            {calcResult ? (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: 16, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><strong>Applied Rule:</strong> <span style={{ color: '#2563eb', fontWeight: 800 }}>{calcResult.ruleName}</span></div>
                <div><strong>Gross Order Total:</strong> {formatGhs(calcResult.grossAmount)}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#16a34a', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                  Platform Commission: {formatGhs(calcResult.commissionAmount)}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                  Net Vendor Earnings: {formatGhs(calcResult.netVendorAmount)}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#64748b' }}>Enter order details and click "Run Auto Calculation" to simulate commission evaluation.</p>
            )}
          </div>
        </div>
      ) : subTab === 'history' ? (

        /* SUB-VIEW 3: COMMISSION HISTORY LOG */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Commission Log Stream ({historyList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Log ID & Order</th>
                  <th style={{ padding: 10 }}>Vendor</th>
                  <th style={{ padding: 10 }}>Gross Order</th>
                  <th style={{ padding: 10 }}>Commission Type</th>
                  <th style={{ padding: 10 }}>Platform Fee</th>
                  <th style={{ padding: 10 }}>Vendor Net</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{l.logId}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Order: #{l.orderId}</div>
                    </td>
                    <td style={{ padding: 12, color: '#334155' }}>
                      <div style={{ fontWeight: 700 }}>{l.vendorName}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{l.vendorEmail}</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{formatGhs(l.grossAmount)}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(l.isManualAdjustment ? '#ea580c' : '#2563eb', l.isManualAdjustment ? '#ffedd5' : '#dbeafe')}>
                        {l.commissionType}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>{formatGhs(l.commissionAmount)}</td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#0f172a' }}>{formatGhs(l.netVendorAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* SUB-VIEW 4: PAYOUT QUEUE */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Vendor Payout Queue ({payoutsList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Vendor Email</th>
                  <th style={{ padding: 10 }}>Payout Amount</th>
                  <th style={{ padding: 10 }}>Payment Channel</th>
                  <th style={{ padding: 10 }}>Request Date</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payoutsList.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{p.vendorEmail}</td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a', fontSize: 14 }}>{formatGhs(p.amount)}</td>
                    <td style={{ padding: 12, color: '#475569' }}>{p.paymentMethod} • {p.accountDetails}</td>
                    <td style={{ padding: 12, color: '#64748b' }}>{p.requestDate}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(p.status === 'Paid' ? '#166534' : p.status === 'Pending' ? '#b45309' : '#991b1b', p.status === 'Paid' ? '#dcfce7' : p.status === 'Pending' ? '#fef3c7' : '#fee2e2')}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {p.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleProcessPayout(p.id, 'Paid')} style={{ border: 'none', background: '#16a34a', color: '#fff', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Approve & Pay
                          </button>
                          <button onClick={() => handleProcessPayout(p.id, 'Rejected')} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS FOR COMMISSION ACTIONS ─────────────────────────────── */}

      {/* Modal: Create Commission Rule */}
      {modalType === 'create_rule' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Commission Rule</h3>
            <form onSubmit={handleCreateRule} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Rule Name *</label>
                <input type="text" value={formRuleName} onChange={e => setFormRuleName(e.target.value)} placeholder="e.g. Electronics Category 7%" required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Rule Type *</label>
                  <select value={formRuleType} onChange={e => setFormRuleType(e.target.value as any)} style={inputStyle}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat Rate (GH₵)</option>
                    <option value="vendor_specific">Vendor Specific Override</option>
                    <option value="category_specific">Category Specific Override</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Rate / Fee *</label>
                  <input type="number" step="0.1" value={formRuleRate} onChange={e => setFormRuleRate(e.target.value)} required style={inputStyle} />
                </div>
              </div>

              {formRuleType === 'vendor_specific' && (
                <div>
                  <label style={labelStyle}>Target Vendor Email *</label>
                  <input type="email" value={formTargetVendor} onChange={e => setFormTargetVendor(e.target.value)} required placeholder="ashanti@africart.com" style={inputStyle} />
                </div>
              )}

              {formRuleType === 'category_specific' && (
                <div>
                  <label style={labelStyle}>Target Product Category *</label>
                  <input type="text" value={formTargetCategory} onChange={e => setFormTargetCategory(e.target.value)} required placeholder="Electronics" style={inputStyle} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manual Adjustment */}
      {modalType === 'manual_adjustment' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Manual Commission Adjustment</h3>
            <form onSubmit={handleManualAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Vendor Email Address *</label>
                <input type="email" value={formAdjVendor} onChange={e => setFormAdjVendor(e.target.value)} required placeholder="vendor@africart.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Adjustment Amount (GH₵) *</label>
                <input type="number" step="0.01" value={formAdjAmount} onChange={e => setFormAdjAmount(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Audit Reason *</label>
                <input type="text" value={formAdjReason} onChange={e => setFormAdjReason(e.target.value)} required placeholder="e.g. Promotional fee waiver reimbursement" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Log Adjustment</button>
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

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 18,
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
