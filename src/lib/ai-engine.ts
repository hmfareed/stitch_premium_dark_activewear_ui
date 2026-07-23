/**
 * ai-engine.ts
 * Core AI logic for the AfriCart Store Assistant.
 * Implements intent detection, multi-filter product search, product comparison,
 * guided buying questionnaire, cart/wishlist management, and live order tracking.
 */

import { Product } from '@/data/products';

export type AIChatRole = 'assistant' | 'user';
export type UserRole = 'customer' | 'vendor' | 'super_admin' | 'rider' | 'guest';
export type SessionStage =
  | 'idle'
  | 'awaiting_tracking_input'
  | 'awaiting_email_for_order_id'
  | 'questionnaire_laptop'
  | 'questionnaire_shoes'
  | 'questionnaire_apparel'
  | 'questionnaire_phone'
  | 'comparison_awaiting_second'
  | 'express_order_confirm'
  | 'awaiting_phone_issue_clarification'
  | 'awaiting_cancel_confirmation';

export interface UserPreferences {
  favoriteBrands?: string[];
  shoeSize?: string;
  clothingSize?: string;
  preferredPayment?: string;
  deliveryAddress?: string;
  budget?: number;
}

export interface AIMessage {
  id: string;
  role: AIChatRole;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  products?: Product[];
  comparisonProducts?: [Product, Product];
  actions?: AIAction[];
  orderTracking?: OrderTrackingInfo;
  expressOrder?: ExpressOrderInfo;
  hasTail?: boolean;
  marginTop?: string;
}

export interface AIAction {
  label: string;
  value: string;
  type?: 'link' | 'query';
}

export interface OrderTrackingInfo {
  orderId: string;
  status: string;
  statusDesc: string;
  emoji: string;
  dateStr: string;
  itemsCount: number;
  totalAmount: number;
  items: { name: string; quantity: number }[];
}

export interface ExpressOrderInfo {
  product: Product;
  quantity: number;
  subtotal: number;
  shippingEstimate: string;
}

export interface SessionState {
  stage: SessionStage;
  tempOrderId?: string;
  tempProduct?: Product;
  tempQuantity?: number;
  questionnaireStep?: number;
  questionnaireAnswers?: Record<string, string>;
  comparisonFirstProduct?: Product;
  lastSearchedProducts?: Product[];
  lastQuery?: string;
  phoneIssue?: string;
  userPreferences?: UserPreferences;
}

export interface AIEngineContext {
  user: { name: string; email: string; role?: string } | null;
  allProducts: Product[];
  recentlyViewed: Product[];
  cart: { id: string; name: string; price: number; quantity: number }[];
  wishlist: { id: string; name: string; price: number }[];
  isPidgin: boolean;
  sessionState: SessionState;
  setSessionState: (state: SessionState) => void;
  setIsPidgin: (v: boolean) => void;
  addToCart: (product: Product) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  showToast: (msg: string) => void;
}

export type AIResponse = Omit<AIMessage, 'id' | 'timestamp' | 'status'>;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function wb(pattern: string): RegExp {
  return new RegExp(`\\b${pattern}\\b`, 'i');
}

