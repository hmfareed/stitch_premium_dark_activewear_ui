'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';

interface TeamMember {
  membershipId: string;
  userId: string;
  name: string;
  phoneNumber: string;
  role: string;
  joinedAt: string;
}

interface Invitation {
  id: string;
  contact: string;
  intendedRole: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
  invitedByName: string;
}

interface SMSLog {
  id: string;
  contact: string;
  message: string;
  link: string;
  sentAt: string;
}

export default function VendorStaffPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Scopes and Stores
  const [activeVendorId, setActiveVendorId] = useState('v_kente');
  const [staffList, setStaffList] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form inputs
  const [invitePhone, setInvitePhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('catalog_editor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SMS Simulator Drawer State
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [isSmsOpen, setIsSmsOpen] = useState(false);

  const stores = [
    { id: 'v_kente', name: '🇬🇭 Kente Village Co. (Bonwire)' },
    { id: 'v_shea', name: '🇬🇭 Northern Shea Organics (Tamale)' },
    { id: 'v_beads', name: '🇬🇭 Accra Bead Artisans (Krobo)' }
  ];

  const roles = [
    { key: 'catalog_editor', name: 'Catalog Editor', desc: 'Add, edit, delete products & update stock' },
    { key: 'order_fulfillment', name: 'Order Fulfillment', desc: 'Accept/reject orders, print packing slips' },
    { key: 'manager', name: 'Store Manager', desc: 'Full access to products, orders, promotions, and settings' },
    { key: 'support', name: 'Customer Support', desc: 'Handle client chats and tickets, hide sales & catalog' }
  ];

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://africart-fareeds-projects-f8be0de6.vercel.app/api/vendors/${activeVendorId}/staff`, {
        headers: {
          'x-bypass-auth': 'africart_secret_bypass_2026',
          'x-vendor-id': activeVendorId
        }
      });
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
        setInvitations(data.invitations || []);
      } else {
        showToast(data.message || 'Error loading staff list', 'error');
      }
    } catch (err) {
      console.error("Error connecting to AfriCart API:", err);
      showToast('Failed to connect to AfriCart database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [activeVendorId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitePhone.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`https://africart-fareeds-projects-f8be0de6.vercel.app/api/vendors/${activeVendorId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bypass-auth': 'africart_secret_bypass_2026',
          'x-vendor-id': activeVendorId
        },
        body: JSON.stringify({
          contact: invitePhone.trim(),
          role: selectedRole
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`SMS Invitation successfully dispatched!`, 'success');
        setInvitePhone('');
        
        // Append to local simulated SMS logs
        const newSMS: SMSLog = {
          id: data.invitation.id,
          contact: invitePhone.trim(),
          message: data.smsSimulated,
          link: data.inviteLink,
          sentAt: new Date().toISOString()
        };
        setSmsLogs(prev => [newSMS, ...prev]);
        setIsSmsOpen(true); // Automatically slide-open simulator drawer!
        
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to dispatch SMS invitation', 'error');
      }
    } catch {
      showToast('Error dispatching SMS invitation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (invitationId: string) => {
    try {
      const res = await fetch(`https://africart-fareeds-projects-f8be0de6.vercel.app/api/vendors/${activeVendorId}/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'x-bypass-auth': 'africart_secret_bypass_2026',
          'x-vendor-id': activeVendorId
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('SMS Invitation resent successfully!', 'success');
        
        const newSMS: SMSLog = {
          id: invitationId,
          contact: data.invitation.contact,
          message: data.smsSimulated,
          link: data.inviteLink,
          sentAt: new Date().toISOString()
        };
        setSmsLogs(prev => [newSMS, ...prev]);
        setIsSmsOpen(true); // Open simulator
        
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to resend invite', 'error');
      }
    } catch {
      showToast('Error resending invite', 'error');
    }
  };

  const handleRevokeInvite = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this pending invitation?')) return;
    try {
      const res = await fetch(`https://africart-fareeds-projects-f8be0de6.vercel.app/api/vendors/${activeVendorId}/invitations/${invitationId}/revoke`, {
        method: 'POST',
        headers: {
          'x-bypass-auth': 'africart_secret_bypass_2026',
          'x-vendor-id': activeVendorId
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Invitation successfully revoked.');
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to revoke invite', 'error');
      }
    } catch {
      showToast('Error revoking invite', 'error');
    }
  };

  const handleRevokeStaff = async (membershipId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from active staff?`)) return;
    try {
      const res = await fetch(`https://africart-fareeds-projects-f8be0de6.vercel.app/api/vendors/${activeVendorId}/staff/${membershipId}`, {
        method: 'DELETE',
        headers: {
          'x-bypass-auth': 'africart_secret_bypass_2026',
          'x-vendor-id': activeVendorId
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Staff membership removed successfully');
        fetchStaff();
      } else {
        showToast(data.message || 'Failed to remove staff', 'error');
      }
    } catch {
      showToast('Error removing staff', 'error');
    }
  };

  const roleColors: Record<string, string> = {
    manager: 'var(--lime-400)',
    catalog_editor: '#00e5ff',
    order_fulfillment: '#7c4dff',
    support: '#26a69a'
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', minHeight: '80vh' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Staff Accounts</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Invite helper staff and configure their manager access permissions</p>
        </div>
        
        {/* Active Store Switcher Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Active Store Dashboard Scope</label>
          <select
            value={activeVendorId}
            onChange={(e) => setActiveVendorId(e.target.value)}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px solid var(--outline)',
              backgroundColor: 'var(--surface)',
              color: 'var(--on-surface)',
              fontFamily: 'var(--font-lexend)',
              fontWeight: 600,
              fontSize: '0.95rem',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '280px'
            }}
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Invite Form */}
        <form onSubmit={handleInvite} style={{ flex: '1 1 350px', backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✉️</span> Invite Team Member
          </h3>

          {/* Phone Number Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Staff Phone Number (MoMo-Linked)</label>
            <input
              required
              type="tel"
              value={invitePhone}
              onChange={e => setInvitePhone(e.target.value)}
              placeholder="e.g. 0241234567 or 0551112222"
              pattern="^[0-9+]{10,15}$"
              title="Please enter a valid Ghana phone number (10-15 digits)"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}> Ghana MoMo numbers are preferred for SMS-based onboarding.</span>
          </div>

          {/* Role selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>Permissions Scopes & Role</label>
            {roles.map(r => (
              <div
                key={r.key}
                onClick={() => setSelectedRole(r.key)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${selectedRole === r.key ? 'var(--lime-400)' : 'var(--outline)'}`,
                  background: selectedRole === r.key ? 'color-mix(in srgb, var(--lime-400) 6%, transparent)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ color: selectedRole === r.key ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>
                  {selectedRole === r.key ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
                <div>
                  <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: selectedRole === r.key ? 'var(--lime-400)' : 'var(--foreground)' }}>{r.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{r.desc}</span>
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
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Dispatching SMS...' : 'Send SMS Invitation'}
          </button>
        </form>

        {/* Staff & Invitations Lists */}
        <div style={{ flex: '2 1 450px', backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Active Store Helpers</h3>

          {loading ? (
            <p style={{ color: 'var(--on-surface-variant)' }}>Fetching active helpers...</p>
          ) : (staffList.length === 0 && invitations.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.2, marginBottom: '8px' }}>group</span>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No helper staff active or invited yet. Dispatch your first invitation above!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Active Members Table list */}
              {staffList.map(member => (
                <div key={member.membershipId} style={{ padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{member.name}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                        backgroundColor: `color-mix(in srgb, var(--lime-400) 15%, transparent)`,
                        color: 'var(--lime-400)', textTransform: 'capitalize'
                      }}>Active</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>📞 {member.phoneNumber}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', background: 'var(--surface-container-high)', border: '1px solid var(--outline)', borderRadius: '6px', fontSize: '0.7rem', color: roleColors[member.role] || 'var(--on-surface-variant)', fontWeight: 600 }}>
                        🔑 {member.role.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeStaff(member.membershipId, member.name)}
                    style={{ padding: '6px 12px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                  >
                    Revoke
                  </button>
                </div>
              ))}

              {/* Pending Invitations list */}
              {invitations.map(invite => (
                <div key={invite.id} style={{ padding: '16px', backgroundColor: 'color-mix(in srgb, #ff9800 4%, var(--surface-container))', borderRadius: '12px', border: '1px solid color-mix(in srgb, #ff9800 30%, var(--outline-variant))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>📞 {invite.contact}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                        backgroundColor: 'rgba(255, 152, 0, 0.15)',
                        color: '#ff9800', textTransform: 'capitalize'
                      }}>{invite.status}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>Invited by: {invite.invitedByName}</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', background: 'var(--surface-container-high)', border: '1px solid var(--outline)', borderRadius: '6px', fontSize: '0.7rem', color: roleColors[invite.intendedRole] || 'var(--on-surface-variant)', fontWeight: 600 }}>
                        🔑 {invite.intendedRole.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {invite.status === 'pending' && (
                      <button
                        onClick={() => handleResend(invite.id)}
                        style={{ padding: '6px 12px', border: '1px solid var(--lime-400)', background: 'transparent', color: 'var(--lime-400)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                      >
                        Resend SMS
                      </button>
                    )}
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      style={{ padding: '6px 12px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 📲 SMS SIMULATOR DRAWING COMPONENT PANEL */}
      {/* ============================================================== */}
      
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsSmsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: '#ff9800',
          color: 'black',
          padding: '12px 24px',
          borderRadius: '50px',
          border: 'none',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          fontFamily: 'var(--font-lexend)',
          transition: 'all 0.2s ease'
        }}
      >
        <span className="material-symbols-outlined">sms</span>
        <span>📲 SMS Simulator ({smsLogs.length})</span>
      </button>

      {/* Simulator Drawer Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: isSmsOpen ? 0 : '-420px',
        width: '400px',
        height: '100vh',
        backgroundColor: '#0c0f12',
        borderLeft: '1px solid var(--outline)',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
        zIndex: 9998,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '30px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="font-lexend" style={{ fontSize: '1.3rem', margin: 0, color: '#ff9800' }}>📲 SMS Gateway Simulation</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Mimicking Hubtel & mNotify SMS APIs</p>
          </div>
          <button
            onClick={() => setIsSmsOpen(false)}
            style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Simulated Phone Screen */}
        <div style={{
          flex: 1,
          borderRadius: '32px',
          border: '12px solid #2d3748',
          backgroundColor: '#1a202c',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
        }}>
          
          {/* Phone Top Speaker/Camera notch */}
          <div style={{
            height: '24px',
            backgroundColor: '#2d3748',
            width: '120px',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
            zIndex: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: '#1a202c' }}></div>
          </div>

          {/* Simulated Phone Content Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '36px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {smsLogs.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#718096', textAlign: 'center', padding: '20px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>sms_failed</span>
                <span style={{ fontSize: '0.85rem' }}>No SMS dispatches simulated yet. Send a staff invitation to watch messages appear here in real-time!</span>
              </div>
            ) : (
              smsLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#a0aec0', alignSelf: 'center', margin: '4px 0' }}>
                    {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {/* SMS Bubble */}
                  <div style={{
                    backgroundColor: '#2d3748',
                    color: 'white',
                    padding: '14px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: '4px',
                    maxWidth: '85%',
                    alignSelf: 'flex-start',
                    fontSize: '0.85rem',
                    lineHeight: '1.4',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    border: '1px solid #4a5568'
                  }}>
                    <strong style={{ display: 'block', fontSize: '0.75rem', color: '#ff9800', marginBottom: '4px' }}>💬 Hubtel Gateway</strong>
                    {log.message}
                    
                    {/* Onboarding Button Link */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid #4a5568', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                      <a
                        href={log.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#00e5ff',
                          color: 'black',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                        }}
                      >
                        <span>Open Link</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>

    </div>
  );
}
