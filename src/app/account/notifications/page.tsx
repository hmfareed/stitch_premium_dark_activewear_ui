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
  order:     { icon: 'local_shipping',         bg: 'rgba(99, 102, 241, 0.15)',  color: '#6366F1' },
  promotion: { icon: 'local_offer',            bg: 'rgba(255, 145, 0, 0.15)',   color: '#FF9100' },
  update:    { icon: 'trending_down',          bg: 'rgba(16, 185, 129, 0.15)',  color: '#10B981' },
  payment:   { icon: 'account_balance_wallet', bg: 'rgba(0, 229, 255, 0.15)',   color: '#00B4CC' },
  admin:     { icon: 'campaign',               bg: 'rgba(168, 85, 247, 0.15)',  color: '#A855F7' },
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
  const [isFetching, setIsFetching] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Orders' | 'Promotions' | 'Updates'>('All');

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/login'); return; }

    // Load cached notifications immediately (no seeded fallback)
    const cached = localStorage.getItem(`africart-notifications-${user.email}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
        }
      } catch {}
    }

    const fetchNotifications = async () => {
      setIsFetching(true);
      try {
        const [msgRes, notifRes] = await Promise.all([
          fetch(`/api/messages?email=${encodeURIComponent(user.email)}`),
          fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`)
        ]);
        const msgData = await msgRes.json();
        const notifData = await notifRes.json();

        const getOrderLink = (text: string, fallback?: string) => {
          const ordMatch = text.match(/ORD-[A-Za-z0-9_-]+/i) || text.match(/order\s+(?:#)?([A-Za-z0-9_-]+)/i);
          if (ordMatch) {
            const rawId = ordMatch[0].replace(/^order\s+#?/i, '');
            return `/account/orders/${rawId}`;
          }
          if (/order|shipped|delivered|processing|package|courier|status/i.test(text)) {
            return '/account/orders';
          }
          return fallback || '/chat';
        };
        let mapped: NotificationItem[] = [];

        if (msgData.success && Array.isArray(msgData.messages)) {
          mapped = mapped.concat(msgData.messages.map((m: any) => ({
            id: m._id,
            type: m.fromRole === 'super_admin' ? 'admin' : 'order',
            title: m.fromName === 'Reed Order System' ? 'Order Update' : m.fromName,
            message: m.text,
            date: m.timestamp,
            read: m.read,
            link: getOrderLink(m.text, '/chat')
          })));
        }

        if (notifData.success && Array.isArray(notifData.notifications)) {
          mapped = mapped.concat(notifData.notifications.map((n: any) => ({
            id: n._id,
            type: n.type || 'update',
            title: n.title,
            message: n.message,
            date: n.createdAt,
            read: n.read,
            link: n.link && n.link !== '/chat' ? n.link : getOrderLink(`${n.title} ${n.message}`, n.link)
          })));
        }

        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (mapped.length > 0) {
          setNotifications(mapped);
          localStorage.setItem(`africart-notifications-${user.email}`, JSON.stringify(mapped));
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchNotifications();
  }, [user, isLoading, router]);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (user) {
      localStorage.setItem(`africart-notifications-${user.email}`, JSON.stringify(updated));
    }
  };

  const filtered = notifications.filter(n => {
    if (activeFilter === 'Orders')     return n.type === 'order';
    if (activeFilter === 'Promotions') return n.type === 'promotion';
    if (activeFilter === 'Updates')    return n.type === 'update' || n.type === 'admin' || n.type === 'payment';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading || !user) return null;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: 100
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-lexend, system-ui, -apple-system, sans-serif)',
        color: 'var(--foreground)'
      }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{
          padding: '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          backgroundColor: 'var(--background)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>chevron_left</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Notifications</h1>
              {unreadCount > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 22,
                  height: 22,
                  padding: '0 6px',
                  borderRadius: 11,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366F1',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-lexend)'
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="no-scrollbar animate-fade-in-up" style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 16,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {(['All', 'Orders', 'Promotions', 'Updates'] as const).map(tab => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 24,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'var(--font-lexend)',
                  cursor: 'pointer',
                  border: isActive ? 'none' : '1px solid var(--outline)',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? 'var(--foreground)' : 'var(--surface)',
                  color: isActive ? 'var(--background)' : 'var(--on-surface-variant)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Notification Cards */}
        {isFetching && notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  borderRadius: 16,
                  padding: '14px 16px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  color: 'var(--on-surface-variant)',
                  fontSize: 13
                }}
              >
                Loading notifications...
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--outline)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            marginTop: 8
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 54, color: 'var(--on-surface-variant)', opacity: 0.6, marginBottom: 12 }}>
              notifications_off
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--foreground)' }}>
              {activeFilter === 'All' ? 'No notifications yet' : `No ${activeFilter.toLowerCase()} notifications`}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.5 }}>
              {activeFilter === 'All'
                ? 'Order updates, promotions, and alerts will show up here.'
                : `You have no ${activeFilter.toLowerCase()} notifications at this time.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((notif, i) => {
              const st = TYPE_STYLES[notif.type] || TYPE_STYLES.update;
              return (
                <div
                  key={notif.id}
                  onClick={() => { if (notif.link) router.push(notif.link); }}
                  className={`animate-fade-in-up stagger-${(i % 5) + 1}`}
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: `1px solid ${notif.read ? 'var(--outline)' : 'rgba(99, 102, 241, 0.25)'}`,
                    borderRadius: 16,
                    padding: '14px 16px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    cursor: notif.link ? 'pointer' : 'default',
                    position: 'relative',
                    boxShadow: notif.read ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.08)'
                  }}
                >
                  {/* Unread dot indicator */}
                  {!notif.read && (
                    <div style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#6366F1'
                    }} />
                  )}

                  {/* Icon Container */}
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: st.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ color: st.color, fontSize: 22 }}>{st.icon}</span>
                  </div>

                  {/* Text Content */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: notif.read ? 0 : 16 }}>
                    <h4 style={{
                      fontFamily: 'var(--font-lexend)',
                      fontSize: 14,
                      fontWeight: notif.read ? 600 : 800,
                      color: 'var(--foreground)',
                      margin: '0 0 3px 0'
                    }}>
                      {notif.title}
                    </h4>
                    <p style={{
                      color: 'var(--on-surface-variant)',
                      fontSize: 13,
                      lineHeight: 1.45,
                      margin: '0 0 5px 0'
                    }}>
                      {notif.message}
                    </p>
                    <span style={{
                      fontSize: 11,
                      color: 'var(--on-surface-variant)',
                      opacity: 0.7
                    }}>
                      {formatTimeAgo(notif.date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
