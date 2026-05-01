'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

type OrderStatus = 'Ongoing' | 'Shipped' | 'Delivered' | 'Cancelled';

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('Ongoing');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const savedOrders = JSON.parse(localStorage.getItem(`reed-orders-${user.email}`) || '[]');
    // Map 'Processing' to 'Ongoing' for display purposes if needed, but in our UI we just call the tab 'Ongoing' and filter 'Processing'.
    // Let's just treat 'Processing' as 'Ongoing'
    setOrders(savedOrders.map((o: any) => o.status === 'Processing' ? { ...o, status: 'Ongoing' } : o));
  }, [user, router]);

  const getStatusIndex = (status: string) => {
    const statuses = ['Ongoing', 'Shipped', 'Delivered'];
    return statuses.indexOf(status);
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  if (!user) return null;

  const tabs: OrderStatus[] = ['Ongoing', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>My Orders</h1>
      </div>

      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', borderRadius: 20, whiteSpace: 'nowrap',
              background: activeTab === tab ? 'var(--lime-400)' : 'var(--surface)',
              color: activeTab === tab ? '#000' : 'var(--foreground)',
              border: activeTab === tab ? 'none' : '1px solid var(--outline)',
              fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredOrders.map((order, i) => (
          <div key={order.id} className={`animate-fade-in-up stagger-${i + 1}`} style={{
            background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--foreground)' }}>{order.id}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase',
                background: order.status === 'Delivered' ? 'rgba(195,244,0,0.1)' : order.status === 'Cancelled' ? 'rgba(255,68,68,0.1)' : 'rgba(255,181,154,0.1)',
                color: order.status === 'Delivered' ? 'var(--lime-400)' : order.status === 'Cancelled' ? 'var(--error)' : 'var(--secondary)'
              }}>
                {order.status}
              </span>
            </div>
            
            {/* Timeline UI - Only show if not cancelled */}
            {order.status !== 'Cancelled' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 10, right: 10, height: 2, background: 'var(--surface-container-highest)', zIndex: 0, transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', top: '50%', left: 10, width: `${(getStatusIndex(order.status) / 2) * 100}%`, height: 2, background: 'var(--lime-400)', zIndex: 0, transform: 'translateY(-50%)', transition: 'width 0.5s' }} />
                
                {['Ongoing', 'Shipped', 'Delivered'].map((step, index) => (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: 6 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--surface)',
                      background: getStatusIndex(order.status) >= index ? 'var(--lime-400)' : 'var(--surface-container-highest)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {getStatusIndex(order.status) >= index && <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#000', fontWeight: 'bold' }}>check</span>}
                    </div>
                    <span style={{ fontSize: 9, color: getStatusIndex(order.status) >= index ? 'var(--foreground)' : 'var(--on-surface-variant)', fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' }}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--on-surface-variant)', fontSize: 13, marginBottom: 12 }}>
              <span>Date: {order.date}</span>
              <span>Items: {order.items}</span>
            </div>

            {/* Products Preview */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }} className="no-scrollbar">
              {order.products?.map((p: any, idx: number) => (
                <img key={idx} src={p.image} alt={p.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', background: 'var(--surface-container)' }} />
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--outline)' }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, color: 'var(--on-surface-variant)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 800, color: 'var(--lime-400)' }}>${order.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>inventory_2</span>
            <p>No {activeTab.toLowerCase()} orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}
