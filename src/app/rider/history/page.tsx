'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';

export default function RiderHistoryPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sub-orders?riderId=${user?.id}`);
      const data = await res.json();
      if (data.success && data.subOrders) {
        setDeliveries(data.subOrders);
      }
    } catch (err) {
      console.error('Fetch history failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 20, fontFamily: 'var(--font-lexend, sans-serif)' }}>
        Delivery History
      </h1>

      {loading ? (
        <div style={{ color: '#888' }}>Loading delivery log...</div>
      ) : deliveries.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#0d0f0b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', color: '#888' }}>
          No past deliveries found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {deliveries.map((item) => (
            <div key={item._id} style={{ background: '#0d0f0b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>
                  SubOrder #{item.subOrderId}
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {item.vendorStoreName} ➔ {item.customerName}
                </div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                  {new Date(item.createdAt).toLocaleString('en-GB')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#c3f400' }}>
                  +GH₵{(item.deliveryFee || 0).toFixed(2)}
                </div>
                <span style={{ fontSize: 11, color: item.status === 'delivered' ? '#4ade80' : '#888', fontWeight: 700 }}>
                  {item.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
