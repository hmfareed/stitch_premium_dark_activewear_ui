'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface AuditEntry {
  _id: string;
  adminEmail: string;
  adminName: string;
  role: string;
  action: string;
  target: string;
  targetId?: string;
  ip: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

const ACTION_COLORS: Record<string, string> = {
  'approve_vendor': 'var(--lime-400)',
  'reject_vendor': 'var(--error)',
  'suspend_vendor': '#ff9800',
  'delete_product': 'var(--error)',
  'refund_order': '#00e5ff',
  'release_funds': 'var(--lime-400)',
  'update_order_status': '#7c4dff',
  'create_admin': '#00e5ff',
  'delete_admin': 'var(--error)',
  'update_settings': '#ff9800',
  'export_data': '#7c4dff',
  'anonymise_user': 'var(--error)',
};

function getActionColor(action: string): string {
  return ACTION_COLORS[action] || 'var(--on-surface-variant)';
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function downloadCSV(logs: AuditEntry[]) {
  const headers = ['Timestamp', 'Admin', 'Role', 'Action', 'Target', 'IP'];
  const rows = logs.map(l => [
    new Date(l.timestamp).toLocaleString(),
    `${l.adminName} <${l.adminEmail}>`,
    l.role,
    l.action.replace(/_/g, ' '),
    l.target,
    l.ip,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `africart-audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Mock data for demonstration (replace with real DB data when connected)
const MOCK_LOGS: AuditEntry[] = [
  { _id: '1', adminEmail: 'admin@africart.com', adminName: 'Super Admin', role: 'Super Admin', action: 'approve_vendor', target: 'GymShark Pro Store', ip: '192.168.1.100', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
  { _id: '2', adminEmail: 'admin@africart.com', adminName: 'Super Admin', role: 'Super Admin', action: 'update_order_status', target: 'Order #AC-00123', ip: '192.168.1.100', timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
  { _id: '3', adminEmail: 'finance@africart.com', adminName: 'Finance Admin', role: 'Finance Admin', action: 'release_funds', target: 'Payout to Nike Official — GH₵1,200', ip: '10.0.0.5', timestamp: new Date(Date.now() - 40 * 60000).toISOString() },
  { _id: '4', adminEmail: 'admin@africart.com', adminName: 'Super Admin', role: 'Super Admin', action: 'suspend_vendor', target: 'Fake Goods Store', ip: '192.168.1.100', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
  { _id: '5', adminEmail: 'admin@africart.com', adminName: 'Super Admin', role: 'Super Admin', action: 'delete_product', target: 'Counterfeit AirPods Listing', ip: '192.168.1.100', timestamp: new Date(Date.now() - 3 * 3600000).toISOString() },
  { _id: '6', adminEmail: 'support@africart.com', adminName: 'Support Agent', role: 'Support Admin', action: 'refund_order', target: 'Order #AC-00098 — GH₵320', ip: '10.0.0.8', timestamp: new Date(Date.now() - 5 * 3600000).toISOString() },
  { _id: '7', adminEmail: 'admin@africart.com', adminName: 'Super Admin', role: 'Super Admin', action: 'export_data', target: 'john.doe@email.com', ip: '192.168.1.100', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
  { _id: '8', adminEmail: 'admin@africart.com', adminName: 'Super Admin', role: 'Super Admin', action: 'create_admin', target: 'finance@africart.com (Finance Admin)', ip: '192.168.1.100', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
  { _id: '9', adminEmail: 'admin@africart.com', adminName: 'Super Admin', role: 'Super Admin', action: 'reject_vendor', target: 'Suspicious Gadgets Store', ip: '192.168.1.100', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
  { _id: '10', adminEmail: 'finance@africart.com', adminName: 'Finance Admin', role: 'Finance Admin', action: 'release_funds', target: 'Payout to Adidas Official — GH₵3,800', ip: '10.0.0.5', timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
];

const ACTION_TYPES = [
  'all', 'approve_vendor', 'reject_vendor', 'suspend_vendor', 'delete_product',
  'refund_order', 'release_funds', 'update_order_status', 'create_admin',
  'delete_admin', 'update_settings', 'export_data', 'anonymise_user'
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success && data.logs?.length > 0) {
        setLogs(data.logs);
      } else {
        setLogs(MOCK_LOGS);
      }
    } catch {
      setLogs(MOCK_LOGS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(fetchLogs, 15000);
    return () => clearInterval(iv);
  }, [autoRefresh, fetchLogs]);

  const filtered = logs.filter(l => {
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const matchesAdmin = !adminFilter || l.adminEmail.toLowerCase().includes(adminFilter.toLowerCase()) || l.adminName.toLowerCase().includes(adminFilter.toLowerCase());
    const matchesFrom = !dateFrom || new Date(l.timestamp) >= new Date(dateFrom);
    const matchesTo = !dateTo || new Date(l.timestamp) <= new Date(dateTo + 'T23:59:59');
    return matchesAction && matchesAdmin && matchesFrom && matchesTo;
  });

  const uniqueAdmins = [...new Set(logs.map(l => l.adminEmail))];

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Audit Logs</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>
            Persistent record of all admin actions — who did what, when, and from where.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: autoRefresh ? 'var(--lime-400)' : 'var(--outline-variant)', animation: autoRefresh ? 'pulse-glow 2s infinite' : 'none' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{autoRefresh ? 'Live' : 'Paused'}</span>
          </div>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface)', cursor: 'pointer', fontSize: '0.85rem' }}>
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
          <button onClick={() => downloadCSV(filtered)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Entries', value: logs.length, icon: 'receipt_long', color: 'var(--lime-400)' },
          { label: 'Today', value: logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length, icon: 'today', color: '#00e5ff' },
          { label: 'Admins Active', value: uniqueAdmins.length, icon: 'shield_person', color: '#7c4dff' },
          { label: 'High-Risk Actions', value: logs.filter(l => ['delete_product', 'suspend_vendor', 'reject_vendor', 'anonymise_user', 'delete_admin'].includes(l.action)).length, icon: 'warning', color: 'var(--error)' },
        ].map(stat => (
          <div key={stat.label} style={{ flex: '1 1 160px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: 12, border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: `color-mix(in srgb, ${stat.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <div className="font-lexend" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', padding: '20px 24px' }}>
        <h3 className="font-lexend" style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--on-surface-variant)' }}>FILTER LOGS</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>Action Type</label>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.9rem' }}
            >
              {ACTION_TYPES.map(a => (
                <option key={a} value={a}>{a === 'all' ? 'All Actions' : a.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>Admin</label>
            <input
              type="text"
              placeholder="Filter by admin name or email..."
              value={adminFilter}
              onChange={e => setAdminFilter(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 8, textTransform: 'uppercase' }}>To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={() => { setActionFilter('all'); setAdminFilter(''); setDateFrom(''); setDateTo(''); }}
            style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--outline)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>
            Log Entries
            <span style={{ marginLeft: 12, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)' }}>
              {filtered.length} records
            </span>
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 36 }}>progress_activity</span>
            <p style={{ marginTop: 12 }}>Loading audit logs…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 56 }}>history</span>
            <p style={{ marginTop: 12 }}>No audit entries match your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', fontSize: '0.8rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'left' }}>Timestamp</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'left' }}>Admin</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'left' }}>Action</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'left' }}>Target</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'left' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => {
                  const color = getActionColor(log.action);
                  const isSelected = selectedLog?._id === log._id;
                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        onClick={() => setSelectedLog(isSelected ? null : log)}
                        style={{
                          borderBottom: '1px solid var(--outline-variant)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--surface-container)' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{timeAgo(log.timestamp)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{new Date(log.timestamp).toLocaleString()}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.adminName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{log.adminEmail}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, #7c4dff 15%, transparent)', color: '#7c4dff' }}>
                            {log.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: '0.9rem', maxWidth: 220 }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{log.target}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--surface-container)', padding: '2px 8px', borderRadius: 4, color: 'var(--on-surface-variant)' }}>
                            {log.ip}
                          </code>
                        </td>
                      </tr>
                      {isSelected && (
                        <tr style={{ backgroundColor: 'color-mix(in srgb, var(--lime-400) 5%, transparent)' }}>
                          <td colSpan={6} style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                              {[
                                { label: 'Full Timestamp', value: new Date(log.timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' }), icon: 'schedule' },
                                { label: 'Admin ID', value: log.adminEmail, icon: 'badge' },
                                { label: 'IP Address', value: log.ip, icon: 'language' },
                                { label: 'Action', value: log.action.replace(/_/g, ' '), icon: 'check_circle' },
                                { label: 'Target', value: log.target, icon: 'target' },
                                log.targetId ? { label: 'Target ID', value: log.targetId, icon: 'tag' } : null,
                              ].filter(Boolean).map((d: any) => (
                                <div key={d.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)', marginTop: 2 }}>{d.icon}</span>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: 2 }}>{d.label}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{d.value}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
