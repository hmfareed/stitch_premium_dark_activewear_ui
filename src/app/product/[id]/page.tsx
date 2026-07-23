'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  const { allProducts, isFollowing, followVendor, unfollowVendor, campaigns } = useStore();
  const { allAdmins } = useAdmin();
  const { user } = useAuth();
  const { addToCart, cart, openCartDrawer } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToHistory, recentlyViewed } = useUserActivity();
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  /* ── Q&A States ── */
  const [qaList, setQaList] = useState<any[]>([]);
  const [qaLoading, setQaLoading] = useState(true);
  const [showQAModal, setShowQAModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyingToQA, setReplyingToQA] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [qaActionLoading, setQaActionLoading] = useState(false);

  const product = allProducts.find(p => p.id === id);

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action: 'voteHelpful' })
      });
      if (res.ok) {
        setReviews(prev => prev.map(rev => (rev._id === reviewId || rev.id === reviewId) ? { ...rev, helpfulVotes: (rev.helpfulVotes || 0) + 1 } : rev));
        showToast('Thanks for upvoting!');
      }
    } catch (err) {
      console.error('Error voting helpful:', err);
    }
  };

  const fetchQAs = async () => {
    try {
      const res = await fetch(`/api/product-qa?productId=${id}`);
      const data = await res.json();
      if (data.success) {
        setQaList(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching Q&As:', err);
    } finally {
      setQaLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please login to ask a question', 'error');
      router.push('/login');
      return;
    }
    if (!newQuestion.trim()) return;
    setQaActionLoading(true);
    try {
      const res = await fetch('/api/product-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          question: newQuestion.trim(),
          questionerEmail: user.email,
          questionerName: user.name
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Question posted successfully!');
        setNewQuestion('');
        setShowQAModal(false);
        fetchQAs();
      } else {
        showToast(data.error || 'Failed to post question', 'error');
      }
    } catch {
      showToast('Error posting question', 'error');
    } finally {
      setQaActionLoading(false);
    }
  };

  const handleAnswerQuestion = async (qaId: string) => {
    if (!user) return;
    if (!newAnswer.trim()) return;
    setQaActionLoading(true);
    try {
      const res = await fetch('/api/product-qa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qaId,
          answer: newAnswer.trim(),
          answeredByEmail: user.email,
          answeredByName: user.role === 'super_admin' ? 'AfriCart Admin' : 'Store Owner'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Answer posted!');
        setNewAnswer('');
        setReplyingToQA(null);
        fetchQAs();
      }
    } catch {
      showToast('Error posting answer', 'error');
    } finally {
      setQaActionLoading(false);
    }
  };

  const handleQAVoteHelpful = async (qaId: string) => {
    try {
      const res = await fetch('/api/product-qa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qaId, action: 'helpful' })
      });
      if (res.ok) {
        setQaList(prev => prev.map(item => item._id === qaId ? { ...item, helpful: (item.helpful || 0) + 1 } : item));
        showToast('Vote registered!');
      }
    } catch {}
  };

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
    if (id) {
      fetchReviews();
      fetchQAs();
    }
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
          const rawImages = [product.image, ...(product.images || [])].filter((img): img is string => Boolean(img && typeof img === 'string' && img.trim() !== ''));
          const allImages = Array.from(new Set(rawImages));
          if (allImages.length === 0) {
            allImages.push('https://images.unsplash.com/photo-1555529733-0e670560f8e1?auto=format&fit=crop&q=80&w=800');
          }
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
                <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 300, maxHeight: 400 }}>
                  <Image
                    key={activeImageIndex}
                    className="animate-fade-in"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 500px"
                    style={{ objectFit: 'contain', transition: 'opacity 0.3s' }}
                    alt={product.name}
                    src={allImages[activeImageIndex] || product.image}
                  />
                </div>

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
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <Image src={img} alt={`View ${i + 1}`} fill sizes="52px" style={{ objectFit: 'cover' }} />
                      </div>
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

        {(() => {
          const productCampaign = product.campaignId ? (campaigns || []).find((c: any) => c.id === product.campaignId && c.status === 'active') : null;
          return productCampaign ? (
            <div 
              className="animate-pulse"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px 16px', 
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12) 0%, rgba(195, 244, 0, 0.12) 100%)', 
                border: '1px solid rgba(0, 229, 255, 0.35)', 
                borderRadius: '12px', 
                marginBottom: '14px',
                boxShadow: '0 0 15px rgba(0, 229, 255, 0.1)'
              }}
            >
              <span className="material-symbols-outlined" style={{ color: '#00e5ff', animation: 'spin 4s linear infinite', fontSize: '20px' }}>campaign</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#00e5ff', fontFamily: 'var(--font-lexend)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Event promotion: {productCampaign.name}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'var(--on-surface-variant)', lineHeight: 1.2 }}>
                  Enjoy a flat <strong>{productCampaign.discountValue}% OFF</strong> as part of this exclusive platform sale!
                </p>
              </div>
            </div>
          ) : null;
        })()}

        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--foreground)', lineHeight: 1.1, textTransform: 'uppercase', marginBottom: 12 }}>{product.name}</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--price-color)' }}>GH₵{product.price.toFixed(2)}</span>
          {product.originalPrice && <span style={{ fontSize: 16, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>GH₵{product.originalPrice.toFixed(2)}</span>}
          {product.originalPrice && <span style={{ fontSize: 12, fontWeight: 700, color: '#ff4444', fontFamily: 'var(--font-lexend)' }}>-{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF</span>}
        </div>

        {product.wholesaleTiers && product.wholesaleTiers.length > 0 && (
          <div style={{ marginTop: '4px', marginBottom: '24px', padding: '16px', background: 'var(--surface-container-low)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>widgets</span>
              B2B Wholesale Price Brackets
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              {product.wholesaleTiers.map((tier: any, idx: number) => {
                const discountPrice = product.price * (1 - tier.discountPercent / 100);
                return (
                  <div key={idx} style={{ padding: '8px 10px', background: 'var(--surface-container-high)', borderRadius: '8px', border: '1px solid var(--outline)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', fontWeight: 700 }}>Buy {tier.minQuantity}+ Units</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', margin: '2px 0' }}>
                      GH₵{discountPrice.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#00e5ff', fontWeight: 800, textTransform: 'uppercase' }}>
                      {tier.discountPercent}% Discount
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', color: 'var(--on-surface-variant)', opacity: 0.8, lineHeight: 1.2 }}>
              *Bulk wholesale discounts apply dynamically during cart checkout based on your final quantities.
            </p>
          </div>
        )}

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
                  {vendor?.isVerified ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#22c55e', fontVariationSettings: "'FILL' 1" }}>verified</span>
                      <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>Verified Seller</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#f59e0b' }}>pending</span>
                      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>Unverified Seller</span>
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
                          {r.isVerifiedPurchase && (
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>verified</span>
                          )}
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
                  
                  {/* Uploaded Review Photos Grid */}
                  {r.images && r.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                      {r.images.map((img: string, idx: number) => (
                        <div key={idx} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--outline)' }}>
                          <img src={img} alt="user review attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Helpful Vote Strip & Vendor Reply */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <button 
                      onClick={() => handleHelpfulVote(r._id || r.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--lime-400)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>thumb_up</span>
                      Helpful ({r.helpfulVotes || 0})
                    </button>
                    {r.isVerifiedPurchase && (
                      <span style={{ fontSize: 10, color: 'var(--lime-400)', fontWeight: 800, fontFamily: 'var(--font-lexend)', letterSpacing: '0.04em' }}>VERIFIED PURCHASE</span>
                    )}
                  </div>

                  {r.vendorReply && (
                    <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--surface-container-high)', borderRadius: 10, borderLeft: '3px solid #00e5ff' }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#00e5ff', marginBottom: 4, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reply from {vendorStoreName}</p>
                      <p style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5, margin: 0 }}>{r.vendorReply}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.2, marginBottom: 8 }}>rate_review</span>
                <p style={{ fontSize: 14 }}>No reviews yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── PRODUCT Q&A SECTION ── */}
        <div className="animate-fade-in-up stagger-5" style={{ marginBottom: 40, padding: '24px 0', borderTop: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, marginBottom: 4 }}>PRODUCT Q&A</h2>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Got questions? Ask the seller or community</p>
            </div>
            <button
              onClick={() => {
                if (!user) {
                  showToast('Please login to ask a question', 'error');
                  router.push('/login');
                  return;
                }
                setShowQAModal(true);
              }}
              style={{
                background: 'var(--lime-400)', color: '#000',
                padding: '8px 16px', borderRadius: 8, border: 'none',
                fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                textTransform: 'uppercase', letterSpacing: '0.04em'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>help_outline</span>
              Ask Question
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {qaLoading ? (
              <div className="shimmer" style={{ height: 100, borderRadius: 12 }} />
            ) : qaList.length > 0 ? (
              qaList.map((qa) => {
                const isSeller = user && (user.email === product.vendorEmail || user.role === 'super_admin');
                return (
                  <div key={qa._id} style={{ padding: '16px', background: 'var(--surface-container-low)', borderRadius: 12, border: '1px solid var(--outline-variant)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 18 }}>help</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{qa.question}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>{new Date(qa.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Asked by {qa.questionerName}</span>
                      <button
                        onClick={() => handleQAVoteHelpful(qa._id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: 11 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>thumb_up</span>
                        Helpful ({qa.helpful || 0})
                      </button>
                    </div>

                    {qa.answer ? (
                      <div style={{ marginTop: 12, padding: '12px', background: 'var(--surface-container-high)', borderRadius: 8, borderLeft: '3px solid var(--lime-400)' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 14 }}>chat_bubble</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--lime-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{qa.answeredByName || 'Seller'}</span>
                          <span style={{ fontSize: 9, color: 'var(--on-surface-variant)' }}>• {new Date(qa.answeredAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--foreground)', margin: 0, lineHeight: 1.5 }}>{qa.answer}</p>
                      </div>
                    ) : (
                      isSeller && (
                        <div style={{ marginTop: 12 }}>
                          {replyingToQA === qa._id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <textarea
                                value={newAnswer}
                                onChange={e => setNewAnswer(e.target.value)}
                                placeholder="Write your answer..."
                                style={{ width: '100%', padding: '10px', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', fontSize: 13, outline: 'none' }}
                                rows={2}
                              />
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => setReplyingToQA(null)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--outline)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                                <button onClick={() => handleAnswerQuestion(qa._id)} disabled={qaActionLoading} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>
                                  {qaActionLoading ? 'Posting...' : 'Post Answer'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingToQA(qa._id)}
                              style={{ background: 'var(--surface-container-highest)', border: '1px solid var(--outline)', borderRadius: 6, padding: '6px 12px', color: 'var(--foreground)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>reply</span>
                              Answer Question
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.2, marginBottom: 8 }}>help_center</span>
                <p style={{ fontSize: 13 }}>No questions asked yet. Be the first to ask!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── ASK QUESTION MODAL ── */}
        {showQAModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div className="animate-scale-in" style={{ background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 450 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 900 }}>Ask a Question</h3>
                <button onClick={() => setShowQAModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleAskQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6, display: 'block' }}>Your Question</label>
                  <textarea
                    required
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="e.g. Does this fit true to size?"
                    style={{ width: '100%', padding: '12px', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 10, color: 'var(--foreground)', fontSize: 14, outline: 'none' }}
                    rows={4}
                  />
                </div>
                <button
                  type="submit"
                  disabled={qaActionLoading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 10,
                    background: 'var(--lime-400)', color: '#000',
                    fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
                    textTransform: 'uppercase', border: 'none', cursor: 'pointer'
                  }}
                >
                  {qaActionLoading ? 'Submitting...' : 'Submit Question'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Related Products Carousel */}
        {related.length > 0 && (
          <div className="animate-fade-in-up stagger-5" style={{ marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'block' }}>You Might Also Like</span>
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
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

        {/* Recently Viewed Carousel */}
        {recentlyViewed.length > 1 && (
          <div className="animate-fade-in-up stagger-5" style={{ marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'block' }}>Recently Viewed Products</span>
            <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {recentlyViewed.filter(p => p.id !== product.id).map(p => (
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
          ) : cart.some(item => item.id === product.id) ? (
            <div style={{ flex: 1, display: 'flex', gap: 8 }}>
              <button onClick={handleAddToCart} style={{
                flex: 1, height: 52, background: 'var(--surface-container-high)',
                color: 'var(--foreground)', border: '1px solid var(--outline)', borderRadius: 10,
                fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 11,
                textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                Add More
              </button>
              <button onClick={() => router.push('/checkout')} style={{
                flex: 1.5, height: 52, background: 'var(--lime-400)',
                color: '#000', border: 'none', borderRadius: 10,
                fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                Checkout
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            </div>
          ) : (
            <button onClick={handleAddToCart} disabled={isOutOfStock} style={{
              flex: 1, height: 52,
              background: 'var(--lime-400)',
              color: '#000',
              fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              border: '1px solid var(--lime-400)', borderRadius: 10,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
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
