'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface AuditLogEntry {
  id: string;
  userEmail: string;
  userName: string;
  role: string;
  ip: string;
  browser: string;
  module: string;
  action: string;
  target: string;
  targetId?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

interface FilterOptions {
  modules: string[];
  actions: string[];
  users: string[];
}

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  'CREATE': { bg: '#dcfce7', text: '#15803d' },
  'APPROVE': { bg: '#dcfce7', text: '#15803d' },
  'UPDATE': { bg: '#dbeafe', text: '#1d4ed8' },
  'RELEASE_FUNDS': { bg: '#e0e7ff', text: '#4338ca' },
  'UPDATE_STATUS': { bg: '#f3e8ff', text: '#6d28d9' },
  'REJECT': { bg: '#fee2e2', text: '#b91c1c' },
  'DELETE': { bg: '#fef2f2', text: '#dc2626' },
  'SUSPEND': { bg: '#ffedd5', text: '#c2410c' },
};

function getActionStyle(action: string) {
  const uppercaseAction = action.toUpperCase();
  for (const key in ACTION_COLORS) {
    if (uppercaseAction.includes(key)) return ACTION_COLORS[key];
  }
  return { bg: '#f1f5f9', text: '#475569' };
}

function formatJSON(jsonStr?: string) {
  if (!jsonStr) return 'None (N/A)';
  try {
    const obj = JSON.parse(jsonStr);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonStr;
  }
}

