'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore, useAuth, useUserActivity, useCart, useWishlist, useToast } from '@/context/AppContext';
import {
  AIMessage,
  AIAction,
  SessionState,
  processIntent,
  getCurrentTimeStr,
  makeId,
  AIEngineContext,
} from '@/lib/ai-engine';

export default function AIChatAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { allProducts } = useStore();
  const { recentlyViewed } = useUserActivity();
  const { cart, addToCart } = useCart();
  const { wishlist, addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPidgin, setIsPidgin] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>({ stage: 'idle' });
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Text-to-Speech Output helper
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !isVoiceEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#•]/g, '').replace(/https?:\/\/\S+/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText.slice(0, 250));
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }, [isVoiceEnabled]);

  // Speech-to-Text Voice Command Handler
  const toggleVoiceListen = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Voice recognition is not supported in this browser.', 'info');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('🎙️ Listening... Speak your command!', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleSend(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        showToast('Could not hear voice. Try typing instead.', 'info');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Initialize Welcome Message
  useEffect(() => {
    const isVendor = user?.role === 'vendor';
    const isAdmin = user?.role === 'super_admin';
    const name = user?.name ? ` ${user.name.split(' ')[0]}` : '';

    let content = `Hi${name}! 👋 I'm your AfriCart Personal Shopper. Ask me to find products, track orders, or compare items!`;
    let actions: AIAction[] = [
      { label: '🔍 Find Shoes', value: 'shoes', type: 'query' },
      { label: '📦 Track Order', value: 'track my order', type: 'query' },
      { label: '⚖️ Compare', value: 'compare products', type: 'query' },
      { label: '✨ For Me', value: 'recommend something based on my history', type: 'query' },
    ];

    if (isVendor) {
      content = `Welcome back, Vendor${name}! 🏪 Need quick metrics or product help?`;
      actions = [
        { label: '📊 Store Sales', value: 'my sales', type: 'query' },
        { label: '📦 Vendor Orders', value: '/vendor/orders', type: 'link' },
      ];
    } else if (isAdmin) {
      content = `Admin Mode Active 🛡️. Select a quick administrative link below:`;
      actions = [
        { label: '🔧 Admin Dashboard', value: '/admin', type: 'link' },
        { label: '📊 Analytics', value: '/admin/analytics', type: 'link' },
      ];
    }

    setMessages([
      {
        id: makeId(),
        role: 'assistant',
        content,
        timestamp: getCurrentTimeStr(),
        status: 'read',
        actions,
      },
    ]);
  }, [user]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userText = text.trim();
    const userMsg: AIMessage = {
      id: makeId(),
      role: 'user',
      content: userText,
      timestamp: getCurrentTimeStr(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const ctx: AIEngineContext = {
      user,
      allProducts,
      recentlyViewed,
      cart,
      wishlist,
      isPidgin,
      sessionState,
      setSessionState,
      setIsPidgin,
      addToCart,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      showToast,
    };

    const response = await processIntent(userText, ctx, messages);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          ...response,
          id: makeId(),
          timestamp: getCurrentTimeStr(),
          status: 'read',
        },
      ]);
      speakText(response.content);
    }, 700);
  };

  const handleAction = (action: { label: string; value: string; type?: 'link' | 'query' }) => {
    if (action.type === 'link') {
      window.location.href = action.value;
    } else {
      handleSend(action.value);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="animate-fade-in-up"
      style={{
        position: 'fixed',
        bottom: 90,
        right: 24,
        zIndex: 10000,
        width: 'calc(100% - 48px)',
        maxWidth: 420,
        height: 600,
        background: '#111b21',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--font-lexend), sans-serif',
      }}
    >
      {/* HEADER */}
      <div style={{ padding: '14px 18px', background: '#1f2c34', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 38, height: 38, borderRadius: '12px', background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#000', fontSize: 20 }}>smart_toy</span>
          </div>
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, background: '#00a884', borderRadius: '50%', border: '2px solid #1f2c34' }} />
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#e9edef', margin: 0 }}>AfriCart Assistant</h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--lime-400)', fontWeight: 700 }}>{isPidgin ? '🌍 PIDGIN (NVIDIA AI)' : '⚡ NVIDIA AI ONLINE'}</span>
            <button
              onClick={() => setIsPidgin(!isPidgin)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 10, cursor: 'pointer' }}
            >
              {isPidgin ? '🇬🇧 ENG' : '🌍 PIDGIN'}
            </button>
          </div>
        </div>

        {/* VOICE SPEAKER TOGGLE */}
        <button
          onClick={() => {
            setIsVoiceEnabled(!isVoiceEnabled);
            showToast(isVoiceEnabled ? 'Voice audio OFF' : 'Voice audio ON', 'info');
          }}
          title={isVoiceEnabled ? 'Voice Audio ON' : 'Turn Voice Audio ON'}
          style={{ background: isVoiceEnabled ? 'var(--lime-400)' : '#202c33', border: 'none', color: isVoiceEnabled ? '#000' : '#aebac1', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{isVoiceEnabled ? 'volume_up' : 'volume_off'}</span>
        </button>

        <button
          onClick={onClose}
          aria-label="Close Assistant"
          style={{ background: '#202c33', border: 'none', color: '#aebac1', cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>

      {/* MESSAGES BODY */}
      <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }} className="no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            {msg.role === 'assistant' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0, 229, 255, 0.12)', color: 'var(--lime-400)', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 6, marginBottom: 4 }}>
                ⚡ NVIDIA LLM (Llama 3.3 70B)
              </div>
            )}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: msg.role === 'user' ? '#005c4b' : '#202c33',
                color: '#e9edef',
                fontSize: 13,
                lineHeight: 1.5,
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {msg.content.split('**').map((part, index) =>
                index % 2 === 1 ? <strong key={index} style={{ color: 'var(--lime-400)' }}>{part}</strong> : part
              )}
            </div>

            {/* ORDER TRACKING CARD */}
            {msg.orderTracking && (
              <div style={{ marginTop: 8, background: '#0b141a', border: '1px solid rgba(195,244,0,0.3)', borderRadius: 12, padding: 10, fontSize: 11, color: '#fff' }}>
                <p style={{ margin: 0, color: 'var(--lime-400)', fontWeight: 800 }}>ORDER #{msg.orderTracking.orderId}</p>
                <p style={{ margin: '4px 0 0', color: '#8696a0' }}>Status: {msg.orderTracking.emoji} {msg.orderTracking.statusDesc}</p>
              </div>
            )}

            {/* PRODUCT CARDS */}
            {msg.products && (
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {msg.products.map((p) => (
                  <div key={p.id} style={{ background: '#202c33', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', aspectRatio: '1', position: 'relative' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.7)', padding: '2px 4px', borderRadius: 4, color: 'var(--lime-400)', fontSize: 10, fontWeight: 800 }}>
                        GH₵{p.price.toFixed(0)}
                      </div>
                    </div>
                    <div style={{ padding: 6 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#fff', margin: 0 }} className="line-clamp-1">{p.name}</p>
                    </div>
                    <div style={{ padding: '0 6px 6px', display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => { addToCart(p); showToast('Added to cart!'); }}
                        style={{ flex: 1, height: 24, borderRadius: 6, background: 'var(--lime-400)', border: 'none', color: '#000', fontSize: 9, fontWeight: 800, cursor: 'pointer' }}
                      >
                        CART
                      </button>
                      <button
                        onClick={() => {
                          if (isInWishlist(p.id)) removeFromWishlist(p.id);
                          else addToWishlist(p);
                        }}
                        style={{ width: 24, height: 24, borderRadius: 6, background: '#111b21', border: '1px solid rgba(255,255,255,0.1)', color: isInWishlist(p.id) ? '#ff4444' : '#8696a0', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>favorite</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACTION PILLS */}
            {msg.actions && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {msg.actions.map((act, ai) => (
                  <button
                    key={ai}
                    onClick={() => handleAction(act)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 14,
                      background: 'rgba(195,244,0,0.08)',
                      border: '1px solid var(--lime-400)',
                      color: 'var(--lime-400)',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '14px 14px 14px 2px', background: '#202c33', display: 'flex', gap: 4 }}>
            <div className="animate-bounce" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lime-400)' }} />
            <div className="animate-bounce" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lime-400)', animationDelay: '0.2s' }} />
            <div className="animate-bounce" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lime-400)', animationDelay: '0.4s' }} />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT FOOTER WITH MIC BUTTON */}
      <div style={{ padding: '10px 14px', background: '#1f2c34', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={toggleVoiceListen}
          title={isListening ? "Listening..." : "Voice Command"}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: isListening ? '#ff4444' : '#202c33',
            color: isListening ? '#fff' : 'var(--lime-400)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isListening ? 'mic' : 'mic_none'}</span>
        </button>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isListening ? "Listening to voice..." : isPidgin ? "Ask me anything..." : "Message Assistant..."}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 12,
            border: 'none',
            background: '#2a3942',
            color: '#e9edef',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleSend()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--lime-400)',
            color: '#000',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_upward</span>
        </button>
      </div>
    </div>
  );
}
