'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useWishlist, useCart, useToast, useAuth } from '@/context/AppContext';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Track alert status locally in localStorage
  const [alerts, setAlerts] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('africart-wishlist-alerts') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleAlert = (productId: string) => {
    if (!user) {
      showToast('Please sign in to enable price drop alerts', 'error');
      return;
    }
    let updated;
    if (alerts.includes(productId)) {
      updated = alerts.filter(id => id !== productId);
      showToast('Price alert disabled');
    } else {
      updated = [...alerts, productId];
      showToast('Price alert enabled! You will receive SMS alerts.');
    }
    setAlerts(updated);
    localStorage.setItem('africart-wishlist-alerts', JSON.stringify(updated));
  };

  const generateShareUrl = () => {
    const ids = wishlist.map(p => p.id).join(',');
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/wishlist/shared?ids=${ids}`;
  };

  const handleShareWhatsApp = () => {
    const items = wishlist.map((p, i) => `${i + 1}. ${p.name} — GH₵${p.price.toFixed(2)}`).join('\n');
    const total = wishlist.reduce((sum, p) => sum + p.price, 0);
    const text = `🛍️ Check out my AfriCart Wishlist!\n\n${items}\n\n💰 Total: GH₵${total.toFixed(2)}\n\n🔗 ${generateShareUrl()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generateShareUrl());
      showToast('Wishlist link copied!');
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateShareUrl();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Wishlist link copied!');
    }
    setShowShareMenu(false);
  };

  const handleNativeShare = async () => {
    const total = wishlist.reduce((sum, p) => sum + p.price, 0);
    try {
      await navigator.share({
        title: 'My AfriCart Wishlist',
        text: `Check out my wishlist with ${wishlist.length} items worth GH₵${total.toFixed(2)}!`,
        url: generateShareUrl(),
      });
    } catch {
      // User cancelled or not supported — fall back to copy
      handleCopyLink();
    }
    setShowShareMenu(false);
  };

  if (wishlist.length === 0) {
    return (
      <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 24px', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--on-surface-variant)', opacity: 0.2, marginBottom: 16 }}>favorite</span>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 800, color: 'var(--foreground)', marginBottom: 8 }}>Your wishlist is empty</h2>
        <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--on-surface-variant)', marginBottom: 24, fontSize: 14 }}>Save your favorite items here.</p>
        <Link href="/shop" style={{
          background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontFamily: 'var(--font-lexend)',
          fontWeight: 800, padding: '14px 32px', borderRadius: 8, fontSize: 13,
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      {/* Header with Share */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, color: 'var(--foreground)', textTransform: 'uppercase' }}>Wishlist</h1>
          <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{wishlist.length} ITEM{wishlist.length !== 1 ? 'S' : ''}</p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            style={{
              background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 10,
              padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>share</span>
            Share
          </button>

          {/* Share Dropdown */}
          {showShareMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setShowShareMenu(false)} />
              <div className="animate-scale-in" style={{
                position: 'absolute', top: 44, right: 0, zIndex: 99,
                background: 'var(--surface-container)', border: '1px solid var(--outline)',
                borderRadius: 14, padding: 6, width: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }}>
                {/* Native Share (mobile) */}
                {'share' in navigator && (
                  <button onClick={handleNativeShare} style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--foreground)', fontSize: 13, fontWeight: 600, textAlign: 'left',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)' }}>ios_share</span>
                    Share via...
                  </button>
                )}
                <button onClick={handleShareWhatsApp} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  color: 'var(--foreground)', fontSize: 13, fontWeight: 600, textAlign: 'left',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </button>
                <button onClick={handleCopyLink} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, background: 'none', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  color: 'var(--foreground)', fontSize: 13, fontWeight: 600, textAlign: 'left',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00e5ff' }}>content_copy</span>
                  Copy Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
        {wishlist.map((product, i) => (
          <div key={product.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`} style={{ 
            display: 'flex', flexDirection: 'column', 
            background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 10, padding: 6,
            position: 'relative'
          }}>
            <Link href={`/product/${product.id}`} style={{
              position: 'relative', aspectRatio: '1', background: 'var(--surface-container)',
              borderRadius: 6, overflow: 'hidden',
              marginBottom: 6, display: 'block',
            }}>
              <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} src={product.image} />
              <button
                onClick={(e) => { e.preventDefault(); removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }}
                style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </button>
            </Link>
            
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{product.name}</p>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 8, color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 4px' }}>{product.subCategory}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--price-color)' }}>GH₵{product.price.toFixed(0)}</span>
              </div>
            </div>

            {/* Price drop alert toggle */}
            <button
              onClick={() => toggleAlert(product.id)}
              style={{
                width: '100%', marginTop: 6, padding: '4px 0',
                background: 'var(--surface-container-high)',
                border: '1px solid var(--outline)',
                borderRadius: 6,
                color: alerts.includes(product.id) ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                cursor: 'pointer',
                fontFamily: 'var(--font-lexend)', fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: alerts.includes(product.id) ? "'FILL' 1" : "'FILL' 0" }}>notifications_active</span>
              {alerts.includes(product.id) ? 'ALERT ON' : 'SET PRICE ALERT'}
            </button>

            {/* Quick Add to Cart */}
            <button
              onClick={() => {
                addToCart(product);
                showToast(`${product.name} added to cart!`);
              }}
              style={{
                width: '100%', marginTop: 8, padding: '5px 0',
                background: 'var(--lime-400)',
                color: '#000',
                border: 'none', borderRadius: 6,
                fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>shopping_cart</span>
              + CART
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
