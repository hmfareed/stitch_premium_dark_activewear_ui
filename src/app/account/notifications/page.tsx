'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'admin';
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Load cached notifications instantly
    const cached = localStorage.getItem(`africart-notifications-${user.email}`);
    if (cached) {
      try { setNotifications(JSON.parse(cached)); } catch {}
    }

    // Fetch messages and notifications from backend
    const fetchNotifications = async () => {
      try {
        const [msgRes, notifRes] = await Promise.all([
          fetch(`/api/messages?email=${encodeURIComponent(user.email)}`),
          fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`)
        ]);

        const msgData = await msgRes.json();
        const notifData = await notifRes.json();

        let mapped: Notification[] = [];

        if (msgData.success) {
          mapped = mapped.concat(msgData.messages.map((m: any) => {
            let fromName = m.fromName;
            if (fromName === 'Reed Order System' || fromName === 'Reed order system' || fromName === 'Reed order messages') {
              fromName = 'AfriCart';
            }
            if (fromName.startsWith('Message from ')) {
              fromName = fromName.replace('Message from ', '');
            }
            return {
              id: m._id,
              type: m.fromRole === 'super_admin' ? 'admin' : 'order',
              title: fromName,
              message: m.text,
              date: m.timestamp,
              read: m.read,
              source: 'message'
            };
          }));
        }

        if (notifData.success) {
          mapped = mapped.concat(notifData.notifications.map((n: any) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            date: n.createdAt,
            read: n.read,
            source: 'notification',
            link: n.link
          })));
        }

        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setNotifications(mapped);
        localStorage.setItem(`africart-notifications-${user.email}`, JSON.stringify(mapped));
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        const saved = localStorage.getItem(`africart-notifications-${user.email}`);
        if (saved) setNotifications(JSON.parse(saved));
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 1000); // Poll every 1s for instant delivery
    return () => clearInterval(interval);
  }, [user, isLoading, router]);

  const markAllRead = async () => {
    try {
      await Promise.all([
        fetch(`/api/messages?to=${encodeURIComponent(user?.email || '')}&read=true`, { method: 'PUT' }),
        fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_all_read', email: user?.email }) })
      ]);
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const markAsRead = async (id: string, source: string) => {
    try {
      if (source === 'message') {
        await fetch(`/api/messages?id=${id}&read=true`, { method: 'PUT' });
      } else {
        // Assume notification read API is implemented or just ignore for now since markAllRead handles it
      }
      const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
      setNotifications(updated);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return 'package_2';
      case 'payment': return 'credit_card';
      case 'admin': return 'campaign';
      case 'product_drop': return 'new_releases';
      default: return 'notifications';
    }
  };

  if (isLoading || !user) return null;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>Notifications</h1>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--lime-400)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-lexend)' }}>
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {notifications.map((notif, i) => (
          <div key={notif.id} onClick={() => {
            if (!notif.read) markAsRead(notif.id, (notif as any).source);
            if ((notif as any).link) router.push((notif as any).link);
          }} className={`animate-fade-in-up stagger-${i + 1}`} style={{
            background: notif.read ? 'var(--surface)' : 'rgba(195,244,0,0.05)',
            border: notif.read ? '1px solid var(--outline)' : '1px solid var(--lime-400)',
            borderRadius: 16, padding: 16, display: 'flex', gap: 16, position: 'relative',
            cursor: 'pointer'
          }}>
            {!notif.read && <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-400)' }} />}
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'var(--surface-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--foreground)' }}>{getIcon(notif.type)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, color: 'var(--foreground)', marginBottom: 4 }}>{notif.title}</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, lineHeight: 1.4, marginBottom: 8 }}>{notif.message}</p>
              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                {new Date(notif.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {(notif as any).link && (
              <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', alignSelf: 'center' }}>chevron_right</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
