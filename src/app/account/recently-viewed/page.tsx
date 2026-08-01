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

  if (isLoading) return null;
  if (!user) { router.push('/login'); return null; }

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: 100
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
        boxSizing: 'border-box',
        fontFamily: 'var(--font-lexend, system-ui, -apple-system, sans-serif)',
        color: 'var(--foreground)'
      }}>
        {/* Header */}
        <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} aria-label="Go back" style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26 }}>chevron_left</span>
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Recently Viewed</h1>
          </div>

          {recentlyViewed.length > 0 && (
            <button
              onClick={() => { clearHistory(); showToast('History cleared', 'info'); }}
              aria-label="Clear history"
              style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>delete</span>
            </button>
          )}
        </div>

        {recentlyViewed.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--outline)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            marginTop: 12
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 54, color: 'var(--on-surface-variant)', opacity: 0.6, marginBottom: 12 }}>
              visibility
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--foreground)' }}>
              No recently viewed items
            </h3>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Products you view while browsing will appear here for quick access.
            </p>
            <Link
              href="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 12,
                backgroundColor: 'var(--foreground)',
                color: 'var(--background)',
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              Start Browsing
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
            {recentlyViewed.map((product, idx) => (
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
                    background: 'var(--surface-container-high, rgba(0,0,0,0.04))', border: '1px solid var(--outline)',
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

