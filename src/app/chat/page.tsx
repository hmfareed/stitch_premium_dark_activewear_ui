'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore, useAuth, useUserActivity, useCart, useWishlist, useToast } from '@/context/AppContext';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string; // HH:MM
  status: 'sent' | 'delivered' | 'read';
  products?: any[];
  actions?: { label: string; value: string; type?: 'link' | 'query' }[];
  type?: 'text' | 'product_list' | 'faq';
  hasTail?: boolean;
  marginTop?: string;
}

// Pre-packaged older message history for the infinite inverse scroll back-history
const olderHistoryMockup: Omit<Message, 'hasTail' | 'marginTop'>[] = [
  {
    id: 'h1',
    role: 'user',
    content: 'Do you sell running shoes?',
    timestamp: '10:05 AM',
    status: 'read',
  },
  {
    id: 'h2',
    role: 'assistant',
    content: 'Yes! We have an excellent selection of high-performance running and training shoes in our activewear catalog. Would you like me to show them to you?',
    timestamp: '10:06 AM',
    status: 'read',
  },
  {
    id: 'h3',
    role: 'user',
    content: 'Are they true to size?',
    timestamp: '10:07 AM',
    status: 'read',
  },
  {
    id: 'h4',
    role: 'assistant',
    content: 'Yes, our sports shoes generally fit true to size. If you are between sizes, we always suggest sizing up for comfort during runs or high-intensity workouts!',
    timestamp: '10:08 AM',
    status: 'read',
  },
  {
    id: 'h5',
    role: 'user',
    content: 'Nice. Do you accept MTN MoMo?',
    timestamp: '10:10 AM',
    status: 'read',
  },
  {
    id: 'h6',
    role: 'assistant',
    content: 'Absolutely! We support MTN MoMo, Telecel Cash, and AirtelTigo Money directly via Paystack escrow for your security.',
    timestamp: '10:11 AM',
    status: 'read',
  },
  {
    id: 'h7',
    role: 'user',
    content: 'Great, how long does delivery take inside Accra?',
    timestamp: '10:12 AM',
    status: 'read',
  },
  {
    id: 'h8',
    role: 'assistant',
    content: 'Delivery within Accra takes between 24 to 48 hours. For regional shipping outside Accra, it typically takes 2 to 4 business days.',
    timestamp: '10:14 AM',
    status: 'read',
  },
  {
    id: 'h9',
    role: 'user',
    content: 'Are there delivery charges?',
    timestamp: '10:15 AM',
    status: 'read',
  },
  {
    id: 'h10',
    role: 'assistant',
    content: 'Yes, standard delivery inside Accra is GH₵25. Dynamic delivery options will show at checkout based on your exact delivery zone!',
    timestamp: '10:16 AM',
    status: 'read',
  },
];

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { allProducts } = useStore();
  const { recentlyViewed } = useUserActivity();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();

  // Primary active messages list - initialized with helpful initial messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'i1',
      role: 'assistant',
      content: `Hello there! I am your AfriCart Personal Shopper. I am here to help you browse activewear, track delivery, or find matching outfits.`,
      timestamp: '04:15 PM',
      status: 'read',
    },
    {
      id: 'i2',
      role: 'assistant',
      content: `I can recommend gear based on what you look at, or switch into local Pidgin mode if you prefer!`,
      timestamp: '04:16 PM',
      status: 'read',
    },
    {
      id: 'i4',
      role: 'assistant',
      content: 'What specifically can I help you find today? Ask me about sizes, track an order, or explore categories!',
      timestamp: '04:18 PM',
      status: 'read',
      actions: [
        { label: 'Explore Shoes', value: 'shoes', type: 'query' },
        { label: 'Track Order', value: 'track my order', type: 'query' },
        { label: 'Sizing Help', value: 'what is my size', type: 'query' },
        { label: 'Become a Seller', value: 'how to sell on africart', type: 'query' },
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPidgin, setIsPidgin] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Scroll back history states for infinite scroll
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Multi-turn Conversational state machine
  const [sessionState, setSessionState] = useState<{
    stage: 'idle' | 'awaiting_tracking_input' | 'awaiting_email_for_order_id';
    tempOrderId?: string;
  }>({ stage: 'idle' });

  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to format HH:MM timestamps
  const getCurrentTimeStr = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // hour '0' is '12'
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minStr} ${ampm}`;
  };

  // Scroll to bottom helper
  const scrollToBottom = useCallback((instant = false) => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: instant ? 'instant' : 'smooth',
    } as ScrollToOptions);
  }, []);

  // Visual viewport keyboard-resize watcher for mobile web
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleViewport = () => {
      const keyboardHeight = Math.max(0, window.innerHeight - (vv.offsetTop + vv.height));
      setKeyboardOffset(keyboardHeight);
      setTimeout(() => scrollToBottom(true), 60);
    };
    vv.addEventListener('resize', handleViewport);
    vv.addEventListener('scroll', handleViewport);
    return () => {
      vv.removeEventListener('resize', handleViewport);
      vv.removeEventListener('scroll', handleViewport);
    };
  }, [scrollToBottom]);

  // Initial load - immediately snap to bottom without transition
  useEffect(() => {
    scrollToBottom(true);
  }, [scrollToBottom]);

  // Handle scroll events: toggle Scroll-To-Bottom pill, load back-history on reaching top
  const handleScroll = () => {
    const container = messagesRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollDown(distanceFromBottom > 160);

    // Inverse Scroll Triggers at top (scrollTop < 10)
    if (container.scrollTop < 10 && hasMoreOlder && !isLoadingOlder) {
      loadOlderMessages();
    }
  };

  const loadOlderMessages = () => {
    setIsLoadingOlder(true);
    const container = messagesRef.current;
    const oldHeight = container ? container.scrollHeight : 0;
    const oldScrollTop = container ? container.scrollTop : 0;

    setTimeout(() => {
      const nextChunk = olderHistoryMockup.slice(loadedCount, loadedCount + 4);
      if (nextChunk.length === 0) {
        setHasMoreOlder(false);
        setIsLoadingOlder(false);
        return;
      }

      setMessages(prev => {
        const formattedChunk = nextChunk.map(m => ({
          ...m,
          id: `h-${m.id}-${Date.now()}`,
        }));
        return [...formattedChunk.reverse(), ...prev];
      });

      setLoadedCount(prev => prev + 4);
      setIsLoadingOlder(false);

      // Adjust scroll jump-free after content prepends
      setTimeout(() => {
        if (container) {
          container.scrollTop = oldScrollTop + (container.scrollHeight - oldHeight);
        }
      }, 0);
    }, 850); // Fluid artificial loader timing
  };

  // Helper: Generates beautiful order details response
  const generateOrderTrackingResult = (order: any): Omit<Message, 'id' | 'timestamp' | 'status'> => {
    const status = order.status || 'Pending';
    const itemsCount = order.itemsCount || order.products?.length || 1;
    const dateStr = order.date ? new Date(order.date).toLocaleDateString('en-GH', { dateStyle: 'medium' }) : 'recently';
    const totalAmount = order.total || 0;
    
    // Determine shipping status descriptions
    let statusDesc = '';
    let emoji = '📦';
    if (status === 'Pending') {
      statusDesc = isPidgin 
        ? 'We don receive your order, payment confirm! Shop vendor dey prepare items now.'
        : 'Your order has been placed and payment is secured in escrow. The vendor is being notified to prepare your gear.';
      emoji = '⏳';
    } else if (status === 'Processing' || status === 'Ongoing') {
      statusDesc = isPidgin
        ? 'Vendor dey pack your gear! Logistic partner go pick am up soon.'
        : 'Your items are being packed and inspected. Our local logistics partner will retrieve them shortly.';
      emoji = '📦';
    } else if (status === 'Shipped') {
      statusDesc = isPidgin
        ? 'Your gear dey road! Courier dey drive sharply to your address.'
        : 'Your order is currently on the move! The delivery agent is en route to your shipping location.';
      emoji = '🚚';
    } else if (status === 'Delivered') {
      statusDesc = isPidgin
        ? 'Success! You don receive your gear. Escrow fund go release to vendor soon.'
        : 'Delivered! Your activewear has successfully reached you. Hope you love the fit!';
      emoji = '✅';
    } else if (status === 'Cancelled') {
      statusDesc = isPidgin
        ? 'Aww, this order was cancelled. We don refund your money.'
        : 'This order was cancelled. Any processed payment has been safely returned to your wallet/account.';
      emoji = '❌';
    }

    const itemsSummary = order.products?.map((p: any) => `- ${p.name} (x${p.quantity || 1})`).join('\n') || '';

    const trackingBody = isPidgin
      ? `### Tracking for Order **${order.orderId}**\n` +
        `**Status**: ${emoji} **${status.toUpperCase()}**\n` +
        `**Date Placed**: ${dateStr}\n` +
        `**Items (${itemsCount})**:\n${itemsSummary}\n` +
        `**Total Price**: GH₵${totalAmount.toFixed(2)}\n\n` +
        `**Progress Update**: ${statusDesc}`
      : `### Tracking Details: Order **${order.orderId}**\n` +
        `**Current Stage**: ${emoji} **${status.toUpperCase()}**\n` +
        `**Ordered On**: ${dateStr}\n` +
        `**Item Breakdown** (${itemsCount}):\n${itemsSummary}\n` +
        `**Total Bill**: GH₵${totalAmount.toFixed(2)}\n\n` +
        `**Latest Status**: ${statusDesc}`;

    return {
      role: 'assistant',
      content: trackingBody,
      actions: [
        { label: 'View Full Order Portal', value: `/track`, type: 'link' },
        { label: 'Shop More Items', value: 'shoes', type: 'query' },
      ],
    };
  };

  // Helper: Look up orders by email address
  const handleTrackByEmail = async (email: string, isAutoFromProfile = false): Promise<Omit<Message, 'id' | 'timestamp' | 'status'>> => {
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await res.json();

      if (res.ok && data.orders && data.orders.length > 0) {
        const userOrders = data.orders;
        
        if (userOrders.length === 1) {
          setSessionState({ stage: 'idle' });
          return generateOrderTrackingResult(userOrders[0]);
        }

        // Present multiple options
        const orderActions = userOrders.slice(0, 4).map((o: any) => ({
          label: `${o.orderId} (GH₵${o.total})`,
          value: `track_specific_order_${o.orderId}_${email.trim().toLowerCase()}`,
          type: 'query' as const,
        }));

        setSessionState({ stage: 'idle' });
        return {
          role: 'assistant',
          content: isPidgin
            ? `I find **${userOrders.length} orders** for your email (${email})! 📦 Click one below to track am sharply:`
            : `I found **${userOrders.length} orders** associated with your email (${email})! 📦 Please click one of the buttons below to track it:`,
          actions: [
            ...orderActions,
            { label: isPidgin ? 'Exit Tracking' : 'Cancel', value: 'cancel', type: 'query' },
          ],
        };
      } else {
        if (isAutoFromProfile) {
          setSessionState({ stage: 'awaiting_tracking_input' });
          return {
            role: 'assistant',
            content: isPidgin
              ? `I check your account (${email}) but I no see any order. No worry! If you buy am as guest, abeg write the guest **Order ID** or another **Email** make I check.`
              : `I searched your profile (${email}) but didn't find any orders. If you checked out as a guest or used a different email, please enter that **Email** or **Order ID** below to look it up.`,
          };
        } else {
          return {
            role: 'assistant',
            content: isPidgin
              ? `Aww, I search **${email}** but I no see any order. Check spelling or enter your **Order ID** (e.g. ORD-12345).`
              : `I couldn't find any orders registered under **${email}**. Please double-check the email address or enter your **Order ID** instead.`,
          };
        }
      }
    } catch {
      return {
        role: 'assistant',
        content: 'Error connecting to the orders database. Please try again later or visit the Tracking page.',
      };
    }
  };

  // Helper: Look up orders by ID and Email
  const handleTrackByOrderAndEmail = async (orderId: string, email: string): Promise<Omit<Message, 'id' | 'timestamp' | 'status'>> => {
    try {
      const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId.trim())}&email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const data = await res.json();

      if (res.ok && data.order) {
        setSessionState({ stage: 'idle' });
        return generateOrderTrackingResult(data.order);
      } else {
        return {
          role: 'assistant',
          content: isPidgin
            ? `I no fit find Order **${orderId}** with email **${email}**. Make you check details, or enter correct registered email address.`
            : `Could not verify Order ID **${orderId}** with email **${email}**. Please check your details and try again, or enter "cancel" to exit.`,
        };
      }
    } catch {
      return {
        role: 'assistant',
        content: 'Error looking up tracking details. Please try again later.',
      };
    }
  };

  // Smart Reply Orchestrator - covering rich conversational answers, safety checks, and non-insulting behavior
  const generateSmartReply = async (input: string): Promise<Omit<Message, 'id' | 'timestamp' | 'status'>> => {
    const text = input.trim();
    const lower = text.toLowerCase();

    // 1. Cancel / Exit trigger
    if (lower === 'cancel' || lower === 'exit' || lower === 'stop' || lower === 'back') {
      setSessionState({ stage: 'idle' });
      return {
        role: 'assistant',
        content: isPidgin
          ? 'No wahala, make we clear am. Wetin you want do next? I fit suggest fine gears or answer questions!'
          : 'No problem, I have reset our tracking flow. What else can I assist you with today?',
        actions: [
          { label: 'Shop Apparel', value: 'shoes', type: 'query' },
          { label: 'Sizing Guide', value: 'what is my size', type: 'query' },
        ],
      };
    }

    // 2. Specific Quick Reply tracking triggers like "track_specific_order_ORD-123_email@domain.com"
    if (lower.startsWith('track_specific_order_')) {
      const parts = text.split('_');
      if (parts.length >= 5) {
        const orderId = parts[3].toUpperCase();
        const email = parts[4].toLowerCase();
        return await handleTrackByOrderAndEmail(orderId, email);
      }
    }

    // 3. Multi-turn Conversational state handlers
    if (sessionState.stage === 'awaiting_tracking_input') {
      // If user typed an email
      if (text.includes('@')) {
        return await handleTrackByEmail(text);
      }
      
      // If user typed an Order ID
      const orderIdPattern = /ord-\d+/i;
      const match = text.match(orderIdPattern);
      if (match) {
        const matchedOrderId = match[0].toUpperCase();
        setSessionState({ stage: 'awaiting_email_for_order_id', tempOrderId: matchedOrderId });
        return {
          role: 'assistant',
          content: isPidgin
            ? `Okay, I don find order ID **${matchedOrderId}**! To protect your details, abeg write the **Email Address** wey you use pay.`
            : `I found Order ID **${matchedOrderId}**! To verify your identity and protect your details, please reply with the **Email Address** associated with this order.`,
        };
      }

      // Neither matched
      return {
        role: 'assistant',
        content: isPidgin
          ? 'Abeg, write correct email address (e.g. name@mail.com) or Order ID wey start with ORD-.'
          : 'Please enter a valid **Email Address** (e.g., mail@example.com) or an **Order ID** (e.g., ORD-2026112) so I can search for your items. Or type **"cancel"** to go back.',
      };
    }

    if (sessionState.stage === 'awaiting_email_for_order_id') {
      if (text.includes('@')) {
        const email = text.toLowerCase();
        const orderId = sessionState.tempOrderId || '';
        return await handleTrackByOrderAndEmail(orderId, email);
      }
      return {
        role: 'assistant',
        content: isPidgin
          ? `Abeg, make you enter a valid Email Address to verify your Order **${sessionState.tempOrderId}**.`
          : `I need a valid email address to look up Order **${sessionState.tempOrderId}**. Please try again or type **"cancel"** to exit.`,
      };
    }

    // 4. normal / IDLE triggers:

    // --- POLITE RESPONSES (Never Insult under any abusive prompt) ---
    const insults = ['stupid', 'dumb', 'idiot', 'useless', 'fool', 'crazy', 'nonsense', 'rubbish', 'suck', 'hate'];
    if (insults.some(word => lower.includes(word))) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "Abeg no vex! I be AI shopper, and I dey do my absolute best to serve you. Make we focus on fine activewear or help you resolve issues. Wetin you want look today? 🤝"
          : "I'm sorry to hear that! I always aim to do my absolute best to assist you in managing orders and exploring our premium activewear catalog. If there's any specific issue or order mismatch, please let me know. I'm here to support you! 🤝",
        actions: [
          { label: 'View Products', value: 'show me everything', type: 'query' },
          { label: 'Track Order', value: 'track my order', type: 'query' },
        ],
      };
    }

    // --- INTENT: TRACKING / ORDER LOOKUP ---
    if (lower.includes('track') || lower.includes('order status') || lower.includes('where is my') || lower.includes('package') || lower.includes('delivery progress')) {
      // Check for direct shortcut pattern like "track ORD-12345"
      const directIdPattern = /ord-\d+/i;
      const matchedDirect = text.match(directIdPattern);
      if (matchedDirect) {
        const matchedOrderId = matchedDirect[0].toUpperCase();
        if (user && user.email) {
          return await handleTrackByOrderAndEmail(matchedOrderId, user.email);
        } else {
          setSessionState({ stage: 'awaiting_email_for_order_id', tempOrderId: matchedOrderId });
          return {
            role: 'assistant',
            content: isPidgin
              ? `Okay, make we track **${matchedOrderId}**! To verify your order, write the registered **Email Address** associated with it.`
              : `Got it! Let's track Order **${matchedOrderId}**. To secure your privacy, please enter the registered **Email Address** used during checkout.`,
          };
        }
      }

      // If user is logged in, look up their orders automatically!
      if (user && user.email) {
        return await handleTrackByEmail(user.email, true);
      }
      
      // If not logged in, request info
      setSessionState({ stage: 'awaiting_tracking_input' });
      return {
        role: 'assistant',
        content: isPidgin
          ? "I fit help you track your order sharply! 🚚 Since you no login yet, abeg write your **Order ID** (e.g. ORD-10927) or registered **Email Address** below:"
          : "I can help you track your order status in real time! 🚚 Since you are not logged in, could you please provide your **Order ID** (e.g., ORD-10294) or your registered **Email Address**?",
        actions: [
          { label: 'Cancel', value: 'cancel', type: 'query' },
        ],
      };
    }

    // --- INTENT: GREETINGS & CASUAL INTERACTION ---
    const casualGreetings = ['hi', 'hello', 'hey', 'yo', 'howfar', 'how far', 'sup', 'whatsapp', 'good morning', 'good afternoon', 'good evening', 'anybody', 'anyone there'];
    if (casualGreetings.some(greet => wordBoundary(greet).test(lower) || lower.includes('hello') || lower.includes('hey '))) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "How far! Welcome to AfriCart. I be your cyber-dark shopper guide. Any gear you want find or order track today? Ask me sharply! ⚡"
          : "Hello! Welcome to AfriCart support. I am your premium AI shopper guide. How can I brighten your day with some amazing compression clothing or activewear today? ⚡",
        actions: [
          { label: 'Shop Best Sellers', value: 'shoes', type: 'query' },
          { label: 'Track My Order', value: 'track my order', type: 'query' },
        ],
      };
    }

    // --- INTENT: HOW ARE YOU ---
    if (lower.includes('how are you') || lower.includes('how you dey') || lower.includes('doing well')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "I dey design, body dey pepper! Full electric-cyan activewear energy. How you dey do too? Your day dey go fine?"
          : "I am doing fantastic, thank you for asking! Feeling fully energized with AfriCart electric activewear vibes. How are you doing today?",
      };
    }

    // --- INTENT: SPEAK PIDGIN TOGGLE ---
    if (lower.includes('pidgin') || lower.includes('speak local') || lower.includes('talk local') || lower.includes('yarn pidgin')) {
      setIsPidgin(true);
      return {
        role: 'assistant',
        content: "No wahala! I don switch go **Local Pidgin Mode** sharp-sharp. Now you fit ask me anything for pidgin, and I go yarn you local. Wetin you want buy today? 😂",
        actions: [{ label: 'STANDARD ENGLISH', value: 'english mode', type: 'query' }],
      };
    }
    if (lower.includes('english mode') || lower.includes('speak english')) {
      setIsPidgin(false);
      return {
        role: 'assistant',
        content: "Understood! I have switched back to standard English. How can I help you explore activewear or manage order dispatch details?",
      };
    }

    // --- INTENT: STORE LOCATION & OPERATIONS ---
    if (lower.includes('where is') || lower.includes('location') || lower.includes('address') || lower.includes('located') || lower.includes('physical store') || lower.includes('office')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "AfriCart be 100% digital online marketplace! 🌐 We no get physical retail shop, so we save cost to make our gears cheaper and premium. Our main tech office dey Accra, but we deliver to your doorstep anywhere in Ghana!"
          : "AfriCart is a fully digital premium activewear marketplace! 🌐 We do not run brick-and-mortar storefronts to save on overhead and keep our gear prices highly competitive. Our corporate and engineering office is in Accra, Ghana, and we ship directly to your home nationwide.",
        actions: [
          { label: 'Explore Products', value: 'show me everything', type: 'query' },
          { label: 'How much is delivery?', value: 'delivery fee', type: 'query' },
        ],
      };
    }

    if (lower.includes('work') || lower.includes('hour') || lower.includes('open') || lower.includes('close') || lower.includes('time')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "Our website and customer support chat open **24/7**! ⏱️ You fit order anytime. Vendor packaging and dispatch riders dey run Monday to Saturday, 8:00 AM go 5:00 PM."
          : "Our online storefront and AI chat assistance are open **24 hours a day, 7 days a week**! ⏱️ You can order anytime. Partner vendor packaging and courier dispatches occur Monday to Saturday, 8:00 AM to 5:00 PM.",
      };
    }

    // --- INTENT: DELIVERY / FEES ---
    if (lower.includes('shipping') || lower.includes('delivery') || lower.includes('courier') || lower.includes('fee') || lower.includes('charges') || lower.includes('how much to ship')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "We dey ship nationwide for Ghana! 🚚 Delivery fees dey compute dynamically at checkout:\n- **Accra (Standard)**: GH₵25 (within 1-2 days)\n- **Accra (Express Same-Day)**: GH₵40\n- **Regional (Kumasi, Tamale, Takoradi)**: GH₵50 (2-4 business days)."
          : "We ship nationwide across Ghana! 🚚 Rates are dynamically computed at checkout based on location:\n- **Accra (Standard)**: GH₵25 (takes 24-48 hours)\n- **Accra (Express Same-Day)**: GH₵40 (on dispatch rider)\n- **Regional (Kumasi, Tamale, Takoradi)**: GH₵50 (takes 2-4 business days).",
        actions: [
          { label: 'Track Order', value: 'track my order', type: 'query' },
          { label: 'Browse Apparel', value: 'all', type: 'query' },
        ],
      };
    }

    // --- INTENT: SIZING GUIDE ---
    if (lower.includes('size') || lower.includes('fit') || lower.includes('measure') || lower.includes('chart')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "Our sports clothing and compression shorts run **true to size**! 📏\n- If you like tight compression fit, pick your normal sizing.\n- If you like loose relaxed style, we advice to size up by one level. Generous athletic sizing applies to shoes too!"
          : "We want your apparel to fit you beautifully! 📏 Our activewear lines generally fit **true to size**.\n- For athletic compression shorts/leggings, buy your standard size for a snug feel.\n- If you are between sizes or prefer a relaxed training fit, we recommend sizing up one level. Shoes fit standard athletic sizes.",
        actions: [
          { label: 'View All Products', value: 'show me everything', type: 'query' },
        ],
      };
    }

    // --- INTENT: PAYMENTS, Momo, paystack security ---
    if (lower.includes('pay') || lower.includes('momo') || lower.includes('mobile money') || lower.includes('card') || lower.includes('checkout') || lower.includes('escrow') || lower.includes('cash on delivery') || lower.includes('cod')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "Security 100%! 🛡️ We no get cash on delivery. All payments go through **Paystack** escrow. We accept MTN Mobile Money, Telecel Cash, and Bank Cards. AfriCart go hold the money safe, and release am to vendor only when you receive your gear!"
          : "Your payment security is guaranteed! 🛡️ We do not offer Cash on Delivery. To protect buyers and vendors, we secure all payments through **Paystack** escrow. We accept MTN MoMo, Telecel Cash, AirtelTigo Money, and Credit Cards. AfriCart holds your payment safely in escrow, releasing it to the seller only after you confirm delivery!",
        actions: [
          { label: 'Learn Returns', value: 'refund policy', type: 'query' },
        ],
      };
    }

    // --- INTENT: RETURNS, REFUNDS & WRONG SIZE ---
    if (lower.includes('refund') || lower.includes('return') || lower.includes('dispute') || lower.includes('defective') || lower.includes('exchange')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "AfriCart offers a **7-day return guarantee** on sportswear! 🔄 If item no fit or get fault, go 'My Orders' portal start return request sharply. Escrow funds go dey locked until you get full refund or replacement."
          : "We provide a solid **7-day return guarantee** on all apparel and sports gear! 🔄 If an item is defective, wrong size, or doesn't match description, initiate a return request on your 'My Orders' dashboard. Your funds stay locked safely in escrow until your issue is fully resolved.",
        actions: [
          { label: 'Support Chat', value: '/chat', type: 'link' },
        ],
      };
    }

    // --- INTENT: BECOME A SELLER / VENDOR ---
    if (lower.includes('vendor') || lower.includes('sell') || lower.includes('merchant') || lower.includes('become a seller') || lower.includes('register shop')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "Want to grow your activewear or tech sales? 📈 Join AfriCart as verified vendor! We go give you metrics portal, staff logins, and dispatch dashboard. Register sharply for here: [africart-one.vercel.app/apply](https://africart-one.vercel.app/apply)!"
          : "Want to scale your retail brand or clothing shop? 📈 Apply to become a verified AfriCart Vendor! We equip you with custom dashboards, payouts log, shipping coordination, and staff accounts. Apply today at [https://africart-one.vercel.app/apply](https://africart-one.vercel.app/apply)!",
        actions: [
          { label: 'Apply Portal', value: '/apply', type: 'link' },
        ],
      };
    }

    // --- INTENT: POLITE PRAISE / THANKS ---
    if (lower.includes('thank') || lower.includes('thanks') || lower.includes('great job') || lower.includes('you are smart') || lower.includes('awesome') || lower.includes('perfect')) {
      return {
        role: 'assistant',
        content: isPidgin
          ? "You welcome! 🙌 Body dey pepper, full activewear energy! Anything other gear you need make you tell me sharply!"
          : "You are very welcome! 😊 It is always a absolute pleasure helping you discover premium fitness wear and coordinates. Let me know if you need any other assistance!",
      };
    }

    // --- INTENT: SPECIFIC CATEGORY FILTER SEARCH ---
    let categoryQuery = '';
    if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('footwear')) {
      categoryQuery = 'Footwear';
    } else if (lower.includes('leggings') || lower.includes('compression') || lower.includes('pants')) {
      categoryQuery = 'Apparel';
    } else if (lower.includes('short') || lower.includes('tee') || lower.includes('shirt')) {
      categoryQuery = 'Apparel';
    } else if (lower.includes('accessory') || lower.includes('bottle') || lower.includes('socks')) {
      categoryQuery = 'Accessories';
    }

    let filtered = [...allProducts];
    if (categoryQuery) {
      filtered = filtered.filter(p => p.category === categoryQuery);
    } else {
      const keywords = lower.split(' ').filter(w => w.length > 3);
      if (keywords.length > 0) {
        filtered = filtered.filter(p =>
          keywords.some(k =>
            p.name.toLowerCase().includes(k) ||
            p.description.toLowerCase().includes(k) ||
            p.category.toLowerCase().includes(k)
          )
        );
      }
    }

    // Price query filters like "under 200"
    const priceMatch = lower.match(/\d+/);
    if (priceMatch && (lower.includes('under') || lower.includes('below') || lower.includes('budget') || lower.includes('cost'))) {
      const maxPrice = parseInt(priceMatch[0]);
      filtered = filtered.filter(p => p.price <= maxPrice);
    }

    if (filtered.length > 0) {
      return {
        role: 'assistant',
        content: isPidgin
          ? `I check our activewear rack, look these fine ones wey I find for you:`
          : `I checked our activewear collections, here are some great matching recommendations:`,
        products: filtered.slice(0, 4),
        actions: [
          { label: 'Filter Budget Under GH₵250', value: 'under 250', type: 'query' },
          { label: 'Explore Shoes', value: 'shoes', type: 'query' },
        ],
      };
    }

    // Default Fallback
    return {
      role: 'assistant',
      content: isPidgin
        ? "Hmm, I no hear that one clearly. Ask me about **delivery rates**, **sizes**, **MTN MoMo**, or write **'track'** make we check your package status sharply!"
        : "I'm not sure I understand that request perfectly. Ask me about **delivery fees**, **activewear sizes**, **Paystack escrow security**, or type **'track order'** to locate your package in real time!",
      actions: [
        { label: 'Track Order', value: 'track my order', type: 'query' },
        { label: 'Explore Shop', value: 'shoes', type: 'query' },
      ],
    };
  };

  // Safe boundary matching word finder
  const wordBoundary = (pattern: string) => {
    return new RegExp(`\\b${pattern}\\b`, 'i');
  };

  // Sends message
  const handleSend = (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMessageContent = text.trim();
    const messageId = `msg-${Date.now()}`;
    const messageTime = getCurrentTimeStr();

    // 1. Instantly append sent message with 'sent' status
    const newMsg: Message = {
      id: messageId,
      role: 'user',
      content: userMessageContent,
      timestamp: messageTime,
      status: 'sent',
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Scroll down to reveal immediately
    setTimeout(() => scrollToBottom(), 10);

    // 2. Transition tick to 'delivered' (WhatsApp gray double tick) after 500ms
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status: 'delivered' } : m))
      );
    }, 550);

    // 3. Simulated online response cycle (delivered -> read/blue ticks -> typing -> answer)
    setTimeout(async () => {
      // Set to read (blue double ticks)
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, status: 'read' } : m))
      );

      // Start typing indicator
      setIsTyping(true);
      setTimeout(() => scrollToBottom(), 50);

      // 4. Generate dynamic response asynchronously (supports realtime DB orders fetch)
      const botResponse = await generateSmartReply(userMessageContent);

      // Bot delivers final answer bubble
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [
          ...prev,
          {
            ...botResponse,
            id: `msg-bot-${Date.now()}`,
            timestamp: getCurrentTimeStr(),
            status: 'read',
          },
        ]);
        setTimeout(() => scrollToBottom(), 50);
      }, 1200);
    }, 1200);
  };

  const handleAction = (action: { label: string; value: string; type?: 'link' | 'query' }) => {
    if (action.type === 'link') {
      router.push(action.value);
    } else {
      handleSend(action.value);
    }
  };

  // Textarea input watcher - handles key event overrides & auto height resizing
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`; // Max grow to 5 lines
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!isMobileDevice) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  // Pre-process consecutive group tags for the tails and clustering layout gaps
  const processedMessages = messages.map((msg, idx) => {
    const prevMsg = idx > 0 ? messages[idx - 1] : null;
    const isConsecutive = prevMsg && prevMsg.role === msg.role;
    
    // Check if within 1 minute of consecutive sender
    const hasTail = !isConsecutive;
    const marginTop = isConsecutive ? '3px' : '14px';

    return {
      ...msg,
      hasTail,
      marginTop,
    };
  });

  return (
    <>
      <style>{`
        /* WhatsApp Theme Styling Rules */
        .whatsapp-chat-container {
          display: flex;
          flex-direction: column;
          position: fixed;
          inset: 0;
          background: #0b141a; /* Dark WA wallpaper bg */
          background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          z-index: 9999;
          overflow: hidden;
          font-family: var(--font-inter), sans-serif;
        }

        [data-theme="light"] .whatsapp-chat-container {
          background: #efeae2; /* Light WA wallpaper bg */
          background-image: radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .whatsapp-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px 16px 12px;
          display: flex;
          flex-direction: column;
          -webkit-overflow-scrolling: touch;
        }

        /* Message Bubbles layout */
        .message-bubble {
          position: relative;
          max-width: 72%;
          padding: 7px 11px 8px 12px;
          font-size: 14px;
          line-height: 1.5;
          box-shadow: 0 1px 1px rgba(0,0,0,0.18);
          display: inline-block;
          word-wrap: break-word;
          animation: bubbleFadeIn 0.2s cubic-bezier(0.1, 0.8, 0.2, 1) both;
        }

        @keyframes bubbleFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .bubble-received {
          align-self: flex-start;
          background-color: var(--surface-container-high);
          color: var(--foreground);
          border-radius: 0px 12px 12px 12px;
        }
        .bubble-received.has-tail {
          border-top-left-radius: 0px;
        }
        .bubble-received.has-tail::before {
          content: "";
          position: absolute;
          top: 0;
          left: -8px;
          width: 8px;
          height: 12px;
          background-color: inherit;
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }

        .bubble-sent {
          align-self: flex-end;
          background-color: #005c4b; /* WhatsApp dark-green bubble */
          color: #e9edef;
          border-radius: 12px 0px 12px 12px;
        }
        [data-theme="light"] .bubble-sent {
          background-color: #d9fdd3; /* WhatsApp light-green bubble */
          color: #111b21;
        }
        .bubble-sent.has-tail {
          border-top-right-radius: 0px;
        }
        .bubble-sent.has-tail::before {
          content: "";
          position: absolute;
          top: 0;
          right: -8px;
          width: 8px;
          height: 12px;
          background-color: inherit;
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }

        /* Float metadata elements on the lower right exactly like WhatsApp */
        .message-meta {
          float: right;
          margin: 6px -4px -4px 8px;
          font-size: 10px;
          color: var(--on-surface-variant);
          opacity: 0.7;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          user-select: none;
        }

        .bubble-sent .message-meta {
          color: rgba(255,255,255,0.65);
        }
        [data-theme="light"] .bubble-sent .message-meta {
          color: rgba(17,27,33,0.55);
        }

        /* Status Check Ticks */
        .status-ticks {
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
        }
        .status-ticks .tick {
          font-size: 12px;
          font-weight: 900;
        }
        .status-ticks .tick-double {
          font-size: 13px;
          font-weight: 900;
        }
        .status-ticks .tick-double.read {
          color: #53bdeb; /* WhatsApp bright blue read receipts */
        }

        /* Typing Bouncing indicator dots */
        .typing-bubble {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          align-self: flex-start;
          background-color: var(--surface-container-high);
          border-radius: 0 12px 12px 12px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.18);
          animation: bubbleFadeIn 0.18s cubic-bezier(0.1, 0.8, 0.2, 1) both;
        }

        .typing-bubble::before {
          content: "";
          position: absolute;
          top: 0;
          left: -8px;
          width: 8px;
          height: 12px;
          background-color: inherit;
          clip-path: polygon(100% 0, 0 0, 100% 100%);
        }

        .typing-dots span {
          width: 6.5px;
          height: 6.5px;
          background-color: var(--on-surface-variant);
          border-radius: 50%;
          display: inline-block;
          animation: dotBounce 1.4s ease-in-out infinite;
          opacity: 0.7;
        }
        .typing-dots span:nth-child(1) { animation-delay: 0s; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }

        /* Floating Scrolldown button */
        .scrolldown-floating-btn {
          position: absolute;
          bottom: 84px;
          right: 18px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--surface-container-high);
          border: 1px solid var(--outline);
          color: var(--foreground);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 100;
          transition: transform 0.15s, opacity 0.2s;
        }
        .scrolldown-floating-btn:hover {
          transform: scale(1.06);
        }

        /* Inline micro-history loader */
        .history-loading-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 8px 0 16px;
          font-size: 11px;
          font-weight: 700;
          color: var(--on-surface-variant);
          gap: 8px;
          animation: fadeIn 0.2s ease-out;
        }

        .history-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--outline);
          border-top: 2px solid var(--lime-400);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      <div
        className="whatsapp-chat-container"
        style={{
          transform: `translateY(-${keyboardOffset}px)`,
          transition: 'transform 0.22s cubic-bezier(0.1, 0.8, 0.2, 1)',
        }}
      >
        {/* --- 1. FIXED HEADER: Pinned and static --- */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--outline)',
          }}
        >
          {/* Back Navigation */}
          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--foreground)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-container-high)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>

          {/* User Avatar with Green Online Status Dot */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 40, height: 42, borderRadius: 14,
              background: 'var(--surface-container-high)',
              border: '1px solid var(--outline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 24 }}>smart_toy</span>
            </div>
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 10, height: 10,
              background: '#25D366', // Active WhatsApp green
              borderRadius: '50%',
              border: '2px solid var(--surface)',
            }} />
          </div>

          {/* Contact metadata */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 15, fontWeight: 800, color: 'var(--foreground)',
              fontFamily: 'var(--font-lexend)', margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              AfriCart Assistant
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 1, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, color: '#25D366', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {isPidgin ? 'LOCAL PIDGIN ACTIVE' : 'ONLINE'}
              </span>
              <button
                onClick={() => setIsPidgin(!isPidgin)}
                style={{
                  background: 'var(--surface-container-highest)', border: 'none',
                  color: 'var(--foreground)', fontSize: 8.5, fontWeight: 800,
                  padding: '1px 7px', borderRadius: 10, cursor: 'pointer',
                  whiteSpace: 'nowrap', textTransform: 'uppercase',
                }}
              >
                {isPidgin ? 'Standard' : 'Pidgin'} Mode
              </button>
            </div>
          </div>
        </div>

        {/* --- 2. SCROLLABLE MIDDLE CHAT LOG AREA --- */}
        <div
          ref={messagesRef}
          onScroll={handleScroll}
          className="whatsapp-messages-area no-scrollbar"
        >
          {/* History Prepend Spinner */}
          {isLoadingOlder && (
            <div className="history-loading-bar">
              <div className="history-spinner" />
              <span>Checking old messages...</span>
            </div>
          )}

          {/* Render Bubble Lists */}
          {processedMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {/* Message block containing bubble and inner float metadata */}
              <div
                className={`message-bubble ${msg.role === 'user' ? 'bubble-sent' : 'bubble-received'} ${msg.hasTail ? 'has-tail' : ''}`}
                style={{ marginTop: msg.marginTop }}
              >
                {/* Bold formatting matcher & paragraph wrapping */}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content.split('**').map((part, idx) =>
                    idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
                  )}
                </div>

                {/* float time & status receipt ticks */}
                <div className="message-meta">
                  <span>{msg.timestamp}</span>
                  {msg.role === 'user' && (
                    <span className="status-ticks">
                      {msg.status === 'sent' && (
                        <span className="material-symbols-outlined tick" style={{ color: '#8696a0' }}>check</span>
                      )}
                      {msg.status === 'delivered' && (
                        <span className="material-symbols-outlined tick-double" style={{ color: '#8696a0' }}>done_all</span>
                      )}
                      {msg.status === 'read' && (
                        <span className="material-symbols-outlined tick-double read">done_all</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Assistant's optional rich-content nodes grouped within the same column alignment */}
              {msg.products && (
                <div style={{
                  marginTop: 8,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 8,
                  width: '90%',
                  maxWidth: 420,
                  alignSelf: 'flex-start',
                  animation: 'bubbleFadeIn 0.22s ease-out both',
                }}>
                  {msg.products.map((p: any) => (
                    <div key={p.id} style={{
                      display: 'flex', flexDirection: 'column',
                      background: 'var(--surface-container-high)',
                      borderRadius: 12, border: '1px solid var(--outline)',
                      overflow: 'hidden',
                    }}>
                      <Link href={`/product/${p.id}`} style={{ textDecoration: 'none', display: 'block', position: 'relative', aspectRatio: '1' }}>
                        <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} />
                        <div style={{
                          position: 'absolute', bottom: 5, left: 5,
                          background: 'rgba(0,0,0,0.72)', padding: '2px 6px',
                          borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 800,
                        }}>
                          GH₵{p.price.toFixed(0)}
                        </div>
                      </Link>
                      <div style={{ padding: '6px 7px 0' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)', margin: 0 }} className="line-clamp-1">{p.name}</p>
                      </div>
                      <div style={{ padding: '5px 7px 7px', display: 'flex', gap: 5 }}>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p); showToast('Added to cart!'); }}
                          style={{ flex: 1, height: 26, borderRadius: 6, background: 'var(--lime-400)', border: 'none', color: '#000', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
                        >
                          CART
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            if (isInWishlist(p.id)) { removeFromWishlist(p.id); showToast('Removed from wishlist'); }
                            else { addToWishlist(p); showToast('Saved to wishlist'); }
                          }}
                          style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface-container)', border: '1px solid var(--outline)', color: isInWishlist(p.id) ? '#ff4444' : 'var(--on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: isInWishlist(p.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {msg.actions && (
                <div style={{
                  marginTop: 6,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignSelf: 'flex-start',
                  width: '95%',
                  animation: 'bubbleFadeIn 0.22s ease-out both',
                }}>
                  {msg.actions.map((action, ai) => (
                    <button
                      key={ai}
                      onClick={() => handleAction(action)}
                      style={{
                        padding: '6px 12px', borderRadius: 20,
                        background: 'transparent',
                        border: '1.5px solid var(--lime-400)',
                        color: 'var(--lime-400)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--lime-400)'; e.currentTarget.style.color = '#000'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lime-400)'; }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator Bubble */}
          {isTyping && (
            <div className="typing-bubble" style={{ marginTop: '12px', position: 'relative' }}>
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {/* --- 3. FLOATING SCROLL DOWN PILL --- */}
        {showScrollDown && (
          <button
            onClick={() => scrollToBottom()}
            className="scrolldown-floating-btn"
            aria-label="Scroll to bottom"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>keyboard_double_arrow_down</span>
          </button>
        )}

        {/* --- 4. FIXED FOOTER INPUT PANEL: Lifts with keyboard --- */}
        <div
          style={{
            flexShrink: 0,
            padding: '8px 10px',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
            background: 'var(--surface)',
            borderTop: '1px solid var(--outline)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end', // Aligns on text bottom as it grows
          }}
        >
          {/* Paperclip Attachment icon */}
          <button
            onClick={() => handleSend('shoes')}
            style={{
              flexShrink: 0,
              width: 40, height: 40, borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: 'var(--on-surface-variant)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-container-high)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
          </button>

          {/* Growable Textarea Container */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isPidgin ? 'Abeg, ask me anything...' : 'Message AfriCart Assistant...'}
              style={{
                width: '100%',
                background: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                color: 'var(--foreground)',
                borderRadius: 20,
                padding: '9px 40px 9px 14px',
                fontSize: 14.5,
                outline: 'none',
                resize: 'none',
                maxHeight: 120, // max 5 lines
                lineHeight: 1.4,
                fontFamily: 'inherit',
                display: 'block',
                overflowY: 'auto',
              }}
            />
            {/* Inner attachment / camera symbol */}
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute', right: 12, bottom: 9,
                fontSize: 21, color: 'var(--on-surface-variant)', opacity: 0.6,
                pointerEvents: 'none',
              }}
            >
              photo_camera
            </span>
          </div>

          {/* Action circular trigger (instantly swaps between Mic or Send depending on text length) */}
          <button
            onClick={() => (input.trim() ? handleSend() : handleSend('shoes'))}
            style={{
              flexShrink: 0,
              width: 40, height: 40,
              borderRadius: '50%',
              background: input.trim() ? '#00af9c' : 'var(--surface-container-high)',
              color: input.trim() ? '#fff' : 'var(--on-surface-variant)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.18s, color 0.18s',
            }}
          >
            {input.trim() ? (
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mic</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
