'use client';

import React, { useState } from 'react';

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);

  const activityLogs = [
    { id: 1, user: 'Super Admin', action: 'Approved vendor registration', target: 'GymShark Pro', ip: '192.168.1.100', time: '2 min ago', severity: 'info' },
    { id: 2, user: 'Nike Official', action: 'Updated product listing', target: 'AeroFlex Tee', ip: '203.45.67.89', time: '15 min ago', severity: 'info' },
    { id: 3, user: 'System', action: 'Failed login attempt detected', target: 'admin@reed.com', ip: '185.220.101.42', time: '30 min ago', severity: 'warning' },
    { id: 4, user: 'Super Admin', action: 'Suspended vendor account', target: 'Lululemon', ip: '192.168.1.100', time: '1 hour ago', severity: 'critical' },
    { id: 5, user: 'Adidas Store', action: 'Processed bulk product upload', target: '24 products', ip: '78.112.45.33', time: '2 hours ago', severity: 'info' },
    { id: 6, user: 'System', action: 'Unusual transaction pattern detected', target: 'Order #ORD-3004', ip: 'N/A', time: '3 hours ago', severity: 'warning' },
    { id: 7, user: 'System', action: 'Brute force protection triggered', target: 'vendor@fake.com', ip: '91.234.12.77', time: '5 hours ago', severity: 'critical' },
  ];

  const loginHistory = [
    { user: 'Super Admin', device: 'Chrome / Windows', ip: '192.168.1.100', location: 'New York, US', time: 'Just now', status: 'Success' },
    { user: 'Super Admin', device: 'Safari / macOS', ip: '192.168.1.101', location: 'New York, US', time: '6 hours ago', status: 'Success' },
    { user: 'Unknown', device: 'Firefox / Linux', ip: '185.220.101.42', location: 'Moscow, RU', time: '30 min ago', status: 'Failed' },
    { user: 'Nike Official', device: 'Chrome / Windows', ip: '203.45.67.89', location: 'Portland, US', time: '1 hour ago', status: 'Success' },
    { user: 'Unknown', device: 'curl/7.68', ip: '91.234.12.77', location: 'Unknown', time: '5 hours ago', status: 'Blocked' },
  ];

  const fraudAlerts = [
    { id: 1, type: 'Suspicious Transaction', desc: 'Multiple high-value orders from same IP within 5 minutes', severity: 'High', time: '1h ago' },
    { id: 2, type: 'Account Takeover Attempt', desc: 'Password reset requested 8 times for alex@email.com', severity: 'Critical', time: '2h ago' },
    { id: 3, type: 'Bot Activity', desc: 'Automated scraping detected from IP range 91.234.x.x', severity: 'Medium', time: '4h ago' },
  ];

  const sevColors: Record<string, string> = { info: '#00e5ff', warning: '#ff9800', critical: 'var(--error)', High: '#ff9800', Critical: 'var(--error)', Medium: '#ffc107', Low: 'var(--lime-400)' };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Security Center</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Monitor platform security, access logs, and fraud alerts</p>
      </div>

      {/* Security Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Security Score', val: '94/100', icon: 'verified_user', color: 'var(--lime-400)' },
          { label: 'Failed Logins (24h)', val: '7', icon: 'lock', color: 'var(--error)' },
          { label: 'Active Sessions', val: '23', icon: 'devices', color: '#00e5ff' },
          { label: 'Fraud Alerts', val: '3', icon: 'warning', color: '#ff9800' },
          { label: '2FA Status', val: 'Enabled', icon: 'security', color: 'var(--lime-400)' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 170px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '14px' }}>
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
        {['overview', 'activity_logs', 'login_history', 'fraud_alerts', '2fa_settings'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer',
            backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface)', color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s',
          }}>{tab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</button>
        ))}
      </div>

      {/* Activity Logs */}
      {(activeTab === 'overview' || activeTab === 'activity_logs') && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Activity Logs</h3>
            <button style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: '1px solid var(--outline)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>Export Logs</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Severity</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>User</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Action</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Target</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>IP Address</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log, idx) => (
                  <tr key={log.id} style={{ borderBottom: idx !== activityLogs.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sevColors[log.severity] }} />
                    </td>
                    <td style={{ padding: '14px 24px', fontWeight: 500, fontSize: '0.9rem' }}>{log.user}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.9rem' }}>{log.action}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{log.target}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem', fontFamily: 'monospace' }}>{log.ip}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Login History */}
      {(activeTab === 'overview' || activeTab === 'login_history') && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Login History</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>User</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Device</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>IP</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Location</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Time</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((l, idx) => (
                  <tr key={idx} style={{ borderBottom: idx !== loginHistory.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 500 }}>{l.user}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.9rem' }}>{l.device}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem', fontFamily: 'monospace' }}>{l.ip}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.9rem' }}>{l.location}</td>
                    <td style={{ padding: '14px 24px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{l.time}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                        backgroundColor: `color-mix(in srgb, ${l.status === 'Success' ? 'var(--lime-400)' : l.status === 'Failed' ? 'var(--error)' : '#ff9800'} 20%, transparent)`,
                        color: l.status === 'Success' ? 'var(--lime-400)' : l.status === 'Failed' ? 'var(--error)' : '#ff9800'
                      }}>{l.status}</span>
                    </td>
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
