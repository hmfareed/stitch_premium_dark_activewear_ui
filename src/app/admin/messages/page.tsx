'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';

export default function AdminMessagesPage() {
  const { allMessages, allAdmins, allCustomers, sendMessage, broadcastMessage } = useAdmin();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'vendors' | 'all'>('vendors');
  const [activeTab, setActiveTab] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Identify admin emails for filtering
  const adminEmails = new Set(allAdmins.map(a => a.email));
  adminEmails.add('africartsadmin99@gmail.com');
  adminEmails.add('system@africart.com');

  // Super admin's own conversations (only messages TO/FROM super admin)
  const getConversations = () => {
    const convos: Record<string, { email: string; name: string; role: string; lastMsg: string; lastTime: string; unread: number }> = {};

    allMessages.forEach(msg => {
      if (msg.to === 'broadcast_vendors' || msg.to === 'broadcast_all') return;
      // Only include messages where super admin is a participant
      const isSuperAdminMsg = msg.fromRole === 'super_admin' || msg.from === 'africartsadmin99@gmail.com' || msg.from === 'system@africart.com' || msg.to === 'africartsadmin99@gmail.com';
      if (!isSuperAdminMsg) return;

      const partnerEmail = (msg.fromRole === 'super_admin' || msg.from === 'africartsadmin99@gmail.com' || msg.from === 'system@africart.com') ? msg.to : msg.from;
      const partnerName = (msg.fromRole === 'super_admin' || msg.from === 'africartsadmin99@gmail.com' || msg.from === 'system@africart.com') ? msg.toName : msg.fromName;
      const partnerRole = adminEmails.has(partnerEmail) ? 'vendor' : 'customer';

      if (!convos[partnerEmail]) convos[partnerEmail] = { email: partnerEmail, name: partnerName, role: partnerRole, lastMsg: '', lastTime: '', unread: 0 };
      if (!convos[partnerEmail].lastTime || new Date(msg.timestamp) > new Date(convos[partnerEmail].lastTime)) {
        convos[partnerEmail].lastMsg = msg.text;
        convos[partnerEmail].lastTime = msg.timestamp;
      }
      if (!msg.read && msg.fromRole !== 'super_admin') convos[partnerEmail].unread++;
    });

    // Add all users without messages so admin can initiate
    allCustomers.forEach(c => { if (!convos[c.email]) convos[c.email] = { email: c.email, name: c.name, role: adminEmails.has(c.email) ? 'vendor' : 'customer', lastMsg: '', lastTime: '', unread: 0 }; });
    allAdmins.forEach(a => { if (!convos[a.email]) convos[a.email] = { email: a.email, name: a.name, role: 'vendor', lastMsg: '', lastTime: '', unread: 0 }; });

    return Object.values(convos).sort((a, b) => (b.lastTime ? new Date(b.lastTime).getTime() : 0) - (a.lastTime ? new Date(a.lastTime).getTime() : 0));
  };

  // Vendor-customer conversations (messages between vendors and customers, NOT involving super admin)
  const getVendorChats = () => {
    const chats: Record<string, { vendorEmail: string; vendorName: string; customerEmail: string; customerName: string; lastMsg: string; lastTime: string; key: string }> = {};
    allMessages.forEach(msg => {
      if (msg.to === 'broadcast_vendors' || msg.to === 'broadcast_all') return;
      if (msg.fromRole === 'super_admin' || msg.from === 'africartsadmin99@gmail.com' || msg.from === 'system@africart.com' || msg.to === 'africartsadmin99@gmail.com') return;
      // One side must be admin (vendor)
      const isFromVendor = msg.fromRole === 'vendor' || adminEmails.has(msg.from);
      const isToVendor = adminEmails.has(msg.to);
      if (!isFromVendor && !isToVendor) return;
      const vEmail = isFromVendor ? msg.from : msg.to;
      const vName = isFromVendor ? msg.fromName : msg.toName;
      const cEmail = isFromVendor ? msg.to : msg.from;
      const cName = isFromVendor ? msg.toName : msg.fromName;
      const key = `${vEmail}::${cEmail}`;
      if (!chats[key]) chats[key] = { vendorEmail: vEmail, vendorName: vName, customerEmail: cEmail, customerName: cName, lastMsg: '', lastTime: '', key };
      if (!chats[key].lastTime || new Date(msg.timestamp) > new Date(chats[key].lastTime)) {
        chats[key].lastMsg = msg.text;
        chats[key].lastTime = msg.timestamp;
      }
    });
    return Object.values(chats).sort((a, b) => (b.lastTime ? new Date(b.lastTime).getTime() : 0) - (a.lastTime ? new Date(a.lastTime).getTime() : 0));
  };

  const conversations = getConversations();
  const vendorChats = getVendorChats();
  const broadcasts = allMessages.filter(m => m.to === 'broadcast_vendors' || m.to === 'broadcast_all');

  const filteredConvos = activeTab === 'all' ? conversations :
    activeTab === 'broadcasts' || activeTab === 'vendor_chats' ? [] :
      conversations.filter(c => c.role === (activeTab === 'vendors' ? 'vendor' : 'customer'));

  // Messages for selected conversation — only super admin's own thread
  const selectedMessages = selectedConvo ? allMessages.filter(m => {
    if (m.to === 'broadcast_vendors' || m.to === 'broadcast_all') return false;
    // If viewing a vendor chat thread (contains ::)
    if (selectedConvo.includes('::')) {
      const [vE, cE] = selectedConvo.split('::');
      return (m.from === vE && m.to === cE) || (m.from === cE && m.to === vE);
    }
    // Otherwise, super admin's own DM
    const isSA = (e: string) => e === 'africartsadmin99@gmail.com' || e === 'system@africart.com';
    return ((m.from === selectedConvo && (isSA(m.to) || m.to === selectedConvo)) || (m.to === selectedConvo && (isSA(m.from) || m.fromRole === 'super_admin')));
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];

  const selectedPartner = conversations.find(c => c.email === selectedConvo);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedMessages.length]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConvo || !selectedPartner) return;
    sendMessage({
      from: 'africartsadmin99@gmail.com',
      fromName: 'Super Admin',
      fromRole: 'super_admin',
      to: selectedConvo,
      toName: selectedPartner.name,
      text: messageInput.trim(),
    });
    setMessageInput('');
  };

  const handleBroadcast = () => {
    if (!broadcastText.trim()) return;
    broadcastMessage(broadcastText.trim(), broadcastTarget);
    setBroadcastText('');
    setShowBroadcast(false);
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: isMobile ? 80 : 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '8px', color: 'var(--foreground)' }}>Messaging Center</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: isMobile ? '0.85rem' : '1rem' }}>Real-time messages — broadcast to vendors and customers</p>
        </div>
        <button onClick={() => setShowBroadcast(!showBroadcast)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>campaign</span>
          Broadcast
        </button>
      </div>

      {/* Broadcast Panel */}
      {showBroadcast && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: isMobile ? '16px' : '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--foreground)' }}>Send Broadcast Message</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setBroadcastTarget('vendors')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: broadcastTarget === 'vendors' ? 'var(--lime-400)' : 'var(--surface-container)', color: broadcastTarget === 'vendors' ? 'black' : 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
              Vendors Only ({allAdmins.length})
            </button>
            <button onClick={() => setBroadcastTarget('all')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: broadcastTarget === 'all' ? 'var(--lime-400)' : 'var(--surface-container)', color: broadcastTarget === 'all' ? 'black' : 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
              Vendors + Customers ({allAdmins.length + allCustomers.length})
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
            <textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)} placeholder="Type your broadcast message..." rows={3} style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            <button onClick={handleBroadcast} disabled={!broadcastText.trim()} style={{ alignSelf: isMobile ? 'stretch' : 'flex-end', padding: '12px 24px', borderRadius: '8px', backgroundColor: broadcastText.trim() ? 'var(--lime-400)' : 'var(--surface-container)', color: broadcastText.trim() ? 'black' : 'var(--on-surface-variant)', border: 'none', fontWeight: 600, cursor: broadcastText.trim() ? 'pointer' : 'default' }}>
              Send Broadcast
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        height: isMobile ? 'calc(100vh - 250px)' : 'calc(100vh - 300px)', 
        minHeight: '400px', 
        backgroundColor: 'var(--surface)', 
        borderRadius: '16px', 
        border: '1px solid var(--outline)', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Conversation List */}
        <div style={{ 
          width: isMobile ? '100%' : '340px', 
          borderRight: isMobile ? 'none' : '1px solid var(--outline)', 
          display: isMobile && selectedConvo ? 'none' : 'flex', 
          flexDirection: 'column',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--outline)', display: 'flex', gap: '6px', overflowX: 'auto' }} className="no-scrollbar">
            {['all', 'vendors', 'customers', 'vendor_chats', 'broadcasts'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'broadcasts' || tab === 'vendor_chats') setSelectedConvo(null); }} style={{ flex: isMobile ? '0 0 auto' : 1, padding: '8px 12px', borderRadius: '8px', border: 'none', fontSize: '0.78rem', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize', backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface-container)', color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>
                {tab === 'vendor_chats' ? 'Vendor Chats' : tab === 'vendors' ? 'Vendors' : tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'broadcasts' ? (
              broadcasts.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4, marginBottom: '8px', display: 'block' }}>campaign</span>
                  <p style={{ fontSize: '0.85rem' }}>No broadcasts sent yet</p>
                </div>
              ) : (
                broadcasts.slice().reverse().map(b => (
                  <div key={b.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--outline-variant)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--lime-400)' }}>{b.to === 'broadcast_vendors' ? '📢 To Vendors' : '📢 To Everyone'}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{formatDate(b.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--on-surface)', margin: 0, lineHeight: 1.4 }}>{b.text}</p>
                  </div>
                ))
              )
            ) : activeTab === 'vendor_chats' ? (
              vendorChats.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4, marginBottom: '8px', display: 'block' }}>forum</span>
                  <p style={{ fontSize: '0.85rem' }}>No vendor-customer chats yet</p>
                </div>
              ) : (
                vendorChats.map(vc => (
                  <div key={vc.key} onClick={() => setSelectedConvo(vc.key)} style={{ display: 'flex', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--outline-variant)', backgroundColor: selectedConvo === vc.key ? 'var(--surface-container-high)' : 'transparent', transition: 'background-color 0.15s' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'color-mix(in srgb, #00e5ff 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, color: '#00e5ff' }}>
                      {vc.vendorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--foreground)' }}>{vc.vendorName}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{formatTime(vc.lastTime)}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 500, display: 'block', marginBottom: 2 }}>↔ {vc.customerName}</span>
                      <span className="line-clamp-1" style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>{vc.lastMsg}</span>
                    </div>
                  </div>
                ))
              )
            ) : filteredConvos.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4, marginBottom: '8px', display: 'block' }}>chat</span>
                <p style={{ fontSize: '0.85rem' }}>No conversations yet</p>
              </div>
            ) : (
              filteredConvos.map(c => (
                <div key={c.email} onClick={() => setSelectedConvo(c.email)} style={{ display: 'flex', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--outline-variant)', backgroundColor: selectedConvo === c.email ? 'var(--surface-container-high)' : 'transparent', transition: 'background-color 0.15s' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, color: 'var(--foreground)' }}>
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>{c.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{formatTime(c.lastTime)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="line-clamp-1" style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', flex: 1 }}>{c.lastMsg}</span>
                      {c.unread > 0 && <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--lime-400)', color: 'var(--on-lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>{c.unread}</div>}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: c.role === 'vendor' ? '#00e5ff' : 'var(--secondary)', fontWeight: 500 }}>{c.role === 'vendor' ? 'Vendor' : 'Customer'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ 
          flex: 1, 
          display: isMobile && !selectedConvo ? 'none' : 'flex', 
          flexDirection: 'column',
          backgroundColor: 'var(--surface)'
        }}>
          {selectedConvo && selectedPartner ? (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isMobile && (
                    <button onClick={() => setSelectedConvo(null)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                  )}
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>
                    {selectedPartner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{selectedPartner.name}</div>
                    <div style={{ fontSize: '0.78rem', color: selectedPartner.role === 'vendor' ? '#00e5ff' : 'var(--secondary)' }}>{selectedPartner.role === 'vendor' ? 'Vendor' : 'Customer'}</div>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedMessages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
                    <p style={{ fontSize: '0.9rem' }}>No messages in this conversation yet</p>
                  </div>
                ) : selectedMessages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: (m.fromRole === 'super_admin' || (activeTab === 'vendor_chats' && adminEmails.has(m.from))) ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%', padding: '12px 16px', borderRadius: m.fromRole === 'super_admin' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: (m.fromRole === 'super_admin' || (activeTab === 'vendor_chats' && adminEmails.has(m.from))) ? 'var(--lime-400)' : 'var(--surface-container-high)',
                      color: (m.fromRole === 'super_admin' || (activeTab === 'vendor_chats' && adminEmails.has(m.from))) ? 'black' : 'var(--on-surface)',
                    }}>
                      <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{m.text}</div>
                      <div style={{ fontSize: '0.72rem', marginTop: '6px', opacity: 0.7, textAlign: 'right' }}>{formatTime(m.timestamp)}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--outline)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
                <button onClick={handleSend} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: messageInput.trim() ? 'var(--lime-400)' : 'var(--surface-container)', color: messageInput.trim() ? 'black' : 'var(--on-surface-variant)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
              <div style={{ textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>forum</span>
                <p style={{ fontWeight: 500 }}>Select a conversation</p>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>or broadcast a message to admins and customers</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
