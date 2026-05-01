'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useCart, useStore } from '@/context/AppContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart } = useCart();
  const { allProducts } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    const greeting = user 
      ? `Hi ${user.name.split(' ')[0]}! I'm your Reed Store AI Assistant. I can help you find products, track your orders, or manage your account. How can I assist you today?`
      : "Welcome to Reed Store! I'm your AI Assistant. How can I help you discover amazing products today?";
    
    setMessages([{ id: '1', sender: 'ai', text: greeting, timestamp: new Date() }]);
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    // Product Assistance
    if (q.includes('cheap') || q.includes('under') || q.includes('affordable')) {
      const cheapProducts = allProducts.filter(p => p.price < 100).slice(0, 2);
      if (cheapProducts.length > 0) {
        return `I found some great affordable options! The ${cheapProducts[0].name} is $${cheapProducts[0].price}, and the ${cheapProducts[1]?.name || 'Classic Denim'} is only $${cheapProducts[1]?.price || 45}. Would you like me to add one to your cart?`;
      }
    }
    
    if (q.includes('recommend') || q.includes('suggest') || q.includes('looking for')) {
      if (q.includes('tv') || q.includes('electronics')) {
        return "For electronics, I highly recommend our UltraVision 4K Smart TV. It's currently $499 and has amazing reviews. Interested?";
      }
      return "Based on popular trends, our Classic Denim Jacket and Noise-Cancelling Headphones are top sellers right now. What specific category are you interested in?";
    }

    // Order Management
    if (q.includes('order') || q.includes('track') || q.includes('where is')) {
      if (!user) return "Please log in first so I can fetch your order details.";
      const savedOrders = JSON.parse(localStorage.getItem(`reed-orders-${user.email}`) || '[]');
      if (savedOrders.length === 0) return "It looks like you haven't placed any orders yet. Check out our 'Fashion' section to get started!";
      const latestOrder = savedOrders[0];
      return `Your most recent order (#${latestOrder.id}) is currently marked as '${latestOrder.status}'. It was placed on ${latestOrder.date}.`;
    }

    // Customer Account Support
    if (q.includes('address') || q.includes('location')) {
      if (!user) return "Please log in to manage your delivery addresses.";
      return "You can easily update your delivery address in the Account menu. I can take you there directly—just let me know!";
    }

    if (q.includes('password') || q.includes('profile')) {
      return "You can change your password and profile details in the 'Settings' tab under your Account.";
    }

    // Checkout Assistance
    if (q.includes('checkout') || q.includes('pay')) {
      if (cart.length === 0) return "Your cart is currently empty. Let's find some items to buy first!";
      return "You have items ready to go! Our checkout supports Visa, Mastercard, MTN MoMo, and Telecel Cash. Would you like to proceed to checkout?";
    }

    // Returns & Refunds
    if (q.includes('return') || q.includes('refund')) {
      return "We offer a hassle-free 30-day return policy. If you're not satisfied, you can return items in their original condition for a full refund. Would you like to start a return?";
    }

    // Fallback
    return "I'm not completely sure about that. Could you clarify? I can help with product recommendations, order tracking, and account management.";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const responseText = generateAIResponse(userMsg.text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <div style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--surface)', borderBottom: '1px solid var(--outline)', zIndex: 10
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #c3f400 0%, #ff8c00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#000', fontSize: 20 }}>smart_toy</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: '#25D366', borderRadius: '50%', border: '2px solid var(--surface)' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>Reed Assistant</h1>
            <p style={{ fontSize: 11, color: 'var(--lime-400)' }}>Online</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map(msg => (
          <div key={msg.id} className="animate-fade-in-up" style={{
            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%', display: 'flex', flexDirection: 'column',
            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              background: msg.sender === 'user' ? 'var(--lime-400)' : 'var(--surface)',
              color: msg.sender === 'user' ? '#000' : 'var(--foreground)',
              padding: '12px 16px', borderRadius: 16,
              borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 16,
              border: msg.sender === 'ai' ? '1px solid var(--outline)' : 'none',
              fontSize: 14, lineHeight: 1.5
            }}>
              {msg.text}
            </div>
            <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 4 }}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="animate-fade-in-up" style={{ alignSelf: 'flex-start', background: 'var(--surface)', border: '1px solid var(--outline)', padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4, display: 'flex', gap: 4 }}>
            <span style={{ width: 6, height: 6, background: 'var(--on-surface-variant)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            <span style={{ width: 6, height: 6, background: 'var(--on-surface-variant)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s' }} />
            <span style={{ width: 6, height: 6, background: 'var(--on-surface-variant)', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s' }} />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{
        padding: '12px 16px', background: 'var(--surface)', borderTop: '1px solid var(--outline)',
        display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask me anything..."
          style={{
            flex: 1, padding: '14px 16px', borderRadius: 24, border: '1px solid var(--outline)',
            background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: 14, outline: 'none'
          }}
        />
        <button type="submit" disabled={!input.trim()} style={{
          background: input.trim() ? 'var(--lime-400)' : 'var(--surface-container)',
          color: input.trim() ? '#000' : 'var(--on-surface-variant)',
          border: 'none', width: 44, height: 44, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.3s'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </button>
      </form>
    </div>
  );
}
