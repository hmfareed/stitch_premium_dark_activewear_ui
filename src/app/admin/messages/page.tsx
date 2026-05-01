'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';

export default function AdminMessagesPage() {
  const { allMessages, allAdmins, allCustomers, sendMessage, broadcastMessage } = useAdmin();
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'admins' | 'all'>('admins');
  const [activeTab, setActiveTab] = useState('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Build unique conversation partners from existing messages + all registered accounts
  const getConversations = () => {
    const convos: Record<string, { email: string; name: string; role: string; lastMsg: string; lastTime: string; unread: number }> = {};

    // Pre-populate with all registered customers
    allCustomers.forEach(c => {
      convos[c.email] = { email: c.email, name: c.name, role: 'customer', lastMsg: '', lastTime: '', unread: 0 };
    });

    // Pre-populate with all admins
    allAdmins.forEach(a => {
      convos[a.email] = { email: a.email, name: a.name, role: 'admin', lastMsg: '', lastTime: '', unread: 0 };
    });

    allMessages.forEach(msg => {
      // Skip broadcasts for convo list — they show as special items
      if (msg.to === 'broadcast_admins' || msg.to === 'broadcast_all') return;

      const partnerEmail = msg.fromRole === 'super_admin' ? msg.to : msg.from;
      const partnerName = msg.fromRole === 'super_admin' ? msg.toName : msg.fromName;
      const partnerRole = msg.fromRole === 'super_admin' ? 'admin' : msg.fromRole;

      if (!convos[partnerEmail]) {
        convos[partnerEmail] = { email: partnerEmail, name: partnerName, role: partnerRole, lastMsg: '', lastTime: '', unread: 0 };
      }
      if (!convos[partnerEmail].lastTime || new Date(msg.timestamp) > new Date(convos[partnerEmail].lastTime)) {
        convos[partnerEmail].lastMsg = msg.text;
        convos[partnerEmail].lastTime = msg.timestamp;
      }
      if (!msg.read && msg.fromRole !== 'super_admin') convos[partnerEmail].unread++;
    });

    return Object.values(convos).sort((a, b) => {
      const timeA = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const timeB = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return timeB - timeA;
    });
  };

  const conversations = getConversations();
  const broadcasts = allMessages.filter(m => m.to === 'broadcast_admins' || m.to === 'broadcast_all');

  const filteredConvos = activeTab === 'all' ? conversations :
    activeTab === 'broadcasts' ? [] :
    conversations.filter(c => c.role === (activeTab === 'admins' ? 'admin' : 'customer'));

  // Messages for selected conversation
  const selectedMessages = selectedConvo ? allMessages.filter(m =>
    (m.from === selectedConvo || m.to === selectedConvo) &&
    m.to !== 'broadcast_admins' && m.to !== 'broadcast_all'
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];

  const selectedPartner = conversations.find(c => c.email === selectedConvo);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedMessages.length]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedConvo || !selectedPartner) return;
    sendMessage({
      from: 'super_admin@reed.com',
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
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Messaging Center</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Real-time messages from admins — broadcast to everyone</p>
        </div>
        <button onClick={() => setShowBroadcast(!showBroadcast)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'var(--on-primary-container)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>campaign</span>
          Broadcast
        </button>
      </div>

      {/* Broadcast Panel */}
      {showBroadcast && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Send Broadcast Message</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setBroadcastTarget('admins')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: broadcastTarget === 'admins' ? 'var(--lime-400)' : 'var(--surface-container)', color: broadcastTarget === 'admins' ? 'black' : 'var(--on-surface-variant)' }}>
              Admins Only ({allAdmins.length})
            </button>
            <button onClick={() => setBroadcastTarget('all')} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', backgroundColor: broadcastTarget === 'all' ? 'var(--lime-400)' : 'var(--surface-container)', color: broadcastTarget === 'all' ? 'black' : 'var(--on-surface-variant)' }}>
              Admins + Customers ({allAdmins.length + allCustomers.length})
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)} placeholder="Type your broadcast message..." rows={3} style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            <button onClick={handleBroadcast} disabled={!broadcastText.trim()} style={{ alignSelf: 'flex-end', padding: '12px 24px', borderRadius: '8px', backgroundColor: broadcastText.trim() ? 'var(--lime-400)' : 'var(--surface-container)', color: broadcastText.trim() ? 'black' : 'var(--on-surface-variant)', border: 'none', fontWeight: 600, cursor: broadcastText.trim() ? 'pointer' : 'default' }}>
              Send
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', height: 'calc(100vh - 300px)', minHeight: '400px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        {/* Conversation List */}
        <div style={{ width: '340px', borderRight: '1px solid var(--outline)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--outline)', display: 'flex', gap: '6px' }}>
            {['all', 'admins', 'customers', 'broadcasts'].map(tab => (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'broadcasts') setSelectedConvo(null); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', fontSize: '0.78rem', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize', backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface-container)', color: activeTab === tab ? 'black' : 'var(--on-surface-variant)' }}>
                {tab}
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
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--lime-400)' }}>{b.to === 'broadcast_admins' ? '📢 To Admins' : '📢 To Everyone'}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{formatDate(b.timestamp)}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--on-surface)', margin: 0, lineHeight: 1.4 }}>{b.text}</p>
                  </div>
                ))
              )
            ) : filteredConvos.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.4, marginBottom: '8px', display: 'block' }}>chat</span>
                <p style={{ fontSize: '0.85rem' }}>No conversations yet</p>
                <p style={{ fontSize: '0.78rem' }}>When admins message you, conversations will appear here.</p>
              </div>
            ) : (
              filteredConvos.map(c => (
                <div key={c.email} onClick={() => setSelectedConvo(c.email)} style={{ display: 'flex', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--outline-variant)', backgroundColor: selectedConvo === c.email ? 'var(--surface-container-high)' : 'transparent', transition: 'background-color 0.15s' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                    {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{formatTime(c.lastTime)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="line-clamp-1" style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', flex: 1 }}>{c.lastMsg}</span>
                      {c.unread > 0 && <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--lime-400)', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>{c.unread}</div>}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: c.role === 'admin' ? '#00e5ff' : 'var(--secondary)', fontWeight: 500 }}>{c.role === 'admin' ? 'Admin' : 'Customer'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConvo && selectedPartner ? (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                    {selectedPartner.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedPartner.name}</div>
                    <div style={{ fontSize: '0.78rem', color: selectedPartner.role === 'admin' ? '#00e5ff' : 'var(--secondary)' }}>{selectedPartner.role === 'admin' ? 'Admin' : 'Customer'}</div>
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedMessages.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
                    <p style={{ fontSize: '0.9rem' }}>No messages in this conversation yet</p>
                  </div>
                ) : selectedMessages.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.fromRole === 'super_admin' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '65%', padding: '12px 16px', borderRadius: m.fromRole === 'super_admin' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: m.fromRole === 'super_admin' ? 'var(--lime-400)' : 'var(--surface-container-high)',
                      color: m.fromRole === 'super_admin' ? 'black' : 'var(--on-surface)',
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
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
