'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

interface SessionItem {
  id: string;
  sessionId: string;
  ip: string;
  userAgent: string;
  activeRole: string;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
}

export default function SessionManagementPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sessions');
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions || []);
        setCurrentSessionId(data.currentSessionId || '');
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/auth/sessions?sessionId=${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke session');

      showToast('Session revoked successfully!', 'success');
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId && s.id !== sessionId));
    } catch (err: any) {
      showToast(err.message || 'Revocation failed', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm('Are you sure you want to revoke all other active sessions across all devices?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/sessions?revokeAllOthers=true', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke sessions');

      showToast('All other active sessions have been signed out!', 'success');
      fetchSessions();
    } catch (err: any) {
      showToast(err.message || 'Revoking sessions failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Logout from ALL devices including this current device?')) return;
    try {
      await fetch('/api/auth/sessions?revokeAll=true', { method: 'DELETE' });
      showToast('Logged out from all devices.', 'info');
      window.location.href = '/login';
    } catch (err) {
      window.location.href = '/login';
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#ffffff', fontFamily: 'var(--font-inter, sans-serif)', padding: '24px 16px' }}>
      
      {/* Header Bar */}
      <div style={{ maxWidth: 720, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/account/settings" style={{ color: '#c3f400', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          <span>Account Settings</span>
        </Link>
        <div style={{ fontSize: 12, color: '#888' }}>Device Security</div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        backgroundColor: '#0d0f0b',
        border: '1px solid rgba(195, 244, 0, 0.22)',
        borderRadius: 24,
        padding: 32,
        boxSizing: 'border-box',
      }}>
        {/* Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.4rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: '#c3f400' }}>devices</span>
              Session & Device Management
            </h1>
            <p style={{ fontSize: 12, color: '#888', marginTop: 4, margin: 0 }}>
              Manage active browser sessions and revoke unauthorized device access.
            </p>
          </div>

          <button
            onClick={handleRevokeAllOthers}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              backgroundColor: 'rgba(239,68,68,0.15)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Revoke All Other Devices
          </button>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#c3f400' }}>
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
            No active database sessions found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sessions.map(sess => {
              const isCurrent = sess.isCurrent || sess.sessionId === currentSessionId;
              const isMobile = /mobile|android|iphone|ipad/i.test(sess.userAgent);

              return (
                <div
                  key={sess.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',
                    border: isCurrent ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', color: isCurrent ? '#a3e635' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {isMobile ? 'smartphone' : 'laptop'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{sess.userAgent.split(' ')[0] || 'Browser Session'}</span>
                        {isCurrent && (
                          <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 6, backgroundColor: '#10b981', color: '#ffffff', letterSpacing: '0.04em' }}>
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', gap: 10 }}>
                        <span>IP: {sess.ip}</span>
                        <span>• Role: {sess.activeRole}</span>
                        <span>• Active: {new Date(sess.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      onClick={() => handleRevokeSession(sess.sessionId)}
                      disabled={revokingId === sess.sessionId}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid #ef4444',
                        color: '#f87171',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {revokingId === sess.sessionId ? 'Revoking...' : 'Revoke'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Master Action: Logout from all devices */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Master Logout</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Instantly end all sessions across all mobile & desktop devices.</div>
          </div>
          <button
            onClick={handleLogoutAll}
            style={{
              padding: '10px 16px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            LOGOUT ALL DEVICES
          </button>
        </div>

      </div>
    </div>
  );
}
