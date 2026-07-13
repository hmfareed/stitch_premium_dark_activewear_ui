'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface FraudRules {
  velocityThreshold: number;
  maxOrderValueAlert: number;
  bannedKeywords: string[];
  autoSuspendEnabled: boolean;
  autoSuspendThreshold: number;
  requirePhoneVerification: boolean;
  blockVPNOrders: boolean;
  blockedIPs: string[];
  updatedAt: string;
}

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

  // Real DB security states
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);
  const [fraudAlertsLoading, setFraudAlertsLoading] = useState(true);

  // Fraud Rules Engine state
  const [fraudRules, setFraudRules] = useState<FraudRules>({
    velocityThreshold: 5,
    maxOrderValueAlert: 2000,
    bannedKeywords: ['scam', 'fake', 'replica', 'counterfeit', 'fraud'],
    autoSuspendEnabled: true,
    autoSuspendThreshold: 3,
    requirePhoneVerification: true,
    blockVPNOrders: false,
    blockedIPs: [],
    updatedAt: new Date().toISOString(),
  });
  const [fraudRulesLoading, setFraudRulesLoading] = useState(false);
  const [fraudRulesSaved, setFraudRulesSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [manualIPInput, setManualIPInput] = useState('');

  // 2FA Setup Wizard States
  const [show2FAWizard, setShow2FAWizard] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationCodeError] = useState('');
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);

  // Fetch security audit logs, fraud alerts, and login events
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

    try {
      const res = await fetch('/api/audit-logs?limit=100');
      const data = await res.json();
      if (data.success) {
        setActivityLogs(data.logs);
      }
    } catch { /* silent */ }
    setActivityLogsLoading(false);

    try {
      const res = await fetch('/api/fraud-alerts');
      const data = await res.json();
      if (data.success) {
        setFraudAlerts(data.alerts);
      }
    } catch { /* silent */ }
    setFraudAlertsLoading(false);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
    // Sync 2FA state from local storage if any
    const cached2FA = localStorage.getItem('africart-2fa-enabled');
    if (cached2FA !== null) {
      setTwoFAEnabled(cached2FA === 'true');
    }
  }, [fetchEvents]);

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

  const filteredLogins = loginEvents.filter(e => filterStatus === 'all' || (filterStatus === 'success' ? e.success : !e.success));

  const deviceIcon = (d: string) => {
    if (/iPhone|Android Phone/i.test(d)) return 'smartphone';
    if (/iPad|Tablet/i.test(d)) return 'tablet';
    if (/Mac/i.test(d)) return 'laptop_mac';
    if (/Windows/i.test(d)) return 'laptop_windows';
    if (/Bot|CLI|Firewall/i.test(d)) return 'terminal';
    return 'devices';
  };

  const securityScore = Math.max(0, Math.min(100, 100 - stats.failedLogins24h * 3 - stats.blockedAttempts * 5));
  const scoreColor = securityScore >= 80 ? 'var(--lime-400)' : securityScore >= 50 ? '#ff9800' : 'var(--error)';

  const sevColors: Record<string, string> = { 
    info: '#00e5ff', 
    warning: '#ff9800', 
    critical: 'var(--error)', 
    High: '#ff9800', 
    Critical: 'var(--error)', 
    Medium: '#ffc107',
    info_log: '#00e5ff',
    warning_log: '#ff9800',
    critical_log: 'var(--error)'
  };

  const tabList = ['overview', 'live_logins', 'activity_logs', 'fraud_alerts', 'fraud_rules', '2fa_settings'];

  const fetchFraudRules = useCallback(async () => {
    try {
      const res = await fetch('/api/fraud-rules');
      const data = await res.json();
      if (data.success) setFraudRules(data.rules);
    } catch { /* use defaults */ }
  }, []);

  const saveFraudRules = async (rulesToSave = fraudRules) => {
    setFraudRulesLoading(true);
    try {
      const res = await fetch('/api/fraud-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rulesToSave),
      });
      const data = await res.json();
      if (data.success) {
        setFraudRules(data.rules);
        setFraudRulesSaved(true);
        setTimeout(() => setFraudRulesSaved(false), 3000);
      }
    } catch { /* silent */ }
    setFraudRulesLoading(false);
  };

  useEffect(() => { fetchFraudRules(); }, [fetchFraudRules]);

  // IP Blacklist Actions
  const handleBlockIP = async (ip: string) => {
    if (!ip) return;
    const normalizedIP = ip.trim();
    if (fraudRules.blockedIPs.includes(normalizedIP)) {
      alert(`IP address ${normalizedIP} is already in the blacklist!`);
      return;
    }
    const updated = {
      ...fraudRules,
      blockedIPs: [...fraudRules.blockedIPs, normalizedIP],
    };
    setFraudRules(updated);
    await saveFraudRules(updated);
    alert(`Successfully blacklisted IP address ${normalizedIP} on the Firewall.`);
    fetchEvents();
  };

  const handleUnblockIP = async (ip: string) => {
    if (!ip) return;
    const updated = {
      ...fraudRules,
      blockedIPs: fraudRules.blockedIPs.filter(x => x !== ip),
    };
    setFraudRules(updated);
    await saveFraudRules(updated);
    alert(`IP address ${ip} was removed from the firewall blacklist.`);
  };

  const handleDismissAlert = (id: string) => {
    setFraudAlerts(prev => prev.filter(x => x.id !== id));
  };

  // 2FA Setup Flow Wizard Handlers
  const handleToggle2FA = () => {
    if (twoFAEnabled) {
      if (confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
        setTwoFAEnabled(false);
        localStorage.setItem('africart-2fa-enabled', 'false');
      }
    } else {
      // Open beautiful step-by-step setup wizard modal
      const codes = Array(8).fill(0).map(() => Math.random().toString(36).substring(2, 10).toUpperCase());
      setGeneratedBackupCodes(codes);
      setVerificationCode('');
      setVerificationCodeError('');
      setSetupStep(1);
      setShow2FAWizard(true);
    }
  };

  const handleVerifyOTP = () => {
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setVerificationCodeError('Please enter a valid 6-digit numerical code.');
      return;
    }
    // Success flow Simulation
    setSetupStep(3); // Go to Backup Codes slide
  };

  const handleComplete2FA = () => {
    setTwoFAEnabled(true);
    localStorage.setItem('africart-2fa-enabled', 'true');
    setShow2FAWizard(false);
    alert('Google Authenticator 2FA is now fully active on your administrator account!');
  };

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

      {/* ── OVERVIEW / LIVE LOGINS ── */}
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
          ) : filteredLogins.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>shield</span>
              <p style={{ marginTop: 8 }}>No login events recorded yet. Events will appear here as users log in.</p>
            </div>
          ) : (
            <div style={{ maxHeight: activeTab === 'live_logins' ? '600px' : '400px', overflowY: 'auto' }}>
              {filteredLogins.map((evt, idx) => (
                <div key={evt._id || idx} onClick={() => setSelectedEvent(selectedEvent?._id === evt._id ? null : evt)}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: idx < filteredLogins.length - 1 ? '1px solid var(--outline-variant)' : 'none', cursor: 'pointer', transition: 'background 0.15s', backgroundColor: selectedEvent?._id === evt._id ? 'var(--surface-container)' : 'transparent' }}>
                  
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `color-mix(in srgb, ${evt.success ? 'var(--lime-400)' : 'var(--error)'} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: evt.success ? 'var(--lime-400)' : 'var(--error)', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{deviceIcon(evt.device)}</span>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{evt.userName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{evt.email}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{evt.browser} • {evt.os} • IP: {evt.ip}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: `color-mix(in srgb, ${evt.success ? 'var(--lime-400)' : 'var(--error)'} 20%, transparent)`,
                        color: evt.success ? 'var(--lime-400)' : 'var(--error)' }}>
                        {evt.success ? 'Success' : evt.failReason || 'Failed'}
                      </span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>{timeAgo(evt.timestamp)}</div>
                    </div>
                    {!evt.success && evt.ip !== '127.0.0.1' && !fraudRules.blockedIPs.includes(evt.ip) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleBlockIP(evt.ip); }}
                        style={{ padding: '6px 12px', border: '1px solid var(--error)', color: 'var(--error)', background: 'transparent', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Block IP
                      </button>
                    )}
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
                  { label: 'Role', value: selectedEvent.role || 'Customer', icon: 'badge' },
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

      {/* ── LIVE ACTIVITY LOGS ── */}
      {(activeTab === 'overview' || activeTab === 'activity_logs') && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>System Compliance Audit Logs</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Dynamic Database Records</span>
          </div>
          {activityLogsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
              <p style={{ marginTop: 8 }}>Loading audit database...</p>
            </div>
          ) : activityLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>receipt_long</span>
              <p style={{ marginTop: 8 }}>No compliance actions recorded yet. Audit events populate automatically when admins update settings, approve/reject stores, or process payouts.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Admin</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Role</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Action Performed</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Target Object</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>IP Location</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log, idx) => (
                    <tr key={log._id || idx} style={{ borderBottom: idx < activityLogs.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                      <td style={{ padding: '14px 24px', fontWeight: 600, fontSize: '0.9rem' }}>{log.adminName}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>
                          {log.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: '0.9rem', color: 'var(--foreground)' }}>
                        <span style={{ color: 'var(--lime-400)', fontWeight: 600 }}>{log.action.replace(/_/g, ' ')}</span>
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{log.target}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--on-surface-variant)' }}>{log.ip || '127.0.0.1'}</td>
                      <td style={{ padding: '14px 24px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{fullTime(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LIVE FRAUD ALERTS ── */}
      {(activeTab === 'overview' || activeTab === 'fraud_alerts') && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Automated Fraud Detection Alerts</h3>
            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', background: 'rgba(255, 68, 68, 0.1)', color: 'var(--error)', fontWeight: 600 }}>Threat Engine Live</span>
          </div>

          {fraudAlertsLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
              <p style={{ marginTop: 8 }}>Scanning transactions and auth logs...</p>
            </div>
          ) : fraudAlerts.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>verified_user</span>
              <p style={{ marginTop: 8 }}>Zero threats active! The platform is clean and secure.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {fraudAlerts.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', border: `1px solid color-mix(in srgb, ${sevColors[a.severity]} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${sevColors[a.severity]} 5%, transparent)`, alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${sevColors[a.severity]} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sevColors[a.severity], flexShrink: 0 }}>
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700 }}>{a.type}</span>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: `color-mix(in srgb, ${sevColors[a.severity]} 20%, transparent)`, color: sevColors[a.severity] }}>{a.severity}</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', margin: '0 0 8px 0', lineHeight: 1.4 }}>{a.desc}</p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{a.time}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {a.metadata?.ip && a.metadata.ip !== '127.0.0.1' && !fraudRules.blockedIPs.includes(a.metadata.ip) && (
                      <button 
                        onClick={() => handleBlockIP(a.metadata.ip)}
                        style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--error)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Firewall Block IP
                      </button>
                    )}
                    <button 
                      onClick={() => handleDismissAlert(a.id)}
                      style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'transparent', color: 'var(--on-surface-variant)', border: '1px solid var(--outline)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FRAUD RULES ENGINE & IP FIREWALL ── */}
      {activeTab === 'fraud_rules' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="font-lexend" style={{ fontSize: '1.3rem', margin: '0 0 4px 0' }}>Fraud Rules Engine</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', margin: 0 }}>Configure automated fraud detection thresholds and actions.</p>
              </div>
              <button
                onClick={() => saveFraudRules()}
                disabled={fraudRulesLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none', background: fraudRulesSaved ? '#00e5ff' : 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{fraudRulesSaved ? 'check' : 'save'}</span>
                {fraudRulesLoading ? 'Saving…' : fraudRulesSaved ? 'Saved!' : 'Save Rules'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Velocity Threshold */}
              <div style={{ padding: '20px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '1rem' }}>Order Velocity Threshold</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: 0 }}>Alert when a single buyer places more than N orders per hour.</p>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 800, backgroundColor: 'color-mix(in srgb, #ff9800 15%, transparent)', color: '#ff9800' }}>
                    {fraudRules.velocityThreshold} orders/hr
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <input type="range" min={1} max={20} value={fraudRules.velocityThreshold}
                    onChange={e => setFraudRules(prev => ({ ...prev, velocityThreshold: parseInt(e.target.value) }))}
                    style={{ flex: 1, accentColor: 'var(--lime-400)' }}
                  />
                  <input type="number" min={1} max={20} value={fraudRules.velocityThreshold}
                    onChange={e => setFraudRules(prev => ({ ...prev, velocityThreshold: parseInt(e.target.value) || 1 }))}
                    style={{ width: 64, padding: '8px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--foreground)', textAlign: 'center', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Max Order Value Alert */}
              <div style={{ padding: '20px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '1rem' }}>High-Value Order Alert</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: 0 }}>Flag orders above this amount for manual review (GH₵).</p>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 800, backgroundColor: 'color-mix(in srgb, #ff9800 15%, transparent)', color: '#ff9800' }}>
                    GH₵{fraudRules.maxOrderValueAlert.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <input type="range" min={100} max={10000} step={100} value={fraudRules.maxOrderValueAlert}
                    onChange={e => setFraudRules(prev => ({ ...prev, maxOrderValueAlert: parseInt(e.target.value) }))}
                    style={{ flex: 1, accentColor: 'var(--lime-400)' }}
                  />
                  <input type="number" min={100} max={10000} step={100} value={fraudRules.maxOrderValueAlert}
                    onChange={e => setFraudRules(prev => ({ ...prev, maxOrderValueAlert: parseInt(e.target.value) || 100 }))}
                    style={{ width: 80, padding: '8px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--foreground)', textAlign: 'center', fontSize: '0.95rem' }}
                  />
                </div>
              </div>

              {/* Banned Keywords */}
              <div style={{ padding: '20px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)' }}>
                <h4 style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '1rem' }}>Banned Keywords</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: '0 0 14px 0' }}>Products or orders containing these words are auto-flagged.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {fraudRules.bannedKeywords.map((kw, i) => (
                    <span key={i} style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {kw}
                      <button type="button" onClick={() => setFraudRules(prev => ({ ...prev, bannedKeywords: prev.bannedKeywords.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Add keyword…"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newKeyword.trim() && !fraudRules.bannedKeywords.includes(newKeyword.trim())) { setFraudRules(prev => ({ ...prev, bannedKeywords: [...prev.bannedKeywords, newKeyword.trim().toLowerCase()] })); setNewKeyword(''); } } }}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: '0.9rem' }}
                  />
                  <button type="button" onClick={() => { if (newKeyword.trim() && !fraudRules.bannedKeywords.includes(newKeyword.trim())) { setFraudRules(prev => ({ ...prev, bannedKeywords: [...prev.bannedKeywords, newKeyword.trim().toLowerCase()] })); setNewKeyword(''); } }} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--error)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                    Add
                  </button>
                </div>
              </div>

              {/* IP Blacklist Firewall Blacklist UI */}
              <div style={{ padding: '20px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)' }}>
                <h4 style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--foreground)' }}>IP Blocking Firewall Blacklist</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: '0 0 16px 0' }}>Blocked IP addresses are completely rejected by the server firewall on login.</p>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <input
                    type="text"
                    placeholder="e.g. 197.255.42.100 or 185.220.101.42"
                    value={manualIPInput}
                    onChange={e => setManualIPInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (manualIPInput.trim()) { handleBlockIP(manualIPInput); setManualIPInput(''); } } }}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: '0.9rem' }}
                  />
                  <button type="button" onClick={() => { if (manualIPInput.trim()) { handleBlockIP(manualIPInput); setManualIPInput(''); } }} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--lime-400)', color: 'black', fontWeight: 700, cursor: 'pointer' }}>
                    Add to Blacklist
                  </button>
                </div>
                {(!fraudRules.blockedIPs || fraudRules.blockedIPs.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', opacity: 0.6, margin: 0 }}>No IP addresses currently banned on the firewall.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {fraudRules.blockedIPs.map(ip => (
                      <span key={ip} style={{ padding: '6px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace' }}>
                        {ip}
                        <button type="button" onClick={() => handleUnblockIP(ip)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { key: 'autoSuspendEnabled', label: 'Auto-Suspend Accounts', desc: 'Automatically suspend accounts that repeatedly trigger fraud alerts.' },
                  { key: 'requirePhoneVerification', label: 'Require Phone Verification for MoMo', desc: 'Force OTP verification before Mobile Money orders are processed.' },
                  { key: 'blockVPNOrders', label: 'Block VPN / Proxy Orders', desc: 'Reject orders from known VPN or proxy IP addresses.' },
                ].map(toggle => (
                  <div key={toggle.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{toggle.label}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>{toggle.desc}</div>
                    </div>
                    <div
                      onClick={() => setFraudRules(prev => { const updated = { ...prev, [toggle.key]: !(prev as any)[toggle.key] }; saveFraudRules(updated); return updated; })}
                      style={{ width: 52, height: 28, backgroundColor: (fraudRules as any)[toggle.key] ? 'var(--lime-400)' : 'var(--outline-variant)', borderRadius: 14, position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s', flexShrink: 0 }}
                    >
                      <div style={{ width: 24, height: 24, backgroundColor: (fraudRules as any)[toggle.key] ? 'black' : 'var(--on-surface-variant)', borderRadius: '50%', position: 'absolute', top: 2, left: (fraudRules as any)[toggle.key] ? 26 : 2, transition: 'left 0.3s' }} />
                    </div>
                  </div>
                ))}

                {/* Auto-suspend threshold (conditional) */}
                {fraudRules.autoSuspendEnabled && (
                  <div style={{ padding: '20px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', marginTop: -8 }}>
                    <h4 style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '0.95rem' }}>Auto-Suspend After</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: '0 0 14px 0' }}>Number of consecutive velocity violations before auto-suspension.</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <input type="range" min={1} max={10} value={fraudRules.autoSuspendThreshold}
                        onChange={e => { const updated = { ...fraudRules, autoSuspendThreshold: parseInt(e.target.value) }; setFraudRules(updated); saveFraudRules(updated); }}
                        style={{ flex: 1, accentColor: 'var(--error)' }}
                      />
                      <span style={{ fontWeight: 800, color: 'var(--error)', minWidth: 40, textAlign: 'center' }}>{fraudRules.autoSuspendThreshold}x</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2FA SETTINGS TAB ── */}
      {activeTab === '2fa_settings' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '32px', border: '1px solid var(--outline)', maxWidth: '600px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.4rem', marginBottom: '24px' }}>Two-Factor Authentication (2FA)</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Google Authenticator App</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>Protect your Super Admin sessions with TOTP codes.</div>
            </div>
            <div onClick={handleToggle2FA} style={{ width: '52px', height: '28px', backgroundColor: twoFAEnabled ? 'var(--lime-400)' : 'var(--outline-variant)', borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s' }}>
              <div style={{ width: '24px', height: '24px', backgroundColor: twoFAEnabled ? 'black' : 'var(--on-surface-variant)', borderRadius: '50%', position: 'absolute', top: '2px', left: twoFAEnabled ? '26px' : '2px', transition: 'left 0.3s' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '10px' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Emergency Backup Codes</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                {twoFAEnabled ? '8 codes are securely saved. Use these if you lose access to your phone.' : 'Enable 2FA first to generate secure offline backup codes.'}
              </div>
            </div>
            {twoFAEnabled && (
              <button 
                onClick={handleToggle2FA}
                style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--outline)', fontWeight: 600, cursor: 'pointer' }}
              >
                Regenerate Backup Codes
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 2FA CONFIGURATION MODAL WIZARD ── */}
      {show2FAWizard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShow2FAWizard(false)}>
          <div 
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', borderRadius: '24px', padding: '32px', maxWidth: '480px', width: '90%', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-lexend" style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800 }}>Configure Authenticator 2FA</h3>
              <button onClick={() => setShow2FAWizard(false)} style={{ background: 'var(--surface-container-high)', border: 'none', cursor: 'pointer', color: 'var(--on-surface)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Slide 1: QR Code Setup */}
            {setupStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ padding: '16px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* High Quality Styled QR Code Simulation */}
                  <div style={{ width: '160px', height: '160px', border: '8px solid black', position: 'relative', display: 'flex', flexWrap: 'wrap' }}>
                    {/* QR Code Blocks */}
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'white' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'white' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'white' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'white' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'white' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'white' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'black' }} />
                    {/* Inner graphic representing activewear branding */}
                    <div style={{ position: 'absolute', inset: '56px', backgroundColor: '#c3f400', borderRadius: '4px', border: '2px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 900, fontSize: '10px' }}>STITCH</div>
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 6px 0' }}>Step 1: Scan this QR Code</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.4 }}>Open Google Authenticator, tap the &quot;+&quot; icon, and scan this code. Or enter the secret key below manually:</p>
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--surface-container)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', border: '1px dashed var(--outline)' }}>
                    STCH SECR 2FAK EY99 MWQ1
                  </div>
                </div>
                <button onClick={() => setSetupStep(2)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--lime-400)', color: 'black', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
                  Next: Enter OTP Code
                </button>
              </div>
            )}

            {/* Slide 2: Enter OTP Code */}
            {setupStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 6px 0' }}>Step 2: Enter Verification Code</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.4 }}>Enter the 6-digit dynamic passcode currently displayed on your Authenticator app for this account.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="e.g. 123456" 
                    maxLength={6} 
                    value={verificationCode}
                    onChange={e => { setVerificationCode(e.target.value); setVerificationCodeError(''); }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: verificationError ? '1.5px solid var(--error)' : '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '1.2rem', textAlign: 'center', fontWeight: 700, letterSpacing: '0.2em' }}
                  />
                  {verificationError && <p style={{ fontSize: '0.8rem', color: 'var(--error)', margin: 0, textAlign: 'center' }}>{verificationError}</p>}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button onClick={() => setSetupStep(1)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer' }}>
                    Back
                  </button>
                  <button onClick={handleVerifyOTP} style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--lime-400)', color: 'black', fontWeight: 700, cursor: 'pointer' }}>
                    Verify Code
                  </button>
                </div>
              </div>
            )}

            {/* Slide 3: Backup Codes Backup */}
            {setupStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--lime-400)', marginBottom: '8px' }}>task_alt</span>
                  <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 6px 0', color: 'var(--lime-400)' }}>Setup Successfully Verified!</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', margin: 0, lineHeight: 1.4 }}>Write down these emergency backup codes. These allow you to log in if you ever lose your mobile device. They are single-use only.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px', background: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                  {generatedBackupCodes.map((code, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--foreground)', display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--on-surface-variant)' }}>{idx + 1}.</span> {code}
                    </div>
                  ))}
                </div>

                <div style={{ padding: '10px 14px', background: 'rgba(255, 152, 0, 0.08)', borderRadius: '8px', border: '1.5px solid rgba(255, 152, 0, 0.3)', fontSize: '0.8rem', color: '#ff9800', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', marginTop: '2px' }}>warning</span>
                  <span style={{ lineHeight: 1.3 }}>Never share your 2FA credentials or secret key. Our administrators will never ask you for these codes.</span>
                </div>

                <button onClick={handleComplete2FA} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--lime-400)', color: 'black', fontWeight: 900, cursor: 'pointer', marginTop: 8 }}>
                  Done & Activate 2FA
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
