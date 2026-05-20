'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlist, useCart, useToast, useStore } from '@/context/AppContext';
import { Icon } from '@/components/Icon';
import { ProductLoadingSkeleton } from '@/components/ProductLoadingSkeleton';

export default function HomePage() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { allProducts, productsLoading } = useStore();

  const [heroIndex, setHeroIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const heroProducts = allProducts.filter(p => p.image).slice(0, 5);
  const currentHero = heroProducts.length > 0 ? heroProducts[heroIndex] : null;

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroProducts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [heroProducts.length]);

  // Load recommendations client-side only (avoids hydration mismatch)
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('africart-recently-viewed') || '[]');
      if (history.length > 0 && allProducts.length > 0) {
        const historyCategories = new Set(history.map((p: any) => p.category));
        const recs = allProducts
          .filter(p => historyCategories.has(p.category) && !history.find((h: any) => h.id === p.id))
          .slice(0, 4);
        setRecommendations(recs);
      }
    } catch {}
  }, [allProducts]);

  if (productsLoading) {
    return <ProductLoadingSkeleton />;
  }

  const featured = allProducts.slice(0, 4);
  const heroImage = currentHero 
    ? currentHero.image 
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuChj0jFk38oi9hjqKzStv4KUrdv0KuAnifPHOggdrfs_2d9JES48C2SY-c0HZkr_Y7OtmZIi9JvdlIXiK9FA1mm9lUAEp5AFhZ7rugy5aZXQOoFyDE67a17cd2Ou_x_Um0U0BvipM_xcN1qnzfRmMxLohVdbLJ073KKg2BA42UGHQm4N6Y1fKH1pibAk7nlnEnmlVlyWwd1DMuTy6MNuE2lHj8Fb2JQn0gWn9_7a8vOA7Qbkr7HhBQcoCuZNg1YXvrk0qBCiPvMRxRQ";


  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Hero Banner */}
      <section className="animate-fade-in" style={{ position: 'relative', width: '100%', height: '45vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%, rgba(0,0,0,0.4) 100%)', zIndex: 10 }} />
        
        <img
          key={heroImage}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)', animation: 'fadeIn 0.8s ease-in-out both' }}
          alt="Hero Banner"
          src={heroImage}
        />
        <div className="animate-fade-in-up" style={{ position: 'absolute', bottom: 40, left: 20, right: 20, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', color: 'var(--lime-400)', letterSpacing: '0.15em', fontSize: 11, fontWeight: 700 }}>
            {currentHero ? 'FEATURED PRODUCT' : 'NEW ARRIVALS 2026'}
          </span>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: currentHero ? 36 : 48, fontWeight: 900, color: '#ffffff', lineHeight: 0.95, textTransform: 'uppercase' }}>
            {currentHero ? currentHero.name : 'EVERYTHING\nYOU NEED'}
          </h1>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: 'rgba(255,255,255,0.8)', maxWidth: 280, lineHeight: 1.5 }}>
            {currentHero ? `GH₵${currentHero.price.toFixed(2)} - Shop this and more from our top sellers.` : 'Shop the latest trends in electronics, fashion, and home essentials.'}
          </p>
          <Link href={currentHero ? `/product/${currentHero.id}` : "/shop"} style={{
            display: 'inline-block', marginTop: 8, background: 'var(--lime-400)', color: 'var(--on-lime-400)',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, padding: '14px 32px',
            fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            borderRadius: 4, transition: 'transform 0.15s', width: 'fit-content',
          }}>
            {currentHero ? 'VIEW PRODUCT' : 'SHOP NOW'}
          </Link>
        </div>
      </section>
 
      {/* Flash Sale Countdown */}
      {allProducts.some(p => p.isFlashSale) && (
        <section className="animate-fade-in-up" style={{ padding: '24px 16px 8px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)', 
            borderRadius: 16, 
            padding: 24, 
            border: '1px solid var(--outline)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, background: 'rgba(195,244,0,0.1)', filter: 'blur(50px)', borderRadius: '50%' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 4 }}>FLASH SALE</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="schedule" size={16} color="var(--lime-400)" />
                  <span id="flash-countdown" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--lime-400)' }}>ENDS IN: --:--:--</span>
                </div>
              </div>
              <Link href="/shop?filter=flash" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}>VIEW ALL</Link>
            </div>

            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {allProducts.filter(p => p.isFlashSale).map(product => (
                <Link key={product.id} href={`/product/${product.id}`} style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none' }}>
                  <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-container)' }}>
                    <img src={product.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
                    <div style={{ position: 'absolute', top: 6, left: 6, background: 'var(--error)', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4 }}>
                      -{Math.round(((product.price - (product.flashSalePrice || product.price)) / product.price) * 100)}%
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }} className="line-clamp-1">{product.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--price-color)' }}>GH₵{(product.flashSalePrice || product.price).toFixed(2)}</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>GH₵{product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              const endTime = new Date("${allProducts.find(p => p.isFlashSale)?.flashSaleEnd}").getTime();
              const updateTimer = () => {
                const now = new Date().getTime();
                const dist = endTime - now;
                if (dist < 0) {
                  document.getElementById('flash-countdown').innerHTML = "EXPIRED";
                  return;
                }
                const h = Math.floor(dist / (1000 * 60 * 60));
                const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((dist % (1000 * 60)) / 1000);
                document.getElementById('flash-countdown').innerHTML = \`ENDS IN: \${h < 10 ? '0'+h : h}:\${m < 10 ? '0'+m : m}:\${s < 10 ? '0'+s : s}\`;
              };
              setInterval(updateTimer, 1000);
              updateTimer();
            })();
          `}} />
        </section>
      )}

      {/* Recommended For You (AI-Driven) */}
      {recommendations.length > 0 && (
        <section className="animate-fade-in-up" style={{ padding: '24px 16px 8px' }}>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)', marginBottom: 16 }}>PICKED FOR YOU</h2>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            {recommendations.map(product => (
              <div key={product.id} style={{ 
                flex: '0 0 130px', 
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
                </Link>
                
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{product.name}</p>
                  <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 8, color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 4px' }}>{product.subCategory}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--price-color)' }}>GH₵{product.price.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section style={{ padding: '20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <h2 className="animate-fade-in-up" style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>CATEGORIES</h2>
          <Link href="/shop" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', borderBottom: '1px solid var(--outline)' }}>VIEW ALL</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '140px 140px', gap: 10 }}>
          {[
            { name: 'Electronics', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=800', span: true },
            { name: 'Fashion', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800' },
            { name: 'Home', img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&q=80&w=800' },
          ].map((cat, i) => (
            <Link
              key={cat.name}
              href={`/shop?category=${cat.name}`}
              className={`animate-fade-in-up stagger-${i + 1}`}
              style={{
                gridRow: cat.span ? 'span 2' : undefined,
                position: 'relative', overflow: 'hidden', borderRadius: 12,
                border: '1px solid var(--outline)', background: 'var(--surface)',
              }}
            >
              <img style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transition: 'transform 0.5s' }} alt={cat.name} src={cat.img} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 14, zIndex: 10 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 700, color: '#fff' }}>{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category Showcases */}
      {Array.from(new Set(allProducts.map(p => p.category))).map(category => {
        const categoryProducts = allProducts.filter(p => p.category === category);
        if (categoryProducts.length === 0) return null;

        return (
          <section key={category} style={{ padding: '8px 16px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <h2 className="animate-fade-in-up" style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)', textTransform: 'uppercase' }}>
                {category}
              </h2>
              <Link href={`/shop?category=${category}`} style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', borderBottom: '1px solid var(--outline)' }}>
                VIEW ALL
              </Link>
            </div>
            
            <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 16, scrollSnapType: 'x mandatory' }}>
              {categoryProducts.map((product, i) => (
                <div key={product.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`} style={{ 
                  flex: '0 0 135px', scrollSnapAlign: 'start',
                  display: 'flex', flexDirection: 'column', 
                  background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 10, padding: 6,
                  position: 'relative'
                }}>
                  <Link href={`/product/${product.id}`} style={{
                    position: 'relative', aspectRatio: '1', background: 'var(--surface-container)',
                    borderRadius: 6, overflow: 'hidden',
                    marginBottom: 6, display: 'block',
                  }}>
                    <img 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      alt={product.name} 
                      src={product.image} 
                      onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                    />
                    {product.isNew && (
                      <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--lime-400)', color: 'var(--on-lime-400)', fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 3, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' }}>NEW</span>
                    )}
                    {product.isLimited && (
                      <span style={{ position: 'absolute', top: 4, left: 4, background: '#ff5e07', color: '#fff', fontSize: 7, fontWeight: 900, padding: '2px 4px', borderRadius: 3, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' }}>LTD</span>
                    )}
                  </Link>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                      <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--foreground)', margin: 0, flex: 1 }}>{product.name}</p>
                      <button
                        onClick={() => {
                          if (isInWishlist(product.id)) { removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }
                          else { addToWishlist(product); showToast('Added to wishlist!'); }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isInWishlist(product.id) ? 'var(--error)' : 'var(--on-surface-variant)', display: 'flex', flexShrink: 0 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                      </button>
                    </div>
                    
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 8, color: 'var(--on-surface-variant)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 4px' }}>{product.subCategory}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800, color: 'var(--price-color)' }}>GH₵{product.price.toFixed(0)}</span>
                      {product.originalPrice && <span style={{ fontSize: 9, color: 'var(--on-surface-variant)', textDecoration: 'line-through' }}>GH₵{product.originalPrice.toFixed(0)}</span>}
                    </div>

                    {/* Stock Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 7, fontWeight: 900, color: (product.stock || 0) > 5 ? 'var(--lime-400)' : (product.stock || 0) > 0 ? '#ff9800' : 'var(--error)' }}>
                        {(product.stock || 0) > 0 ? `${product.stock} LEFT` : 'OUT'}
                      </span>
                    </div>
                    
                    {/* Stock Bar */}
                    <div style={{ marginTop: 3 }}>
                      <div style={{ height: 2, width: '100%', background: 'var(--surface-container-highest)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${Math.min(((product.stock || 0) / 20) * 100, 100)}%`, 
                          background: (product.stock || 0) > 5 ? 'var(--lime-400)' : 'var(--error)',
                          borderRadius: 2,
                        }} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Add to Cart */}
                  <button
                    onClick={() => {
                      if ((product.stock || 0) <= 0) { showToast('Out of stock', 'error'); return; }
                      addToCart(product);
                      showToast(`${product.name} added to cart!`);
                    }}
                    disabled={(product.stock || 0) <= 0}
                    style={{
                      width: '100%', marginTop: 8, padding: '5px 0',
                      background: (product.stock || 0) <= 0 ? 'var(--surface-container-high)' : 'var(--lime-400)',
                      color: (product.stock || 0) <= 0 ? 'var(--on-surface-variant)' : '#000',
                      border: 'none', borderRadius: 6,
                      fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 9,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      cursor: (product.stock || 0) <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      transition: 'all 0.2s',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>shopping_cart</span>
                    {(product.stock || 0) <= 0 ? 'OUT' : '+ CART'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Stats Section */}
      <section className="animate-fade-in-up" style={{ margin: '0 16px 32px', padding: 32, border: '1px solid var(--outline)', background: 'var(--surface)', borderRadius: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'rgba(195,244,0,0.06)', filter: 'blur(50px)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 48, fontWeight: 900, color: 'var(--lime-400)' }}>1M+</p>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>PRODUCTS DELIVERED</p>
          </div>
          <div style={{ height: 1, background: 'var(--outline)', width: '50%', margin: '0 auto' }} />
          <div>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: 'var(--foreground)', fontStyle: 'italic' }}>&quot;FAST & RELIABLE&quot;</p>
            <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--on-surface-variant)', marginTop: 8, textTransform: 'uppercase' }}>— CUSTOMER REVIEWS</p>
          </div>
        </div>
      </section>
    </div>
  );
}
