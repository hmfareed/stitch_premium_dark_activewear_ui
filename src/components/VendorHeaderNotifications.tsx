'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  link: string;
  read: boolean;
  createdAt: string;
}

const CATEGORY_STYLES: Record<string, { icon: string; bg: string; color: string }> = {
  orders: { icon: 'shopping_bag', bg: '#dcfce7', color: '#16a34a' },
  payments: { icon: 'payments', bg: '#dbeafe', color: '#2563eb' },
  stock: { icon: 'warning', bg: '#fee2e2', color: '#dc2626' },
  reviews: { icon: 'star', bg: '#fef3c7', color: '#d97706' },
  messages: { icon: 'mail', bg: '#f3e8ff', color: '#9333ea' },
  subscription: { icon: 'workspace_premium', bg: '#ccfbf1', color: '#0d9488' },
  system: { icon: 'campaign', bg: '#f1f5f9', color: '#475569' },
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function VendorHeaderNotifications() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/notifications?filter=all');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.counts?.unread || 0);
      }
    } catch (err) {
      console.error('Error fetching vendor notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/vendor/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking vendor notifications read:', err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    setIsOpen(false);
    if (!notif.read) {
      try {
        await fetch('/api/vendor/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', id: notif.id }),
        });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }
    router.push(notif.link || '/vendor/notifications');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#f1f5f9' : '#f8fafc',
          border: isOpen ? '1px solid #10b981' : '1px solid #e2e8f0',
          borderRadius: '50%',
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          color: isOpen ? '#10b981' : '#475569',
          transition: 'all 0.15s ease',
        }}
        title="Vendor Notifications"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: '#ef4444',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 900,
            width: 16,
            height: 16,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(239, 68, 68, 0.4)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Bell Popover Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '115%',
          right: 0,
          width: 360,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          zIndex: 100,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Header Row */}
          <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Vendor Notifications
            </h3>
            <button
              onClick={handleMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#10b981',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
              <span>Mark all read</span>
            </button>
          </div>

          {/* Scrollable Notifications List */}
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 6 }}>
                  notifications_paused
                </span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No recent notifications.</p>
              </div>
            ) : (
              notifications.map(notif => {
                const style = CATEGORY_STYLES[notif.category] || CATEGORY_STYLES.system;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: '1px solid #f8fafc',
                      backgroundColor: notif.read ? '#ffffff' : '#f0fdf4',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: style.bg,
                      color: style.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {style.icon}
                      </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {notif.title}
                        </div>
                        <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2, lineHeight: 1.3 }}>
                        {notif.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer View All Notifications Link */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center', backgroundColor: '#fafafa' }}>
            <Link
              href="/vendor/notifications"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#10b981',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>View all notifications & preferences</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
