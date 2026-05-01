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
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Simulate fetching notifications from backend
    const saved = localStorage.getItem(`reed-notifications-${user.email}`);
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      const mockNotifs: Notification[] = [
        {
          id: '1', type: 'admin', title: 'Welcome to Reed Store!', message: 'Thank you for joining. Check out our new Electronics collection.',
          date: new Date().toISOString(), read: false
        },
        {
          id: '2', type: 'payment', title: 'Payment Confirmed', message: 'Your payment for Order #ORD-10294 was successful.',
          date: new Date(Date.now() - 86400000).toISOString(), read: true
        }
      ];
      setNotifications(mockNotifs);
      localStorage.setItem(`reed-notifications-${user.email}`, JSON.stringify(mockNotifs));
    }
  }, [user, router]);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`reed-notifications-${user?.email}`, JSON.stringify(updated));
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem(`reed-notifications-${user?.email}`, JSON.stringify(updated));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return 'package_2';
      case 'payment': return 'credit_card';
      case 'admin': return 'campaign';
      default: return 'notifications';
    }
  };

  if (!user) return null;

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
            Mark all read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {notifications.map((notif, i) => (
          <div key={notif.id} onClick={() => !notif.read && markAsRead(notif.id)} className={`animate-fade-in-up stagger-${i + 1}`} style={{
            background: notif.read ? 'var(--surface)' : 'rgba(195,244,0,0.05)',
            border: notif.read ? '1px solid var(--outline)' : '1px solid var(--lime-400)',
            borderRadius: 16, padding: 16, display: 'flex', gap: 16, position: 'relative',
            cursor: notif.read ? 'default' : 'pointer'
          }}>
            {!notif.read && <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-400)' }} />}
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: 'var(--surface-container)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--foreground)' }}>{getIcon(notif.type)}</span>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, color: 'var(--foreground)', marginBottom: 4 }}>{notif.title}</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, lineHeight: 1.4, marginBottom: 8 }}>{notif.message}</p>
              <span style={{ fontSize: 11, color: '#666' }}>{new Date(notif.date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
