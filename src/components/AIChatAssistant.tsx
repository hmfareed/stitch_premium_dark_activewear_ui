'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore, useAuth, useUserActivity, useCart, useWishlist, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  products?: any[];
  actions?: { label: string; value: string; type?: 'link' | 'query' }[];
  type?: 'text' | 'product_list' | 'faq';
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { allProducts } = useStore();
  const { recentlyViewed } = useUserActivity();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hi ${user?.name || 'there'}! 👋 I'm your AfriCart Personal Shopper. I can help you find products, track orders, or answer questions about our store. What's on your mind?`,
      actions: [
        { label: '🔍 Find Shoes', value: 'shoes', type: 'query' },
        { label: '📦 Track Order', value: 'track', type: 'query' },
        { label: '📏 Size Help', value: 'what is my size', type: 'query' },
        { label: '✨ For Me', value: 'recommend something based on my history', type: 'query' },
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPidgin, setIsPidgin] = useState(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMessage = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const response = processQuery(userMessage);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const processQuery = (query: string): Message => {
    const q = query.toLowerCase();
    
    // --- 1. FAQ & KNOWLEDGE BASE ---
    if (q.includes('track') || q.includes('order status') || q.includes('where is my')) {
      return {
        role: 'assistant',
        content: isPidgin 
          ? "Abeg, you fit track your order for our portal. You go need your Order ID and Email. Make I take you there?"
          : "You can track your order using your Order ID and Email on our tracking portal. Would you like to go there now?",
        actions: [
          { label: isPidgin ? 'Take me there' : 'Go to Track Portal', value: '/track', type: 'link' },
          { label: isPidgin ? 'How I go find ID?' : 'How to find Order ID?', value: 'how to find order id', type: 'query' }
        ]
      };
    }

    if (q.includes('style search') || q.includes('visual search') || q.includes('look like')) {
      return {
        role: 'assistant',
        content: isPidgin 
          ? "I dey look for gear wey look like the one you want... check these ones!"
          : "Analyzing your style request... Here are some items that match that aesthetic! ✨",
        products: allProducts.slice(0, 4),
        actions: [{ label: 'Find More', value: 'trending', type: 'query' }]
      };
    }

    if (q.includes('payment') || q.includes('pay') || q.includes('momo') || q.includes('card')) {
      return {
        role: 'assistant',
        content: "We accept **Mobile Money (MTN, Telecel, AirtelTigo)** and all major **Credit/Debit cards**. Payments are held in escrow until you receive your order to ensure your safety. 🛡️",
        actions: [{ label: 'View All Products', value: 'show me everything', type: 'query' }]
      };
    }

    if (q.includes('return') || q.includes('refund') || q.includes('policy')) {
      return {
        role: 'assistant',
        content: "AfriCart offers a **7-day return policy** on most items. Items must be in original condition with tags. If you have an issue, you can start a return from your 'My Orders' page.",
        actions: [{ label: 'Contact Support', value: '/chat', type: 'link' }]
      };
    }

    if (q.includes('vendor') || q.includes('sell') || q.includes('become')) {
      return {
        role: 'assistant',
        content: "Want to grow your business? You can become a verified vendor on AfriCart! We handle the tech, you handle the style.",
        actions: [{ label: 'Apply Now', value: '/apply', type: 'link' }]
      }
    }

    if (q.includes('history') || q.includes('for me') || q.includes('recommend') || q.includes('suggest')) {
      if (recentlyViewed.length > 0) {
        return {
          role: 'assistant',
          content: "Based on the items you've been looking at, I think you'll love these! ✨",
          products: recentlyViewed.slice(0, 4),
          actions: [{ label: 'See Trending Items', value: 'trending', type: 'query' }]
        };
      }
    }

    if (q.includes('size') || q.includes('fit') || q.includes('measure')) {
      return {
        role: 'assistant',
        content: "To give you the best size recommendation, I need to know your preference. Do you prefer a **Tight Fit**, **Regular Fit**, or **Oversized** look? \n\nGenerally, our activewear runs true to size. If you're between sizes, we recommend sizing up for comfort!",
        actions: [
          { label: 'Tight Fit', value: 'i want tight fit', type: 'query' },
          { label: 'Regular Fit', value: 'i want regular fit', type: 'query' },
          { label: 'Oversized', value: 'i want oversized', type: 'query' }
        ]
      };
    }

    // --- 2. PRODUCT SEARCH ---
    const intents = {
      price: q.match(/under|below|cheaper|expensive|price|budget|cost/i),
      category: q.match(/electronics|fashion|home|beauty|groceries|shoes|fitness|activewear|gym|sets|tops|bottoms/i),
      color: q.match(/black|white|red|blue|green|pink|yellow|orange|grey|gray/i),
      recommend: q.match(/recommend|suggest|best|top|good|what should i buy/i)
    };

    let filtered = [...allProducts];

    // Filter by keywords found in query
    const keywords = q.split(' ').filter(w => w.length > 3);
    if (keywords.length > 0) {
      filtered = filtered.filter(p => 
        keywords.some(k => 
          p.name.toLowerCase().includes(k) || 
          p.description.toLowerCase().includes(k) ||
          p.category.toLowerCase().includes(k)
        )
      );
    }

    // Filter by price
    const priceMatch = q.match(/\d+/);
    if (priceMatch && (q.includes('under') || q.includes('below') || q.includes('cost') || q.includes('budget'))) {
      const maxPrice = parseInt(priceMatch[0]);
      filtered = filtered.filter(p => p.price <= maxPrice);
    }

    if (filtered.length === 0) {
      return { 
        role: 'assistant', 
        content: "I couldn't find exactly what you're looking for, but check out these trending activewear pieces! 👇",
        products: allProducts.slice(0, 3),
        actions: [{ label: 'Show All Products', value: 'all', type: 'query' }]
      };
    }

    return {
      role: 'assistant',
      content: filtered.length > 5 
        ? `I found ${filtered.length} items. Here are the top picks for you:` 
        : `Great choice! Here's what I found for you:`,
      products: filtered.slice(0, 4),
      actions: [
        { label: 'Filter by Price', value: 'under 200', type: 'query' },
        { label: 'See More', value: 'more items', type: 'query' }
      ]
    };
  };

  const handleAction = (action: { label: string; value: string; type?: 'link' | 'query' }) => {
    if (action.type === 'link') {
      window.location.href = action.value;
    } else {
      handleSend(action.value);
    }
  };

  return (
    <>
      {/* Floating Button with Pulse Effect */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: 100, right: 24, zIndex: 100,
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--lime-400)', color: '#000',
          boxShadow: '0 8px 32px rgba(195, 244, 0, 0.4)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        className={isOpen ? 'rotate-90' : 'hover-scale'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 32, fontWeight: 'bold' }}>
          {isOpen ? 'close' : 'forum'}
        </span>
        {!isOpen && (
          <div style={{
            position: 'absolute', top: -4, right: -4, width: 14, height: 14,
            background: '#ff4444', borderRadius: '50%', border: '2px solid var(--surface)'
          }} />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="animate-fade-in-up"
          style={{
            position: 'fixed', bottom: 175, right: 24, zIndex: 1000,
            width: 'calc(100% - 48px)', maxWidth: 400, height: 600,
            background: 'var(--surface)', borderRadius: 28,
            border: '1px solid var(--outline)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '24px', background: 'linear-gradient(135deg, var(--surface-container-high) 0%, var(--surface) 100%)', borderBottom: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 48, height: 48, borderRadius: '16px', background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#000', fontSize: 24 }}>smart_toy</span>
              </div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, background: '#c3f400', borderRadius: '50%', border: '3px solid var(--surface)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--foreground)', fontFamily: 'var(--font-lexend)' }}>AfriCart Assistant</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--lime-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isPidgin ? 'Local Mode' : 'AI Expert'}</p>
                <button 
                  onClick={() => setIsPidgin(!isPidgin)}
                  style={{ background: 'var(--surface-container-highest)', border: 'none', color: 'var(--foreground)', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, cursor: 'pointer' }}
                >
                  SWITCH TO {isPidgin ? 'STANDARD' : 'LOCAL'}
                </button>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }} className="no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                <div style={{ 
                  padding: '14px 18px', borderRadius: msg.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                  background: msg.role === 'user' ? 'var(--lime-400)' : 'var(--surface-container)',
                  color: msg.role === 'user' ? '#000' : 'var(--foreground)',
                  fontSize: 14, lineHeight: 1.6, fontWeight: msg.role === 'user' ? 600 : 400,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {msg.content.split('**').map((part, index) => 
                    index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                  )}
                </div>

                {/* Product Recommendations */}
                {msg.products && (
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {msg.products.map((p: any) => (
                      <Link key={p.id} href={`/product/${p.id}`} onClick={() => setIsOpen(false)} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: 'var(--surface-container-high)', borderRadius: 16, border: '1px solid var(--outline)', overflow: 'hidden', transition: 'transform 0.2s' }}>
                        <div style={{ width: '100%', aspectRatio: '1', position: 'relative' }}>
                          <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} />
                          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 800 }}>
                            GH₵{p.price.toFixed(0)}
                          </div>
                        </div>
                        <div style={{ padding: '8px' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)' }} className="line-clamp-1">{p.name}</p>
                        </div>
                        <div style={{ padding: '0 8px 8px', display: 'flex', gap: 6 }}>
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); showToast('Added to cart!'); }}
                            style={{ flex: 1, height: 32, borderRadius: 8, background: 'var(--lime-400)', border: 'none', color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                          >
                            CART
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault(); e.stopPropagation(); 
                              if (isInWishlist(p.id)) { removeFromWishlist(p.id); showToast('Removed from wishlist'); }
                              else { addToWishlist(p); showToast('Saved to wishlist'); }
                            }}
                            style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-container)', border: '1px solid var(--outline)', color: isInWishlist(p.id) ? '#ff4444' : 'var(--on-surface-variant)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: isInWishlist(p.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Quick Action Buttons */}
                {msg.actions && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {msg.actions.map((action, ai) => (
                      <button 
                        key={ai} 
                        onClick={() => handleAction(action)}
                        style={{
                          padding: '8px 14px', borderRadius: 20, background: 'none', 
                          border: '1.5px solid var(--lime-400)', color: 'var(--lime-400)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--lime-400)'; e.currentTarget.style.color = '#000'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--lime-400)'; }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', padding: '16px 20px', borderRadius: '24px 24px 24px 4px', background: 'var(--surface-container)', display: 'flex', gap: 6 }}>
                <div className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)' }} />
                <div className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)', animationDelay: '0.2s' }} />
                <div className="animate-bounce" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)', animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '20px', background: 'var(--surface-container-high)', borderTop: '1px solid var(--outline)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              onClick={() => handleSend('style search')}
              style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--outline)', background: 'var(--surface)', color: 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined">add_a_photo</span>
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={isPidgin ? "Ask me anything, abeg..." : "Message AfriCart Assistant..."}
                style={{ 
                  width: '100%', padding: '14px 18px', paddingRight: 50, borderRadius: 16, 
                  border: '1px solid var(--outline)', background: 'var(--surface)', 
                  color: 'var(--foreground)', fontSize: 14, outline: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
              <button 
                onClick={() => handleSend()}
                style={{ 
                  position: 'absolute', right: 8, top: 8, width: 36, height: 36, 
                  borderRadius: 12, background: 'var(--lime-400)', color: '#000', 
                  border: 'none', cursor: 'pointer', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center' 
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
