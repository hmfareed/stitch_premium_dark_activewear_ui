'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface SubOrder {
  _id: string;
  subOrderId: string;
  orderId: string;
  storeId: string;
  vendorStoreName: string;
  customerName: string;
  customerPhone: string;
  fulfillmentMethod: 'home_delivery' | 'self_pickup';
  fulfillmentSource: string;
  status: string;
  total: number;
  pickupOtp?: string;
  deliveryOtp?: string;
  riderName?: string;
  createdAt: string;
}

export default function HubOperationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dropoff' | 'rider' | 'counter'>('counter');
  const [loading, setLoading] = useState(true);
  const [queues, setQueues] = useState<{
    awaitingDropoff: SubOrder[];
    readyForRider: SubOrder[];
    readyForCustomerPickup: SubOrder[];
    customerPickedUp: SubOrder[];
  }>({
    awaitingDropoff: [],
    readyForRider: [],
    readyForCustomerPickup: [],
    customerPickedUp: [],
  });

  const [otpModalOrder, setOtpModalOrder] = useState<SubOrder | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hub');
      const data = await res.json();
      if (data.success) {
        setQueues(data.queues);
      }
    } catch (err: any) {
      showToast('Failed to load hub queues', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubData();
  }, []);

  const handleConfirmDropoff = async (subOrderId: string) => {
    try {
      const res = await fetch(`/api/sub-orders/${subOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'hub_received',
          userRole: 'hub',
          description: 'Package physically received and verified at Central Hub Tamale.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Sub-order marked as received at hub', 'success');
        fetchHubData();
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Network error during status update', 'error');
    }
  };

  const handleConfirmPickup = async () => {
    if (!otpModalOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sub-orders/${otpModalOrder.subOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'customer_picked_up',
          userRole: 'hub',
          otp: enteredOtp,
          description: 'Customer physically collected order at Hub Counter with verified OTP.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Self-pickup confirmed successfully!', 'success');
        setOtpModalOrder(null);
        setEnteredOtp('');
        fetchHubData();
      } else {
        showToast(data.error || 'Invalid OTP code', 'error');
      }
    } catch (err) {
      showToast('Error confirming customer pickup', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-inter)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/admin" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>← Admin Dashboard</Link>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 4px 0' }}>Central Warehouse & Hub Operations</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem' }}>Tamale Main Fulfillment Hub — Consignment, Vendor Drop-offs & Self-Pickup Counter</p>
        </div>

        <button
          onClick={fetchHubData}
          style={{
            padding: '10px 18px',
            backgroundColor: 'var(--surface-container-high)',
            color: 'var(--on-surface)',
            border: '1px solid var(--outline-variant)',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span> Refresh Queues
        </button>
      </div>

      {/* Stats Quick Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Awaiting Vendor Drop-off</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#ff9800' }}>{queues.awaitingDropoff.length}</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Ready at Self-Pickup Counter</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--lime-400)' }}>{queues.readyForCustomerPickup.length}</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Ready for Rider Collection</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#00e5ff' }}>{queues.readyForRider.length}</div>
        </div>

        <div style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Collected Today</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--primary)' }}>{queues.customerPickedUp.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--outline-variant)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('counter')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'counter' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'counter' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🏬 Self-Pickup Counter Queue ({queues.readyForCustomerPickup.length})
        </button>

        <button
          onClick={() => setActiveTab('dropoff')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'dropoff' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'dropoff' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📦 Incoming Vendor Drop-offs ({queues.awaitingDropoff.length})
        </button>

        <button
          onClick={() => setActiveTab('rider')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'rider' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'rider' ? 'var(--primary)' : 'var(--on-surface-variant)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🛵 Rider Dispatch Queue ({queues.readyForRider.length})
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Loading hub operations data...</div>
      ) : (
        <div>
          {/* Counter Tab */}
          {activeTab === 'counter' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Self-Pickup Counter Queue</h2>
              {queues.readyForCustomerPickup.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface-container)', borderRadius: '12px', color: 'var(--on-surface-variant)' }}>
                  No customer self-pickup orders waiting at the counter right now.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {queues.readyForCustomerPickup.map(order => (
                    <div key={order._id} style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{order.subOrderId}</span>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}>FREE Self-Pickup</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--on-surface)' }}>Customer: <strong>{order.customerName}</strong> ({order.customerPhone})</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Vendor: {order.vendorStoreName} | Total: GHS {order.total.toFixed(2)}</div>
                      </div>

                      <button
                        onClick={() => {
                          setOtpModalOrder(order);
                          setEnteredOtp('');
                        }}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: 'var(--primary)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pin</span> Confirm Pickup OTP
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dropoff Tab */}
          {activeTab === 'dropoff' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Incoming Vendor Packages</h2>
              {queues.awaitingDropoff.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface-container)', borderRadius: '12px', color: 'var(--on-surface-variant)' }}>
                  No pending drop-offs from vendors right now.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {queues.awaitingDropoff.map(order => (
                    <div key={order._id} style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px' }}>{order.subOrderId}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--on-surface)' }}>Store: <strong>{order.vendorStoreName}</strong></div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Fulfillment Method: {order.fulfillmentMethod === 'self_pickup' ? 'Self Pickup at Hub' : 'Home Delivery via Rider'}</div>
                      </div>

                      <button
                        onClick={() => handleConfirmDropoff(order.subOrderId)}
                        style={{
                          padding: '10px 18px',
                          backgroundColor: 'var(--lime-400)',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Mark Received at Hub
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rider Dispatch Tab */}
          {activeTab === 'rider' && (
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Ready for Rider Collection</h2>
              {queues.readyForRider.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface-container)', borderRadius: '12px', color: 'var(--on-surface-variant)' }}>
                  No home delivery orders waiting for rider pickup.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {queues.readyForRider.map(order => (
                    <div key={order._id} style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '6px' }}>{order.subOrderId}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--on-surface)' }}>Customer: {order.customerName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Assigned Rider: {order.riderName || 'Unassigned (Waiting)'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpModalOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: 'var(--surface-container-high)', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%', border: '1px solid var(--outline-variant)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>Enter Customer Pickup OTP</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
              Ask customer <strong>{otpModalOrder.customerName}</strong> for their 6-digit collection OTP code (sent via SMS).
            </p>

            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 123456"
              value={enteredOtp}
              onChange={e => setEnteredOtp(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1.5rem',
                letterSpacing: '8px',
                textAlign: 'center',
                backgroundColor: 'var(--surface)',
                border: '2px solid var(--primary)',
                borderRadius: '10px',
                color: 'var(--on-surface)',
                marginBottom: '20px',
                fontWeight: 700,
              }}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setOtpModalOrder(null)}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'transparent',
                  color: 'var(--on-surface-variant)',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPickup}
                disabled={isSubmitting || enteredOtp.length < 6}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: (isSubmitting || enteredOtp.length < 6) ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Hand Over'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
