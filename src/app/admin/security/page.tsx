'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface LoginEvt {
  _id: string;
  email: string;
  userName: string;
  role?: string;
  success: boolean;
  ip: string;
  device: string;
  browser: string;
  os: string;
  failReason?: string;
  timestamp: string;
}

interface Stats {
  failedLogins24h: number;
  successLogins24h: number;
  uniqueDevices: number;
  blockedAttempts: number;
}

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [loginEvents, setLoginEvents] = useState<LoginEvt[]>([]);
  const [stats, setStats] = useState<Stats>({ failedLogins24h: 0, successLogins24h: 0, uniqueDevices: 0, blockedAttempts: 0 });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<LoginEvt | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/login-events?limit=100');
      const data = await res.json();
      if (data.success) {
        setLoginEvents(data.events);
        setStats(data.stats);
        setLastRefresh(new Date());
      }
    } catch { /* fallback silently */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchEvents, 8000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchEvents]);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const fullTime = (ts: string) => new Date(ts).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' });

  const filtered = loginEvents.filter(e => filterStatus === 'all' || (filterStatus === 'success' ? e.success : !e.success));

  const deviceIcon = (d: string) => {
    if (/iPhone|Android Phone/i.test(d)) return 'smartphone';
    if (/iPad|Tablet/i.test(d)) return 'tablet';
    if (/Mac/i.test(d)) return 'laptop_mac';
    if (/Windows/i.test(d)) return 'laptop_windows';
    if (/Bot|CLI/i.test(d)) return 'terminal';
    return 'devices';
  };

  const securityScore = Math.max(0, Math.min(100, 100 - stats.failedLogins24h * 3 - stats.blockedAttempts * 5));
  const scoreColor = securityScore >= 80 ? 'var(--lime-400)' : securityScore >= 50 ? '#ff9800' : 'var(--error)';

  const sevColors: Record<string, string> = { info: '#00e5ff', warning: '#ff9800', critical: 'var(--error)', High: '#ff9800', Critical: 'var(--error)', Medium: '#ffc107' };

  const activityLogs = [
    { id: 1, user: 'Super Admin', action: 'Approved vendor registration', target: 'GymShark Pro', ip: '192.168.1.100', time: '2 min ago', severity: 'info' },
    { id: 2, user: 'Nike Official', action: 'Updated product listing', target: 'AeroFlex Tee', ip: '203.45.67.89', time: '15 min ago', severity: 'info' },
    { id: 3, user: 'System', action: 'Failed login attempt detected', target: 'admin@africart.com', ip: '185.220.101.42', time: '30 min ago', severity: 'warning' },
    { id: 4, user: 'Super Admin', action: 'Suspended vendor account', target: 'Lululemon', ip: '192.168.1.100', time: '1 hour ago', severity: 'critical' },
  ];

  const fraudAlerts = [
    { id: 1, type: 'Suspicious Transaction', desc: 'Multiple high-value orders from same IP within 5 minutes', severity: 'High', time: '1h ago' },
    { id: 2, type: 'Account Takeover Attempt', desc: 'Password reset requested 8 times for alex@email.com', severity: 'Critical', time: '2h ago' },
    { id: 3, type: 'Bot Activity', desc: 'Automated scraping detected from IP range 91.234.x.x', severity: 'Medium', time: '4h ago' },
  ];

  const tabList = ['overview', 'live_logins', 'activity_logs', 'fraud_alerts', '2fa_settings'];

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Security Center</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Monitor platform security, live logins, access logs & fraud alerts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: autoRefresh ? 'var(--lime-400)' : 'var(--outline-variant)', animation: autoRefresh ? 'pulse-glow 2s infinite' : 'none' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
            {autoRefresh ? 'Live' : 'Paused'} • {lastRefresh.toLocaleTimeString()}
          </span>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface)', cursor: 'pointer', fontSize: '0.8rem' }}>
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
          <button onClick={fetchEvents} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface)', cursor: 'pointer', fontSize: '0.8rem' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Security Score', val: `${securityScore}/100`, icon: 'verified_user', color: scoreColor },
          { label: 'Failed Logins (24h)', val: String(stats.failedLogins24h), icon: 'lock', color: 'var(--error)' },
          { label: 'Successful Logins (24h)', val: String(stats.successLogins24h), icon: 'check_circle', color: 'var(--lime-400)' },
          { label: 'Unique Devices (24h)', val: String(stats.uniqueDevices), icon: 'devices', color: '#00e5ff' },
          { label: 'Blocked Attempts', val: String(stats.blockedAttempts), icon: 'block', color: '#ff9800' },
          { label: '2FA Status', val: twoFAEnabled ? 'Enabled' : 'Disabled', icon: 'security', color: twoFAEnabled ? 'var(--lime-400)' : 'var(--error)' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 160px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <div className="font-lexend" style={{ fontSize: '1.3rem', fontWeight: 600 }}>{s.val}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tabList.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
            backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface)', color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s',
          }}>{tab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</button>
        ))}
      </div>

      {/* ── LIVE LOGINS ── */}
      {(activeTab === 'overview' || activeTab === 'live_logins') && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Live Login Monitor</h3>
              <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)' }}>
                {loginEvents.length} events
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'success', 'failed'] as const).map(f => (
                <button key={f} onClick={() => setFilterStatus(f)} style={{ padding: '6px 14px', borderRadius: 6, border: filterStatus === f ? 'none' : '1px solid var(--outline)', backgroundColor: filterStatus === f ? (f === 'failed' ? 'color-mix(in srgb, var(--error) 20%, transparent)' : f === 'success' ? 'color-mix(in srgb, var(--lime-400) 20%, transparent)' : 'var(--surface-container-high)') : 'transparent', color: filterStatus === f ? (f === 'failed' ? 'var(--error)' : f === 'success' ? 'var(--lime-400)' : 'var(--on-surface)') : 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: filterStatus === f ? 600 : 400, textTransform: 'capitalize' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
              <p style={{ marginTop: 8 }}>Loading login events...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>shield</span>
              <p style={{ marginTop: 8 }}>No login events recorded yet. Events will appear here as users log in.</p>
            </div>
          ) : (
            <div style={{ maxHeight: activeTab === 'live_logins' ? '600px' : '400px', overflowY: 'auto' }}>
              {filtered.map((evt, idx) => (
                <div key={evt._id || idx} onClick={() => setSelectedEvent(selectedEvent?._id === evt._id ? null : evt)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: idx < filtered.length - 1 ? '1px solid var(--outline-variant)' : 'none', cursor: 'pointer', transition: 'background 0.15s', backgroundColor: selectedEvent?._id === evt._id ? 'var(--surface-container)' : 'transparent' }}>
                  
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `color-mix(in srgb, ${evt.success ? 'var(--lime-400)' : 'var(--error)'} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: evt.success ? 'var(--lime-400)' : 'var(--error)', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{deviceIcon(evt.device)}</span>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{evt.userName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{evt.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{evt.browser} • {evt.os} • {evt.device}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: `color-mix(in srgb, ${evt.success ? 'var(--lime-400)' : 'var(--error)'} 20%, transparent)`,
                      color: evt.success ? 'var(--lime-400)' : 'var(--error)' }}>
                      {evt.success ? 'Success' : 'Failed'}
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>{timeAgo(evt.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detail panel */}
          {selectedEvent && (
            <div className="animate-fade-in" style={{ padding: '20px 24px', backgroundColor: 'var(--surface-container)', borderTop: '1px solid var(--outline)' }}>
              <h4 className="font-lexend" style={{ marginBottom: 12, fontSize: '1rem' }}>Login Event Details</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { label: 'User', value: `${selectedEvent.userName} (${selectedEvent.email})`, icon: 'person' },
                  { label: 'Role', value: selectedEvent.role || 'N/A', icon: 'badge' },
                  { label: 'Status', value: selectedEvent.success ? 'Successful Login' : `Failed: ${selectedEvent.failReason || 'Unknown'}`, icon: selectedEvent.success ? 'check_circle' : 'cancel' },
                  { label: 'Device', value: selectedEvent.device, icon: deviceIcon(selectedEvent.device) },
                  { label: 'Browser', value: selectedEvent.browser, icon: 'web' },
                  { label: 'Operating System', value: selectedEvent.os, icon: 'computer' },
                  { label: 'IP Address', value: selectedEvent.ip, icon: 'language' },
                  { label: 'Exact Time', value: fullTime(selectedEvent.timestamp), icon: 'schedule' },
                ].map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)', marginTop: 2 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>{d.label}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{d.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Logs */}
      {(activeTab === 'overview' || activeTab === 'activity_logs') && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Activity Logs</h3>
            <button style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: '1px solid var(--outline)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>Export Logs</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Severity</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>User</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Action</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Target</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log, idx) => (
                  <tr key={log.id} style={{ borderBottom: idx < activityLogs.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <td style={{ padding: '14px 24px' }}><div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: sevColors[log.severity] }} /></td>
                    <td style={{ padding: '14px 24px', fontWeight: 500, fontSize: '0.9rem' }}>{log.user}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.9rem' }}>{log.action}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{log.target}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fraud Alerts */}
      {(activeTab === 'overview' || activeTab === 'fraud_alerts') && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', padding: '24px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Fraud Detection Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {fraudAlerts.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', border: `1px solid color-mix(in srgb, ${sevColors[a.severity]} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${sevColors[a.severity]} 5%, transparent)`, alignItems: 'flex-start' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${sevColors[a.severity]} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sevColors[a.severity], flexShrink: 0 }}>
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{a.type}</span>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: `color-mix(in srgb, ${sevColors[a.severity]} 20%, transparent)`, color: sevColors[a.severity] }}>{a.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', margin: '0 0 8px 0' }}>{a.desc}</p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{a.time}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: '1px solid var(--outline)', cursor: 'pointer', fontSize: '0.8rem' }}>Investigate</button>
                  <button style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'transparent', color: 'var(--on-surface-variant)', border: '1px solid var(--outline)', cursor: 'pointer', fontSize: '0.8rem' }}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2FA Settings */}
      {activeTab === '2fa_settings' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '32px', border: '1px solid var(--outline)', maxWidth: '600px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.4rem', marginBottom: '24px' }}>Two-Factor Authentication</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>2FA via Authenticator App</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>Use Google Authenticator or similar app</div>
            </div>
            <div onClick={() => setTwoFAEnabled(!twoFAEnabled)} style={{ width: '52px', height: '28px', backgroundColor: twoFAEnabled ? 'var(--lime-400)' : 'var(--outline-variant)', borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: twoFAEnabled ? 'black' : 'var(--on-surface-variant)', borderRadius: '50%', position: 'absolute', top: '2px', left: twoFAEnabled ? '26px' : '2px', transition: 'left 0.3s' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '10px' }}>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>Backup Codes</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>8 codes remaining • Last generated Jan 15, 2025</div>
            </div>
            <button style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: '1px solid var(--outline)', fontWeight: 500, cursor: 'pointer' }}>Regenerate Backup Codes</button>
          </div>
        </div>
      )}
    </div>
  );
}