function now(): string {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m < 10 ? '0' + m : m} ${ampm}`;
}

export function makeId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getCurrentTimeStr(): string {
  return now();
}

// ─────────────────────────────────────────────
// ORDER STATUS HELPERS
// ─────────────────────────────────────────────

function buildOrderTrackingInfo(order: any, isPidgin: boolean): OrderTrackingInfo {
  const status: string = order.status || 'Pending';
  const itemsCount: number = order.itemsCount || order.products?.length || 1;
  const dateStr: string = order.date
    ? new Date(order.date).toLocaleDateString('en-GH', { dateStyle: 'medium' })
    : 'recently';
  const totalAmount: number = order.total || 0;
  const items: { name: string; quantity: number }[] =
    (order.products || []).map((p: any) => ({ name: p.name, quantity: p.quantity || 1 }));

  let statusDesc = '';
  let emoji = '📦';

  if (status === 'Pending') {
    emoji = '⏳';
    statusDesc = isPidgin
      ? 'We don receive your order, payment confirm! Vendor dey prepare items now.'
      : 'Your order is confirmed and secured in escrow. The vendor is preparing your items.';
  } else if (status === 'Processing' || status === 'Ongoing') {
    emoji = '📦';
    statusDesc = isPidgin
      ? 'Vendor dey pack your gear! Logistic partner go pick am up soon.'
      : 'Your items are being packed. Our logistics partner will collect them shortly.';
  } else if (status === 'Shipped') {
    emoji = '🚚';
    statusDesc = isPidgin
      ? 'Your gear dey road! Courier dey drive sharply to your address.'
      : 'Your order is on the move! The courier is heading to your delivery address.';
  } else if (status === 'Delivered') {
    emoji = '✅';
    statusDesc = isPidgin
      ? 'Success! You don receive your gear. Escrow go release funds to vendor soon.'
      : 'Delivered! Your items have arrived. Enjoy your gear!';
  } else if (status === 'Cancelled') {
    emoji = '❌';
    statusDesc = isPidgin
      ? 'Aww, this order was cancelled. Your money don refund.'
      : 'This order was cancelled. Any payment has been returned to your account.';
  }

  return { orderId: order.orderId, status, statusDesc, emoji, dateStr, itemsCount, totalAmount, items };
}

// ─────────────────────────────────────────────
// PRODUCT SEARCH ENGINE
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// PRODUCT SEARCH ENGINE (Strict Category Indexing & Smart Intent Detection)
// ─────────────────────────────────────────────

export function searchProducts(query: string, allProducts: Product[]): Product[] {
  const q = query.toLowerCase();
  let results = [...allProducts];

  // 1. Smart Category Intent Detection (from Ai-searchflow.md)
  const intentMap: Record<string, string[]> = {
    'cooking|kitchen|cookware|pot|pan|utensil': ['Home Appliances', 'Cooling', 'Home', 'Groceries', 'Food'],
    'baby|infant|diaper|toddler|nursery': ['Baby', 'Baby Products', 'Toys'],
    'university|college|school|student|study|calculator|notebook': ['Laptops', 'Computing', 'Books', 'Accessories', 'Fashion'],
    'birthday|celebration|gift|party': ['Fashion', 'Electronics', 'Accessories', 'Beauty'],
  };

  for (const [pattern, cats] of Object.entries(intentMap)) {
    if (new RegExp(pattern, 'i').test(q)) {
      const intentFiltered = results.filter(p => cats.includes(p.category));
      if (intentFiltered.length > 0) {
        results = intentFiltered;
        break;
      }
    }
  }

  // 2. Strict Category Shortcuts & Negative Filtering (Strict Indexing)
  const categoryMap: Record<string, string[]> = {
    'shoe|sneaker|footwear|boot|trainer': ['Sports', 'Fashion'],
    'laptop|computer|pc|notebook': ['Laptops', 'Computing'],
    'phone|mobile|smartphone': ['Phones', 'Phones/Tablets'],
    'watch|accessory|bag|belt': ['Accessories', 'Fashion'],
    'shirt|tee|top|jersey': ['Fashion', 'Sports'],
    'pant|trouser|short|legging|compression': ['Fashion', 'Sports'],
    'headphone|earbud|earphone': ['Electronics', 'Mobile Accessories'],
    'fridge|ac|washer|fan|cooler': ['Home Appliances', 'Cooling', 'Washers/Dryers'],
  };

  let categoryHit: string[] = [];
  for (const [pattern, cats] of Object.entries(categoryMap)) {
    if (new RegExp(pattern, 'i').test(q)) {
      categoryHit = cats;
      break;
    }
  }

  if (categoryHit.length > 0) {
    const catFiltered = results.filter(p => categoryHit.includes(p.category));
    if (catFiltered.length > 0) results = catFiltered;
  }

  // 3. Strict Negative Category Filtering (from Ai-searchflow.md Section G)
  // If user asks for "laptop" without explicitly saying "bag", "stand", "sticker", "charger", exclude accessories!
  const isLaptopQuery = /\b(laptop|laptops|computer|pc|notebook)\b/i.test(q);
  const wantsLaptopAccessory = /\b(bag|bags|stand|stands|sticker|stickers|charger|chargers|case|cases|sleeve|sleeves|cable|cables|accessory|accessories)\b/i.test(q);

  if (isLaptopQuery && !wantsLaptopAccessory) {
    results = results.filter(p => {
      const pCat = p.category;
      if (['Accessories', 'Mobile Accessories', 'Phone Accessories'].includes(pCat)) return false;
      const nameLower = p.name.toLowerCase();
      const subLower = (p.subCategory || '').toLowerCase();
      if (/\b(bag|stand|sticker|case|sleeve|charger|cable|holder|rack)\b/i.test(nameLower + ' ' + subLower)) {
        return false;
      }
      return true;
    });
  }

  // If user asks for "shoes" or "running shoes" without asking for "polish", "rack", "socks", exclude non-footwear!
  const isShoeQuery = /\b(shoe|shoes|sneaker|sneakers|footwear|boot|boots|trainer|trainers)\b/i.test(q);
  const wantsShoeAccessory = /\b(polish|rack|racks|socks|sock|cleaner|brush)\b/i.test(q);

  if (isShoeQuery && !wantsShoeAccessory) {
    results = results.filter(p => {
      const nameLower = p.name.toLowerCase();
      if (/\b(polish|rack|socks|cleaner|brush)\b/i.test(nameLower)) return false;
      return true;
    });
  }

  // 4. Color filter
  const colorMatch = q.match(/\b(black|white|red|blue|green|pink|yellow|orange|grey|gray|navy|brown|purple)\b/i);
  if (colorMatch) {
    const color = colorMatch[1].toLowerCase();
    const colorFiltered = results.filter(p =>
      p.colors?.some(c => c.toLowerCase().includes(color)) ||
      p.name.toLowerCase().includes(color) ||
      p.description.toLowerCase().includes(color)
    );
    if (colorFiltered.length > 0) results = colorFiltered;
  }

  // 5. Price ceiling
  const priceMatch = q.match(/\d+/);
  if (priceMatch && /\b(under|below|max|budget|less than|cheaper|within)\b/i.test(q)) {
    const max = parseInt(priceMatch[0]);
    results = results.filter(p => p.price <= max);
  }

  // Price floor
  const priceAboveMatch = q.match(/above\s+(\d+)|over\s+(\d+)|more than\s+(\d+)/i);
  if (priceAboveMatch) {
    const min = parseInt(priceAboveMatch[1] || priceAboveMatch[2] || priceAboveMatch[3]);
    results = results.filter(p => p.price >= min);
  }

  // Rating filter
  const ratingMatch = q.match(/(\d(?:\.\d)?)\s*star/i);
  if (ratingMatch) {
    const minRating = parseFloat(ratingMatch[1]);
    results = results.filter(p => p.rating >= minRating);
  }

  // 6. Keyword search fallback / Multi-attribute matching
  if (results.length === allProducts.length || categoryHit.length === 0) {
    const keywords = q.split(/\s+/).filter(w => w.length > 2 && !['show', 'find', 'need', 'want', 'looking', 'with', 'best', 'good', 'some'].includes(w));
    if (keywords.length > 0) {
      const keyFiltered = results.filter(p =>
        keywords.some(k =>
          p.name.toLowerCase().includes(k) ||
          p.description.toLowerCase().includes(k) ||
          p.category.toLowerCase().includes(k) ||
          (p.subCategory || '').toLowerCase().includes(k) ||
          (p.vendorStoreName || '').toLowerCase().includes(k)
        )
      );
      if (keyFiltered.length > 0 && keyFiltered.length < results.length) {
        results = keyFiltered;
      }
    }
  }

  // Sort: best rated first, then flash sale, then cheapest
  results.sort((a, b) => {
    if (b.isFlashSale !== a.isFlashSale) return a.isFlashSale ? -1 : 1;
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.price - b.price;
  });

  return results;
}

// ─────────────────────────────────────────────
// COMPARISON ENGINE
// ─────────────────────────────────────────────

export function compareProducts(a: Product, b: Product): {
  winner: 'a' | 'b' | 'tie';
  summary: string;
} {
  let aScore = 0;
  let bScore = 0;

  if (a.rating > b.rating) aScore++;
  else if (b.rating > a.rating) bScore++;

  if (a.price < b.price) aScore++;
  else if (b.price < a.price) bScore++;

  if ((a.reviewsCount || 0) > (b.reviewsCount || 0)) aScore++;
  else if ((b.reviewsCount || 0) > (a.reviewsCount || 0)) bScore++;

  if (a.isFlashSale) aScore++;
  if (b.isFlashSale) bScore++;

  const winner = aScore > bScore ? 'a' : bScore > aScore ? 'b' : 'tie';

  let summary = '';
  if (winner === 'tie') {
    summary = `Both products are closely matched! Choose **${a.name}** if price is your top priority, or **${b.name}** if you want a higher-rated option.`;
  } else {
    const winnerProduct = winner === 'a' ? a : b;
    const loserProduct = winner === 'a' ? b : a;
    const reasons: string[] = [];
    if (winnerProduct.rating > loserProduct.rating) reasons.push(`higher rating (${winnerProduct.rating}⭐)`);
    if (winnerProduct.price < loserProduct.price) reasons.push(`lower price (GH₵${winnerProduct.price})`);
    if ((winnerProduct.reviewsCount || 0) > (loserProduct.reviewsCount || 0)) reasons.push(`more reviews`);
    if (winnerProduct.isFlashSale) reasons.push(`flash sale pricing`);
    summary = `**${winnerProduct.name}** wins overall because of its ${reasons.join(', ')}.`;
  }

  return { winner, summary };
}

// ─────────────────────────────────────────────
// QUESTIONNAIRE ENGINE
// ─────────────────────────────────────────────

const QUESTIONNAIRES: Record<string, {
  steps: { key: string; question: string; questionPidgin: string; options?: string[] }[];
}> = {
  laptop: {
    steps: [
      { key: 'budget', question: "What's your budget?", questionPidgin: "Your budget dey how much?", options: ['Under GH₵2000', 'GH₵2000 - 5000', 'Over GH₵5000'] },
      { key: 'use', question: "What will you use it for?", questionPidgin: "Wetin you go use am for?", options: ['Programming', 'Gaming', 'Office/School', 'Design/Video'] },
      { key: 'brand', question: "Any preferred brand?", questionPidgin: "Which brand you like?", options: ['Apple', 'Dell', 'HP', 'Lenovo', 'Any'] },
    ]
  },
  shoes: {
    steps: [
      { key: 'use', question: "What are the shoes for?", questionPidgin: "For wetin you want the shoe?", options: ['Running', 'Gym', 'Casual', 'Football'] },
      { key: 'budget', question: "What's your budget?", questionPidgin: "Budget dey how much?", options: ['Under GH₵200', 'GH₵200 - 500', 'Over GH₵500'] },
      { key: 'size', question: "Your shoe size?", questionPidgin: "Your size na?", options: ['39', '40', '41', '42', '43', '44', '45'] },
    ]
  },
  apparel: {
    steps: [
      { key: 'type', question: "What type of apparel?", questionPidgin: "Wetin kind clothes you want?", options: ['T-Shirts', 'Shorts', 'Leggings', 'Tracksuits', 'Jerseys'] },
      { key: 'fit', question: "Preferred fit?", questionPidgin: "Which fit style you like?", options: ['Tight/Compression', 'Regular', 'Oversized'] },
      { key: 'budget', question: "Budget?", questionPidgin: "Budget?", options: ['Under GH₵100', 'GH₵100 - 300', 'Over GH₵300'] },
    ]
  },
  phone: {
    steps: [
      { key: 'budget', question: "Budget range?", questionPidgin: "Budget dey how much?", options: ['Under GH₵1000', 'GH₵1000 - 2500', 'Over GH₵2500'] },
      { key: 'os', question: "Preferred OS?", questionPidgin: "Which OS you like?", options: ['Android', 'iPhone/iOS', 'No preference'] },
      { key: 'priority', question: "Top priority?", questionPidgin: "Wetin important pass?", options: ['Camera', 'Battery life', 'Performance', 'Price'] },
    ]
  },
};

export function getQuestionnaireStep(type: string, step: number, isPidgin: boolean): AIResponse | null {
  const q = QUESTIONNAIRES[type];
  if (!q || step >= q.steps.length) return null;

  const s = q.steps[step];
  return {
    role: 'assistant',
    content: isPidgin ? s.questionPidgin : s.question,
    actions: s.options?.map(opt => ({ label: opt, value: opt, type: 'query' as const })),
  };
}

export function filterByQuestionnaireAnswers(
  type: string,
  answers: Record<string, string>,
  allProducts: Product[]
): Product[] {
  let results = [...allProducts];

  // Price/budget from answers
  const budgetAnswer = answers.budget || '';
  const budgetUnder = budgetAnswer.match(/under\s+gh[₵c]?\s*(\d+)/i) ||
    budgetAnswer.match(/gh[₵c]?\s*(\d+)/i);
  if (budgetUnder) {
    const max = parseInt(budgetUnder[1]);
    results = results.filter(p => p.price <= max);
  }
  if (/over\s+gh[₵c]?\s*(\d+)/i.test(budgetAnswer)) {
    const minMatch = budgetAnswer.match(/over\s+gh[₵c]?\s*(\d+)/i);
    if (minMatch) results = results.filter(p => p.price >= parseInt(minMatch[1]));
  }
  const rangeParts = budgetAnswer.match(/gh[₵c]?\s*(\d+)\s*-\s*(\d+)/i);
  if (rangeParts) {
    results = results.filter(p => p.price >= parseInt(rangeParts[1]) && p.price <= parseInt(rangeParts[2]));
  }

  // Category
  const catMap: Record<string, string[]> = {
    laptop: ['Laptops', 'Computing'],
    shoes: ['Sports', 'Fashion'],
    apparel: ['Fashion', 'Sports'],
    phone: ['Phones', 'Phones/Tablets'],
  };
  if (catMap[type]) {
    const catFiltered = results.filter(p => catMap[type].includes(p.category));
    if (catFiltered.length > 0) results = catFiltered;
  }

  // Sort by rating
  results.sort((a, b) => b.rating - a.rating);
  return results.slice(0, 6);
}

// ─────────────────────────────────────────────
// ORDER TRACKING HELPERS (async)
// ─────────────────────────────────────────────

export async function fetchOrdersByEmail(email: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/orders?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    const data = await res.json();
    if (res.ok && data.orders?.length > 0) return data.orders;
    return [];
  } catch {
    return [];
  }
}

export async function fetchOrderById(orderId: string, email: string): Promise<any | null> {
  try {
    const res = await fetch(
      `/api/orders?orderId=${encodeURIComponent(orderId.trim())}&email=${encodeURIComponent(email.trim().toLowerCase())}`
    );
    const data = await res.json();
    if (res.ok && data.order) return data.order;
    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// KNOWN COUPONS
// ─────────────────────────────────────────────
export const KNOWN_COUPONS: Record<string, { discount: number; label: string }> = {
  'SAVE10': { discount: 10, label: '10% Off' },
  'AFRI15': { discount: 15, label: '15% Off' },
  'WELCOME20': { discount: 20, label: '20% Welcome Discount' },
  'FLASH25': { discount: 25, label: '25% Flash Deal' },
};

// ─────────────────────────────────────────────
// MAIN INTENT PROCESSOR
// ─────────────────────────────────────────────

export async function processIntent(
  input: string,
  ctx: AIEngineContext
): Promise<AIResponse> {
  const text = input.trim();
  const lower = text.toLowerCase();
  const p = ctx.isPidgin;
  const { user, allProducts, recentlyViewed, sessionState, setSessionState, setIsPidgin } = ctx;

  // ── Exit / cancel ──────────────────────────────
  if (/^(cancel|exit|stop|back|reset|clear)$/i.test(lower)) {
    setSessionState({ stage: 'idle' });
    return {
      role: 'assistant',
      content: p
        ? 'No wahala, I don reset everything. Wetin else I fit help you with? 😊'
        : "No problem! I've reset our flow. What else can I help you with?",
      actions: [
        { label: '🛍️ Shop Now', value: 'show me everything', type: 'query' },
        { label: '📦 Track Order', value: 'track my order', type: 'query' },
      ],
    };
  }

  // ── Handle specific order button clicks ────────
  if (lower.startsWith('track_specific_order_')) {
    const parts = text.split('_');
    if (parts.length >= 5) {
      const orderId = parts[3].toUpperCase();
      const email = parts.slice(4).join('_').toLowerCase();
      const order = await fetchOrderById(orderId, email);
      if (order) {
        setSessionState({ stage: 'idle' });
        return buildOrderResponse(order, p);
      }
      return {
        role: 'assistant',
        content: p
          ? `I no fit verify Order **${orderId}**. Check the details and try again.`
          : `Could not verify Order **${orderId}**. Please check your details.`,
      };
    }
  }

  // ── EXPRESS ORDER CONFIRMATION STAGE ──────────
  if (sessionState.stage === 'express_order_confirm') {
    if (/\b(yes|confirm|place|proceed|order it|do it|go ahead|sure)\b/i.test(lower)) {
      const product = sessionState.tempProduct;
      const qty = sessionState.tempQuantity || 1;
      if (product) {
        for (let i = 0; i < qty; i++) ctx.addToCart(product);
        ctx.showToast(`${qty}x ${product.name} added to cart!`);
        setSessionState({ stage: 'idle' });
        return {
          role: 'assistant',
          content: p
            ? `✅ **${qty}x ${product.name}** don enter your cart! Go to checkout to complete your order.`
            : `✅ **${qty}x ${product.name}** has been added to your cart! Head to checkout to complete your purchase.`,
          actions: [
            { label: '🛒 View Cart', value: '/cart', type: 'link' },
            { label: '🛍️ Continue Shopping', value: 'show me everything', type: 'query' },
          ],
        };
      }
    }
    if (/\b(no|cancel|don't|nope|stop)\b/i.test(lower)) {
      setSessionState({ stage: 'idle' });
      return {
        role: 'assistant',
        content: p ? 'Okay, order cancelled. Anything else?' : 'Order cancelled. How else can I help?',
      };
    }
  }

  // ── QUESTIONNAIRE STAGES ───────────────────────
  if (sessionState.stage.startsWith('questionnaire_')) {
    const qType = sessionState.stage.replace('questionnaire_', '');
    const step = sessionState.questionnaireStep ?? 0;
    const questionnaire = QUESTIONNAIRES[qType];

    if (questionnaire) {
      // Record answer
      const currentStepKey = questionnaire.steps[step].key;
      const newAnswers = { ...(sessionState.questionnaireAnswers || {}), [currentStepKey]: text };
      const nextStep = step + 1;

      if (nextStep < questionnaire.steps.length) {
        setSessionState({
          stage: sessionState.stage,
          questionnaireStep: nextStep,
          questionnaireAnswers: newAnswers,
        });
        const nextQ = getQuestionnaireStep(qType, nextStep, p);
        return nextQ || { role: 'assistant', content: 'Let me find some options for you...' };
      } else {
        // Done collecting answers - search and recommend
        setSessionState({ stage: 'idle' });
        const recommended = filterByQuestionnaireAnswers(qType, newAnswers, allProducts);
        if (recommended.length > 0) {
          return {
            role: 'assistant',
            content: p
              ? `Based on your answers, here are the best ${qType}s for you! 🎯`
              : `Based on your preferences, here are my top recommendations for you! 🎯`,
            products: recommended.slice(0, 4),
            actions: [{ label: '🔄 Start Over', value: 'show me everything', type: 'query' }],
          };
        } else {
          return {
            role: 'assistant',
            content: p
              ? `Hmm, I no find match for those specs. Check these trending ones instead!`
              : `I couldn't find an exact match, but here are some trending alternatives!`,
            products: allProducts.slice(0, 4),
          };
        }
      }
    }
  }

  // ── TRACKING STAGES ────────────────────────────
  if (sessionState.stage === 'awaiting_tracking_input') {
    if (text.includes('@')) {
      return await handleTrackByEmail(text, false, p, setSessionState);
    }
    const oidMatch = text.match(/ord-\d+/i);
    if (oidMatch) {
      const oid = oidMatch[0].toUpperCase();
      if (user?.email) {
        const order = await fetchOrderById(oid, user.email);
        if (order) { setSessionState({ stage: 'idle' }); return buildOrderResponse(order, p); }
      }
      setSessionState({ stage: 'awaiting_email_for_order_id', tempOrderId: oid });
      return {
        role: 'assistant',
        content: p
          ? `I find Order ID **${oid}**. Abeg write your **Email Address** to verify.`
          : `Found Order ID **${oid}**. Please enter your registered **Email Address** to verify.`,
      };
    }
    return {
      role: 'assistant',
      content: p
        ? 'Abeg write your correct **Email** or **Order ID** (e.g. ORD-12345). Or type **cancel** to go back.'
        : 'Please enter a valid **Email** or **Order ID** (e.g., ORD-12345). Type **cancel** to exit.',
    };
  }

  if (sessionState.stage === 'awaiting_email_for_order_id') {
    if (text.includes('@')) {
      const oid = sessionState.tempOrderId || '';
      const order = await fetchOrderById(oid, text);
      if (order) { setSessionState({ stage: 'idle' }); return buildOrderResponse(order, p); }
      return {
        role: 'assistant',
        content: p
          ? `I no fit verify **${oid}** with **${text}**. Check and try again or type **cancel**.`
          : `Could not verify **${oid}** with **${text}**. Double-check and try again, or type **cancel**.`,
      };
    }
    return {
      role: 'assistant',
      content: p
        ? `Abeg enter a valid email to verify Order **${sessionState.tempOrderId}**. Or type **cancel**.`
        : `Please enter a valid email for Order **${sessionState.tempOrderId}**. Or type **cancel**.`,
    };
  }

  // ─────────────────────────────────────────────────────
  // IDLE INTENTS
  // ─────────────────────────────────────────────────────

  // ── POLITE FILTER ──────────────────────────────
  const insults = ['stupid', 'dumb', 'idiot', 'useless', 'fool', 'nonsense', 'rubbish', 'hate'];
  if (insults.some(w => lower.includes(w))) {
    return {
      role: 'assistant',
      content: p
        ? 'Abeg no vex! 🙏 I dey do my best for you. How I fit help you find fine gear today?'
        : "I'm sorry to hear that! I always strive to help. Let me know if there's a specific issue I can resolve. 🤝",
      actions: [
        { label: '🛍️ Browse Products', value: 'show me everything', type: 'query' },
        { label: '📦 Track Order', value: 'track my order', type: 'query' },
      ],
    };
  }

  // ── PIDGIN TOGGLE ─────────────────────────────
  if (/\b(pidgin|local mode|speak local|yarn local|naija mode)\b/i.test(lower)) {
    setIsPidgin(true);
    return {
      role: 'assistant',
      content: `No wahala! I don switch go **Local Mode** sharp-sharp! Ask me anything, abeg 😂`,
      actions: [{ label: '🇬🇧 Switch to English', value: 'english mode', type: 'query' }],
    };
  }
  if (/\b(english mode|speak english|standard mode)\b/i.test(lower)) {
    setIsPidgin(false);
    return {
      role: 'assistant',
      content: 'Switched to Standard English. How can I help you today?',
      actions: [{ label: '🌍 Pidgin Mode', value: 'pidgin', type: 'query' }],
    };
  }

  // ── GREETINGS ─────────────────────────────────
  const greetings = ['hi', 'hello', 'hey', 'howfar', 'how far', 'sup', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => wb(g).test(lower))) {
    const name = user?.name ? `, ${user.name.split(' ')[0]}` : '';
    return {
      role: 'assistant',
      content: p
        ? `How far${name}! 👋 I be your AfriCart AI Shopper. I fit help you find gear, track order, or compare products. Wetin you want today?`
        : `Hey${name}! 👋 I'm your AfriCart AI Shopping Assistant. I can help you find products, track orders, compare items, or manage your cart. What can I do for you?`,
      actions: [
        { label: '🔍 Find Products', value: 'show me everything', type: 'query' },
        { label: '📦 Track My Order', value: 'track my order', type: 'query' },
        { label: '🔥 Today\'s Deals', value: 'flash sale', type: 'query' },
        { label: '✨ Recommend for Me', value: 'recommend something based on my history', type: 'query' },
      ],
    };
  }

  // ── HOW ARE YOU ───────────────────────────────
  if (/how are you|how you dey|doing well/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? "I dey fine! Electric-cyan activewear energy full 🔋. You too dey fine?"
        : "I'm doing great, thank you! Fully energized and ready to help you find some amazing activewear! 🔥",
    };
  }

  // ── TRACKING INTENT ───────────────────────────
  if (/\b(track|order status|where is my|package|delivery progress|my order)\b/i.test(lower)) {
    const directOid = text.match(/ord-\d+/i);
    if (directOid) {
      const oid = directOid[0].toUpperCase();
      const emailToUse = user?.email;
      if (emailToUse) {
        const order = await fetchOrderById(oid, emailToUse);
        if (order) return buildOrderResponse(order, p);
      }
      setSessionState({ stage: 'awaiting_email_for_order_id', tempOrderId: oid });
      return {
        role: 'assistant',
        content: p
          ? `Okay, let me track **${oid}**! Write your registered **Email** to verify.`
          : `Let's track **${oid}**! Please enter the registered **Email Address** for this order.`,
      };
    }

    if (user?.email) {
      return await handleTrackByEmail(user.email, true, p, setSessionState);
    }

    setSessionState({ stage: 'awaiting_tracking_input' });
    return {
      role: 'assistant',
      content: p
        ? "I fit track your order! 🚚 Since you no login, write your **Order ID** (e.g. ORD-10927) or **Email**:"
        : "I can track your order in real time! 🚚 Since you're not logged in, please enter your **Order ID** (e.g., ORD-10294) or registered **Email**:",
      actions: [{ label: '❌ Cancel', value: 'cancel', type: 'query' }],
    };
  }

  // ── MY ORDERS (account) ───────────────────────
  if (/\b(my orders|order history|past orders|purchases)\b/i.test(lower)) {
    if (user?.email) {
      return await handleTrackByEmail(user.email, true, p, setSessionState);
    }
    return {
      role: 'assistant',
      content: p
        ? "Abeg login to see your orders history!"
        : "Please log in to view your full order history.",
      actions: [{ label: '🔑 Login', value: '/login', type: 'link' }],
    };
  }

  // ── CART MANAGEMENT ───────────────────────────
  if (/\b(add to cart|put in cart|buy this|add this)\b/i.test(lower)) {
    // Find the most relevant product
    const keywords = lower.replace(/add to cart|put in cart|buy this|add this/g, '').trim();
    const results = searchProducts(keywords || 'trending', allProducts);
    if (results.length > 0) {
      const product = results[0];
      // Express order flow
      const qty = parseInt(lower.match(/\b(\d+)\s+of\b/i)?.[1] || '1');
      setSessionState({ stage: 'express_order_confirm', tempProduct: product, tempQuantity: qty });
      const subtotal = product.price * qty;
      return {
        role: 'assistant',
        content: p
          ? `I find **${product.name}** (GH₵${product.price}). You want add ${qty}x to cart?\n**Subtotal**: GH₵${subtotal.toFixed(2)}`
          : `I found **${product.name}** at GH₵${product.price} each. Want to add ${qty}× to your cart?\n**Subtotal**: GH₵${subtotal.toFixed(2)}`,
        products: [product],
        actions: [
          { label: '✅ Yes, Add to Cart', value: 'yes', type: 'query' },
          { label: '❌ Cancel', value: 'cancel', type: 'query' },
        ],
      };
    }
    return {
      role: 'assistant',
      content: p ? "Which product you want add?" : "Which product would you like to add to your cart?",
    };
  }

  // ── EXPRESS ORDER ─────────────────────────────
  const expressOrderMatch = lower.match(/\b(order|buy)\s+(.+)/i);
  if (expressOrderMatch || /\b(buy it now|reorder|order the cheapest|buy two|order two)\b/i.test(lower)) {
    let searchTerm = '';
    if (/reorder|buy again/i.test(lower) && recentlyViewed.length > 0) {
      searchTerm = recentlyViewed[0].name;
    } else if (/cheapest|most affordable/i.test(lower)) {
      const cheapest = [...allProducts].sort((a, b) => a.price - b.price)[0];
      searchTerm = cheapest?.name || '';
    } else if (expressOrderMatch) {
      searchTerm = expressOrderMatch[2];
    }

    const results = searchProducts(searchTerm, allProducts);
    if (results.length > 0) {
      const product = results[0];
      const qtyMatch = lower.match(/\b(two|2|three|3|four|4|five|5)\b/i);
      const qtyMap: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, '2': 2, '3': 3, '4': 4, '5': 5 };
      const qty = qtyMatch ? (qtyMap[qtyMatch[1].toLowerCase()] || 1) : 1;
      const subtotal = product.price * qty;

      setSessionState({ stage: 'express_order_confirm', tempProduct: product, tempQuantity: qty });
      return {
        role: 'assistant',
        content: p
          ? `I find **${product.name}** (GH₵${product.price} each). I fit add **${qty}x** to your cart?\n**Total**: GH₵${subtotal.toFixed(2)} + shipping`
          : `I found **${product.name}** at GH₵${product.price.toFixed(2)} each. Shall I add **${qty}×** to your cart?\n**Subtotal**: GH₵${subtotal.toFixed(2)} + shipping`,
        products: [product],
        actions: [
          { label: '✅ Confirm Order', value: 'yes', type: 'query' },
          { label: '❌ Cancel', value: 'cancel', type: 'query' },
        ],
        expressOrder: {
          product,
          quantity: qty,
          subtotal,
          shippingEstimate: 'GH₵25 - GH₵50',
        },
      };
    }
  }

  // ── WISHLIST ──────────────────────────────────
  if (/\b(save to wishlist|add to wishlist|wishlist|heart this|favorite)\b/i.test(lower)) {
    const kw = lower.replace(/save to wishlist|add to wishlist|wishlist|heart this|favorite/g, '').trim();
    const results = searchProducts(kw || 'trending', allProducts);
    if (results.length > 0) {
      const product = results[0];
      if (!ctx.isInWishlist(product.id)) {
        ctx.addToWishlist(product);
        ctx.showToast(`${product.name} saved to wishlist!`);
      }
      return {
        role: 'assistant',
        content: p
          ? `❤️ I don save **${product.name}** to your wishlist! We go tell you if price drop.`
          : `❤️ **${product.name}** has been saved to your wishlist! We'll notify you if the price drops.`,
        products: [product],
        actions: [{ label: '❤️ View Wishlist', value: '/wishlist', type: 'link' }],
      };
    }
  }

  // ── COUPONS ────────────────────────────────────
  if (/\b(coupon|promo|discount code|voucher|deal)\b/i.test(lower)) {
    const foundCode = Object.keys(KNOWN_COUPONS).find(code => lower.includes(code.toLowerCase()));
    if (foundCode) {
      const coupon = KNOWN_COUPONS[foundCode];
      return {
        role: 'assistant',
        content: p
          ? `🎉 Coupon **${foundCode}** valid! You go get **${coupon.label}** on your next order. Apply am at checkout!`
          : `🎉 Coupon **${foundCode}** is valid! You'll get **${coupon.label}** on your order. Apply it at checkout!`,
        actions: [{ label: '🛒 Go to Cart', value: '/cart', type: 'link' }],
      };
    }
    return {
      role: 'assistant',
      content: p
        ? `Try these promo codes wey dey work now:\n• **SAVE10** → 10% off\n• **AFRI15** → 15% off\n• **WELCOME20** → 20% for new customers\n• **FLASH25** → 25% flash deal\n\nApply them at checkout!`
        : `Here are some active promo codes:\n• **SAVE10** → 10% off\n• **AFRI15** → 15% off\n• **WELCOME20** → 20% for new customers\n• **FLASH25** → 25% flash deal\n\nApply them at checkout!`,
      actions: [{ label: '🛒 Shop Now', value: 'show me everything', type: 'query' }],
    };
  }

  // ── PRODUCT COMPARISON ────────────────────────
  if (/\b(compare|vs|versus|difference between|which is better)\b/i.test(lower)) {
    // Extract product names from the query
    const cleaned = lower
      .replace(/compare|vs|versus|difference between|which is better|and|or|\?/gi, ' ')
      .trim();
    const results = searchProducts(cleaned, allProducts);

    if (results.length >= 2) {
      const [a, b] = results.slice(0, 2);
      const { summary } = compareProducts(a, b);
      return {
        role: 'assistant',
        content: p
          ? `Side-by-side comparison for you: 📊\n\n${summary}`
          : `Here's a side-by-side comparison: 📊\n\n${summary}`,
        comparisonProducts: [a, b],
        actions: [
          { label: '🛒 Add to Cart', value: `add to cart ${a.name}`, type: 'query' },
          { label: '🛒 Add Other', value: `add to cart ${b.name}`, type: 'query' },
        ],
      };
    }

    return {
      role: 'assistant',
      content: p
        ? "Which two products you want compare? Write their names make I show you the table."
        : "Which two products would you like to compare? Type their names and I'll show you a comparison table.",
    };
  }

  // ── RECOMMENDATIONS (from history) ────────────
  if (/\b(recommend|for me|suggest|based on my|my taste|personalized)\b/i.test(lower)) {
    if (recentlyViewed.length > 0) {
      const historyProducts = recentlyViewed.slice(0, 4);
      return {
        role: 'assistant',
        content: p
          ? "Based on wetin you dey look recently, here are fine ones for you! ✨"
          : "Based on your browsing history, I think you'll love these! ✨",
        products: historyProducts,
        actions: [{ label: '🔥 Trending Now', value: 'trending', type: 'query' }],
      };
    }
    // No history - start questionnaire
    return {
      role: 'assistant',
      content: p
        ? "Hmm, I no get your history yet. Wetin type of product you dey find?"
        : "I don't have your browsing history yet. What type of product are you looking for?",
      actions: [
        { label: '👟 Shoes', value: 'recommend shoes', type: 'query' },
        { label: '💻 Laptop', value: 'recommend laptop', type: 'query' },
        { label: '📱 Phone', value: 'recommend phone', type: 'query' },
        { label: '👕 Clothing', value: 'recommend apparel', type: 'query' },
      ],
    };
  }

  // ── GUIDED QUESTIONNAIRE TRIGGERS ────────────
  const qTriggers: Record<string, SessionStage> = {
    'recommend laptop|buy laptop|need laptop|looking for laptop': 'questionnaire_laptop',
    'recommend shoe|buy shoe|find shoe|looking for shoe|need shoe': 'questionnaire_shoes',
    'recommend apparel|buy clothes|find clothes|need clothes|gym wear|activewear': 'questionnaire_apparel',
    'recommend phone|buy phone|find phone|need phone|looking for phone': 'questionnaire_phone',
  };
  for (const [pattern, stage] of Object.entries(qTriggers)) {
    if (new RegExp(pattern, 'i').test(lower)) {
      const qType = stage.replace('questionnaire_', '');
      setSessionState({ stage, questionnaireStep: 0, questionnaireAnswers: {} });
      const firstStep = getQuestionnaireStep(qType, 0, p);
      if (firstStep) {
        return {
          ...firstStep,
          content: (p
            ? `Okay, I go help you find the best ${qType}! First question:\n\n`
            : `Let me find the perfect ${qType} for you! First question:\n\n`) + firstStep.content,
        };
      }
    }
  }

  // ── FLASH SALE / DEALS ────────────────────────
  if (/\b(flash sale|deal|discount|sale|offer|promo)\b/i.test(lower)) {
    const saleProducts = allProducts.filter(p => p.isFlashSale || (p.originalPrice && p.originalPrice > p.price));
    if (saleProducts.length > 0) {
      return {
        role: 'assistant',
        content: p
          ? `🔥 These products dey on sale now - grab them before time finish!`
          : `🔥 Hot deals right now — grab them before they're gone!`,
        products: saleProducts.slice(0, 4),
        actions: [{ label: '🛍️ Browse All', value: 'show me everything', type: 'query' }],
      };
    }
  }

  // ── TRENDING / NEW ARRIVALS ───────────────────
  if (/\b(trending|new arrival|popular|best seller|hot|what\'s new|latest)\b/i.test(lower)) {
    const trending = [...allProducts].filter(p => p.isNew || p.rating >= 4.5).sort((a, b) => b.rating - a.rating);
    return {
      role: 'assistant',
      content: p
        ? `These ones dey hot right now! 🔥`
        : `Here's what's trending right now! 🔥`,
      products: trending.slice(0, 4),
      actions: [
        { label: '🔥 Flash Sales', value: 'flash sale', type: 'query' },
        { label: '🛒 View All', value: 'show me everything', type: 'query' },
      ],
    };
  }

  // ── VIEW CART ─────────────────────────────────
  if (/\b(my cart|view cart|what\'s in cart|cart total|show cart)\b/i.test(lower)) {
    const cart = ctx.cart;
    if (cart.length === 0) {
      return {
        role: 'assistant',
        content: p ? "Your cart dey empty! Let me find fine things for you." : "Your cart is empty! Let me show you some great products.",
        actions: [{ label: '🛍️ Browse Products', value: 'show me everything', type: 'query' }],
      };
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const summary = cart.map(item => `• ${item.name} ×${item.quantity} — GH₵${(item.price * item.quantity).toFixed(2)}`).join('\n');
    return {
      role: 'assistant',
      content: p
        ? `Your cart get **${cart.length} item(s)**:\n${summary}\n\n**Total**: GH₵${total.toFixed(2)}`
        : `Your cart has **${cart.length} item(s)**:\n${summary}\n\n**Total**: GH₵${total.toFixed(2)}`,
      actions: [
        { label: '🛒 Checkout', value: '/checkout', type: 'link' },
        { label: '🏪 Continue Shopping', value: 'show me everything', type: 'query' },
      ],
    };
  }

  // ── WISHLIST VIEW ─────────────────────────────
  if (/\b(my wishlist|view wishlist|saved items|favorites)\b/i.test(lower)) {
    const wl = ctx.wishlist;
    if (wl.length === 0) {
      return {
        role: 'assistant',
        content: p ? "Your wishlist dey empty!" : "Your wishlist is empty!",
        actions: [{ label: '🛍️ Browse Products', value: 'show me everything', type: 'query' }],
      };
    }
    const summary = wl.map(item => `• ${item.name} — GH₵${item.price}`).join('\n');
    return {
      role: 'assistant',
      content: p
        ? `You don save **${wl.length} item(s)**:\n${summary}`
        : `You have **${wl.length} saved item(s)**:\n${summary}`,
      actions: [{ label: '❤️ View Wishlist', value: '/wishlist', type: 'link' }],
    };
  }

  // ── SHOW ALL / BROWSE ─────────────────────────
  if (/\b(all|everything|browse|show me|explore|see all|more)\b/i.test(lower)) {
    const popular = [...allProducts].sort((a, b) => b.rating - a.rating);
    return {
      role: 'assistant',
      content: p ? "Here are our top-rated items right now 👇" : "Here are our top-rated products for you 👇",
      products: popular.slice(0, 4),
      actions: [
        { label: '🔥 Flash Sales', value: 'flash sale', type: 'query' },
        { label: '✨ Recommend for Me', value: 'recommend something based on my history', type: 'query' },
      ],
    };
  }

  // ── PAYMENT / MOMO ─────────────────────────────
  if (/\b(pay|momo|mobile money|card|payment|checkout|escrow|cash on delivery|cod)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? "Security 100%! 🛡️ We accept **MTN MoMo**, **Telecel Cash**, **AirtelTigo**, and **Bank Cards** via Paystack escrow. Your money dey safe until you receive your order!"
        : "Your payment is fully secured! 🛡️ We accept **MTN MoMo**, **Telecel Cash**, **AirtelTigo Money**, and **Credit/Debit Cards** via Paystack escrow. Funds are only released to the vendor after you confirm delivery.",
      actions: [{ label: '🛒 Shop Now', value: 'show me everything', type: 'query' }],
    };
  }

  // ── RETURNS / REFUNDS ──────────────────────────
  if (/\b(refund|return|exchange|defective|wrong item|dispute)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? "We get **7-day return guarantee**! 🔄 If item no fit or get fault, go 'My Orders' and start return request. Funds stay locked in escrow until you get full refund!"
        : "We offer a **7-day return guarantee**! 🔄 If an item is defective, wrong size, or misrepresented, start a return from your 'My Orders' page. Your funds remain safely in escrow until resolved.",
      actions: [
        { label: '📦 My Orders', value: '/account/orders', type: 'link' },
        { label: '💬 Support', value: '/chat', type: 'link' },
      ],
    };
  }

  // ── DELIVERY / SHIPPING ────────────────────────
  if (/\b(delivery|shipping|courier|fee|charges|how long|when|dispatch)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? "We ship nationwide! 🚚\n• **Accra (Standard)**: GH₵25 (1-2 days)\n• **Accra (Express)**: GH₵40 (same day)\n• **Regional**: GH₵50 (2-4 business days)"
        : "We deliver nationwide! 🚚\n• **Accra (Standard)**: GH₵25 (1-2 days)\n• **Accra (Same-Day Express)**: GH₵40\n• **Regional (Kumasi, Tamale, etc.)**: GH₵50 (2-4 business days)",
      actions: [
        { label: '📦 Track Order', value: 'track my order', type: 'query' },
        { label: '🛍️ Browse Products', value: 'show me everything', type: 'query' },
      ],
    };
  }

  // ── SIZING ────────────────────────────────────
  if (/\b(size|fit|measure|chart|sizing)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? "Our activewear run **true to size**! 📏\n• For compression/tight fit → pick your normal size\n• For relaxed/oversized → size up by one\n• Shoes → standard athletic sizing applies"
        : "Our activewear fits **true to size**! 📏\n• **Compression fit** → select your standard size\n• **Relaxed/oversized look** → go one size up\n• **Shoes** → follow standard athletic sizing",
      actions: [
        { label: '👟 Shop Shoes', value: 'shoes', type: 'query' },
        { label: '👕 Shop Apparel', value: 'activewear', type: 'query' },
      ],
    };
  }

  // ── BECOME A VENDOR ───────────────────────────
  if (/\b(vendor|sell|merchant|become a seller|register shop|my store|open shop)\b/i.test(lower)) {
    const isVendor = user?.role === 'vendor';
    return {
      role: 'assistant',
      content: isVendor
        ? (p ? "You dey already a vendor! Go your dashboard manage your store." : "You're already a vendor! Head to your dashboard to manage your store.")
        : (p
          ? "Want grow your business? 📈 Join AfriCart as vendor! We go give you metrics portal, staff logins, and dispatch dashboard. Apply here: /apply"
          : "Want to scale your business? 📈 Apply to become a verified AfriCart Vendor! We provide sales dashboards, payouts, shipping tools, and staff accounts."),
      actions: isVendor
        ? [{ label: '📊 Vendor Dashboard', value: '/vendor', type: 'link' }]
        : [{ label: '📝 Apply Now', value: '/apply', type: 'link' }],
    };
  }

  // ── INVENTORY & VENDOR SMART ALERTS ─────────────────────────
  if (/\b(low stock|out of stock|inventory|restock|stock alert|vendor stock)\b/i.test(lower)) {
    const lowStockItems = allProducts.filter(p => (p.stock !== undefined && p.stock < 10) || p.isLimited);
    const lowSummary = lowStockItems.slice(0, 3).map(p => `• **${p.name}**: ${p.stock ?? 5} units remaining`).join('\n');
    return {
      role: 'assistant',
      content: p
        ? `⚠️ **Inventory Alert!** These items dey low stock:\n${lowSummary || '• All products currently have healthy stock level!'}\n\nWe advise to restock before weekend sales start!`
        : `⚠️ **Smart Inventory Monitoring:**\n${lowSummary || '• All products currently have healthy stock levels!'}\n\n**AI Recommendation:** Restock high-demand items before weekend peaks to avoid lost sales!`,
      actions: user?.role === 'vendor' ? [{ label: '📦 Vendor Inventory', value: '/vendor/products', type: 'link' }] : undefined,
    };
  }

  // ── VENDOR SPECIFIC VOICE / TEXT COMMANDS ───────────
  if (/\b(today\'s sales|my sales|pending orders|sales report|top selling)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? `📊 **Vendor Metrics Overview:**\n• **Today's Sales**: GH₵1,450.00\n• **Pending Orders**: 3 orders ready for pickup\n• **Top Seller**: Compression Athletic Tights (14 units this week)`
        : `📊 **Vendor Performance Overview:**\n• **Today's Sales**: GH₵1,450.00\n• **Pending Orders**: 3 orders awaiting courier pickup\n• **Top Seller**: Compression Athletic Tights (14 units sold this week)`,
      actions: [
        { label: '📦 View Pending Orders', value: '/vendor/orders', type: 'link' },
        { label: '💰 Payouts Portal', value: '/vendor/payouts', type: 'link' },
      ],
    };
  }

  // ── SUPER ADMIN VOICE / TEXT COMMANDS ──────────────
  if (/\b(today\'s revenue|platform revenue|approve vendors|pending vendors|customer complaints|suspicious|fraud)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: `🛡️ **Super Admin Operations Overview:**\n• **Today's Platform GMV**: GH₵12,850.00\n• **Pending Vendor Applications**: 2 pending review\n• **Fraud Alert Level**: Low (0 suspicious transactions flagged)\n• **Escrow Fund Balance**: GH₵45,200.00`,
      actions: [
        { label: '📝 Vendor Applications', value: '/admin/vendor-applications', type: 'link' },
        { label: '🚨 Fraud & Security', value: '/admin/fraud-alerts', type: 'link' },
        { label: '📊 System Analytics', value: '/admin/analytics', type: 'link' },
      ],
    };
  }

  // ── DELIVERY ISSUE & SUPPORT COMMANDS ──────────────
  if (/\b(damaged package|lost package|reschedule|change address|courier contact|report issue|call support)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? `🆘 **Delivery Support Helper:**\n• To change delivery address: Submit new address before courier pickup.\n• Damaged/lost package: Escrow funds go dey locked while support team investigates!\n• Support Hotline: +233 20 000 0000`
        : `🆘 **Delivery Resolution Assistant:**\n• **Address Change**: Address changes are allowed prior to courier dispatch.\n• **Damaged/Lost Package**: Escrow payment remains locked until full refund or replacement is dispatched.\n• **Customer Support Line**: +233 20 000 0000`,
      actions: [
        { label: '📦 My Orders Portal', value: '/account/orders', type: 'link' },
        { label: '💬 Support Chat', value: '/chat', type: 'link' },
      ],
    };
  }

  // ── ROLE-SPECIFIC: VENDOR ─────────────────────
  if (user?.role === 'vendor' && /\b(my sales|my revenue|my products|my orders|store stats)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? "Go your Vendor Dashboard to check all your sales metrics, orders, and payouts!"
        : "Head to your Vendor Dashboard to view sales metrics, manage products, and track payouts!",
      actions: [
        { label: '📊 Dashboard', value: '/vendor', type: 'link' },
        { label: '📦 Orders', value: '/vendor/orders', type: 'link' },
        { label: '💰 Payouts', value: '/vendor/payouts', type: 'link' },
      ],
    };
  }

  // ── ROLE-SPECIFIC: SUPER ADMIN ─────────────────
  if (user?.role === 'super_admin' && /\b(admin|user management|analytics|audit|system)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: "Welcome, Super Admin! Here are your management tools:",
      actions: [
        { label: '🔧 Admin Panel', value: '/admin', type: 'link' },
        { label: '📊 Analytics', value: '/admin/analytics', type: 'link' },
        { label: '👥 Users', value: '/admin/users', type: 'link' },
      ],
    };
  }

  // ── LOCATION / STORE ──────────────────────────
  if (/\b(where|location|address|physical store|office)\b/i.test(lower)) {
    return {
      role: 'assistant',
      content: p
        ? "AfriCart na 100% digital marketplace! 🌐 No physical shop, but we deliver anywhere in Ghana. Our tech office dey Accra."
        : "AfriCart is a 100% digital marketplace! 🌐 No physical storefronts — we deliver nationwide across Ghana. Our engineering office is based in Accra.",
    };
  }

  // ── PRODUCT SEARCH (default) ──────────────────
  const results = searchProducts(text, allProducts);
  if (results.length > 0) {
    return {
      role: 'assistant',
      content: results.length > 5
        ? (p ? `I find **${results.length}** items! These are the top picks:` : `Found **${results.length}** items! Here are the top picks:`)
        : (p ? "Look these fine ones I find for you! 👇" : "Here's what I found for you! 👇"),
      products: results.slice(0, 4),
      actions: [
        { label: '💰 Under GH₵200', value: `${text} under 200`, type: 'query' },
        { label: '⭐ Top Rated', value: `top rated ${text}`, type: 'query' },
      ],
    };
  }

  // ── FINAL FALLBACK ────────────────────────────
  return {
    role: 'assistant',
    content: p
      ? "Hmm, I no understand that one well. Try ask me about **delivery**, **sizes**, **MoMo payment**, or write **'track'** to check your order!"
      : "I'm not sure I caught that. Try asking about **delivery fees**, **sizing**, **payment options**, or type **'track order'** to check your delivery status!",
    actions: [
      { label: '📦 Track Order', value: 'track my order', type: 'query' },
      { label: '🛍️ Browse Shop', value: 'show me everything', type: 'query' },
      { label: '🆘 Contact Support', value: '/chat', type: 'link' },
    ],
  };
}

// ─────────────────────────────────────────────
// TRACK BY EMAIL HELPER
// ─────────────────────────────────────────────

async function handleTrackByEmail(
  email: string,
  isAutoFromProfile: boolean,
  isPidgin: boolean,
  setSessionState: (s: SessionState) => void
): Promise<AIResponse> {
  const orders = await fetchOrdersByEmail(email);
  if (orders.length > 0) {
    if (orders.length === 1) {
      setSessionState({ stage: 'idle' });
      return buildOrderResponse(orders[0], isPidgin);
    }
    const orderActions: AIAction[] = orders.slice(0, 4).map((o: any) => ({
      label: `${o.orderId} — GH₵${o.total}`,
      value: `track_specific_order_${o.orderId}_${email.trim().toLowerCase()}`,
      type: 'query' as const,
    }));
    setSessionState({ stage: 'idle' });
    return {
      role: 'assistant',
      content: isPidgin
        ? `I find **${orders.length} orders** for (${email})! 📦 Click one below to track am:`
        : `Found **${orders.length} orders** for (${email})! 📦 Click one to track it:`,
      actions: [...orderActions, { label: '❌ Cancel', value: 'cancel', type: 'query' }],
    };
  }

  if (isAutoFromProfile) {
    setSessionState({ stage: 'awaiting_tracking_input' });
    return {
      role: 'assistant',
      content: isPidgin
        ? `I check ${email} but I no see any order. If you buy as guest, enter your **Order ID** or **another Email**.`
        : `I searched ${email} but found no orders. If you checked out as a guest, enter your **Order ID** or the **email used at checkout**.`,
    };
  }

  return {
    role: 'assistant',
    content: isPidgin
      ? `Aww, no order under **${email}**. Check spelling or enter your **Order ID**.`
      : `No orders found under **${email}**. Check the email or enter your **Order ID** instead.`,
  };
}

function buildOrderResponse(order: any, isPidgin: boolean): AIResponse {
  const info = buildOrderTrackingInfo(order, isPidgin);
  const itemsSummary = info.items.map(i => `• ${i.name} ×${i.quantity}`).join('\n');
  return {
    role: 'assistant',
    content: isPidgin
      ? `### 📦 Tracking: Order **${info.orderId}**\n**Status**: ${info.emoji} **${info.status.toUpperCase()}**\n**Date**: ${info.dateStr}\n**Items** (${info.itemsCount}):\n${itemsSummary}\n**Total**: GH₵${info.totalAmount.toFixed(2)}\n\n${info.statusDesc}`
      : `### 📦 Order Tracking: **${info.orderId}**\n**Status**: ${info.emoji} **${info.status.toUpperCase()}**\n**Ordered**: ${info.dateStr}\n**Items** (${info.itemsCount}):\n${itemsSummary}\n**Total**: GH₵${info.totalAmount.toFixed(2)}\n\n${info.statusDesc}`,
    orderTracking: info,
    actions: [
      { label: '🔗 Track Portal', value: '/track', type: 'link' },
      { label: '🛍️ Shop More', value: 'show me everything', type: 'query' },
    ],
  };
}
