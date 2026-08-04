'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  link: string;
  read: boolean;
  createdAt: string;
}

interface NotificationCounts {
  total: number;
  unread: number;
  system: number;
  updates: number;
}

const CATEGORY_STYLES: Record<string, { icon: string; bg: string; color: string }> = {
  vendors: { icon: 'storefront', bg: '#dcfce7', color: '#16a34a' },
  orders: { icon: 'shopping_cart', bg: '#ffedd5', color: '#ea580c' },
  finance: { icon: 'credit_card', bg: '#f3e8ff', color: '#9333ea' },
  warning: { icon: 'warning', bg: '#fee2e2', color: '#dc2626' },
  user: { icon: 'group', bg: '#dbeafe', color: '#2563eb' },
  subscription: { icon: 'stars', bg: '#d1fae5', color: '#059669' },
  system: { icon: 'settings', bg: '#f3e8ff', color: '#7c3aed' },
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

export default function AdminHeaderNotifications() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'system' | 'updates'>('all');
  const [counts, setCounts] = useState<NotificationCounts>({ total: 0, unread: 0, system: 0, updates: 0 });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (filter = activeTab) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/header-notifications?filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setCounts(data.counts || { total: 0, unread: 0, system: 0, updates: 0 });
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching admin header notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab, fetchNotifications]);

  // Mark all as read action
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/admin/header-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setCounts(prev => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif: NotificationItem) => {
    setIsOpen(false);
    if (!notif.read) {
      try {
        await fetch('/api/admin/header-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', id: notif.id }),
        });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setCounts(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      } catch (err) {
        console.error('Error marking single notification read:', err);
      }
    }
    router.push(notif.link || '/admin');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell Icon Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#f1f5f9' : '#f8fafc',
          border: isOpen ? '1px solid #16a34a' : '1px solid #e2e8f0',
          borderRadius: '50%',
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          color: isOpen ? '#16a34a' : '#475569',
          transition: 'all 0.15s ease',
        }}
        title="Notifications"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications</span>
        {counts.unread > 0 && (
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
            {counts.unread > 99 ? '99+' : counts.unread}
          </span>
        )}
      </button>

      {/* Popover Dropdown matching requested specs */}
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

          {/* Header Row: Title & Mark All as Read */}
          <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
              Notifications
            </h3>
            <button
              onClick={handleMarkAllRead}
              style={{
                background: 'none',
                border: 'none',
                color: '#16a34a',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
                borderRadius: 6,
                transition: 'background-color 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
              <span>Mark all as read</span>
            </button>
          </div>

          {/* Filter Pills Navigation Row */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fafafa', overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'All', count: counts.total },
              { id: 'unread', label: 'Unread', count: counts.unread, color: '#ef4444' },
              { id: 'system', label: 'System', count: counts.system },
              { id: 'updates', label: 'Updates', count: counts.updates },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    border: 'none',
                    backgroundColor: isActive ? (tab.id === 'unread' ? '#fee2e2' : '#e2e8f0') : 'transparent',
                    color: isActive ? (tab.id === 'unread' ? '#991b1b' : '#0f172a') : '#64748b',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: 11,
                    padding: '5px 10px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 900,
                      backgroundColor: isActive ? (tab.color || '#0f172a') : '#cbd5e1',
                      color: '#ffffff',
                      borderRadius: 10,
                      padding: '1px 6px',
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrollable Notifications List */}
          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Loading activity notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#cbd5e1', marginBottom: 6 }}>
                  notifications_paused
                </span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No notifications found in this category.</p>
              </div>
            ) : (
              notifications.map(notif => {
                const style = CATEGORY_STYLES[notif.category] || CATEGORY_STYLES[notif.type] || CATEGORY_STYLES.system;
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
                    {/* Category Soft Icon Box */}
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: style.bg,
                      color: style.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {style.icon}
                      </span>
                    </div>

                    {/* Text Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {notif.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                          )}
                        </div>
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#475569',
                        marginTop: 2,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
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
              href="/admin/tickets"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#16a34a',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>View all notifications</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
