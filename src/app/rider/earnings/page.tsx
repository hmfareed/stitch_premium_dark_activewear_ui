'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';

export default function RiderEarningsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalEarnings: 0,
    completedDeliveries: 0,
    pendingPayout: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-orders?riderId=${user?.id}&status=delivered`);
      const data = await res.json();
      if (data.success && data.subOrders) {
        const list = data.subOrders;
        const total = list.reduce((sum: number, item: any) => sum + (item.deliveryFee || 0), 0);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayTotal = list
          .filter((item: any) => new Date(item.updatedAt).toISOString().split('T')[0] === todayStr)
          .reduce((sum: number, item: any) => sum + (item.deliveryFee || 0), 0);

        setStats({
          todayEarnings: todayTotal,
          totalEarnings: total,
          completedDeliveries: list.length,
          pendingPayout: total, // Prepaid via Paystack, dispatches to rider wallet
        });
      }
    } catch (err) {
      console.error('Fetch earnings failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 20, fontFamily: 'var(--font-lexend, sans-serif)' }}>
        Rider Earnings & Wallet
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0d0f0b', border: '1px solid rgba(195,244,0,0.3)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Today&apos;s Earnings</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#c3f400', marginTop: 4 }}>
            GH₵{stats.todayEarnings.toFixed(2)}
          </div>
        </div>

        <div style={{ background: '#0d0f0b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Total Earnings</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            GH₵{stats.totalEarnings.toFixed(2)}
          </div>
        </div>

        <div style={{ background: '#0d0f0b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Completed Deliveries</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            {stats.completedDeliveries}
          </div>
        </div>
      </div>

      <div style={{ background: '#0d0f0b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 12px 0' }}>
          Payment & Disburshment Model
        </h3>
        <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6, margin: 0 }}>
          All customer orders on AfriCart are <strong>prepaid via Mobile Money / Card</strong>. Riders do not collect cash from customers. Delivery fees are automatically accrued to your rider wallet upon confirmed delivery.
        </p>
      </div>
    </div>
  );
}
