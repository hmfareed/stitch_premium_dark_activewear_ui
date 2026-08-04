'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorActivityLogsPage() {
  const { user } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);
  const [moduleFilter, setModuleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Log Diff Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, searchQuery]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/activity-logs?module=${moduleFilter}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Page Header */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Vendor & Employee Activity Audit Logs
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Complete audit trail of all store operations, POS checkouts, inventory restocks, and settings updates.
            </p>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by user name, action, or IP..."
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, width: 280 }}
          />
        </div>

        {/* Module Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'pos', label: 'POS' },
            { id: 'products', label: 'Products' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'promotions', label: 'Promotions' },
            { id: 'settings', label: 'Settings' },
            { id: 'staff', label: 'Staff' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setModuleFilter(m.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                fontWeight: moduleFilter === m.id ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: moduleFilter === m.id ? '#061d13' : '#ffffff',
                color: moduleFilter === m.id ? '#a3e635' : '#475569',
                whiteSpace: 'nowrap',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Main Audit Log Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading activity audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 42, color: '#cbd5e1', marginBottom: 8 }}>history</span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>No activity logs found matching filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '12px 10px' }}>User & Role</th>
                  <th style={{ padding: '12px 10px' }}>Action</th>
                  <th style={{ padding: '12px 10px' }}>Module</th>
                  <th style={{ padding: '12px 10px' }}>Date & Time</th>
                  <th style={{ padding: '12px 10px' }}>IP Address</th>
                  <th style={{ padding: '12px 10px' }}>Device</th>
                  <th style={{ padding: '12px 10px', textAlign: 'right' }}>Audit Diff</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{l.userName}</div>
                      <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>{l.userRole}</div>
                    </td>

                    <td style={{ padding: '12px 10px', fontWeight: 700, color: '#334155' }}>{l.action}</td>

                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dbeafe', color: '#2563eb', padding: '3px 8px', borderRadius: 6 }}>
                        {l.module.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ padding: '12px 10px', color: '#64748b' }}>{l.date}</td>

                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#475569', fontWeight: 600 }}>
                      🌐 {l.ipAddress}
                    </td>

                    <td style={{ padding: '12px 10px', color: '#64748b' }}>
                      💻 {l.device}
                    </td>

                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedLog(l)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          backgroundColor: '#f1f5f9',
                          color: '#061d13',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        View Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diff Inspection Modal */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 550, width: '100%', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Audit Log Inspection</h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>{selectedLog.action} • {selectedLog.date}</span>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#64748b' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#991b1b' }}>OLD VALUE</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#7f1d1d', marginTop: 4 }}>
                  {selectedLog.oldValue}
                </div>
              </div>

              <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: 14, borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#166534' }}>NEW VALUE</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#14532d', marginTop: 4 }}>
                  {selectedLog.newValue}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setSelectedLog(null)} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#0f172a', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
