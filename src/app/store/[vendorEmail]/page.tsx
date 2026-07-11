'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore, useAuth, useToast, useCart, useWishlist } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

type Tab = 'products' | 'about' | 'reviews';

export default function VendorStorePage() {
  const params = useParams();
  const vendorEmailParam = params?.vendorEmail;
  const decodedEmail = vendorEmailParam ? decodeURIComponent(vendorEmailParam as string) : '';
  const router = useRouter();

  const { allProducts, productsLoading, isFollowing, followVendor, unfollowVendor, getVendorSettings, followers } = useStore();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { allAdmins } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const vendorProducts = useMemo(() =>
    allProducts.filter(p => p.vendorEmail === decodedEmail),
    [allProducts, decodedEmail]
  );

  const vendorSettings = useMemo(() => getVendorSettings(decodedEmail), [decodedEmail, getVendorSettings]);
  const vendorAdmin = useMemo(() => allAdmins.find(a => a.email === decodedEmail), [allAdmins, decodedEmail]);

  const vendorStoreName = vendorSettings.storeName
    || vendorAdmin?.storeName
    || (vendorProducts[0]?.vendorStoreName ?? '')
    || (decodedEmail ? decodedEmail.split('@')[0] : 'Store');

  const vendorFollowers = useMemo(() =>
    followers.filter(f => f.vendorEmail === decodedEmail).length,
    [followers, decodedEmail]
  );

  const avgRating = useMemo(() => {
    const rated = vendorProducts.filter(p => p.rating);
    if (!rated.length) return 0;
    return rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length;
  }, [vendorProducts]);

  const isFollowed = user ? isFollowing(decodedEmail, user.email) : false;

  // Fetch reviews for all vendor products
  useEffect(() => {
    if (!vendorProducts.length) { setReviewsLoading(false); return; }
    const ids = vendorProducts.map(p => p.id);
    Promise.all(ids.map(id => fetch(`/api/reviews?productId=${id}`).then(r => r.json())))
      .then(results => {
        const all = results.flatMap(d => d.success ? d.reviews : []);
        setReviews(all);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [vendorProducts.length]);

  const handleFollow = () => {
    if (!user) { showToast('Please login to follow vendors', 'error'); router.push('/login'); return; }
    if (isFollowed) {
      unfollowVendor(decodedEmail, user.email);
      showToast(`Unfollowed ${vendorStoreName}`);
    } else {
      followVendor(decodedEmail, user.email, user.name);
      showToast(`Now following ${vendorStoreName}! 🎉`);
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    showToast(`${product.name} added to cart!`);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const handleWishlist = (product: any) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      showToast('Removed from wishlist', 'info');
    } else {
      addToWishlist(product);
      showToast('Added to wishlist! ❤️');
    }
  };

  if (productsLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Skeleton cover */}
        <div className="shimmer" style={{ width: '100%', height: 200 }} />
        <div style={{ padding: '0 16px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginTop: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ borderRadius: 14, aspectRatio: '3/4' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!decodedEmail || (!productsLoading && vendorProducts.length === 0 && !vendorSettings.storeName)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--on-surface-variant)' }}>storefront</span>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Store Not Found</p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)', textAlign: 'center' }}>
          This store doesn&apos;t exist yet or has no products listed.
        </p>
        <button onClick={() => router.back()} style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--lime-400)', border: 'none', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  const initial = vendorStoreName[0]?.toUpperCase() ?? 'S';
  const coverColors = ['#00E5FF', '#a855f7', '#f59e0b', '#22c55e', '#ef4444'];
  const colorSeed = decodedEmail.charCodeAt(0) % coverColors.length;
  const accentColor = coverColors[colorSeed];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── Cover Banner ── */}
      <div style={{
        position: 'relative', width: '100%', height: 200, overflow: 'hidden',
        background: `linear-gradient(135deg, #0a0a0a 0%, ${accentColor}22 50%, #0a0a0a 100%)`,
      }}>
        {/* Collage of vendor product images */}
        {vendorProducts.slice(0, 4).map((p, i) => (
          <div key={p.id} style={{
            position: 'absolute',
            width: '25%', height: '100%',
            left: `${i * 25}%`,
            overflow: 'hidden',
            opacity: 0.18,
          }}>
            <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px)' }} />
          </div>
        ))}
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(10,10,10,0.95) 100%)' }} />
        {/* Glow orb */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 200, height: 200, background: `${accentColor}18`, filter: 'blur(60px)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 20, backdropFilter: 'blur(8px)', fontFamily: 'var(--font-inter)', fontSize: 12, fontWeight: 600 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back
        </button>

        {/* Share */}
        <button
          onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Link copied!'); }}
          aria-label="Share store"
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', padding: 8, borderRadius: 20, backdropFilter: 'blur(8px)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
        </button>
      </div>

      {/* ── Store Identity Header ── */}
      <div style={{ padding: '0 16px', position: 'relative', marginTop: -40 }}>
        <div className="animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '20px 16px', position: 'relative', overflow: 'hidden' }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: `${accentColor}12`, filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1 }}>
            {/* Avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: 18, flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}44, ${accentColor}22)`,
              border: `2px solid ${accentColor}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, fontFamily: 'var(--font-lexend)', color: accentColor,
              boxShadow: `0 0 20px ${accentColor}22`,
            }}>
              {initial}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>
                  {vendorStoreName}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: `${accentColor}18`, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12, color: accentColor, fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: accentColor, letterSpacing: '0.08em' }}>VERIFIED</span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  { val: vendorProducts.length, label: 'Products' },
                  { val: vendorFollowers, label: 'Followers' },
                  { val: avgRating > 0 ? `${avgRating.toFixed(1)}★` : '—', label: 'Rating' },
                ].map(stat => (
                  <div key={stat.label}>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>{stat.val}</p>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--on-surface-variant)', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow button */}
            <button
              onClick={handleFollow}
              aria-label={isFollowed ? 'Unfollow store' : 'Follow store'}
              style={{
                padding: '10px 18px', borderRadius: 12, flexShrink: 0,
                background: isFollowed ? 'transparent' : accentColor,
                border: isFollowed ? `1px solid ${accentColor}` : 'none',
                color: isFollowed ? accentColor : '#000',
                fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12,
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
                letterSpacing: '0.04em',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: isFollowed ? "'FILL' 1" : "'FILL' 0" }}>
                {isFollowed ? 'person_check' : 'person_add'}
              </span>
              {isFollowed ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Store description preview */}
          {vendorSettings.storeDescription && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 12, lineHeight: 1.6, position: 'relative', zIndex: 1 }} className="line-clamp-2">
              {vendorSettings.storeDescription}
            </p>
          )}

          {/* Contact & Location strip */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, position: 'relative', zIndex: 1 }}>
            {(vendorSettings.storeContact || vendorAdmin?.phone) && (
              <a
                href={`tel:${vendorSettings.storeContact || vendorAdmin?.phone}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'var(--surface-container)', border: '1px solid var(--outline)',
                  borderRadius: 20, padding: '5px 12px',
                  fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
                  color: 'var(--foreground)', textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--lime-400)' }}>call</span>
                {vendorSettings.storeContact || vendorAdmin?.phone}
              </a>
            )}
            {vendorSettings.deliveryPlaces && vendorSettings.deliveryPlaces.length > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'var(--surface-container)', border: '1px solid var(--outline)',
                borderRadius: 20, padding: '5px 12px',
                fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--lime-400)' }}>location_on</span>
                {vendorSettings.deliveryPlaces.slice(0, 2).join(', ')}
                {vendorSettings.deliveryPlaces.length > 2 && ` +${vendorSettings.deliveryPlaces.length - 2}`}
              </span>
            )}
            {(vendorSettings.storeEmail || decodedEmail) && (
              <a
                href={`mailto:${vendorSettings.storeEmail || decodedEmail}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'var(--surface-container)', border: '1px solid var(--outline)',
                  borderRadius: 20, padding: '5px 12px',
                  fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
                  color: 'var(--foreground)', textDecoration: 'none',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--lime-400)' }}>mail</span>
                Message
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: 0, padding: '16px 16px 0', borderBottom: '1px solid var(--outline)' }}>
        {(['products', 'about', 'reviews'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: activeTab === tab ? 'var(--lime-400)' : 'var(--on-surface-variant)',
              borderBottom: activeTab === tab ? '2px solid var(--lime-400)' : '2px solid transparent',
              transition: 'all 0.2s',
              marginBottom: -1,
            }}
          >
            {tab === 'products' ? `Products (${vendorProducts.length})` : tab === 'reviews' ? `Reviews (${reviews.length})` : 'About'}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: '20px 16px', flex: 1 }}>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {vendorProducts.map((p, i) => {
              const discount = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
              const displayPrice = p.flashSalePrice ?? p.price;
              const inStock = (p.stock ?? 1) > 0;
              const isAdded = addedId === p.id;
              return (
                <div
                  key={p.id}
                  className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
                  style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--surface-container)', overflow: 'hidden' }}>
                    <Link href={`/product/${p.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} />
                    </Link>
                    {discount > 0 && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--error)', color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>-{discount}%</span>
                    )}
                    {p.isNew && !discount && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--lime-400)', color: '#000', fontSize: 8, fontWeight: 900, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>NEW</span>
                    )}
                    <button
                      onClick={() => handleWishlist(p)}
                      aria-label="Toggle wishlist"
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: isInWishlist(p.id) ? '#ff4444' : '#fff', fontVariationSettings: isInWishlist(p.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '10px 10px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 9, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.category}</span>
                    <Link href={`/product/${p.id}`} className="line-clamp-2" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.35 }}>
                      {p.name}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                      <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 900, color: 'var(--lime-400)' }}>
                        GH₵{displayPrice.toFixed(2)}
                      </span>
                      {p.originalPrice && (
                        <span style={{ fontFamily: 'var(--font-inter)', fontSize: 10, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>
                          GH₵{p.originalPrice.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={() => inStock ? handleAddToCart(p) : null}
                    disabled={!inStock}
                    style={{
                      margin: '8px 10px 10px', padding: '9px 0', borderRadius: 8, border: 'none',
                      background: !inStock ? 'var(--surface-container-high)' : isAdded ? '#22c55e' : 'var(--lime-400)',
                      color: !inStock ? 'var(--on-surface-variant)' : '#000',
                      fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11,
                      cursor: !inStock ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                    aria-label={inStock ? `Add ${p.name} to cart` : 'Out of stock'}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      {isAdded ? 'check_circle' : inStock ? 'add_shopping_cart' : 'remove_shopping_cart'}
                    </span>
                    {isAdded ? 'Added!' : inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: 'storefront', label: 'Store Name', val: vendorStoreName },
              { icon: 'mail', label: 'Contact Email', val: vendorSettings.storeEmail || decodedEmail },
              { icon: 'phone', label: 'Phone', val: vendorSettings.storeContact || '—' },
              { icon: 'description', label: 'Description', val: vendorSettings.storeDescription || 'No description provided.' },
              { icon: 'assignment_return', label: 'Return Policy', val: vendorSettings.returnPolicy || 'Contact vendor for returns.' },
              { icon: 'local_shipping', label: 'Delivery Fee', val: vendorSettings.deliveryFee ? `GH₵${vendorSettings.deliveryFee}` : 'Varies by location' },
              { icon: 'schedule', label: 'Estimated Delivery', val: vendorSettings.estimatedTime || '2–5 business days' },
              { icon: 'location_on', label: 'Delivery Areas', val: vendorSettings.deliveryPlaces?.join(', ') || 'Nationwide' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)', flexShrink: 0, marginTop: 2 }}>{row.icon}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{row.label}</p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5 }}>{row.val}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviewsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="shimmer" style={{ height: 96, borderRadius: 14 }} />
              ))
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>rate_review</span>
                <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 700 }}>No reviews yet</p>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, marginTop: 6 }}>Be the first to buy and leave a review!</p>
              </div>
            ) : reviews.map((r: any) => (
              <div key={r._id || r.id} style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{r.userName}</p>
                    <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} style={{ fontSize: 12, color: i < Math.round(r.rating) ? '#f59e0b' : 'var(--outline)' }}>★</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontFamily: 'var(--font-inter)' }}>
                    {new Date(r.date || r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
