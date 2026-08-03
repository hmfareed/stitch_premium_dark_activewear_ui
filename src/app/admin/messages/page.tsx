'use client';

import React, { useState, useEffect, useCallback } from 'react';

type SubView = 'dispatch' | 'history' | 'messages';

export default function AdminNotificationsPage() {
  const [subView, setSubView] = useState<SubView>('dispatch');
  const [loading, setLoading] = useState(true);
  const [dispatchesList, setDispatchesList] = useState<any[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<any>({ allVendors: 0, customers: 0, staff: 0 });
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Dispatch Form States
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  
  // 4 Channels Checkboxes State
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSMS, setChannelSMS] = useState(false);
  const [channelPush, setChannelPush] = useState(false);

  // 4 Recipient Audiences State
  const [recipientAudience, setRecipientAudience] = useState<'all_vendors' | 'selected_vendors' | 'customers' | 'staff'>('all_vendors');
  const [selectedVendorEmails, setSelectedVendorEmails] = useState<string[]>([]);
  
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) {
        setDispatchesList(data.dispatches || []);
        setAudienceCounts(data.audienceCounts || {});
        setVendorsList(data.vendorsList || []);
        setStaffList(data.staffList || []);
      }
    } catch (err) {
      console.error('Error fetching notifications data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action: Dispatch Multi-Channel Notification
  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedChannels: string[] = [];
    if (channelInApp) selectedChannels.push('in_app');
    if (channelEmail) selectedChannels.push('email');
    if (channelSMS) selectedChannels.push('sms');
    if (channelPush) selectedChannels.push('push');

    if (selectedChannels.length === 0) {
      alert('Please select at least one notification channel (In-app, Email, SMS, or Push)');
      return;
    }

    if (recipientAudience === 'selected_vendors' && selectedVendorEmails.length === 0) {
      alert('Please select at least one target vendor from the list');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          message: formMessage,
          channels: selectedChannels,
          recipientAudience,
          selectedVendorEmails,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setFormTitle('');
        setFormMessage('');
        setSelectedVendorEmails([]);
        fetchData();
      } else {
        alert(data.message || 'Dispatch failed');
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete Dispatch Log
  const handleDeleteDispatch = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Delete dispatch error:', err);
    }
  };

  const toggleVendorSelection = (email: string) => {
    if (selectedVendorEmails.includes(email)) {
      setSelectedVendorEmails(selectedVendorEmails.filter(e => e !== email));
    } else {
      setSelectedVendorEmails([...selectedVendorEmails, email]);
    }
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

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Multi-Channel Notification Dispatch Hub
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Broadcast alerts across In-app, Email, SMS & Push Notifications to All Vendors, Selected Vendors, Customers & Staff
          </p>
        </div>
      </div>

      {/* Audience Target Telemetry Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>All Registered Vendors</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>{audienceCounts.allVendors} Partners</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Registered Customers</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{audienceCounts.customers} Buyers</div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Internal Staff & Support</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>{audienceCounts.staff} Accounts</div>
        </div>
      </div>

      {/* Navigation Sub-View Tabs */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        {[
          { id: 'dispatch', label: 'Multi-Channel Dispatcher', icon: 'campaign' },
          { id: 'history', label: 'Broadcast Dispatch History', icon: 'history' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubView(tab.id as SubView)}
            style={{
              border: 'none',
              background: subView === tab.id ? '#0f172a' : 'transparent',
              color: subView === tab.id ? '#ffffff' : '#64748b',
              fontWeight: subView === tab.id ? 800 : 600,
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

      {/* Main Content Area */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading notification engine telemetry...</p>
        </div>
      ) : subView === 'dispatch' ? (

        /* SUB-VIEW 1: MULTI-CHANNEL DISPATCHER FORM */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          
          {/* Dispatch Form Card */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Create Broadcast Notification</h3>
            <form onSubmit={handleDispatchNotification} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label style={labelStyle}>Notification Title / Subject *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Platform Maintenance & Payout Schedule Update"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Notification Message Body *</label>
                <textarea
                  rows={4}
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  placeholder="Type message content delivered to selected channels..."
                  required
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {/* 4 Delivery Channels Selector */}
              <div>
                <label style={labelStyle}>1. Delivery Channels (Select 1 or more) *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                  <label style={channelCheckboxStyle(channelInApp)}>
                    <input type="checkbox" checked={channelInApp} onChange={e => setChannelInApp(e.target.checked)} />
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#2563eb' }}>notifications</span>
                    <span>In-app Alert</span>
                  </label>
                  <label style={channelCheckboxStyle(channelEmail)}>
                    <input type="checkbox" checked={channelEmail} onChange={e => setChannelEmail(e.target.checked)} />
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ea580c' }}>mail</span>
                    <span>Email Broadcast</span>
                  </label>
                  <label style={channelCheckboxStyle(channelSMS)}>
                    <input type="checkbox" checked={channelSMS} onChange={e => setChannelSMS(e.target.checked)} />
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#16a34a' }}>sms</span>
                    <span>SMS Mobile Text</span>
                  </label>
                  <label style={channelCheckboxStyle(channelPush)}>
                    <input type="checkbox" checked={channelPush} onChange={e => setChannelPush(e.target.checked)} />
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#7c3aed' }}>send_to_mobile</span>
                    <span>Push Notification</span>
                  </label>
                </div>
              </div>

              {/* 4 Recipient Audiences Selector */}
              <div>
                <label style={labelStyle}>2. Recipient Audience Target *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
                  {[
                    { id: 'all_vendors', label: 'All Vendors', count: audienceCounts.allVendors },
                    { id: 'selected_vendors', label: 'Selected Vendors', count: selectedVendorEmails.length },
                    { id: 'customers', label: 'Customers', count: audienceCounts.customers },
                    { id: 'staff', label: 'Internal Staff', count: audienceCounts.staff },
                  ].map(aud => (
                    <button
                      type="button"
                      key={aud.id}
                      onClick={() => setRecipientAudience(aud.id as any)}
                      style={{
                        background: recipientAudience === aud.id ? '#0f172a' : '#f8fafc',
                        color: recipientAudience === aud.id ? '#ffffff' : '#475569',
                        fontWeight: recipientAudience === aud.id ? 800 : 600,
                        fontSize: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        border: recipientAudience === aud.id ? '1px solid #0f172a' : '1px solid #cbd5e1',
                      }}
                    >
                      <span>{aud.label}</span>
                      <span style={{ fontSize: 10, background: recipientAudience === aud.id ? '#334155' : '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                        {aud.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={actionLoading} style={{ ...btnPrimaryStyle, width: '100%', justifyContent: 'center', padding: 12, marginTop: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
                <span>Dispatch Broadcast Notification</span>
              </button>

            </form>
          </div>

          {/* Selected Vendor Picker Drawer (when Selected Vendors is targeted) */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
              {recipientAudience === 'selected_vendors' ? `Target Vendor Picker (${selectedVendorEmails.length} Selected)` : 'Audience Target Overview'}
            </h3>
            
            {recipientAudience === 'selected_vendors' ? (
              <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {vendorsList.map((v, idx) => {
                  const isSelected = selectedVendorEmails.includes(v.vendorEmail);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleVendorSelection(v.vendorEmail)}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        background: isSelected ? '#dcfce7' : '#f8fafc',
                        border: isSelected ? '1px solid #16a34a' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{v.storeName}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{v.vendorEmail}</div>
                      </div>
                      <span className="material-symbols-outlined" style={{ color: isSelected ? '#16a34a' : '#cbd5e1' }}>
                        {isSelected ? 'check_box' : 'checkbox_outline_blank'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div><strong>Current Target Audience:</strong> <span style={{ color: '#2563eb', fontWeight: 800, textTransform: 'uppercase' }}>{recipientAudience.replace('_', ' ')}</span></div>
                <div><strong>Estimated Recipients:</strong> {recipientAudience === 'all_vendors' ? audienceCounts.allVendors : recipientAudience === 'customers' ? audienceCounts.customers : audienceCounts.staff} Active Accounts</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>
                  Selecting <strong>Selected Vendors</strong> lets you check individual vendor stores from the list to target specific partners.
                </div>
              </div>
            )}

          </div>

        </div>

      ) : (

        /* SUB-VIEW 2: BROADCAST DISPATCH HISTORY */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Broadcast Dispatch History Log ({dispatchesList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Notification Title & ID</th>
                  <th style={{ padding: 10 }}>Channels</th>
                  <th style={{ padding: 10 }}>Target Audience</th>
                  <th style={{ padding: 10 }}>Recipients Delivered</th>
                  <th style={{ padding: 10 }}>Dispatch Date</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dispatchesList.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.title}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>ID: {d.dispatchId}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {d.channels?.map((ch: string, cIdx: number) => (
                          <span key={cIdx} style={badgeStyle('#2563eb', '#dbeafe')}>
                            {ch.toUpperCase().replace('_', '-')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#7c3aed', '#f3e8ff')}>{d.recipientAudience.replace('_', ' ').toUpperCase()}</span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>
                      {d.sentCount} Recipients
                    </td>
                    <td style={{ padding: 12, color: '#64748b' }}>{d.createdAt}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <button onClick={() => handleDeleteDispatch(d.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      )}

    </div>
  );
}

// Helpers
const channelCheckboxStyle = (checked: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 10,
  background: checked ? '#f0f9ff' : '#ffffff',
  border: checked ? '1px solid #0284c7' : '1px solid #cbd5e1',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  color: checked ? '#0369a1' : '#475569',
});

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 18,
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

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 6,
  textTransform: 'uppercase',
});

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
