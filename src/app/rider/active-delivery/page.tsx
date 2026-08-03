'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';

interface SubOrder {
  _id: string;
  subOrderId: string;
  orderId: string;
  vendorStoreName: string;
  customerName: string;
  customerPhone: string;
  fulfillmentSource: 'hub_stock' | 'vendor_dropoff_pending' | 'vendor_direct_pickup';
  status: string;
  deliveryFee: number;
  deliveryOtp?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
}

export default function ActiveDeliveryPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeOrder, setActiveOrder] = useState<SubOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchActiveDelivery();
  }, [user]);

  const fetchActiveDelivery = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const res = await fetch(`/api/sub-orders?riderId=${user.id}&status=out_for_delivery`);
      const data = await res.json();
      if (data.success && data.subOrders && data.subOrders.length > 0) {
        setActiveOrder(data.subOrders[0]);
      } else {
        // Try rider_assigned or rider_collected
        const res2 = await fetch(`/api/sub-orders?riderId=${user.id}`);
        const data2 = await res2.json();
        if (data2.success && data2.subOrders) {
          const ongoing = data2.subOrders.find((s: any) =>
            ['rider_assigned', 'rider_collected', 'out_for_delivery'].includes(s.status)
          );
          if (ongoing) setActiveOrder(ongoing);
        }
      }
    } catch (err) {
      console.error('Fetch active delivery failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus: string) => {
    if (!activeOrder) return;
    try {
      const res = await fetch(`/api/sub-orders/${activeOrder.subOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userRole: 'rider',
          userId: user?.id,
          description: `Rider updated status to ${newStatus}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Status updated to ${newStatus}`, 'success');
        setActiveOrder(data.subOrder);
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !otpInput.trim()) {
      showToast('Please enter the delivery confirmation OTP', 'error');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch(`/api/sub-orders/${activeOrder.subOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'delivered',
          userRole: 'rider',
          userId: user?.id,
          otp: otpInput.trim(),
          description: 'Delivery confirmed via customer OTP',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('🎉 Delivery confirmed successfully!', 'success');
        setActiveOrder(null);
        setOtpInput('');
      } else {
        showToast(data.error || 'Invalid OTP code', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error confirming delivery', 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#888', padding: 20 }}>Loading active assignment...</div>;
  }

  if (!activeOrder) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0d0f0b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#666', marginBottom: 12 }}>two_wheeler</span>
        <h3 style={{ fontSize: 18, color: '#fff', margin: 0 }}>No Active Delivery Right Now</h3>
        <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
          Stay online to receive delivery requests from Tamale Hub or direct vendor pickups.
        </p>
      </div>
    );
  }

  const isHubPickup = activeOrder.fulfillmentSource === 'hub_stock' || activeOrder.fulfillmentSource === 'vendor_dropoff_pending';
  const pickupLabel = isHubPickup ? 'AfriCart Tamale Central Hub' : activeOrder.vendorStoreName;
  const pickupAddress = isHubPickup ? 'Shishegu Central Mosque, Tamale' : 'Vendor Address';

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Active Delivery
          </h1>
          <div style={{ color: '#c3f400', fontSize: 13, fontWeight: 700, marginTop: 4 }}>
            SubOrder: #{activeOrder.subOrderId}
          </div>
        </div>
        <span style={{
          padding: '6px 14px',
          borderRadius: 20,
          background: 'rgba(195,244,0,0.15)',
          color: '#c3f400',
          fontWeight: 800,
          fontSize: 12,
          textTransform: 'uppercase',
        }}>
          {activeOrder.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Collection Point Card */}
      <div style={{ background: '#0d0f0b', border: '1px solid rgba(195, 244, 0, 0.3)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#c3f400', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Step 1: Collection Point ({isHubPickup ? 'Hub First' : 'Direct Vendor Pickup'})
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{pickupLabel}</div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{pickupAddress}</div>
        
        {activeOrder.status === 'rider_assigned' && (
          <button
            onClick={() => handleStatusTransition('rider_collected')}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px',
              background: '#c3f400',
              color: '#000',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Confirm Items Collected from {isHubPickup ? 'Hub' : 'Vendor'}
          </button>
        )}
      </div>

      {/* Dropoff Details Card */}
      <div style={{ background: '#0d0f0b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Step 2: Customer Delivery Address
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
          {activeOrder.shippingAddress?.fullName || activeOrder.customerName}
        </div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>
          {activeOrder.shippingAddress?.address || 'Tamale, Northern Region'}
        </div>
        <div style={{ fontSize: 13, color: '#c3f400', marginTop: 4, fontWeight: 700 }}>
          📞 {activeOrder.shippingAddress?.phone || activeOrder.customerPhone}
        </div>

        {activeOrder.status === 'rider_collected' && (
          <button
            onClick={() => handleStatusTransition('out_for_delivery')}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Start Route (Out for Delivery)
          </button>
        )}
      </div>

      {/* Proof of Delivery OTP Confirmation */}
      {activeOrder.status === 'out_for_delivery' && (
        <div style={{ background: 'rgba(195,244,0,0.05)', border: '1px solid rgba(195,244,0,0.3)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#c3f400', marginBottom: 8 }}>
            🔒 Proof of Delivery Confirmation
          </div>
          <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 16px 0' }}>
            Ask the customer for their 6-digit delivery confirmation OTP code received via SMS.
          </p>

          <form onSubmit={handleConfirmDelivery} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              placeholder="Enter 6-digit OTP code"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              maxLength={6}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#000',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 10,
                color: '#fff',
                fontSize: 16,
                letterSpacing: '0.2em',
                fontWeight: 900,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={verifying}
              style={{
                padding: '12px 24px',
                background: '#c3f400',
                color: '#000',
                border: 'none',
                borderRadius: 10,
                fontWeight: 900,
                fontSize: 14,
                cursor: verifying ? 'not-allowed' : 'pointer',
              }}
            >
              {verifying ? 'Verifying...' : 'Complete Delivery'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
