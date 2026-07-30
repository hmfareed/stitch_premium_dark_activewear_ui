'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

interface NotificationItem {
  id: string;
  type: 'order' | 'promotion' | 'update' | 'payment' | 'admin';
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
}

const TYPE_STYLES: Record<string, { icon: string; bg: string; color: string }> = {
  order:     { icon: 'local_shipping',         bg: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' },
  promotion: { icon: 'local_offer',            bg: 'rgba(255, 145, 0, 0.15)',  color: '#FF9100' },
  update:    { icon: 'trending_down',          bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
  payment:   { icon: 'account_balance_wallet', bg: 'rgba(0, 229, 255, 0.15)', color: '#00E5FF' },
  admin:     { icon: 'campaign',               bg: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' },
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Orders' | 'Promotions' | 'Updates'>('All');

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }

    const cached = localStorage.getItem(`africart-notifications-${user.email}`);
    if (cached) { try { setNotifications(JSON.parse(cached)); } catch {} }

    const fetchNotifications = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          fetch(`/api/messages?email=${encodeURIComponent(user.email)}`),
          fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`)
        ]);
        const msgData = await msgRes.json();
        const notifData = await notifRes.json();

        let mapped: NotificationItem[] = [];

        if (msgData.success) {
          mapped = mapped.concat(msgData.messages.map((m: any) => ({
            id: m._id,
            type: m.fromRole === 'super_admin' ? 'admin' : 'order',
            title: m.fromName === 'Reed Order System' ? 'Order Update' : m.fromName,
            message: m.text,
            date: m.timestamp,
            read: m.read,
          })));
        }

        if (notifData.success) {
          mapped = mapped.concat(notifData.notifications.map((n: any) => ({
            id: n._id,
            type: n.type || 'update',
            title: n.title,
            message: n.message,
            date: n.createdAt,
            read: n.read,
            link: n.link
          })));
        }

        if (mapped.length === 0) {
          mapped = [
            { id: '1', type: 'order',     title: 'Order Update',       message: 'Your order #ORD-764512 has been shipped.',           date: new Date(Date.now() - 120000).toISOString(),   read: false, link: '/account/orders' },
            { id: '2', type: 'promotion', title: 'Promotion',          message: 'Enjoy 10% off on electronics. Use code: AFRICART10', date: new Date(Date.now() - 3600000).toISOString(),  read: false },
            { id: '3', type: 'update',    title: 'Price Drop',         message: 'An item in your wishlist is now cheaper!',          date: new Date(Date.now() - 7200000).toISOString(),  read: true,  link: '/wishlist' },
            { id: '4', type: 'order',     title: 'Order Delivered',    message: 'Your order #ORD-764200 has been delivered.',         date: new Date(Date.now() - 86400000).toISOString(), read: true,  link: '/account/orders' },
            { id: '5', type: 'promotion', title: 'New Arrivals',       message: 'Check out the latest trends in fashion.',           date: new Date(Date.now() - 172800000).toISOString(),read: true,  link: '/shop' },
            { id: '6', type: 'payment',   title: 'Payment Successful', message: 'GHS 120.00 has been added to your wallet.',         date: new Date(Date.now() - 259200000).toISOString(),read: true },
          ];
        }

        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setNotifications(mapped);
        localStorage.setItem(`africart-notifications-${user.email}`, JSON.stringify(mapped));
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
  }, [user, isLoading, router]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'Orders')     return n.type === 'order';
    if (activeFilter === 'Promotions') return n.type === 'promotion';
    if (activeFilter === 'Updates')    return n.type === 'update' || n.type === 'admin' || n.type === 'payment';
    return true;
  });

  if (isLoading || !user) return null;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      {/* Top Header matching Screen 2 */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>Notifications</h1>
        </div>

        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}>
          Mark all as read
        </button>
      </div>

      {/* Filter Tabs matching Screen 2 */}
      <div className="no-scrollbar animate-fade-in-up" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16 }}>
        {(['All', 'Orders', 'Promotions', 'Updates'] as const).map(tab => {
          const isActive = activeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              style={{
                padding: '8px 20px', borderRadius: 24, fontSize: 13, fontWeight: 700,
                fontFamily: 'var(--font-lexend)', cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: isActive ? '#6366F1' : 'var(--surface-container-high)',
                color: isActive ? '#ffffff' : 'var(--on-surface-variant)',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Notification Cards List matching Screen 2 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((notif, i) => {
          const st = TYPE_STYLES[notif.type] || TYPE_STYLES.update;
          return (
            <div
              key={notif.id}
              onClick={() => { if (notif.link) router.push(notif.link); }}
              className={`animate-fade-in-up stagger-${(i % 5) + 1}`}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--outline)',
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                cursor: notif.link ? 'pointer' : 'default'
              }}
            >
              {/* Icon Container */}
              <div style={{
                width: 42, height: 42, borderRadius: '50%', background: st.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ color: st.color, fontSize: 20 }}>{st.icon}</span>
              </div>

              {/* Text Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, color: 'var(--foreground)', margin: '0 0 2px 0' }}>{notif.title}</h4>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, lineHeight: 1.4, margin: '0 0 4px 0' }}>{notif.message}</p>
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', opacity: 0.7 }}>{formatTimeAgo(notif.date)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
