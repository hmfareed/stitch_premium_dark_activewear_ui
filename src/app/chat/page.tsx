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
      ? `Hi ${user.name.split(' ')[0]}! I'm your AfriCart AI Assistant. I can help you find products, track your orders, or manage your account. How can I assist you today?`
      : "Welcome to AfriCart! I'm your AI Assistant. How can I help you discover amazing products today?";
    
    setMessages([{ id: '1', sender: 'ai', text: greeting, timestamp: new Date() }]);
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateAIResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    
    // 1. Greetings & Identity
    if (/^(hi|hello|hey|greetings|yo)/.test(q)) {
      return `Hello! I'm your AfriCart AI Assistant. I can help you find premium activewear, track your orders, or guide you through your account settings. What's on your mind?`;
    }
    if (q.includes('how are you')) {
      return "I'm doing great, thank you for asking! Just powered up and ready to help you find the best deals on AfriCart. How about you?";
    }
    if (q.includes('who are you') || q.includes('what are you')) {
      return "I'm the official AfriCart AI Assistant. I was created to make your shopping experience seamless, from finding products to tracking deliveries.";
    }
    if (q.includes('thank') || q.includes('thanks')) {
      return "You're very welcome! Is there anything else I can help you with today?";
    }
    if (q.includes('bye') || q.includes('goodbye')) {
      return "Goodbye! Have a great day and come back to AfriCart soon!";
    }

    // 2. Store Information
    if (q.includes('about the store') || q.includes('what is reed store') || q.includes('what is africart')) {
      return "AfriCart is Ghana's premium multi-vendor marketplace for high-quality activewear, electronics, and fashion. We connect top vendors with customers looking for quality and style.";
    }
    if (q.includes('where') && (q.includes('located') || q.includes('store') || q.includes('office'))) {
      return "We are primarily an online marketplace, which allows us to ship anywhere in Ghana! Our main fulfillment hub is located in Accra.";
    }
    if (q.includes('contact') || q.includes('phone') || q.includes('email') || q.includes('support')) {
      return "You can reach our support team at support@africart.com or call us at +233 24 000 0000. We're also available right here in this chat!";
    }
    if (q.includes('time') || q.includes('hours') || q.includes('open')) {
      return "Our website is open 24/7! Our customer support team is available from 8:00 AM to 6:00 PM, Monday to Saturday.";
    }

    // 3. Vendor Inquiries (New!)
    if (q.includes('sell') || q.includes('vendor') || q.includes('become a seller') || q.includes('join as vendor')) {
      return "We'd love to have you! You can apply to become a vendor by going to your Account and clicking 'Become a Vendor', or visit /apply directly. We charge a flat 5% commission on sales.";
    }

    // 4. Product Assistance (Dynamic)
    if (q.includes('cheap') || q.includes('under') || q.includes('affordable') || q.includes('price')) {
      const cheapProducts = allProducts.filter(p => p.price < 100).sort((a,b) => a.price - b.price).slice(0, 3);
      if (cheapProducts.length > 0) {
        return `I found some great affordable options! The ${cheapProducts[0].name} is just GH₵${cheapProducts[0].price}. We also have the ${cheapProducts[1]?.name} for GH₵${cheapProducts[1]?.price}. Should I show you more?`;
      }
    }
    
    if (q.includes('recommend') || q.includes('suggest') || q.includes('looking for') || q.includes('best')) {
      const topRated = allProducts.filter(p => p.rating >= 4.8).slice(0, 2);
      if (topRated.length > 0) {
        return `Based on customer ratings, I highly recommend the ${topRated[0].name} (${topRated[0].rating}/5). It's one of our top sellers. What do you think?`;
      }
      return "Based on popular trends, our Classic Denim Jacket and Noise-Cancelling Headphones are top sellers right now. What specific category are you interested in?";
    }

    if (q.includes('fashion') || q.includes('clothes') || q.includes('wear')) {
      const fashion = allProducts.filter(p => p.category === 'Fashion').slice(0, 2);
      return `We have amazing fashion pieces! Check out the ${fashion[0]?.name || 'Premium Activewear'}. We have a wide range of sizes and styles available.`;
    }

    // 5. Order Management
    if (q.includes('order') || q.includes('track') || q.includes('where is')) {
      if (!user) return "I can certainly help with that! Please log in first so I can access your order history and give you a real-time update.";
      const savedOrders = JSON.parse(localStorage.getItem(`africart-orders-${user.email}`) || '[]');
      if (savedOrders.length === 0) return "It looks like you haven't placed any orders yet. Once you do, I can track them for you right here!";
      const latestOrder = savedOrders[0];
      return `I found your latest order (#${latestOrder.id}). It's currently in the '${latestOrder.status}' stage. You can see the full timeline in your 'Orders' section!`;
    }

    // 6. Checkout & Payment
    if (q.includes('checkout') || q.includes('pay') || q.includes('payment')) {
      if (cart.length === 0) return "Your cart is currently empty. Once you add some items, I can guide you through our secure checkout.";
      return "Ready to shop? We support MTN MoMo, Telecel Cash, and all major bank cards. Our checkout is 100% secure.";
    }

    // 7. Returns & Refunds
    if (q.includes('return') || q.includes('refund')) {
      return "We offer a 30-day return policy for most items in original condition. Refunds are usually processed within 3-5 business days after we receive the item.";
    }

    // 8. Fallback
    return "I'm sorry, I didn't quite catch that. I can help you with product recommendations, store information, order tracking, or becoming a vendor! Could you try rephrasing your question?";
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
            <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 800, color: 'var(--foreground)' }}>AfriCart Assistant</h1>
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
