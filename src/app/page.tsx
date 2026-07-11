'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist, useCart, useToast, useStore, useAuth, useUserActivity } from '@/context/AppContext';
import { ProductLoadingSkeleton } from '@/components/ProductLoadingSkeleton';
import QuickViewModal from '@/components/QuickViewModal';
import type { Product } from '@/data/products';

/* ─── Countdown hook ─────────────────────────────────────── */
function useCountdown(targetDate: string | undefined) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const end = new Date(targetDate).getTime();
    const tick = () => {
      const dist = end - Date.now();
      if (dist <= 0) { setTime({ h: 0, m: 0, s: 0 }); return; }
      setTime({
        h: Math.floor(dist / 3_600_000),
        m: Math.floor((dist % 3_600_000) / 60_000),
        s: Math.floor((dist % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`;
}

/* ─── Simulated live viewer count ────────────────────────── */
function useLiveViewers(base: number) {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 5) - 2);
    }, 4000);
    return () => clearInterval(id);
  }, []);
  return Math.max(base - 10, count);
}

/* ─── Loyalty tier helper ───────────────────────────────── */
function getLoyaltyTier(points: number) {
  if (points >= 5000) return { name: 'Platinum', color: '#e5e4e2', icon: '💎', next: null, nextAt: 5000 };
  if (points >= 2000) return { name: 'Gold', color: '#FFD700', icon: '🥇', next: 'Platinum', nextAt: 5000 };
  if (points >= 500) return { name: 'Silver', color: '#C0C0C0', icon: '🥈', next: 'Gold', nextAt: 2000 };
  return { name: 'Bronze', color: '#CD7F32', icon: '🥉', next: 'Silver', nextAt: 500 };
}

/* ─── Category definitions ────────────────────────────────── */
const NAV_CATEGORIES = [
  { name: 'Electronics', icon: 'devices',                   href: '/shop?category=Electronics',  color: '#3b82f6' },
  { name: 'Fashion',     icon: 'checkroom',                 href: '/shop?category=Fashion',      color: '#ec4899' },
  { name: 'Home',        icon: 'chair',                     href: '/shop?category=Home',         color: '#f59e0b' },
  { name: 'Beauty',      icon: 'face_retouching_natural',   href: '/shop?category=Beauty',       color: '#a855f7' },
  { name: 'Phones',      icon: 'smartphone',                href: '/shop?category=Phones',       color: '#10b981' },
  { name: 'Groceries',   icon: 'local_grocery_store',       href: '/shop?category=Groceries',    color: '#f97316' },
  { name: 'Sports',      icon: 'sports_basketball',         href: '/shop?category=Health',       color: '#ef4444' },
  { name: 'Baby',        icon: 'child_care',                href: '/shop?category=Baby',         color: '#8b5cf6' },
];

/* ─── Styles ───────────────────────────────────────────────── */
const S = {
  page:        { display: 'flex', flexDirection: 'column' as const, background: 'var(--background)', minHeight: '100vh' },
  heroWrap:    { position: 'relative' as const, width: '100%', height: '52vw', minHeight: 220, maxHeight: 380, overflow: 'hidden', borderRadius: '0 0 24px 24px' },
  heroOverlay: { position: 'absolute' as const, inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)', zIndex: 10 },
  heroImg:     { width: '100%', height: '100%', objectFit: 'cover' as const },
  heroContent: { position: 'absolute' as const, bottom: 24, left: 20, right: 20, zIndex: 20 },
  heroLabel:   { fontFamily: 'var(--font-lexend)', fontSize: 9, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.22em', textTransform: 'uppercase' as const, marginBottom: 6 },
  heroTitle:   { fontFamily: 'var(--font-lexend)', fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.05, textTransform: 'uppercase' as const, marginBottom: 8 },
  heroSub:     { fontFamily: 'var(--font-inter)', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 16, lineHeight: 1.5 },
  heroBtn:     { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' as const, padding: '11px 22px', borderRadius: 8, transition: 'opacity 0.15s' },
  dotRow:      { display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 },
  section:     { padding: '0 14px' },
  sectionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:{ fontFamily: 'var(--font-lexend)', fontSize: 17, fontWeight: 800, color: 'var(--foreground)' },
  seeAll:      { fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 2 },
  catRow:      { display: 'flex', gap: 8, overflowX: 'auto' as const, paddingBottom: 4, scrollbarWidth: 'none' as const },
  catItem:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, flex: '0 0 70px', cursor: 'pointer', textDecoration: 'none' },
  catCircle:   { width: 58, height: 58, borderRadius: '50%', background: 'var(--surface-container)', border: '1.5px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s, background 0.2s, transform 0.2s' },
  catLabel:    { fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 600, color: 'var(--on-surface-variant)', textAlign: 'center' as const, lineHeight: 1.25 },
  flashBadge:  { background: '#ff2200', color: '#fff', fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 11, padding: '4px 10px', borderRadius: 6, letterSpacing: '0.02em', display: 'inline-flex', alignItems: 'center', gap: 5 },
  timerBox:    { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,34,0,0.12)', border: '1px solid rgba(255,34,0,0.3)', borderRadius: 6, padding: '4px 10px' },
  timerText:   { fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: '#ff4444', letterSpacing: '0.08em' },
  cardRow:     { display: 'flex', gap: 12, overflowX: 'auto' as const, paddingBottom: 4, scrollbarWidth: 'none' as const },
  card:        { flex: '0 0 160px', display: 'flex', flexDirection: 'column' as const, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14, overflow: 'hidden', position: 'relative' as const, transition: 'transform 0.2s, box-shadow 0.2s' },
  cardImgWrap: { position: 'relative' as const, width: '100%', aspectRatio: '1', overflow: 'hidden', background: 'var(--surface-container)' },
  cardImg:     { width: '100%', height: '100%', objectFit: 'cover' as const, transition: 'transform 0.4s ease' },
  cardBody:    { padding: '10px 10px 0', display: 'flex', flexDirection: 'column' as const, gap: 3, flex: 1 },
  cardVendor:  { fontFamily: 'var(--font-inter)', fontSize: 9, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  cardName:    { fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.35 },
  cardRating:  { display: 'flex', alignItems: 'center', gap: 4 },
  cardPrice:   { fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: 'var(--price-color)', marginTop: 2 },
  cardOldPrice:{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--on-surface-variant)', textDecoration: 'line-through', marginLeft: 4 },
  addCartBtn:  { padding: '9px 0', background: 'var(--lime-400)', color: 'var(--on-lime-400)', border: 'none', borderRadius: 8, fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11, letterSpacing: '0.04em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s, transform 0.15s', textTransform: 'uppercase' as const, flex: 1, whiteSpace: 'nowrap' as const },
  addCartBtnDis:{ padding: '9px 0', background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: 'none', borderRadius: 8, fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, textTransform: 'uppercase' as const, letterSpacing: '0.04em', whiteSpace: 'nowrap' as const },
  viewBtn:     { width: 34, height: 34, borderRadius: 8, border: '1px solid var(--outline)', background: 'transparent', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' },
  wishBtn:     { position: 'absolute' as const, top: 8, right: 8, zIndex: 5, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' },
  discountBadge:{ position: 'absolute' as const, top: 8, left: 8, background: 'var(--error)', color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, zIndex: 5, fontFamily: 'var(--font-lexend)' },
  newBadge:    { position: 'absolute' as const, top: 8, left: 8, background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, zIndex: 5, fontFamily: 'var(--font-lexend)' },
  flashCardBadge: { position: 'absolute' as const, top: 8, left: 8, background: '#ff2200', color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, zIndex: 5, fontFamily: 'var(--font-lexend)' },
};

/* ─── Product Card ────────────────────────────────────────── */
function ProductCard({ product, onAddToCart, onWishlist, isWishlisted, onQuickView, showFlashBadge }: {
  product: Product;
  onAddToCart: () => void;
  onWishlist: () => void;
  isWishlisted: boolean;
  onQuickView: () => void;
  showFlashBadge?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [baseViewers] = useState(() => 3 + Math.floor(Math.random() * 15));
  const viewers = useLiveViewers(baseViewers);
  const [fallbackRating] = useState(() => (3.5 + Math.random() * 1.4).toFixed(1));
  const inStock = (product.stock ?? 0) > 0;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.flashSalePrice
      ? Math.round(((product.price - product.flashSalePrice) / product.price) * 100)
      : 0;
  const displayPrice = product.flashSalePrice ?? product.price;
  const stockPercent = Math.min(100, Math.max(0, ((product.stock ?? 50) / 100) * 100));

  const handleAdd = () => {
    if (!inStock) return;
    setAdded(true);
    onAddToCart();
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      style={{ ...S.card, transform: hovered ? 'translateY(-4px)' : 'none', boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.5)' : 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Wish button */}
      <button style={S.wishBtn} onClick={(e) => { e.preventDefault(); onWishlist(); }} aria-label="Toggle wishlist">
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: isWishlisted ? '#ff4444' : '#fff', fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
      </button>

      {/* Badges */}
      {showFlashBadge && <span style={S.flashCardBadge}>⚡ FLASH</span>}
      {!showFlashBadge && discount > 0 && <span style={S.discountBadge}>-{discount}%</span>}
      {!showFlashBadge && !discount && product.isNew && <span style={S.newBadge}>NEW</span>}

      <Link href={`/product/${product.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={S.cardImgWrap}>
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 160px, 200px"
            style={{ objectFit: 'cover', transform: hovered ? 'scale(1.07)' : 'scale(1)', transition: 'transform 0.4s ease' }}
          />
          {/* Live viewers badge */}
          {showFlashBadge && (
            <div style={{
              position: 'absolute', bottom: 6, left: 6, zIndex: 5,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
              borderRadius: 4, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff4444', animation: 'flashDotPulse 1s ease-in-out infinite' }} />
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 9, color: '#fff', fontWeight: 700 }}>{viewers} viewing</span>
            </div>
          )}
        </div>

        <div style={S.cardBody}>
          {product.vendorStoreName && <p style={S.cardVendor}>by {product.vendorStoreName}</p>}
          <p className="line-clamp-2" style={S.cardName}>{product.name}</p>
          <div style={S.cardRating}>
            <span style={{ color: '#f59e0b', fontSize: 11 }}>★</span>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 600, color: 'var(--on-surface-variant)' }}>
              {product.rating ?? fallbackRating}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
            <span style={S.cardPrice}>GH₵{displayPrice.toFixed(2)}</span>
            {(product.originalPrice || product.price > displayPrice) && (
              <span style={S.cardOldPrice}>GH₵{(product.originalPrice || product.price).toFixed(0)}</span>
            )}
          </div>
          {/* Stock bar for flash items */}
          {showFlashBadge && product.stock !== undefined && (
            <div style={{ marginTop: 5 }}>
              <div style={{ height: 3, background: 'var(--outline)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${stockPercent}%`,
                  background: stockPercent < 25 ? '#ff4444' : stockPercent < 60 ? '#f59e0b' : 'var(--lime-400)',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: 9, color: stockPercent < 25 ? '#ff4444' : 'var(--on-surface-variant)', fontWeight: 700, marginTop: 2 }}>
                {stockPercent < 25 ? `Only ${product.stock} left!` : 'In Stock'}
              </p>
            </div>
          )}
        </div>
      </Link>

      {/* Action Row */}
      <div style={{ display: 'flex', gap: 6, margin: '8px 10px 10px', alignItems: 'center' }}>
        <button
          style={inStock ? { ...S.addCartBtn, background: added ? '#22c55e' : 'var(--lime-400)' } : S.addCartBtnDis}
          onClick={inStock ? handleAdd : undefined}
          disabled={!inStock}
          aria-label={inStock ? `Add ${product.name} to cart` : 'Out of stock'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            {added ? 'check_circle' : inStock ? 'add_shopping_cart' : 'remove_shopping_cart'}
          </span>
          {added ? 'Added!' : inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>

        <button
          style={S.viewBtn}
          onClick={(e) => { e.preventDefault(); onQuickView(); }}
          aria-label={`Quick view ${product.name}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>visibility</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Loyalty Progress Banner ──────────────────────────────── */
function LoyaltyBanner({ points }: { points: number }) {
  const tier = getLoyaltyTier(points);
  const prevTierAt = tier.name === 'Bronze' ? 0 : tier.name === 'Silver' ? 500 : tier.name === 'Gold' ? 2000 : 5000;
  const progress = tier.next
    ? Math.min(100, ((points - prevTierAt) / (tier.nextAt - prevTierAt)) * 100)
    : 100;
  const remaining = tier.next ? tier.nextAt - points : 0;

  return (
    <div style={{
      margin: '0 14px', padding: '16px 18px',
      background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-container) 100%)',
      border: `1px solid ${tier.color}33`,
      borderRadius: 14, position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow orb */}
      <div style={{ position: 'absolute', top: -30, right: -20, width: 100, height: 100, background: `${tier.color}22`, filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 18 }}>{tier.icon}</span>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 900, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tier.name}</span>
          </div>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--on-surface-variant)' }}>
            {tier.next ? `${remaining} pts to ${tier.next}` : '🎉 Maximum tier reached!'}
          </p>
        </div>
        <Link href="/account" style={{
          fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700,
          color: 'var(--lime-400)', display: 'flex', alignItems: 'center', gap: 2,
        }}>
          {points} pts <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
        </Link>
      </div>
      {tier.next && (
        <div style={{ height: 5, background: 'var(--outline)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`, borderRadius: 5,
            background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`,
            transition: 'width 1s ease',
          }} />
        </div>
      )}
    </div>
  );
}

/* ─── "Payday Drop" Banner ─────────────────────────────────── */
function PaydayBanner() {
  const now = new Date();
  const day = now.getDate();
  // Show from 24th to end of month
  if (day < 24) return null;
  return (
    <Link href="/shop?filter=flash" style={{ margin: '0 14px', display: 'block', textDecoration: 'none' }}>
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, #1a0a00 0%, #2d1400 50%, #1a0a00 100%)',
        border: '1px solid #f59e0b44', borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(245,158,11,0.03) 10px, rgba(245,158,11,0.03) 20px)' }} />
        <span style={{ fontSize: 28, flexShrink: 0 }}>💰</span>
        <div>
          <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payday Drop 🎉</p>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            Salary landed? Treat yourself — exclusive end-of-month deals live now!
          </p>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f59e0b', flexShrink: 0 }}>arrow_forward</span>
      </div>
    </Link>
  );
}

/* ─── Trust Bar ────────────────────────────────────────────── */
function TrustBar() {
  const items = [
    { icon: 'verified', label: 'Delivered or Refund', color: 'var(--lime-400)' },
    { icon: 'lock', label: 'Paystack Secured', color: '#22c55e' },
    { icon: 'local_shipping', label: '24h Delivery', color: '#f59e0b' },
    { icon: 'support_agent', label: '24/7 Support', color: '#a855f7' },
  ];
  return (
    <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none', borderTop: '1px solid var(--outline)', borderBottom: '1px solid var(--outline)', background: 'var(--surface)' }} className="no-scrollbar">
      {items.map((item, i) => (
        <div key={item.label} style={{
          flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px', borderRight: i < items.length - 1 ? '1px solid var(--outline)' : 'none',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: item.color }}>
            {item.icon}
          </span>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 9, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function HomePage() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { allProducts, productsLoading } = useStore();
  const { user } = useAuth();
  const { recentlyViewed } = useUserActivity();

  const [heroIndex, setHeroIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const heroProducts = allProducts.filter(p => p.image).slice(0, 5);
  const currentHero = heroProducts.length > 0 ? heroProducts[heroIndex] : null;

  const flashProducts = allProducts.filter(p => p.isFlashSale);
  const flashEnd = flashProducts[0]?.flashSaleEnd;
  const countdown = useCountdown(flashEnd);

  // Auto-cycle hero
  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const id = setInterval(() => setHeroIndex(i => (i + 1) % heroProducts.length), 4000);
    return () => clearInterval(id);
  }, [heroProducts.length]);

  // Recommendations
  useEffect(() => {
    try {
      const history: { id: string; category: string }[] = JSON.parse(localStorage.getItem('africart-recently-viewed') || '[]');
      if (history.length > 0 && allProducts.length > 0) {
        const cats = new Set(history.map((p) => p.category));
        const recs = allProducts.filter(p => cats.has(p.category) && !history.find((h) => h.id === p.id)).slice(0, 8);
        setRecommendations(recs.length >= 4 ? recs : allProducts.slice(0, 8));
      } else {
        setRecommendations(allProducts.slice(0, 8));
      }
      // New arrivals: isNew items first, then the rest
      const sorted = [...allProducts].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      setNewArrivals(sorted.slice(0, 8));
    } catch {
      setRecommendations(allProducts.slice(0, 8));
    }
  }, [allProducts]);

  if (productsLoading) return <ProductLoadingSkeleton />;

  const heroImage = currentHero?.image ?? 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&q=80&w=1200';

  const categoryGroups = Array.from(new Set(allProducts.map(p => p.category))).map(cat => ({
    cat,
    products: allProducts.filter(p => p.category === cat).slice(0, 8),
  })).filter(g => g.products.length > 0);

  const addHandler = (product: Product) => {
    addToCart(product);
    showToast(`${product.name} added to cart!`);
  };
  const wishHandler = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      showToast('Removed from wishlist', 'info');
    } else {
      addToWishlist(product);
      showToast('Added to wishlist! ❤️');
    }
  };

  return (
    <div style={S.page}>

      {/* ══════════════════════════════════════
          TRUST BAR  (above hero)
      ══════════════════════════════════════ */}
      <TrustBar />

      {/* ══════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════ */}
      <section className="animate-fade-in" style={S.heroWrap}>
        <div style={S.heroOverlay} />
        <Image
          key={heroImage}
          src={heroImage}
          alt="Hero Banner"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', animation: 'fadeIn 0.6s ease-in-out both' }}
        />
        <div style={S.heroContent}>
          <p style={S.heroLabel}>{currentHero ? 'FEATURED PRODUCT' : '✦ NEW ARRIVALS 2026'}</p>
          <h1 style={S.heroTitle}>
            {currentHero ? currentHero.name : 'Summer\nCollection'}
          </h1>
          <p style={S.heroSub}>
            {currentHero
              ? `GH₵${currentHero.price.toFixed(2)} · Shop this and more from our top sellers.`
              : 'Up to 60% off premium brands. Limited time.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href={currentHero ? `/product/${currentHero.id}` : '/shop'} style={S.heroBtn}>
              {currentHero ? 'View Product' : 'Shop Now'}
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </Link>
            {flashProducts.length > 0 && (
              <Link href="/shop?filter=flash" style={{ ...S.heroBtn, background: '#ff2200', color: '#fff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bolt</span>
                Flash Deals
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Hero dot indicators */}
      {heroProducts.length > 1 && (
        <div style={{ ...S.dotRow, margin: '12px 0 4px' }}>
          {heroProducts.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              style={{ width: i === heroIndex ? 22 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', background: i === heroIndex ? 'var(--lime-400)' : 'var(--outline)', padding: 0, transition: 'width 0.3s, background 0.3s' }}
              aria-label={`Hero slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          LOYALTY BANNER (for logged-in users)
      ══════════════════════════════════════ */}
      {user && (user.points !== undefined) && (
        <section style={{ marginTop: 20 }}>
          <LoyaltyBanner points={user.points} />
        </section>
      )}

      {/* ══════════════════════════════════════
          PAYDAY DROP BANNER
      ══════════════════════════════════════ */}
      <section style={{ marginTop: user ? 12 : 20 }}>
        <PaydayBanner />
      </section>

      {/* ══════════════════════════════════════
          CATEGORY ICONS ROW
      ══════════════════════════════════════ */}
      <section style={{ ...S.section, marginTop: 24, marginBottom: 4 }}>
        <div style={S.catRow} className="no-scrollbar">
          {NAV_CATEGORIES.map((cat, i) => (
            <Link key={cat.name} href={cat.href} style={S.catItem} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
              <div style={{ ...S.catCircle, borderColor: `${cat.color}44` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: cat.color }}>{cat.icon}</span>
              </div>
              <span style={S.catLabel}>{cat.name}</span>
            </Link>
          ))}
          <Link href="/shop" style={S.catItem}>
            <div style={{ ...S.catCircle, background: 'var(--surface-container-high)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--on-surface-variant)' }}>more_horiz</span>
            </div>
            <span style={S.catLabel}>More</span>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FLASH SALE SECTION
      ══════════════════════════════════════ */}
      {flashProducts.length > 0 && (
        <section style={{ ...S.section, marginTop: 28, marginBottom: 4 }}>
          <div style={S.sectionHead}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={S.flashBadge}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'flashDotPulse 1s ease-in-out infinite' }} />
                Flash Sale
              </span>
              <div style={S.timerBox}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ff4444' }}>timer</span>
                <span style={S.timerText}>{countdown}</span>
              </div>
            </div>
            <Link href="/shop?filter=flash" style={S.seeAll}>
              See All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            </Link>
          </div>
          <div style={S.cardRow} className="no-scrollbar">
            {flashProducts.map(product => (
              <ProductCard
                key={product.id} product={product} showFlashBadge
                onAddToCart={() => addHandler(product)}
                onWishlist={() => wishHandler(product)}
                isWishlisted={isInWishlist(product.id)}
                onQuickView={() => setQuickViewProduct(product)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          NEW ARRIVALS
      ══════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <section style={{ ...S.section, marginTop: 28, marginBottom: 4 }}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>✨ New Arrivals</h2>
            <Link href="/shop?sort=newest" style={S.seeAll}>
              See All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            </Link>
          </div>
          <div style={S.cardRow} className="no-scrollbar">
            {newArrivals.map(product => (
              <ProductCard
                key={product.id} product={product}
                onAddToCart={() => addHandler(product)}
                onWishlist={() => wishHandler(product)}
                isWishlisted={isInWishlist(product.id)}
                onQuickView={() => setQuickViewProduct(product)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          PICKED FOR YOU
      ══════════════════════════════════════ */}
      {recommendations.length > 0 && (
        <section style={{ ...S.section, marginTop: 28, marginBottom: 4 }}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>🎯 Picked For You</h2>
            <Link href="/shop" style={S.seeAll}>
              See All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            </Link>
          </div>
          <div style={S.cardRow} className="no-scrollbar">
            {recommendations.map(product => (
              <ProductCard
                key={product.id} product={product}
                onAddToCart={() => addHandler(product)}
                onWishlist={() => wishHandler(product)}
                isWishlisted={isInWishlist(product.id)}
                onQuickView={() => setQuickViewProduct(product)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          RECENTLY VIEWED ROW
      ══════════════════════════════════════ */}
      {recentlyViewed.length > 0 && (
        <section style={{ ...S.section, marginTop: 28, marginBottom: 4 }}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>🕒 Recently Viewed</h2>
          </div>
          <div style={S.cardRow} className="no-scrollbar">
            {recentlyViewed.map(product => (
              <ProductCard
                key={product.id} product={product}
                onAddToCart={() => addHandler(product)}
                onWishlist={() => wishHandler(product)}
                isWishlisted={isInWishlist(product.id)}
                onQuickView={() => setQuickViewProduct(product)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          CATEGORY BENTO GRID
      ══════════════════════════════════════ */}
      <section style={{ ...S.section, marginTop: 28, marginBottom: 4 }}>
        <div style={S.sectionHead}>
          <h2 style={S.sectionTitle}>Shop by Category</h2>
          <Link href="/shop" style={S.seeAll}>
            View All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '150px 150px', gap: 10 }}>
          {[
            { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800', span: true },
            { name: 'Fashion',     img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800' },
            { name: 'Home',        img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=800' },
          ].map((cat, i) => (
            <Link
              key={cat.name}
              href={`/shop?category=${cat.name}`}
              className={`animate-fade-in-up stagger-${i + 1}`}
              style={{
                gridRow: cat.span ? 'span 2' : undefined,
                position: 'relative', overflow: 'hidden', borderRadius: 16,
                border: '1px solid var(--outline)', background: 'var(--surface)',
                display: 'block', textDecoration: 'none',
              }}
            >
              <img style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transition: 'transform 0.5s, opacity 0.3s' }} alt={cat.name} src={cat.img} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 10 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: '#fff' }}>{cat.name}</span>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {allProducts.filter(p => p.category === cat.name).length} products
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          PER-CATEGORY HORIZONTAL ROWS
      ══════════════════════════════════════ */}
      {categoryGroups.map(({ cat, products }) => (
        <section key={cat} style={{ ...S.section, marginTop: 28, marginBottom: 4 }}>
          <div style={S.sectionHead}>
            <h2 style={S.sectionTitle}>{cat}</h2>
            <Link href={`/shop?category=${cat}`} style={S.seeAll}>
              See All <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
            </Link>
          </div>
          <div style={S.cardRow} className="no-scrollbar">
            {products.map(product => (
              <ProductCard
                key={product.id} product={product}
                onAddToCart={() => addHandler(product)}
                onWishlist={() => wishHandler(product)}
                isWishlisted={isInWishlist(product.id)}
                onQuickView={() => setQuickViewProduct(product)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* ══════════════════════════════════════
          TRUST STATS (animated)
      ══════════════════════════════════════ */}
      <section className="animate-fade-in-up" style={{ margin: '32px 14px 20px', padding: '28px 20px', border: '1px solid var(--outline)', background: 'var(--surface)', borderRadius: 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: 'rgba(0,229,255,0.06)', filter: 'blur(50px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, background: 'rgba(255,34,0,0.06)', filter: 'blur(40px)', borderRadius: '50%' }} />
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: 'var(--foreground)', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Why AfriCart?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {[
            { val: '1M+', label: 'Delivered', icon: 'local_shipping' },
            { val: '4.8★', label: 'Avg Rating', icon: 'star' },
            { val: '24h', label: 'Fast Ship', icon: 'bolt' },
          ].map(stat => (
            <div key={stat.label}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)', marginBottom: 6, display: 'block' }}>{stat.icon}</span>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, color: 'var(--lime-400)' }}>{stat.val}</p>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: 9, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          JOIN / SIGN UP CTA
      ══════════════════════════════════════ */}
      {!user && (
        <section style={{ margin: '0 14px 40px' }}>
          <div style={{
            padding: '24px 20px', borderRadius: 18,
            background: 'linear-gradient(135deg, #0d1a00 0%, #162600 50%, #0d1a00 100%)',
            border: '1px solid rgba(195,244,0,0.2)',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'rgba(195,244,0,0.07)', filter: 'blur(60px)', borderRadius: '50%' }} />
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Join AfriCart Today</p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 20, lineHeight: 1.6 }}>
              Create an account to earn loyalty points, get early flash sale access, and track your orders.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href="/login?tab=signup" style={{ ...S.heroBtn, fontSize: 12 }}>
                Sign Up Free
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </Link>
              <Link href="/login" style={{ ...S.heroBtn, background: 'transparent', border: '1px solid rgba(195,244,0,0.4)', color: 'var(--lime-400)', fontSize: 12 }}>
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}

      <style>{`
        @keyframes flashDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>

      {/* ══════════════════════════════════════
          BUYER PROTECTION TRUST STRIP
      ══════════════════════════════════════ */}
      <section style={{ margin: '0 14px 32px' }}>
        <div style={{
          padding: '16px 20px', borderRadius: 16,
          background: 'var(--surface)', border: '1px solid var(--outline)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 900, color: 'var(--foreground)' }}>AfriCart Buyer Protection</span>
            </div>
            <Link href="/buyer-protection" style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Learn More →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { icon: 'autorenew', label: '7-Day Returns' },
              { icon: 'lock', label: 'Secure Payments' },
              { icon: 'support_agent', label: '24/7 Support' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 6px', background: 'var(--surface-container)', borderRadius: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)' }}>{item.icon}</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 9, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick View Modal Container */}
      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

    </div>
  );
}
