'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';

const RETURN_REASONS = [
  'Wrong size / doesn\'t fit',
  'Product damaged or defective',
  'Item doesn\'t match description',
  'Changed my mind',
  'Received wrong item',
  'Quality not as expected',
  'Other',
];

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  'Requested': { color: '#ff9800', icon: 'pending', label: 'Requested' },
  'Approved': { color: '#00e5ff', icon: 'check_circle', label: 'Approved' },
  'Pickup Scheduled': { color: '#7c4dff', icon: 'local_shipping', label: 'Pickup Scheduled' },
  'Received': { color: '#00e5ff', icon: 'inventory', label: 'Item Received' },
  'Refunded': { color: 'var(--lime-400)', icon: 'payments', label: 'Refund Issued' },
  'Rejected': { color: 'var(--error)', icon: 'cancel', label: 'Rejected' },
};

export default function AccountReturnsPage() {
  const { user, isLoading } = useAuth();
  const { allOrders } = useAdmin();
  const { showToast } = useToast();
  const router = useRouter();

  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchReturns = async () => {
      try {
        const res = await fetch(`/api/returns?buyerEmail=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (data.success) setReturns(data.requests);
      } catch { /* fail silently */ }
      setLoading(false);
    };
    fetchReturns();
  }, [user]);

  if (!user) return null;

  // Eligible orders: Delivered within last 7 days
  const eligibleOrders = allOrders.filter(o => {
    if (o.customerEmail !== user.email) return false;
    if (o.status !== 'Delivered') return false;
    const deliveredAt = o.date ? new Date(o.date).getTime() : 0;
    const daysSince = (Date.now() - deliveredAt) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });

  const selectedOrder = allOrders.find(o => o.id === selectedOrderId);

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || selectedItems.length === 0) {
      showToast('Please select at least one item and a reason.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          buyerEmail: user.email,
          buyerName: user.name,
          items: selectedItems,
          reason,
          reasonDetail,
          preferredPickupDate: pickupDate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReturns(prev => [data.request, ...prev]);
        setShowForm(false);
        setSelectedOrderId('');
        setSelectedItems([]);
        setReason('');
        setReasonDetail('');
        setPickupDate('');
        showToast('Return request submitted! We\'ll arrange a pickup soon.', 'success');
      } else {
        showToast(data.error || 'Failed to submit return.', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
    setSubmitting(false);
  };

  const minPickupDate = new Date();
  minPickupDate.setDate(minPickupDate.getDate() + 1);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: 8 }}>Returns & Refunds</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Request a return for delivered orders within 7 days.</p>
        </div>
        {eligibleOrders.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', background: showForm ? 'var(--surface-container-high)' : 'var(--lime-400)', color: showForm ? 'var(--on-surface)' : '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showForm ? 'close' : 'assignment_return'}</span>
            {showForm ? 'Cancel' : 'New Return Request'}
          </button>
        )}
      </div>

      {/* Policy Banner */}
      <div style={{ padding: '16px 20px', borderRadius: 12, border: '1px solid color-mix(in srgb, #00e5ff 30%, transparent)', backgroundColor: 'color-mix(in srgb, #00e5ff 6%, transparent)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <span className="material-symbols-outlined" style={{ color: '#00e5ff', fontSize: 22, marginTop: 2 }}>info</span>
        <div>
          <strong style={{ fontSize: '0.95rem' }}>AfriCart 7-Day Return Policy</strong>
          <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
            Items must be returned within 7 days of delivery. Products must be in original condition with tags attached. Electronics must be unused. We'll arrange a free pickup from your delivery address.
          </p>
        </div>
      </div>

      {/* Return Request Form */}
      {showForm && (
        <form onSubmit={handleSubmitReturn} style={{ backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in-up">
          <h2 className="font-lexend" style={{ fontSize: '1.3rem', margin: 0 }}>New Return Request</h2>

          {/* Select Order */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>
              Select Order *
            </label>
            {eligibleOrders.length === 0 ? (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', padding: '12px', backgroundColor: 'var(--surface-container)', borderRadius: 10 }}>
                No eligible orders for return. Orders must be delivered within the last 7 days.
              </p>
            ) : (
              <select
                required
                value={selectedOrderId}
                onChange={e => { setSelectedOrderId(e.target.value); setSelectedItems([]); }}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.95rem' }}
              >
                <option value="">Choose an order…</option>
                {eligibleOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} — GH₵{o.total?.toFixed(2)} ({new Date(o.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Select Items */}
          {selectedOrder && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>
                Select Items to Return *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedOrder.products?.map((p: any, i: number) => (
                  <label key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 16px', borderRadius: 10, backgroundColor: selectedItems.includes(p.name) ? 'color-mix(in srgb, var(--lime-400) 8%, transparent)' : 'var(--surface-container)', border: `1px solid ${selectedItems.includes(p.name) ? 'var(--lime-400)' : 'var(--outline)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(p.name)}
                      onChange={e => {
                        if (e.target.checked) setSelectedItems(prev => [...prev, p.name]);
                        else setSelectedItems(prev => prev.filter(x => x !== p.name));
                      }}
                      style={{ width: 18, height: 18 }}
                    />
                    <img src={p.image} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, margin: '0 0 2px 0', fontSize: '0.9rem' }}>{p.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>Qty: {p.quantity} · GH₵{(p.price * p.quantity).toFixed(2)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>
              Return Reason *
            </label>
            <select
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.95rem' }}
            >
              <option value="">Select a reason…</option>
              {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Detail */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>
              Additional Details (Optional)
            </label>
            <textarea
              value={reasonDetail}
              onChange={e => setReasonDetail(e.target.value)}
              placeholder="Describe the issue in more detail…"
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'var(--font-inter)', boxSizing: 'border-box' }}
            />
          </div>

          {/* Pickup Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>
              Preferred Pickup Date (Optional)
            </label>
            <input
              type="date"
              value={pickupDate}
              min={minPickupDate.toISOString().split('T')[0]}
              onChange={e => setPickupDate(e.target.value)}
              style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.95rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedOrderId || selectedItems.length === 0 || !reason}
            style={{
              padding: '14px 24px', borderRadius: 12, border: 'none',
              background: 'var(--lime-400)', color: '#000', fontWeight: 700, fontSize: '1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
              opacity: submitting || !selectedOrderId || selectedItems.length === 0 || !reason ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>assignment_return</span>
            {submitting ? 'Submitting…' : 'Submit Return Request'}
          </button>
        </form>
      )}

      {/* Existing Returns */}
      <div>
        <h2 className="font-lexend" style={{ fontSize: '1.4rem', marginBottom: 20 }}>Your Return Requests</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 36 }}>progress_activity</span>
          </div>
        ) : returns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)', backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 60 }}>assignment_return</span>
            <p style={{ marginTop: 12, fontSize: '1rem' }}>You haven't submitted any return requests yet.</p>
            {eligibleOrders.length > 0 && (
              <button onClick={() => setShowForm(true)} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                Start a Return
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {returns.map((ret: any) => {
              const cfg = STATUS_CONFIG[ret.status] || { color: 'var(--on-surface-variant)', icon: 'help', label: ret.status };
              return (
                <div key={ret._id} style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', marginBottom: 4 }}>Return #{ret._id?.slice(-8).toUpperCase()}</p>
                      <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Order {ret.orderId}</p>
                    </div>
                    <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, backgroundColor: `color-mix(in srgb, ${cfg.color} 15%, transparent)`, color: cfg.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cfg.icon}</span>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Return Progress */}
                  <div style={{ display: 'flex', gap: 0, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
                    {['Requested', 'Approved', 'Pickup Scheduled', 'Received', 'Refunded'].map((step, i) => {
                      const statuses = ['Requested', 'Approved', 'Pickup Scheduled', 'Received', 'Refunded'];
                      const currentIdx = statuses.indexOf(ret.status);
                      const stepIdx = statuses.indexOf(step);
                      const isDone = stepIdx <= currentIdx;
                      const isCurrent = stepIdx === currentIdx;
                      return (
                        <div key={step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: isDone ? 'var(--lime-400)' : 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${isCurrent ? 'var(--lime-400)' : isDone ? 'var(--lime-400)' : 'var(--outline)'}` }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14, color: isDone ? '#000' : 'var(--on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
                                {isDone ? 'check' : 'circle'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.68rem', color: isDone ? 'var(--lime-400)' : 'var(--on-surface-variant)', fontWeight: isCurrent ? 700 : 400, whiteSpace: 'nowrap' }}>{step}</span>
                          </div>
                          {i < 4 && <div style={{ width: 32, height: 2, backgroundColor: stepIdx < currentIdx ? 'var(--lime-400)' : 'var(--outline)', marginBottom: 20, flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Items</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{ret.items?.join(', ')}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Reason</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{ret.reason}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Requested</p>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{new Date(ret.createdAt).toLocaleDateString()}</p>
                    </div>
                    {ret.preferredPickupDate && (
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Preferred Pickup</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>{new Date(ret.preferredPickupDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {ret.refundAmount && (
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>Refund Amount</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--lime-400)' }}>GH₵{ret.refundAmount}</p>
                      </div>
                    )}
                  </div>

                  {ret.rejectionReason && (
                    <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--error)', margin: 0 }}>
                        <strong>Rejection reason:</strong> {ret.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
