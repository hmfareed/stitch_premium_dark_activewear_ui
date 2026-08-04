'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorNotificationsCenterPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/notifications?filter=${activeFilter}`);
      const data = await res.json();
      if (res.ok) setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        showToast('Notification marked as read', 'info');
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showToast('All notifications marked as read!', 'success');
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Sub Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Notifications Center', path: '/vendor/notifications', active: true, icon: 'notifications' },
          { label: 'Channel Preferences', path: '/vendor/notifications/preferences', active: false, icon: 'settings_suggest' },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#ffffff' : '#475569',
              backgroundColor: tab.active ? '#10b981' : '#ffffff',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Notifications Center Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Vendor Notifications Center
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Real-time activity log across new orders, payouts, stock alerts, reviews, customer messages, and system notices.
            </p>
          </div>

          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              backgroundColor: '#f1f5f9',
              color: '#10b981',
              border: '1px solid #cbd5e1',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>done_all</span>
            Mark All as Read
          </button>
        </div>

        {/* 7 Category Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 20 }}>
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'unread', label: 'Unread Only' },
            { id: 'orders', label: '🛒 New Orders' },
            { id: 'payments', label: '💳 Payments' },
            { id: 'stock', label: '⚠️ Low Stock' },
            { id: 'reviews', label: '⭐ Customer Reviews' },
            { id: 'messages', label: '💬 Messages' },
            { id: 'subscription', label: '💎 Subscription' },
            { id: 'system', label: '📢 Announcements' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                fontWeight: activeFilter === f.id ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: activeFilter === f.id ? '#061d13' : '#ffffff',
                color: activeFilter === f.id ? '#a3e635' : '#475569',
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 42, color: '#cbd5e1', marginBottom: 8 }}>notifications_paused</span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>No notifications found in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(n => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 16,
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  backgroundColor: n.read ? '#ffffff' : '#f0fdf4',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: n.read ? '#f1f5f9' : '#dcfce7',
                    color: n.read ? '#64748b' : '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                      {n.category === 'orders' ? 'shopping_bag' : n.category === 'payments' ? 'payments' : n.category === 'stock' ? 'warning' : n.category === 'reviews' ? 'star' : n.category === 'messages' ? 'mail' : n.category === 'subscription' ? 'workspace_premium' : 'campaign'}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{n.title}</span>
                      {!n.read && (
                        <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: '#ef4444', color: '#ffffff', padding: '2px 6px', borderRadius: 10 }}>UNREAD</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: '#475569', margin: '4px 0 0' }}>{n.message}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => router.push(n.link || '/vendor')}
                    style={{ padding: '6px 14px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
