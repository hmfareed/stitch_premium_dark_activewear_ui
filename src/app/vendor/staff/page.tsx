'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';

interface TeamMember {
  _id: string;
  staffEmail: string;
  staffName?: string;
  role: 'manager';
  permissions: string[];
  status: 'pending' | 'active' | 'revoked';
  invitedAt: string;
}

export default function VendorStaffPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [staffList, setStaffList] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'manage_products',
    'manage_orders'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availablePermissions = [
    { key: 'manage_products', name: 'Manage Products', desc: 'Add, edit, delete products & update stock' },
    { key: 'manage_orders', name: 'Manage Orders', desc: 'Accept/reject orders, print packing slips' },
    { key: 'view_analytics', name: 'View Analytics', desc: 'Access revenue metrics & best sellers' },
    { key: 'manage_promotions', name: 'Manage Promotions', desc: 'Create coupon codes & flash sales' }
  ];

  const fetchStaff = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/vendor-staff?ownerEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
      }
    } catch {
      showToast('Error loading staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const handleTogglePermission = (key: string) => {
    setSelectedPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user?.email) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vendor-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: user.email,
          staffEmail: inviteEmail.trim(),
          permissions: selectedPermissions
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Invitation sent to ${inviteEmail}!`, 'success');
        setInviteEmail('');
        fetchStaff();
      } else {
        showToast(data.error || 'Failed to send invite', 'error');
      }
    } catch {
      showToast('Error sending invite', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke staff access for ${email}?`)) return;
    try {
      const res = await fetch(`/api/vendor-staff?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Access revoked');
        fetchStaff();
      }
    } catch {
      showToast('Error revoking access', 'error');
    }
  };

  const statusColors = {
    pending: '#ff9800',
    active: 'var(--lime-400)',
    revoked: 'var(--error)'
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Staff Accounts</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Invite helper staff and configure their manager access permissions</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Invite Form */}
        <form onSubmit={handleInvite} style={{ flex: '1 1 350px', backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Invite Team Member</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Staff Email Address</label>
            <input
              required
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="helper@yourstore.com"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Permissions Scopes</label>
            {availablePermissions.map(p => (
              <div
                key={p.key}
                onClick={() => handleTogglePermission(p.key)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${selectedPermissions.includes(p.key) ? 'var(--lime-400)' : 'var(--outline)'}`,
                  background: selectedPermissions.includes(p.key) ? 'color-mix(in srgb, var(--lime-400) 6%, transparent)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: selectedPermissions.includes(p.key) ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>
                  {selectedPermissions.includes(p.key) ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <div>
                  <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: selectedPermissions.includes(p.key) ? 'var(--lime-400)' : 'var(--foreground)' }}>{p.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{p.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: '#00e5ff',
              color: 'black',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-lexend)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>

        {/* Staff List */}
        <div style={{ flex: '2 1 450px', backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Active Store Helpers</h3>

          {loading ? (
            <p style={{ color: 'var(--on-surface-variant)' }}>Loading team...</p>
          ) : staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.2, marginBottom: '8px' }}>group</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No helper staff accounts active. Invite your first helper staff above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staffList.map(member => (
                <div key={member._id} style={{ padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{member.staffEmail}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                        backgroundColor: `color-mix(in srgb, ${statusColors[member.status]} 15%, transparent)`,
                        color: statusColors[member.status], textTransform: 'capitalize'
                      }}>{member.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {member.permissions.map(p => (
                        <span key={p} style={{ padding: '2px 8px', background: 'var(--surface-container-high)', border: '1px solid var(--outline)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>
                          {p.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  {member.status !== 'revoked' && (
                    <button
                      onClick={() => handleRevoke(member._id, member.staffEmail)}
                      style={{ padding: '6px 12px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
