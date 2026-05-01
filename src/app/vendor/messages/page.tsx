'use client';
import React, { useState } from 'react';

export default function VendorMessagesPage() {
  const [selected, setSelected] = useState('1');
  const [input, setInput] = useState('');
  const convos = [
    { id: '1', name: 'Alex Johnson', msg: 'When will my order arrive?', time: '5m ago', unread: 2, online: true },
    { id: '2', name: 'Sarah Williams', msg: 'Thanks for the quick shipping!', time: '1h ago', unread: 0, online: false },
    { id: '3', name: 'Michael Chen', msg: 'Can I get size XL?', time: '3h ago', unread: 1, online: true },
    { id: '4', name: 'Super Admin', msg: 'Commission update for May', time: '1d ago', unread: 0, online: true },
  ];
  const msgs = [
    { sender: 'them', text: 'Hi! I ordered the AeroFlex Tee 3 days ago. When will it arrive?', time: '10:15 AM' },
    { sender: 'me', text: 'Hi Alex! Your order ORD-1042 was shipped yesterday. Tracking: TRK-8834.', time: '10:18 AM' },
    { sender: 'them', text: 'Great, thanks! When will my order arrive?', time: '10:20 AM' },
  ];
  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div><h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Messages</h1><p style={{ color: 'var(--on-surface-variant)' }}>Chat with your customers</p></div>
      <div style={{ display: 'flex', height: 'calc(100vh - 260px)', minHeight: '400px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <div style={{ width: '300px', borderRight: '1px solid var(--outline)', overflowY: 'auto' }}>
          <div style={{ padding: '16px' }}><input placeholder="Search..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} /></div>
          {convos.map(c => (
            <div key={c.id} onClick={() => setSelected(c.id)} style={{ display: 'flex', gap: '12px', padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--outline-variant)', backgroundColor: selected === c.id ? 'var(--surface-container-high)' : 'transparent' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>{c.name.split(' ').map(n => n[0]).join('')}</div>
                {c.online && <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--lime-400)', border: '2px solid var(--surface)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span><span style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)' }}>{c.time}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="line-clamp-1" style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>{c.msg}</span>
                  {c.unread > 0 && <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#00e5ff', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{c.unread}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', fontWeight: 600 }}>{convos.find(c => c.id === selected)?.name}</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.sender === 'me' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '60%', padding: '12px 16px', borderRadius: m.sender === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: m.sender === 'me' ? '#00e5ff' : 'var(--surface-container-high)', color: m.sender === 'me' ? 'black' : 'var(--on-surface)' }}>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{m.text}</div>
                  <div style={{ fontSize: '0.72rem', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--outline)', display: 'flex', gap: '12px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
            <button style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#00e5ff', color: 'black', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: '22px' }}>send</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
