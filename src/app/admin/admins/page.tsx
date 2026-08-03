'use client';

import React, { useState, useEffect, useCallback } from 'react';

type RoleView = 'admins' | 'managers' | 'support_staff' | 'auditors' | 'developers' | 'all';
type DetailTab = 'overview' | 'sessions' | 'activity';

export default function AdminUsersPage() {
  const [activeRoleView, setActiveRoleView] = useState<RoleView>('admins');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // User Inspection Drawer State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailData, setUserDetailData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal States
  const [modalType, setModalType] = useState<'invite' | 'assign_role' | 'reset_password' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('admin');
  const [formPassword, setFormPassword] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Users List by Role View
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${activeRoleView}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [activeRoleView, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch Full User Details (Overview, Sessions, Activity History)
  const fetchUserDetail = async (id: string) => {
    setSelectedUserId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      if (data.success) {
        setUserDetailData(data);
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Action: Invite User
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          phone: formPhone,
          email: formEmail,
          role: formRole,
          password: formPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchUsers();
      } else {
        alert(data.message || 'Invitation failed');
      }
    } catch (err) {
      console.error('Error inviting user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Assign Role
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_role', role: formRole }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        fetchUsers();
        fetchUserDetail(selectedUserId);
      }
    } catch (err) {
      console.error('Error assigning role:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !formPassword) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', newPassword: formPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormPassword('');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Toggle 2FA
  const handleToggle2FA = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_2fa' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
        if (selectedUserId === userId) fetchUserDetail(userId);
      }
    } catch (err) {
      console.error('Error toggling 2FA:', err);
    }
  };

  // Action: Toggle Status (Suspend / Activate)
  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_status' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchUsers();
        if (selectedUserId === userId) fetchUserDetail(userId);
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  // Action: Revoke Single Session or All Sessions
  const handleRevokeSessions = async (userId: string, sessionId?: string) => {
    try {
      const url = sessionId
        ? `/api/admin/users/${userId}/sessions?sessionId=${sessionId}`
        : `/api/admin/users/${userId}/sessions`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        if (selectedUserId === userId) fetchUserDetail(userId);
      }
    } catch (err) {
      console.error('Error revoking sessions:', err);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormPhone(''); setFormEmail(''); setFormRole('admin'); setFormPassword('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={toastStyle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            User Management Module
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Internal role governance, security policies, 2FA enforcement & active session management
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => { resetForm(); setModalType('invite'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
            <span>+ Invite User</span>
          </button>
        </div>
      </div>

      {/* 5 Sub-Page View Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'admins', label: 'Admins', icon: 'admin_panel_settings' },
            { id: 'managers', label: 'Managers', icon: 'badge' },
            { id: 'support_staff', label: 'Support Staff', icon: 'support_agent' },
            { id: 'auditors', label: 'Auditors', icon: 'fact_check' },
            { id: 'developers', label: 'Developers', icon: 'code' },
            { id: 'all', label: 'All Users', icon: 'group' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveRoleView(tab.id as RoleView)}
              style={{
                border: 'none',
                background: activeRoleView === tab.id ? '#0f172a' : 'transparent',
                color: activeRoleView === tab.id ? '#ffffff' : '#64748b',
                fontWeight: activeRoleView === tab.id ? 800 : 600,
                fontSize: 13,
                padding: '8px 16px',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: 260 }}>
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: 9, fontSize: 18, color: '#94a3b8' }}>
            search
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading user management telemetry...</p>
        </div>
      ) : (

        /* Internal Users Data Table */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Internal Users ({usersList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>User Name & Phone</th>
                  <th style={{ padding: 10 }}>Email Address</th>
                  <th style={{ padding: 10 }}>Assigned Role</th>
                  <th style={{ padding: 10 }}>2FA Security</th>
                  <th style={{ padding: 10 }}>Account Status</th>
                  <th style={{ padding: 10 }}>Last Active</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{u.phone}</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 600, color: '#334155' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#4338ca', '#e0e7ff')}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => handleToggle2FA(u.id)}
                        style={{
                          border: 'none',
                          background: u.twoFactorEnabled ? '#dcfce7' : '#fef3c7',
                          color: u.twoFactorEnabled ? '#166534' : '#b45309',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        {u.twoFactorEnabled ? '2FA ENABLED' : '2FA DISABLED'}
                      </button>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(u.isActive ? '#166534' : '#991b1b', u.isActive ? '#dcfce7' : '#fee2e2')}>
                        {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: '#64748b' }}>
                      {u.lastLoginAt}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {/* Inspection Drawer */}
                        <button
                          onClick={() => fetchUserDetail(u.id)}
                          style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '5px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                        >
                          User Details
                        </button>
                        {/* Suspend / Activate */}
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          style={{ border: 'none', background: u.isActive ? '#fee2e2' : '#dcfce7', color: u.isActive ? '#dc2626' : '#16a34a', padding: '5px 10px', borderRadius: 6, fontWeight: 800, cursor: 'pointer' }}
                        >
                          {u.isActive ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── USER INSPECTION DRAWER ────────────────────────────────────────── */}
      {selectedUserId && userDetailData && (
        <div style={modalBackdropStyle} onClick={() => setSelectedUserId(null)}>
          <div style={drawerContentStyle} onClick={e => e.stopPropagation()}>

            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    {userDetailData.user.name}
                  </h2>
                  <span style={badgeStyle('#4338ca', '#e0e7ff')}>
                    {userDetailData.user.role.toUpperCase()}
                  </span>
                  <span style={badgeStyle(userDetailData.user.isActive ? '#166534' : '#991b1b', userDetailData.user.isActive ? '#dcfce7' : '#fee2e2')}>
                    {userDetailData.user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {userDetailData.user.email} • {userDetailData.user.phone} • Invited by: {userDetailData.user.invitedBy}
                </div>
              </div>

              {/* Drawer Quick Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setFormRole(userDetailData.user.role); setModalType('assign_role'); }} style={{ border: 'none', background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Assign Role
                </button>
                <button onClick={() => setModalType('reset_password')} style={{ border: 'none', background: '#ea580c', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Reset Password
                </button>
                <button onClick={() => handleToggle2FA(selectedUserId)} style={{ border: 'none', background: userDetailData.user.twoFactorEnabled ? '#dc2626' : '#16a34a', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  {userDetailData.user.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </button>
                <button onClick={() => setSelectedUserId(null)} style={closeBtnStyle}>×</button>
              </div>
            </div>

            {/* Sub-Tabs */}
            <div style={{ display: 'flex', gap: 6, padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
              {(['overview', 'sessions', 'activity'] as DetailTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    border: 'none',
                    background: activeTab === tab ? '#1e293b' : '#f1f5f9',
                    color: activeTab === tab ? '#ffffff' : '#64748b',
                    fontWeight: activeTab === tab ? 800 : 600,
                    fontSize: 12,
                    padding: '6px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab === 'sessions' ? 'Session Management' : tab === 'activity' ? 'Activity History' : tab}
                </button>
              ))}
            </div>

            {/* Sub-Tab Contents */}
            <div style={{ paddingTop: 16, overflowY: 'auto', maxHeight: '60vh' }}>
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Assigned Primary Role</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#4338ca', marginTop: 4 }}>{userDetailData.user.role.toUpperCase()}</div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Two-Factor Security (2FA)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: userDetailData.user.twoFactorEnabled ? '#16a34a' : '#d97706', marginTop: 4 }}>
                        {userDetailData.user.twoFactorEnabled ? 'ENFORCED' : 'NOT ENFORCED'}
                      </div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Active Device Sessions</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{userDetailData.sessions.length} sessions</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Session Management */}
              {activeTab === 'sessions' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Active Logged-in Device Sessions ({userDetailData.sessions.length})</h4>
                    {userDetailData.sessions.length > 0 && (
                      <button
                        onClick={() => handleRevokeSessions(selectedUserId)}
                        style={{ border: 'none', background: '#dc2626', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                      >
                        Kill All Sessions
                      </button>
                    )}
                  </div>

                  {userDetailData.sessions.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: 12 }}>No active device sessions found for this user.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {userDetailData.sessions.map((s: any) => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{s.userAgent}</div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>IP: {s.ip} • Created: {s.createdAt} • Expires: {s.expiresAt}</div>
                          </div>
                          <button
                            onClick={() => handleRevokeSessions(selectedUserId, s.id)}
                            style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                          >
                            Revoke Session
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Activity History */}
              {activeTab === 'activity' && (
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>User Activity Audit Logs ({userDetailData.activityHistory.length})</h4>
                  {userDetailData.activityHistory.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: 12 }}>No activity log records recorded yet.</p>
                  ) : (
                    userDetailData.activityHistory.map((l: any) => (
                      <div key={l.id} style={{ fontSize: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{l.action} — {l.target}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>Timestamp: {l.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── MODALS FOR USER ACTIONS ──────────────────────────────────────── */}

      {/* Modal: Invite User */}
      {modalType === 'invite' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Invite Internal User</h3>
            <form onSubmit={handleInviteUser} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Assign Initial Role *</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)} style={inputStyle}>
                  <option value="admin">System Admin</option>
                  <option value="manager">Operations Manager</option>
                  <option value="support_staff">Customer Support Staff</option>
                  <option value="auditor">Compliance & Financial Auditor</option>
                  <option value="developer">Technical Developer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Temporary Password</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="AdminUser123!" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Role */}
      {modalType === 'assign_role' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Reassign User Role</h3>
            <form onSubmit={handleAssignRole} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Select New Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)} style={inputStyle}>
                  <option value="admin">System Admin</option>
                  <option value="manager">Operations Manager</option>
                  <option value="support_staff">Customer Support Staff</option>
                  <option value="auditor">Compliance & Financial Auditor</option>
                  <option value="developer">Technical Developer</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {modalType === 'reset_password' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Reset User Password</h3>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} required minLength={6} placeholder="Enter new password..." style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  background: '#0f172a',
  color: '#38bdf8',
  padding: '12px 20px',
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  fontSize: 13,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #0284c7',
};

const btnPrimaryStyle: React.CSSProperties = {
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondaryStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#475569',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
};

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 6,
  textTransform: 'uppercase',
});

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 20,
  padding: 24,
  width: '100%',
  maxWidth: 520,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

const drawerContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 24,
  padding: 28,
  width: '100%',
  maxWidth: 920,
  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
};

const closeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 24,
  fontWeight: 700,
  color: '#64748b',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  outline: 'none',
};

const statBoxStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 14,
};
