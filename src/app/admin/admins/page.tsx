'use client';

import React, { useState } from 'react';
import { useAdmin, AdminUser } from '@/context/AdminContext';

export default function AdminsPage() {
  const { allAdmins, allApplications, addAdmin, updateAdminStatus, removeAdmin, approveApplication, rejectApplication } = useAdmin();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminUser['role']>('Vendor Admin');
  const [newStoreName, setNewStoreName] = useState('');
  const [activeTab, setActiveTab] = useState<'admins' | 'applications'>('admins');

  const pendingApps = allApplications.filter(a => a.status === 'pending');

  const handleAdd = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    addAdmin({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      status: 'Active',
      storeName: newRole === 'Vendor Admin' ? newStoreName.trim() || undefined : undefined,
    });
    setNewName('');
    setNewEmail('');
    setNewStoreName('');
    setShowAddForm(false);
  };

  const statusColors: Record<string, string> = { Active: 'var(--lime-400)', Pending: 'var(--secondary)', Suspended: 'var(--error)' };

  const activeCount = allAdmins.filter(a => a.status === 'Active').length;
  const suspendedCount = allAdmins.filter(a => a.status === 'Suspended').length;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Admin & Vendor Management</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Manage platform access and review new vendor applications</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'var(--on-primary-container)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add New Admin
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Add New Admin / Vendor</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
            </div>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Email</label>
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
            </div>
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as AdminUser['role'])} style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }}>
                <option>Vendor Admin</option>
                <option>Support Admin</option>
                <option>Finance Admin</option>
                <option>Super Admin</option>
              </select>
            </div>
            {newRole === 'Vendor Admin' && (
              <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>Store Name</label>
                <input value={newStoreName} onChange={e => setNewStoreName(e.target.value)} placeholder="Store name" style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }} />
              </div>
            )}
            <button onClick={handleAdd} style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'var(--on-primary-container)', border: 'none', fontWeight: 600, cursor: 'pointer', height: '46px' }}>
              Add Admin
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Admins', val: allAdmins.length, color: 'var(--lime-400)' },
          { label: 'Active', val: activeCount, color: 'var(--lime-400)' },
          { label: 'Suspended', val: suspendedCount, color: 'var(--error)' },
          { label: 'Pending Apps', val: pendingApps.length, color: '#00e5ff' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 160px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>{s.label}</div>
            <div className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 600, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setActiveTab('admins')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: activeTab === 'admins' ? 600 : 400, cursor: 'pointer', backgroundColor: activeTab === 'admins' ? 'var(--lime-400)' : 'var(--surface)', color: activeTab === 'admins' ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
          Current Admins ({allAdmins.length})
        </button>
        <button onClick={() => setActiveTab('applications')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: activeTab === 'applications' ? 600 : 400, cursor: 'pointer', backgroundColor: activeTab === 'applications' ? 'var(--lime-400)' : 'var(--surface)', color: activeTab === 'applications' ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Vendor Applications
          {pendingApps.length > 0 && <span style={{ backgroundColor: 'var(--error)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{pendingApps.length}</span>}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        {activeTab === 'admins' ? (
          allAdmins.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.4 }}>shield_person</span>
              <p style={{ fontSize: '1rem', marginBottom: '4px', fontWeight: 500 }}>No admins or vendors added yet</p>
              <p style={{ fontSize: '0.85rem' }}>Click &quot;Add New Admin&quot; to grant admin access to someone.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>ID</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Name</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Email</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Role</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Store</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Added</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allAdmins.map((admin, idx) => (
                    <tr key={admin.id} style={{ borderBottom: idx !== allAdmins.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>{admin.id}</td>
                      <td style={{ padding: '16px 24px', fontWeight: 500 }}>{admin.name}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{admin.email}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{admin.role}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{admin.storeName || '—'}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: `color-mix(in srgb, ${statusColors[admin.status]} 20%, transparent)`, color: statusColors[admin.status] }}>{admin.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{admin.createdAt}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {admin.status === 'Active' && (
                            <button onClick={() => updateAdminStatus(admin.id, 'Suspended')} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Suspend">
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>block</span>
                            </button>
                          )}
                          {admin.status === 'Suspended' && (
                            <button onClick={() => updateAdminStatus(admin.id, 'Active')} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reactivate">
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_open</span>
                            </button>
                          )}
                          <button onClick={() => removeAdmin(admin.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Remove">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Applications Tab */
          allApplications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.4 }}>inbox</span>
              <p style={{ fontSize: '1rem', marginBottom: '4px', fontWeight: 500 }}>No applications yet</p>
              <p style={{ fontSize: '0.85rem' }}>When users apply at /admin/apply, their applications will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {allApplications.map((app, idx) => (
                <div key={app.id} style={{ padding: '24px', borderBottom: idx !== allApplications.length - 1 ? '1px solid var(--outline)' : 'none', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{app.name}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{app.role}</span>
                        {app.status === 'pending' && <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)', color: '#00e5ff', fontWeight: 600 }}>Needs Review</span>}
                        {app.status === 'approved' && <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)', fontWeight: 600 }}>Approved</span>}
                        {app.status === 'rejected' && <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', fontWeight: 600 }}>Rejected</span>}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Applied on {app.appliedAt}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>email</span> {app.email}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>phone</span> {app.phone}</div>
                      {app.storeName && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>storefront</span> {app.storeName}</div>}
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-container)', padding: '16px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Applying</p>
                      <p style={{ fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>&quot;{app.reason}&quot;</p>
                    </div>
                  </div>

                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '140px', flexShrink: 0 }}>
                      <button onClick={() => approveApplication(app.id)} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check</span>
                        Approve
                      </button>
                      <button onClick={() => rejectApplication(app.id)} style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
