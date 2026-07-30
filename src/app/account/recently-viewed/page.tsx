'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUserActivity, useToast } from '@/context/AppContext';

export default function RecentlyViewedPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { recentlyViewed, clearHistory } = useUserActivity();
  const { showToast } = useToast();

  // Demo fallback matching Screen 6 reference image if history is empty
  const displayItems = recentlyViewed.length > 0 ? recentlyViewed : [
    { id: 'rv1', name: 'Samsung Galaxy S24', price: 6499.00, dateLabel: 'Today', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200' },
    { id: 'rv2', name: 'Wireless Bluetooth Speaker', price: 320.00, dateLabel: 'Today', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200' },
    { id: 'rv3', name: "Men's Denim Jacket", price: 280.00, dateLabel: 'Yesterday', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=200' },
    { id: 'rv4', name: "Women's Sneakers", price: 380.00, dateLabel: 'Yesterday', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' },
    { id: 'rv5', name: 'Gaming Chair', price: 1150.00, dateLabel: '2 days ago', image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=200' },
  ];

  if (isLoading) return null;
  if (!user) { router.push('/login'); return null; }

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      {/* Header matching Screen 6 */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>Recently Viewed</h1>
        </div>

        <button
          onClick={() => { clearHistory(); showToast('History cleared', 'info'); }}
          style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>delete</span>
        </button>
      </div>

      {/* Vertical Product List matching Screen 6 reference image */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        {displayItems.map((product, idx) => (
          <div
            key={product.id || idx}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
              background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16,
            }}
          >
            {/* Product Thumbnail */}
            <Link href={`/product/${product.id}`} style={{ flexShrink: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12, overflow: 'hidden',
                background: 'var(--surface-container-high)', border: '1px solid var(--outline)',
              }}>
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </Link>

            {/* Title, Price, Date */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                <p style={{
                  fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700,
                  color: 'var(--foreground)', margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>{product.name}</p>
              </Link>
              <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', margin: 0 }}>
                GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', opacity: 0.6 }}>
                {(product as any).dateLabel || (idx === 0 || idx === 1 ? 'Today' : idx === 2 || idx === 3 ? 'Yesterday' : '2 days ago')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
