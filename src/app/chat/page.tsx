'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { allProducts } = useStore();
  const { recentlyViewed } = useUserActivity();
  const { cart, addToCart } = useCart();
  const { wishlist, addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();

  const vendorEmail = searchParams?.get('vendor');
  const vendorName = searchParams?.get('name');

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPidgin, setIsPidgin] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>({ stage: 'idle' });
  const [showImageModal, setShowImageModal] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Initialize Welcome Message tailored to User Role & Parameters
  useEffect(() => {
    if (vendorEmail) {
      setMessages([
        {
          id: `v-${Date.now()}`,
          role: 'assistant',
          content: `Connected to **${vendorName || vendorEmail}**. Send your direct inquiry or message below!`,
          timestamp: getCurrentTimeStr(),
          status: 'read',
        },
      ]);
    } else {
      const isVendor = user?.role === 'vendor';
      const isAdmin = user?.role === 'super_admin';
      const name = user?.name ? ` ${user.name.split(' ')[0]}` : '';

      let welcomeContent = `Hello${name}! 👋 I am your AfriCart Personal AI Assistant. How can I help you today?`;
      let actions: AIAction[] = [
        { label: '🔍 Find Products', value: 'show me everything', type: 'query' },
        { label: '📦 Track Order', value: 'track my order', type: 'query' },
        { label: '⚖️ Compare Items', value: 'compare products', type: 'query' },
        { label: '🔥 Today\'s Deals', value: 'flash sale', type: 'query' },
        { label: '🎟️ Coupons', value: 'coupons', type: 'query' },
        { label: '📏 Size Guide', value: 'size guide', type: 'query' },
      ];

      if (isVendor) {
        welcomeContent = `Welcome back, Vendor${name}! 🏪 I can help you check store metrics, low stock alerts, or manage orders.`;
        actions = [
          { label: '📊 Today\'s Sales', value: 'my sales', type: 'query' },
          { label: '⚠️ Low Stock Alerts', value: 'low stock', type: 'query' },
          { label: '📦 Orders', value: '/vendor/orders', type: 'link' },
          { label: '💰 Payouts', value: '/vendor/payouts', type: 'link' },
        ];
      } else if (isAdmin) {
        welcomeContent = `Greetings, Super Admin${name}! 🛡️ Select an administrative quick task or check system metrics.`;
        actions = [
          { label: '📊 Today\'s Revenue', value: 'today\'s revenue', type: 'query' },
          { label: '📝 Approve Vendors', value: '/admin/vendor-applications', type: 'link' },
          { label: '🚨 Fraud Alerts', value: '/admin/fraud-alerts', type: 'link' },
          { label: '🔧 Admin Panel', value: '/admin', type: 'link' },
        ];
      }

      setMessages([
        {
          id: 'i1',
          role: 'assistant',
          content: welcomeContent,
          timestamp: getCurrentTimeStr(),
          status: 'read',
          actions,
        },
      ]);
    }
  }, [vendorEmail, vendorName, user]);

  const scrollToBottom = useCallback((instant = false) => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: instant ? 'instant' : 'smooth',
    } as ScrollToOptions);
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, scrollToBottom]);

  // Send message orchestrator
  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userText = text.trim();
    const userMsgId = makeId();
    const userTime = getCurrentTimeStr();

    const userMsg: AIMessage = {
      id: userMsgId,
      role: 'user',
      content: userText,
      timestamp: userTime,
      status: 'sent',
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setTimeout(() => scrollToBottom(), 20);

    // Delivered tick
    setTimeout(() => {
      setMessages(prev => prev.map(m => (m.id === userMsgId ? { ...m, status: 'delivered' } : m)));
    }, 400);

    // Read tick & Typing indicator
    setTimeout(async () => {
      setMessages(prev => prev.map(m => (m.id === userMsgId ? { ...m, status: 'read' } : m)));
      setIsTyping(true);
      setTimeout(() => scrollToBottom(), 50);

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

      const response = await processIntent(userText, ctx);

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
        setTimeout(() => scrollToBottom(), 50);
      }, 800);
    }, 700);
  };

  const handleAction = (action: { label: string; value: string; type?: 'link' | 'query' }) => {
    if (action.type === 'link') {
      router.push(action.value);
    } else {
      handleSend(action.value);
    }
  };

  const handleVisualSearchPreset = (category: string) => {
    setShowImageModal(false);
    handleSend(`looking for ${category}`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0b141a', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-lexend), sans-serif' }}>
      {/* HEADER */}
      <div style={{ padding: '12px 16px', background: '#1f2c34', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} aria-label="Go Back" style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>

          <div style={{ position: 'relative' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#000', fontSize: 22 }}>smart_toy</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, background: '#00a884', borderRadius: '50%', border: '2px solid #1f2c34' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#e9edef' }}>AfriCart AI Bot</h2>
              <span style={{ fontSize: 10, background: 'rgba(195,244,0,0.15)', color: 'var(--lime-400)', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                {isPidgin ? 'LOCAL' : '24/7 ONLINE'}
              </span>
            </div>
            <p style={{ fontSize: 11, margin: 0, color: '#8696a0' }}>
              {isPidgin ? 'Yarn me for pidgin anytime!' : 'Voice • Shopping • Tracking • Support'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* VOICE OUTPUT SPEECH TOGGLE */}
          <button
            onClick={() => {
              setIsVoiceEnabled(!isVoiceEnabled);
              showToast(isVoiceEnabled ? 'Voice audio output turned OFF' : 'Voice audio output turned ON', 'info');
            }}
            title={isVoiceEnabled ? 'Voice Output Enabled' : 'Enable Voice Audio Output'}
            style={{
              background: isVoiceEnabled ? 'var(--lime-400)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              color: isVoiceEnabled ? '#000' : '#aebac1',
              width: 34,
              height: 34,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {isVoiceEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          {/* PIDGIN TOGGLE */}
          <button
            onClick={() => setIsPidgin(!isPidgin)}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--lime-400)', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
          >
            {isPidgin ? '🇬🇧 ENGLISH' : '🌍 PIDGIN'}
          </button>

          {/* RESET CHAT */}
          <button
            onClick={() => {
              setMessages([{ id: makeId(), role: 'assistant', content: 'Chat reset! How can I assist you now?', timestamp: getCurrentTimeStr(), status: 'read' }]);
              setSessionState({ stage: 'idle' });
            }}
            aria-label="Clear Chat"
            style={{ background: 'none', border: 'none', color: '#aebac1', cursor: 'pointer', padding: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete_sweep</span>
          </button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div ref={messagesRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }} className="no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            {/* Text Bubble */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                background: msg.role === 'user' ? '#005c4b' : '#202c33',
                color: '#e9edef',
                fontSize: 14,
                lineHeight: 1.55,
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {msg.content.split('**').map((part, index) =>
                index % 2 === 1 ? <strong key={index} style={{ color: 'var(--lime-400)' }}>{part}</strong> : part
              )}
              <div style={{ float: 'right', margin: '4px -4px -2px 10px', fontSize: 10, color: '#8696a0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {msg.timestamp}
                {msg.role === 'user' && (
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: msg.status === 'read' ? '#53bdeb' : '#8696a0' }}>
                    {msg.status === 'sent' ? 'check' : 'done_all'}
                  </span>
                )}
              </div>
            </div>

            {/* ORDER TRACKING STEPPER CARD */}
            {msg.orderTracking && (
              <div style={{ marginTop: 10, background: '#111b21', border: '1px solid rgba(195,244,0,0.3)', borderRadius: 16, padding: 14, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--lime-400)' }}>ORDER #{msg.orderTracking.orderId}</span>
                  <span style={{ fontSize: 11, background: '#202c33', padding: '2px 8px', borderRadius: 10, color: '#aebac1' }}>{msg.orderTracking.dateStr}</span>
                </div>

                {/* Progress Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0', position: 'relative' }}>
                  {['Pending', 'Processing', 'Shipped', 'Delivered'].map((st, idx) => {
                    const currentIdx = ['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(msg.orderTracking!.status);
                    const isCompleted = idx <= currentIdx;
                    return (
                      <div key={st} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isCompleted ? 'var(--lime-400)' : '#202c33', color: isCompleted ? '#000' : '#8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900 }}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: 9, marginTop: 4, color: isCompleted ? 'var(--lime-400)' : '#8696a0', fontWeight: isCompleted ? 700 : 400 }}>{st}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: '#202c33', padding: 10, borderRadius: 10, fontSize: 12, color: '#e9edef' }}>
                  <p style={{ margin: 0 }}><strong>Status:</strong> {msg.orderTracking.emoji} {msg.orderTracking.statusDesc}</p>
                  <p style={{ margin: '4px 0 0', color: 'var(--lime-400)', fontWeight: 700 }}>Total: GH₵{msg.orderTracking.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* PRODUCT COMPARISON CARD */}
            {msg.comparisonProducts && (
              <div style={{ marginTop: 10, background: '#111b21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 12 }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--lime-400)', margin: '0 0 10px', textTransform: 'uppercase' }}>Side-by-Side Comparison</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {msg.comparisonProducts.map((cp) => (
                    <div key={cp.id} style={{ background: '#202c33', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <img src={cp.image} alt={cp.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }} className="line-clamp-1">{cp.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--lime-400)', margin: 0 }}>GH₵{cp.price.toFixed(0)}</p>
                      <p style={{ fontSize: 10, color: '#8696a0', margin: 0 }}>⭐ {cp.rating} ({cp.reviewsCount || 0} reviews)</p>
                      <button
                        onClick={() => { addToCart(cp); showToast('Added to cart!'); }}
                        style={{ marginTop: 4, padding: '6px', background: 'var(--lime-400)', border: 'none', borderRadius: 6, color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPRESS ORDER CARD */}
            {msg.expressOrder && (
              <div style={{ marginTop: 10, background: '#111b21', border: '1px solid var(--lime-400)', borderRadius: 16, padding: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img src={msg.expressOrder.product.image} alt={msg.expressOrder.product.name} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: 12, fontWeight: 800, color: '#fff', margin: 0 }}>{msg.expressOrder.product.name}</h4>
                    <p style={{ fontSize: 11, color: 'var(--lime-400)', fontWeight: 700, margin: '2px 0 0' }}>Qty: {msg.expressOrder.quantity} × GH₵{msg.expressOrder.product.price} = GH₵{msg.expressOrder.subtotal.toFixed(2)}</p>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleSend('yes')}
                    style={{ flex: 1, padding: '8px', background: 'var(--lime-400)', border: 'none', borderRadius: 8, color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                  >
                    ✅ CONFIRM & ADD TO CART
                  </button>
                  <button
                    onClick={() => handleSend('cancel')}
                    style={{ padding: '8px 14px', background: '#202c33', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {/* PRODUCT RECOMMENDATIONS GRID */}
            {msg.products && (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {msg.products.map((p) => (
                  <div key={p.id} style={{ background: '#202c33', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: 4, color: 'var(--lime-400)', fontSize: 11, fontWeight: 800 }}>
                        GH₵{p.price.toFixed(0)}
                      </div>
                    </div>
                    <div style={{ padding: 8, flex: 1 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#e9edef', margin: 0 }} className="line-clamp-1">{p.name}</p>
                      <p style={{ fontSize: 10, color: '#8696a0', margin: '2px 0 0' }}>⭐ {p.rating}</p>
                    </div>
                    <div style={{ padding: '0 8px 8px', display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => { addToCart(p); showToast('Added to cart!'); }}
                        style={{ flex: 1, height: 28, borderRadius: 6, background: 'var(--lime-400)', border: 'none', color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                      >
                        CART
                      </button>
                      <button
                        onClick={() => {
                          if (isInWishlist(p.id)) { removeFromWishlist(p.id); showToast('Removed'); }
                          else { addToWishlist(p); showToast('Saved to wishlist'); }
                        }}
                        style={{ width: 28, height: 28, borderRadius: 6, background: '#111b21', border: '1px solid rgba(255,255,255,0.1)', color: isInWishlist(p.id) ? '#ff4444' : '#8696a0', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>favorite</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* QUICK ACTION BUTTONS */}
            {msg.actions && (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {msg.actions.map((act, ai) => (
                  <button
                    key={ai}
                    onClick={() => handleAction(act)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 18,
                      background: 'rgba(195,244,0,0.08)',
                      border: '1px solid var(--lime-400)',
                      color: 'var(--lime-400)',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 16px', borderRadius: '14px 14px 14px 2px', background: '#202c33', display: 'flex', gap: 6 }}>
            <div className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)' }} />
            <div className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)', animationDelay: '0.2s' }} />
            <div className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)', animationDelay: '0.4s' }} />
          </div>
        )}
      </div>

      {/* VISUAL IMAGE SEARCH MODAL */}
      {showImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1f2c34', borderRadius: 20, width: '100%', maxWidth: 360, padding: 20, color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--lime-400)' }}>📷 Visual Search</h3>
              <button onClick={() => setShowImageModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#8696a0', marginBottom: 16 }}>Select an apparel / product style to search our catalog:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['Shoes & Sneakers', 'Compression Tights', 'Sports Hoodies', 'Smart Watches'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleVisualSearchPreset(cat)}
                  style={{ padding: '12px', background: '#202c33', border: '1px solid var(--lime-400)', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INPUT FOOTER WITH VOICE MIC & VISUAL BUTTON */}
      <div style={{ padding: '12px 16px', background: '#1f2c34', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* VISUAL SEARCH BUTTON */}
        <button
          onClick={() => setShowImageModal(true)}
          title="Visual Image Search"
          style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: '#202c33', color: 'var(--lime-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined">add_a_photo</span>
        </button>

        {/* VOICE COMMAND SPEECH-TO-TEXT BUTTON */}
        <button
          onClick={toggleVoiceListen}
          title={isListening ? "Listening... Click to stop" : "Voice Command"}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            border: 'none',
            background: isListening ? '#ff4444' : '#202c33',
            color: isListening ? '#fff' : 'var(--lime-400)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isListening ? 'pulse 1s infinite' : 'none',
          }}
        >
          <span className="material-symbols-outlined">{isListening ? 'mic' : 'mic_none'}</span>
        </button>

        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "Listening to your voice..." : isPidgin ? "Ask me anything, abeg..." : "Ask AfriCart Assistant..."}
            style={{
              width: '100%',
              padding: '12px 48px 12px 14px',
              borderRadius: 14,
              border: 'none',
              background: '#2a3942',
              color: '#e9edef',
              fontSize: 14,
              outline: 'none',
              resize: 'none',
              maxHeight: 100,
            }}
          />
          <button
            onClick={() => handleSend()}
            style={{
              position: 'absolute', right: 6, top: 6, width: 34, height: 34,
              borderRadius: 10, background: 'var(--lime-400)', color: '#000',
              border: 'none', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_upward</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#fff', textAlign: 'center' }}>Loading AI Assistant...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
