'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, useWishlist, useToast, useStore, useAuth, useUserActivity } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

const getRealisticFeatures = (category: string) => {
  switch(category) {
    case 'Electronics':
      return ['1 Year Manufacturer Warranty', 'Premium Build Quality', 'Fast & Reliable Performance', 'Energy Efficient'];
    case 'Fashion':
      return ['Premium Breathable Fabric', 'Perfect Tailored Fit', 'Machine Washable', 'Durable Stitching'];
    case 'Home':
      return ['Modern Elegant Design', 'High Durability', 'Easy to Clean & Maintain', 'Eco-Friendly Materials'];
    case 'Beauty':
      return ['Cruelty-Free & Vegan', 'Dermatologist Tested', 'All Natural Ingredients', 'Long-lasting Effect'];
    case 'Groceries':
      return ['100% Organic', 'Farm Fresh Guaranteed', 'No Artificial Preservatives', 'Locally Sourced'];
    default:
      return ['High Quality Material', 'Durable Construction', 'Satisfaction Guaranteed'];
  }
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { allProducts, isFollowing, followVendor, unfollowVendor } = useStore();
  const { allAdmins } = useAdmin();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToHistory } = useUserActivity();
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const product = allProducts.find(p => p.id === id);

  React.useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${id}`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (id) fetchReviews();
  }, [id]);

  // Recently Viewed Tracking
  React.useEffect(() => {
    if (product) {
      addToHistory(product);
    }
  }, [product, addToHistory]);

  if (allProducts.length === 0) {
    return (
      <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100vh' }}>
        <div className="shimmer" style={{ width: '100%', aspectRatio: '1', borderRadius: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="shimmer" style={{ width: '60%', height: 24, borderRadius: 8 }} />
          <div className="shimmer" style={{ width: '40%', height: 20, borderRadius: 8 }} />
          <div className="shimmer" style={{ width: '100%', height: 60, borderRadius: 8, marginTop: 16 }} />
        </div>
      </div>
    );
  }

  if (!product) return <div style={{ padding: 80, textAlign: 'center', color: 'var(--foreground)' }}>Product not found</div>;

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  const vendor = allAdmins.find(a => a.email === product.vendorEmail);
  const vendorStoreName = vendor?.storeName || product.vendorStoreName || product.vendorEmail?.split('@')[0] || 'Vendor';

  const hasSizesArray = product.sizes && product.sizes.length > 0;
  const isClothing = product.category === 'Fashion';
  const defaultSizes = isClothing ? ['S', 'M', 'L', 'XL'] : [];
  const sizes = hasSizesArray ? product.sizes! : defaultSizes;
  const requiresSize = sizes.length > 0;

  const handleAddToCart = () => {
    if (isOutOfStock) { showToast('This product is out of stock', 'error'); return; }
    if (requiresSize && !selectedSize) { showToast('Please select a size first', 'error'); return; }
    addToCart(product, selectedSize || undefined);
    showToast(`${product.name} added to cart!`);
  };

  const toggleWishlist = () => {
    if (isInWishlist(product.id)) { removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }
    else { addToWishlist(product); showToast('Added to wishlist!'); }
  };

  const handleFollowVendor = () => {
    if (!user) {
      showToast('Please login to follow vendors', 'error');
      router.push('/login');
      return;
    }
    if (!product.vendorEmail) return;

    if (isFollowing(product.vendorEmail, user.email)) {
      unfollowVendor(product.vendorEmail, user.email);
      showToast(`Unfollowed ${vendorStoreName}`);
    } else {
      followVendor(product.vendorEmail, user.email);
      showToast(`Now following ${vendorStoreName}!`);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Check out this ${product.name} on AfriCart! \n\nPrice: GH₵${product.price.toFixed(2)} \n\nLink: ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleNotifyMe = async () => {
    if (!user) {
      showToast('Please login to receive notifications', 'error');
      router.push('/login');
      return;
    }
    try {
      const res = await fetch('/api/notifications/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, userEmail: user.email })
      });
      if (res.ok) {
        showToast('We will notify you when this is back in stock!', 'success');
      }
    } catch (err) {
      showToast('Error setting notification', 'error');
    }
  };

  const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 160 }}>
      {/* Back button */}
      <div className="animate-fade-in" style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'var(--font-inter)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span> Back
        </button>
        <button onClick={handleShareWhatsApp} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>
          SHARE <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
        </button>
      </div>

      {/* Product Image Gallery */}
      <section className="animate-fade-in" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        {(() => {
          const allImages = [product.image, ...(product.images || [])].filter(Boolean);
          const hasMultiple = allImages.length > 1;
          return (
            <>
              {/* Main Image */}
              <div
                style={{ aspectRatio: '1/1', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', touchAction: 'pan-y' }}
                onTouchStart={(e) => { if (hasMultiple) (e.currentTarget as any)._touchX = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (!hasMultiple) return;
                  const startX = (e.currentTarget as any)._touchX;
                  if (!startX) return;
                  const diff = startX - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 50) {
                    setActiveImageIndex(prev => diff > 0 ? Math.min(prev + 1, allImages.length - 1) : Math.max(prev - 1, 0));
                  }
                }}
              >
                <img
                  key={activeImageIndex}
                  className="animate-fade-in"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 400, transition: 'opacity 0.3s' }}
                  alt={product.name}
                  src={allImages[activeImageIndex] || product.image}
                />

                {/* Navigation Arrows (desktop) */}
                {hasMultiple && activeImageIndex > 0 && (
                  <button onClick={() => setActiveImageIndex(prev => prev - 1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
                  </button>
                )}
                {hasMultiple && activeImageIndex < allImages.length - 1 && (
                  <button onClick={() => setActiveImageIndex(prev => prev + 1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                  </button>
                )}

                {/* Image counter badge */}
                {hasMultiple && (
                  <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff' }}>photo_library</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-lexend)' }}>{activeImageIndex + 1}/{allImages.length}</span>
                  </div>
                )}
              </div>

              {/* Dot Indicators */}
              {hasMultiple && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0' }}>
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      style={{
                        width: activeImageIndex === i ? 20 : 6, height: 6, borderRadius: 3,
                        background: activeImageIndex === i ? 'var(--lime-400)' : 'var(--outline)',
                        border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Thumbnail Strip */}
              {hasMultiple && (
                <div className="no-scrollbar" style={{ display: 'flex', gap: 6, padding: '0 16px 8px', overflowX: 'auto' }}>
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      style={{
                        flexShrink: 0, width: 52, height: 52, borderRadius: 8, overflow: 'hidden', padding: 0,
                        border: activeImageIndex === i ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                        cursor: 'pointer', background: 'var(--surface-container)',
                        opacity: activeImageIndex === i ? 1 : 0.6, transition: 'all 0.2s',
                      }}
                    >
                      <img src={img} alt={`View ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        <button
          onClick={toggleWishlist}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--surface-container-high)', border: '1px solid var(--outline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: isInWishlist(product.id) ? '#ff4444' : 'var(--on-surface-variant)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        {product.isNew && !isOutOfStock && <span style={{ position: 'absolute', top: 16, left: 16, background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>NEW</span>}
        {product.isLimited && !isOutOfStock && <span style={{ position: 'absolute', top: 16, left: 16, background: '#ff5e07', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>LIMITED EDITION</span>}
        {isOutOfStock && <span style={{ position: 'absolute', top: 16, left: 16, background: 'var(--error)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 4, fontFamily: 'var(--font-lexend)' }}>OUT OF STOCK</span>}
      </section>

      {/* Product Info */}
      <section className="animate-fade-in-up" style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{product.subCategory}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fbbf24', fontVariationSettings: "'FILL' 1" }}>star</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{product.rating}</span>
          </div>
        </div>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--foreground)', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: 12 }}>{product.name}</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--price-color)' }}>GH₵{product.price.toFixed(2)}</span>
          {product.originalPrice && <span style={{ fontSize: 16, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>GH₵{product.originalPrice.toFixed(2)}</span>}
          {product.originalPrice && <span style={{ fontSize: 12, fontWeight: 700, color: '#ff4444', fontFamily: 'var(--font-lexend)' }}>-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF</span>}
        </div>

        {/* Size Selector */}
        {requiresSize && (
          <div className="animate-fade-in-up stagger-1" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Select Size</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    minWidth: 48, height: 44, border: selectedSize === size ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                    background: selectedSize === size ? 'rgba(195,244,0,0.08)' : 'transparent',
                    color: selectedSize === size ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                    fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 13,
                    borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                    padding: '0 12px',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Profile Section */}
        {product.vendorEmail && (
          <div className="animate-fade-in-up stagger-2" style={{ marginBottom: 24, padding: '16px', background: 'var(--surface-container)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Link href={`/store/${encodeURIComponent(product.vendorEmail)}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'color-mix(in srgb, #00e5ff 20%, transparent)', color: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  {vendorStoreName[0].toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>{vendorStoreName}</h3>
                  {vendor?.isVerified && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Verified Seller</span>
                    </div>
                  )}
                </div>
              </Link>
              
              <button 
                onClick={handleFollowVendor}
                style={{ 
                  padding: '8px 16px', borderRadius: '20px', 
                  background: (user && isFollowing(product.vendorEmail, user.email)) ? 'transparent' : '#00e5ff', 
                  border: (user && isFollowing(product.vendorEmail, user.email)) ? '1px solid #00e5ff' : 'none',
                  color: (user && isFollowing(product.vendorEmail, user.email)) ? '#00e5ff' : '#000', 
                  fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                {(user && isFollowing(product.vendorEmail, user.email)) ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="animate-fade-in-up stagger-3" style={{ marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Description</span>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: 'var(--on-surface-variant)', lineHeight: 1.7, marginTop: 8 }}>{product.description}</p>
        </div>

        {/* Features */}
        <div className="animate-fade-in-up stagger-4" style={{ marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'block' }}>Features</span>
          {getRealisticFeatures(product.category).map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime-400)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{f}</span>
            </div>
          ))}
        </div>

        <div className="animate-fade-in-up stagger-5" style={{ marginBottom: 40, padding: '24px 0', borderTop: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, marginBottom: 4 }}>VERIFIED REVIEWS</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className="material-symbols-outlined" style={{ fontSize: 14, color: s <= Math.round(product.rating) ? '#fbbf24' : 'var(--outline)', fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{product.rating} / 5</span>
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginLeft: 8 }}>({reviews.length} reviews)</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--lime-400)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Verified Purchase Only</div>
              <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Review items from your order history</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {reviewsLoading ? (
               <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
                 {[1, 2].map(i => (
                   <div key={i} className="shimmer" style={{ height: 100, borderRadius: 16 }} />
                 ))}
               </div>
            ) : reviews.length > 0 ? (
              reviews.map((r, i) => (
                <div key={i} style={{ paddingBottom: 24, borderBottom: '1px solid var(--outline-variant)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{r.customerName?.[0].toUpperCase() || 'U'}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {r.customerName}
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex' }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className="material-symbols-outlined" style={{ fontSize: 12, color: s <= r.rating ? '#fbbf24' : 'var(--outline)', fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--on-surface-variant)', marginBottom: 12 }}>{r.comment}</p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.2, marginBottom: 8 }}>rate_review</span>
                <p style={{ fontSize: 14 }}>No verified reviews yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="animate-fade-in-up stagger-5" style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'block' }}>You Might Also Like</span>
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
              {related.map(p => (
                <Link key={p.id} href={`/product/${p.id}`} style={{ flexShrink: 0, width: 140, textDecoration: 'none' }}>
                  <div style={{ aspectRatio: '3/4', background: 'var(--surface-container)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--outline)', marginBottom: 6 }}>
                    <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} src={p.image} />
                  </div>
                  <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{p.name}</p>
                  <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800, color: 'var(--price-color)' }}>GH₵{p.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sticky Add to Cart */}
      <div className="sticky-add-to-cart-container">
        <div className="sticky-add-to-cart-buttons">
          <button onClick={toggleWishlist} style={{
            width: 52, height: 52, borderRadius: 10, border: '1px solid var(--outline)',
            background: 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: isInWishlist(product.id) ? '#ff4444' : 'var(--on-surface-variant)',
          }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>
          {isOutOfStock ? (
            <button onClick={handleNotifyMe} style={{
              flex: 1, height: 52,
              background: 'var(--surface-container-high)',
              color: 'var(--lime-400)',
              fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: '1px solid var(--lime-400)', borderRadius: 10,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>notifications_active</span>
              Notify Me When Available
            </button>
          ) : (
            <button onClick={handleAddToCart} disabled={isOutOfStock} style={{
              flex: 1, height: 52,
              background: 'var(--lime-400)',
              color: '#000',
              fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              border: 'none', borderRadius: 10,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'transform 0.15s',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>shopping_bag</span>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
