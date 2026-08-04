'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useAuth, useStore } from '@/context/AppContext';

export default function VendorMessagesPage() {
  const { allMessages, sendMessage, allOrders } = useAdmin();
  const { user } = useAuth();
  const { followers } = useStore();
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string>('');
  const [input, setInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get unique customers who have messaged or been messaged by this vendor
  const vendorMessages = useMemo(() => {
    if (!user) return [];
    const safeMsgs = Array.isArray(allMessages) ? allMessages : [];
    return safeMsgs.filter(m => m && (m.from === user.email || m.to === user.email));
  }, [allMessages, user]);

  const conversationPartners = useMemo(() => {
    const emails = new Set<string>();
    vendorMessages.forEach(m => {
      if (user && m.from !== user.email) emails.add(m.from);
      if (user && m.to !== user.email && m.to !== 'broadcast_all' && m.to !== 'broadcast_vendors') emails.add(m.to);
    });
    
    const safeFollowers = Array.isArray(followers) ? followers : [];
    const safeOrders = Array.isArray(allOrders) ? allOrders : [];

    // Include followers
    if (user) {
      safeFollowers.filter((f: any) => f && f.vendorEmail === user.email).forEach((f: any) => emails.add(f.userEmail));
      
      // Include purchasers
      safeOrders.filter(o => o && Array.isArray(o.products) && o.products.some(p => p && p.vendorEmail === user.email)).forEach(o => emails.add(o.customerEmail));
    }
    
    return Array.from(emails).map(email => {
      // Try to find name in followers, then orders, then messages
      const follower = safeFollowers.find((f: any) => f && f.userEmail === email);
      const order = allOrders.find(o => o.customerEmail === email);
      const lastMsg = [...vendorMessages].reverse().find(m => m.from === email || m.to === email);
      
      return {
        email,
        name: follower?.userName || order?.customerName || lastMsg?.fromName || lastMsg?.toName || email.split('@')[0],
        msg: lastMsg?.text || 'No messages yet',
        time: lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        timestamp: lastMsg ? new Date(lastMsg.timestamp).getTime() : 0,
        unread: 0, 
        online: false
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [vendorMessages, followers, allOrders, user]);

  const activePartner = conversationPartners.find(p => p.email === selectedCustomerEmail) || (selectedCustomerEmail === '' ? conversationPartners[0] : null);

  const currentMsgs = useMemo(() => {
    if (!selectedCustomerEmail || !user) return [];
    return vendorMessages.filter(m => 
      (m.from === user.email && m.to === selectedCustomerEmail) ||
      (m.from === selectedCustomerEmail && m.to === user.email)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [vendorMessages, selectedCustomerEmail, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMsgs.length]);

  const handleSend = async () => {
    if (!input.trim() || !user || !activePartner) return;
    
    await sendMessage({
      from: user.email,
      fromName: user.name,
      fromRole: 'vendor',
      to: activePartner.email,
      toName: activePartner.name,
      text: input,
    });
    
    setInput('');
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: isMobile ? 80 : 0 }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '8px', color: 'var(--foreground)' }}>Messages</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: isMobile ? '0.85rem' : '1rem' }}>Chat with your customers</p>
      </div>
      <div style={{ 
        display: 'flex', 
        height: isMobile ? 'calc(100vh - 250px)' : 'calc(100vh - 260px)', 
        minHeight: '400px', 
        backgroundColor: 'var(--surface)', 
        borderRadius: '16px', 
        border: '1px solid var(--outline)', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: isMobile ? '100%' : '300px', 
          borderRight: isMobile ? 'none' : '1px solid var(--outline)', 
          overflowY: 'auto',
          display: isMobile && selectedCustomerEmail ? 'none' : 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--outline)' }}>
            <input placeholder="Search customers..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversationPartners.map(p => (
              <div key={p.email} onClick={() => setSelectedCustomerEmail(p.email)} style={{ display: 'flex', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--outline-variant)', backgroundColor: selectedCustomerEmail === p.email ? 'var(--surface-container-high)' : 'transparent', transition: 'background-color 0.2s' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--foreground)' }}>{p.name.split(' ').map(n => n[0]).join('')}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)' }}>{p.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{p.time}</span>
                  </div>
                  <span className="line-clamp-1" style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>{p.msg}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ 
          flex: 1, 
          display: isMobile && !selectedCustomerEmail ? 'none' : 'flex', 
          flexDirection: 'column',
          backgroundColor: 'var(--surface)'
        }}>
          {activePartner ? (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                  <button onClick={() => setSelectedCustomerEmail('')} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                )}
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--foreground)' }}>{activePartner.name.split(' ').map(n => n[0]).join('')}</div>
                <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{activePartner.name}</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentMsgs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--on-surface-variant)' }}>No messages yet. Start the conversation!</div>
                ) : (
                  currentMsgs.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.from === user.email ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '80%', padding: '12px 16px', borderRadius: m.from === user.email ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: m.from === user.email ? 'var(--lime-400)' : 'var(--surface-container-high)', color: m.from === user.email ? 'black' : 'var(--on-surface)' }}>
                        <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{m.text}</div>
                        <div style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--outline)', display: 'flex', gap: '12px' }}>
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..." 
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} 
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: input.trim() ? 'var(--lime-400)' : 'var(--surface-container)', color: input.trim() ? 'black' : 'var(--on-surface-variant)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
              Select a customer to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
