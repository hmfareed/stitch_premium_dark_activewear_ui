'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorSupportLiveChatPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/support');
      const data = await res.json();
      if (res.ok) setMessages(data.chatMessages || []);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      const res = await fetch('/api/vendor/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_chat',
          chatText: inputText.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(data.chatMessages || []);
        setInputText('');
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 19 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Support Tickets', path: '/vendor/support/tickets', active: false, icon: 'confirmation_number' },
          { label: 'Live Chat', path: '/vendor/support/chat', active: true, icon: 'chat' },
          { label: 'Knowledge Base', path: '/vendor/support/kb', active: false, icon: 'help' },
          { label: 'Contact Support', path: '/vendor/support/contact', active: false, icon: 'contact_support' },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#ffffff' : '#475569',
              backgroundColor: tab.active ? '#10b981' : '#ffffff',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Live Chat Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', height: 600 }}>
        
        {/* Agent Header */}
        <div style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', backgroundColor: '#061d13', color: '#a3e635', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            KW
            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', backgroundColor: '#16a34a', border: '2px solid #fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Kwesi (AfriCart Merchant Support)</div>
            <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>● Online & Ready to Assist</div>
          </div>
        </div>

        {/* Chat Messages Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: '#10b981' }}>Loading chat history...</div>
          ) : (
            messages.map(m => {
              const isVendor = m.sender === 'vendor';
              return (
                <div key={m.id} style={{ alignSelf: isVendor ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, textAlign: isVendor ? 'right' : 'left' }}>
                    {m.name} • {m.time}
                  </div>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: isVendor ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    backgroundColor: isVendor ? '#10b981' : '#f1f5f9',
                    color: isVendor ? '#ffffff' : '#0f172a',
                    fontSize: 13,
                    lineHeight: 1.4,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type your message to merchant support..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13 }}
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            style={{
              padding: '0 20px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
            Send
          </button>
        </form>

      </div>

    </div>
  );
}
