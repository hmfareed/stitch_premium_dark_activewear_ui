'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<{ id: string, text: string, isUser: boolean, timestamp: string }[]>([
    { id: '1', text: 'Hi there! I am STITCH, your personal AI styling and support assistant. How can I help you today?', isUser: false, timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isChatOpen]);

  const faqs = [
    { q: 'How do I track my order?', a: 'You can track your order in the "My Orders" section of your account.' },
    { q: 'What is your return policy?', a: 'We accept returns within 30 days of purchase for a full refund.' },
    { q: 'How do I contact customer service?', a: 'You can email us at support@africart.com or call 1-800-AFRI-CRT.' },
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), text: input.trim(), isUser: true, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Smart AI Logic Simulation
    setTimeout(() => {
      let aiResponse = "I'm still learning! If you need further assistance, our human agents are available via support@stitch.com.";
      const lowerInput = userMessage.text.toLowerCase();

      if (lowerInput.includes('track') || lowerInput.includes('order') || lowerInput.includes('status')) {
        aiResponse = "I can definitely help with that! Could you please provide your Order ID (e.g., ORD-12345)? Alternatively, you can instantly check the 'My Orders' tab in your account for real-time updates.";
      } else if (lowerInput.includes('return') || lowerInput.includes('refund') || lowerInput.includes('exchange')) {
        aiResponse = "Our return policy allows returns within 30 days of delivery. Items must be unworn and in their original packaging with tags attached. Would you like me to guide you to the returns portal?";
      } else if (lowerInput.includes('shipping') || lowerInput.includes('delivery') || lowerInput.includes('ship')) {
        aiResponse = "We offer standard delivery (3-5 business days) and expedited delivery (1-2 business days). Great news: all orders over GH₵500 automatically qualify for free standard shipping!";
      } else if (lowerInput.includes('size') || lowerInput.includes('fit') || lowerInput.includes('measure')) {
        aiResponse = "Our activewear is generally true to size. For our high-compression seamless leggings, we recommend sizing up if you prefer a less restrictive fit. You can find our detailed Size Guide on any product page.";
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput.trim() === 'hi' || lowerInput.includes('hey')) {
        aiResponse = "Hello! 👋 I'm STITCH AI. I'm here to help you find the perfect workout gear, track your orders, or answer any questions you have. How can I assist you today?";
      } else if (lowerInput.includes('thank')) {
         aiResponse = "You're very welcome! If you need anything else, I'm right here. Happy shopping and have a great workout!";
      } else if (lowerInput.includes('cancel')) {
        aiResponse = "I understand you'd like to cancel an order. Orders can be cancelled instantly from the 'My Orders' page if they haven't shipped yet. Let me know if you need help finding that!";
      } else if (lowerInput.includes('contact') || lowerInput.includes('human') || lowerInput.includes('agent')) {
        aiResponse = "I can connect you with a human agent! Please email support@stitch.com or call our toll-free line at 1-800-STITCH. Our agents are available 24/7.";
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), text: aiResponse, isUser: false, timestamp: new Date().toISOString() }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800); // Realistic typing delay
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div style={{ padding: '0 16px', paddingBottom: 32 }}>
        <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>Help & Support</h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div className="animate-fade-in-up stagger-1" style={{ background: 'var(--lime-400)', borderRadius: 16, padding: 24, color: '#000', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 120 }}>smart_toy</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="material-symbols-outlined">auto_awesome</span>
                <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>STITCH AI Support</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, marginBottom: 8, fontWeight: 800, lineHeight: 1.2 }}>Get instant help,<br/>24/7.</h2>
              <p style={{ fontSize: 14, marginBottom: 20, opacity: 0.8, fontWeight: 500 }}>Track orders, process returns, or ask for styling advice instantly.</p>
              <button 
                onClick={() => setIsChatOpen(true)}
                style={{
                  background: '#000', color: 'var(--lime-400)', border: 'none', padding: '14px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat_bubble</span> 
                Start Smart Chat
              </button>
            </div>
          </div>

          <h2 className="animate-fade-in-up stagger-2" style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: 'var(--foreground)', marginTop: 24, marginBottom: 8 }}>Frequently Asked Questions</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, i) => (
              <div key={i} className={`animate-fade-in-up stagger-${i + 3}`} style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontSize: 14, color: 'var(--foreground)', marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Smart AI Chat Overlay */}
      {isChatOpen && (
        <div className="animate-fade-in-up" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)',
          height: '100svh', // Use svh for better mobile support
          animationDuration: '0.3s',
          overflow: 'hidden' // Prevent container scroll
        }}>
          <style>{`
            .typing-dot {
              width: 6px;
              height: 6px;
              background-color: var(--on-surface-variant);
              border-radius: 50%;
              display: inline-block;
              animation: typing-bounce 1.4s infinite ease-in-out both;
            }
            @keyframes typing-bounce {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1); }
            }
          `}</style>
          
          <div style={{ 
            padding: '12px 16px', 
            paddingTop: 'calc(12px + env(safe-area-inset-top))', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            backgroundColor: 'var(--surface)', 
            borderBottom: '1px solid var(--outline)', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            zIndex: 10,
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>keyboard_arrow_down</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(163, 230, 53, 0.2)' }}>
                  <span className="material-symbols-outlined" style={{ color: '#000', fontSize: 20 }}>smart_toy</span>
                </div>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>STITCH AI</h1>
                  <p style={{ fontSize: 11, color: 'var(--lime-400)', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)', display: 'inline-block' }}></span>
                    Online
                  </p>
                </div>
              </div>
            </div>
            <button onClick={() => setMessages([{ id: '1', text: 'Chat history cleared. How can I help you today?', isUser: false, timestamp: new Date().toISOString() }])} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', padding: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
            </button>
          </div>

          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16, 
            backgroundColor: 'var(--background)',
            WebkitOverflowScrolling: 'touch'
          }} className="no-scrollbar">
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', background: 'var(--surface)', padding: '4px 10px', borderRadius: 10, fontWeight: 500 }}>Today</span>
            </div>
            {messages.map((m, i) => (
              <div key={m.id} className="animate-fade-in-up" style={{ display: 'flex', justifyContent: m.isUser ? 'flex-end' : 'flex-start', animationDuration: '0.2s' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: m.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  backgroundColor: m.isUser ? 'var(--lime-400)' : 'var(--surface)',
                  color: m.isUser ? '#000' : 'var(--foreground)',
                  boxShadow: m.isUser ? '0 4px 10px rgba(163, 230, 53, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)',
                  border: m.isUser ? 'none' : '1px solid var(--outline)',
                }}>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, fontFamily: 'var(--font-inter)' }}>{m.text}</p>
                  <div style={{ fontSize: 9, marginTop: 4, opacity: 0.6, textAlign: 'right', fontWeight: 600 }}>{formatTime(m.timestamp)}</div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '18px 18px 18px 4px',
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--outline)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot" style={{ animationDelay: '0.2s' }}></span>
                  <span className="typing-dot" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: 'var(--surface)', 
            borderTop: '1px solid var(--outline)', 
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-container)', borderRadius: 24, padding: '4px 4px 4px 16px', border: '1px solid var(--outline-variant)', transition: 'border-color 0.2s', ...((input.trim() ? { borderColor: 'var(--lime-400)' } : {})) }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Message STITCH AI..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', fontSize: 14, fontFamily: 'var(--font-inter)', padding: '8px 0' }}
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || isTyping}
                style={{ 
                  width: 36, height: 36, borderRadius: '50%', 
                  backgroundColor: input.trim() && !isTyping ? 'var(--lime-400)' : 'var(--surface-container-highest)', 
                  color: input.trim() && !isTyping ? '#000' : 'var(--on-surface-variant)', 
                  border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'default', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                AI generated • Verify important info
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
