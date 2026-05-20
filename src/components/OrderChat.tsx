'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AppContext';

interface Props {
  orderId: string;
  receiverEmail: string;
  onClose: () => void;
}

export const OrderChat: React.FC<Props> = ({ orderId, receiverEmail, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?orderId=${orderId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const messageData = {
      orderId,
      sender: user.email,
      receiver: receiverEmail,
      message: input.trim()
    };

    // Optimistic update
    setMessages(prev => [...prev, { ...messageData, timestamp: new Date(), _id: 'temp-' + Date.now() }]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      const data = await res.json();
      if (!data.success) {
        console.error('Failed to send message:', data.error);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: '24px', width: '90%', maxWidth: '500px', height: '600px',
        display: 'flex', flexDirection: 'column', border: '1px solid var(--outline)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px', background: 'var(--surface-container-high)', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="font-lexend" style={{ fontSize: '1.1rem' }}>Order Support</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>ID: {orderId}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-scrollbar">
          {loading && <p style={{ textAlign: 'center', opacity: 0.5 }}>Loading messages...</p>}
          {!loading && messages.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '100px' }}>No messages yet. Start the conversation!</p>}
          {messages.map((msg, i) => (
            <div key={msg._id || i} style={{
              alignSelf: msg.sender === user?.email ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}>
              <div style={{
                padding: '10px 14px', borderRadius: msg.sender === user?.email ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.sender === user?.email ? '#00e5ff' : 'var(--surface-container-highest)',
                color: msg.sender === user?.email ? '#000' : 'var(--foreground)',
                fontSize: '0.9rem'
              }}>
                {msg.message}
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', marginTop: '4px', textAlign: msg.sender === user?.email ? 'right' : 'left' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} style={{ padding: '16px', background: 'var(--surface-container-high)', borderTop: '1px solid var(--outline)', display: 'flex', gap: '10px' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--foreground)', outline: 'none' }}
          />
          <button type="submit" style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#00e5ff', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