function downloadCSV(logs: AuditLogEntry[]) {
  const headers = ['Timestamp', 'User Name', 'User Email', 'Role', 'IP Address', 'Browser User Agent', 'Module', 'Action', 'Target Description', 'Old Value', 'New Value'];
  const rows = logs.map(l => [
    new Date(l.timestamp).toLocaleString(),
    l.userName,
    l.userEmail,
    l.role,
    l.ip,
    l.browser,
    l.module,
    l.action,
    l.target,
    l.oldValue || '',
    l.newValue || '',
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

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Required Filters
  const [userFilter, setUserFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    modules: ['all', 'Vendors', 'Products', 'Orders', 'Finance', 'Support', 'Settings', 'Users', 'Inventory'],
    actions: ['all', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'RELEASE_FUNDS', 'UPDATE_STATUS'],
    users: ['all'],
  });

  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Manual record modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [manualModule, setManualModule] = useState('Vendors');
  const [manualAction, setManualAction] = useState('UPDATE');
  const [manualTarget, setManualTarget] = useState('');
  const [manualOldValue, setManualOldValue] = useState('');
  const [manualNewValue, setManualNewValue] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (userFilter) queryParams.set('user', userFilter);
      if (moduleFilter !== 'all') queryParams.set('module', moduleFilter);
      if (actionFilter !== 'all') queryParams.set('action', actionFilter);
      if (dateFrom) queryParams.set('dateFrom', dateFrom);
      if (dateTo) queryParams.set('dateTo', dateTo);
      if (searchQuery) queryParams.set('q', searchQuery);

      const res = await fetch(`/api/admin/audit-logs?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        if (data.filterOptions) {
          setFilterOptions(data.filterOptions);
        }
      } else {
        showToast(data.message || 'Failed to load audit logs', 'error');
      }
    } catch (err) {
      showToast('Error connecting to audit logs service', 'error');
    } finally {
      setLoading(false);
    }
  }, [userFilter, moduleFilter, actionFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTarget.trim()) {
      showToast('Please specify target description', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email || 'superadmin@africart.com',
          userName: user?.name || 'Super Admin',
          role: user?.role === 'super_admin' ? 'Super Admin' : 'Admin',
          module: manualModule,
          action: manualAction,
          target: manualTarget,
          oldValue: manualOldValue,
          newValue: manualNewValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('New audit entry logged successfully!', 'success');
        setShowRecordModal(false);
        setManualTarget('');
        setManualOldValue('');
        setManualNewValue('');
        fetchLogs();
      } else {
        showToast(data.message || 'Failed to record entry', 'error');
      }
    } catch (err) {
      showToast('Error logging audit entry', 'error');
    }
  };

  const handleClearFilters = () => {
    setUserFilter('');
    setModuleFilter('all');
    setActionFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-inter, sans-serif)', color: '#0f172a' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>
            <Link href="/admin" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Admin Portal</Link>
            <span>/</span>
            <span>Governance</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: '#16a34a' }}>history</span>
            Enterprise Audit Logs & Compliance Center
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 4 }}>
            Comprehensive immutable audit trail tracking User, Role, IP, Browser, Module, Actions, Timestamps, and State Diffs (Old vs New Values).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: autoRefresh ? '#16a34a' : '#94a3b8' }} />
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{autoRefresh ? 'Live Polling (10s)' : 'Polling Paused'}</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ background: 'none', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, marginLeft: 4 }}
            >
              {autoRefresh ? 'Pause' : 'Resume'}
            </button>
          </div>

          <button
            onClick={() => setShowRecordModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Log Test Audit Entry
          </button>

          <button
            onClick={() => downloadCSV(logs)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#16a34a' }}>download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>TOTAL AUDIT ENTRIES</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#3b82f6' }}>receipt_long</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{logs.length}</div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: 4, fontWeight: 600 }}>Active compliance log records</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>DISTINCT USERS</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#8b5cf6' }}>group</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed' }}>
            {[...new Set(logs.map(l => l.userEmail))].length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6d28d9', marginTop: 4, fontWeight: 600 }}>Tracked staff accounts</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>MODULES COVERED</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#16a34a' }}>view_module</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d' }}>
            {[...new Set(logs.map(l => l.module))].length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: 4, fontWeight: 600 }}>System modules monitored</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748b', fontSize: '0.82rem', fontWeight: 600, marginBottom: 8 }}>
            <span>MODIFICATIONS / DIFFS</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f59e0b' }}>difference</span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>
            {logs.filter(l => l.oldValue || l.newValue).length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: 4, fontWeight: 600 }}>Old vs New state records</div>
        </div>
      </div>

      {/* REQUIRED FILTERS BAR (User, Module, Date, Action) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#16a34a' }}>filter_alt</span>
            Filter Audit Trail
          </h3>
          <button
            onClick={handleClearFilters}
            style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Reset All Filters
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'end' }}>
          
          {/* Filter 1: User */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              FILTER BY USER
            </label>
            <input
              type="text"
              placeholder="Search user name or email..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          {/* Filter 2: Module */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              FILTER BY MODULE
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#ffffff' }}
            >
              {filterOptions.modules.map((m) => (
                <option key={m} value={m}>
                  {m === 'all' ? 'All System Modules' : m}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Action */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              FILTER BY ACTION
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#ffffff' }}
            >
              {filterOptions.actions.map((a) => (
                <option key={a} value={a}>
                  {a === 'all' ? 'All Action Types' : a}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: Date Range (From & To) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              FROM DATE
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
              TO DATE
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>

        </div>
      </div>

      {/* AUDIT LOG TABLE (User, Role, IP, Browser, Module, Action, Date, Old Value, New Value) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
            Audit Log Entries
            <span style={{ marginLeft: 10, padding: '2px 10px', borderRadius: 12, backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.78rem', fontWeight: 700 }}>
              {logs.length} Records
            </span>
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading audit logs data...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#cbd5e1', display: 'block', marginBottom: 8 }}>find_in_page</span>
            No audit log entries match your specified filter parameters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Date / Time</th>
                  <th style={{ padding: '12px 16px' }}>User</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Module</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                  <th style={{ padding: '12px 16px' }}>Target Description</th>
                  <th style={{ padding: '12px 16px' }}>IP Address</th>
                  <th style={{ padding: '12px 16px' }}>Browser</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>State Diff</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const actionStyle = getActionStyle(log.action);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => setSelectedLog(isSelected ? null : log)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.userName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.userEmail}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#334155', fontSize: '0.75rem', fontWeight: 700 }}>
                            {log.role}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.82rem' }}>
                            {log.module}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 12, backgroundColor: actionStyle.bg, color: actionStyle.text, fontSize: '0.75rem', fontWeight: 800 }}>
                            {log.action}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', maxWidth: 220 }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.target}
                          </div>
                          {log.targetId && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                              ID: {log.targetId}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <code style={{ fontSize: '0.78rem', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: 4, color: '#475569', fontFamily: 'monospace' }}>
                            {log.ip}
                          </code>
                        </td>

                        <td style={{ padding: '14px 16px', maxWidth: 160 }}>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.browser}>
                            {log.browser.includes('Chrome') ? '🌐 Chrome' : log.browser.includes('Safari') ? '🧭 Safari' : log.browser.includes('Firefox') ? '🦊 Firefox' : '💻 Browser'}
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(isSelected ? null : log);
                            }}
                            style={{
                              padding: '4px 10px',
                              backgroundColor: isSelected ? '#16a34a' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isSelected ? 'Hide Diff ▲' : 'View Diff ▼'}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED ROW: OLD VALUE VS NEW VALUE STATE DIFF */}
                      {isSelected && (
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          <td colSpan={9} style={{ padding: 20, borderBottom: '2px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              
                              {/* OLD VALUE */}
                              <div style={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #fca5a5', padding: 14 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove_circle_outline</span>
                                  OLD VALUE (Pre-Execution State)
                                </div>
                                <pre style={{ fontSize: '0.8rem', backgroundColor: '#fef2f2', padding: 12, borderRadius: 6, color: '#991b1b', overflowX: 'auto', margin: 0, fontFamily: 'monospace' }}>
                                  {formatJSON(log.oldValue)}
                                </pre>
                              </div>

                              {/* NEW VALUE */}
                              <div style={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid #86efac', padding: 14 }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#15803d', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle_outline</span>
                                  NEW VALUE (Post-Execution State)
                                </div>
                                <pre style={{ fontSize: '0.8rem', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 6, color: '#166534', overflowX: 'auto', margin: 0, fontFamily: 'monospace' }}>
                                  {formatJSON(log.newValue)}
                                </pre>
                              </div>

                            </div>

                            <div style={{ marginTop: 12, display: 'flex', gap: 24, fontSize: '0.78rem', color: '#64748b' }}>
                              <span>User Agent Details: <strong style={{ color: '#334155' }}>{log.browser}</strong></span>
                              <span>Timestamp: <strong style={{ color: '#334155' }}>{new Date(log.timestamp).toUTCString()}</strong></span>
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

      {/* MODAL: MANUAL RECORD TEST ENTRY */}
      {showRecordModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Log Manual Audit Test Entry</h3>
              <button onClick={() => setShowRecordModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateManualLog} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Module</label>
                  <select
                    value={manualModule}
                    onChange={(e) => setManualModule(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="Vendors">Vendors</option>
                    <option value="Products">Products</option>
                    <option value="Orders">Orders</option>
                    <option value="Finance">Finance</option>
                    <option value="Support">Support</option>
                    <option value="Settings">Settings</option>
                    <option value="Users">Users</option>
                    <option value="Inventory">Inventory</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Action</label>
                  <select
                    value={manualAction}
                    onChange={(e) => setManualAction(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', backgroundColor: '#ffffff' }}
                  >
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                    <option value="APPROVE">APPROVE</option>
                    <option value="REJECT">REJECT</option>
                    <option value="RELEASE_FUNDS">RELEASE_FUNDS</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Target Description</label>
                <input
                  type="text"
                  placeholder="e.g. Vendor Store #VND-992 (Updated Commission Rate)"
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>Old Value (JSON string / text)</label>
                <textarea
                  rows={2}
                  placeholder='{"commissionRate": 5.0}'
                  value={manualOldValue}
                  onChange={(e) => setManualOldValue(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>New Value (JSON string / text)</label>
                <textarea
                  rows={2}
                  placeholder='{"commissionRate": 4.5}'
                  value={manualNewValue}
                  onChange={(e) => setManualNewValue(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  style={{ padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                >
                  Record Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
