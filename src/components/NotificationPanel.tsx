'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, useNotifications } from '@/context/AppContext';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  source: 'notification' | 'message';
  link?: string;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { refreshCounts } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load from local cache on open, then fetch fresh
  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);

    // Initial read from localStorage cache to show immediately
    try {
      const cached = localStorage.getItem(`africart-notifications-${user.email}`);
      if (cached) {
        setNotifications(JSON.parse(cached));
      }
    } catch {}

    try {
      const [msgRes, notifRes] = await Promise.all([
        fetch(`/api/messages?email=${encodeURIComponent(user.email)}`),
        fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`)
      ]);

      const msgData = await msgRes.json();
      const notifData = await notifRes.json();

      let all: NotificationItem[] = [];

      if (msgData.success && msgData.messages) {
        const mappedMsgs = msgData.messages.map((m: any) => ({
          id: m._id,
          type: m.fromRole === 'super_admin' ? 'admin' : 'order',
          title: m.fromName || 'Message',
          message: m.text,
          date: m.timestamp,
          read: m.read,
          source: 'message',
          link: '/chat'
        }));
        all = [...all, ...mappedMsgs];
      }

      if (notifData.success && notifData.notifications) {
        const mappedNotifs = notifData.notifications.map((n: any) => ({
          id: n._id,
          type: n.type || 'info',
          title: n.title,
          message: n.message,
          date: n.createdAt,
          read: n.read,
          source: 'notification',
          link: n.link
        }));
        all = [...all, ...mappedNotifs];
      }

      // Sort newest first
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(all);
      localStorage.setItem(`africart-notifications-${user.email}`, JSON.stringify(all));
      refreshCounts();
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, user]);

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      // Mark system notifications read
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read', email: user.email })
      });

      // Mark messages read
      await fetch(`/api/messages?to=${encodeURIComponent(user.email)}&read=true`, {
        method: 'PUT'
      });

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      // Update cache
      const cached = localStorage.getItem(`africart-notifications-${user.email}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const updated = parsed.map((n: any) => ({ ...n, read: true }));
        localStorage.setItem(`africart-notifications-${user.email}`, JSON.stringify(updated));
      }

      refreshCounts();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return 'local_shipping';
      case 'promo': return 'local_offer';
      case 'admin': return 'admin_panel_settings';
      case 'info': return 'info';
      default: return 'notifications';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'order': return 'var(--lime-400)';
      case 'promo': return '#ff5e07';
      case 'admin': return '#a855f7';
      default: return 'var(--on-surface-variant)';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out both',
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'fixed', zIndex: 201,
          top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 420,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--outline)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideInFromRight 0.3s cubic-bezier(0.32,0.72,0,1) both',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--outline)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>notifications</span>
            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>
              NOTIFICATIONS
            </h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={{
                background: 'var(--lime-400)', color: '#000',
                fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-lexend)',
                padding: '2px 8px', borderRadius: 20,
              }}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none', border: 'none', color: 'var(--lime-400)',
                  fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.04em'
                }}
              >
                MARK READ
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                background: 'var(--surface-container)', border: '1px solid var(--outline)',
                borderRadius: 8, width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--on-surface-variant)',
                transition: 'all 0.15s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--on-surface-variant)', opacity: 0.3 }}>lock</span>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 700 }}>Login to see notifications</p>
              <Link href="/login" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800 }}>
                LOGIN NOW
              </Link>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--on-surface-variant)', opacity: 0.3 }}>notifications_off</span>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 700 }}>No notifications yet</p>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>We will notify you about your order status here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map((n) => {
                const itemIcon = getIcon(n.type);
                const itemColor = getColor(n.type);
                return (
                  <div
                    key={n.id}
                    style={{
                      background: n.read ? 'var(--surface-container-low)' : 'var(--surface-container-high)',
                      border: n.read ? '1px solid var(--outline)' : '1px solid var(--outline-variant)',
                      borderRadius: 14, padding: '14px 16px',
                      display: 'flex', gap: 12, position: 'relative',
                      transition: 'all 0.2s',
                    }}
                  >
                    {!n.read && (
                      <span style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: 'var(--lime-400)' }} />
                    )}
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: itemColor, flexShrink: 0, marginTop: 2 }}>{itemIcon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: n.read ? 700 : 900, color: 'var(--foreground)', marginBottom: 4 }}>{n.title}</p>
                      <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.4, marginBottom: 8 }}>{n.message}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{new Date(n.date).toLocaleString()}</span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={onClose}
                            style={{
                              fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800,
                              color: 'var(--lime-400)', textTransform: 'uppercase', letterSpacing: '0.04em'
                            }}
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
