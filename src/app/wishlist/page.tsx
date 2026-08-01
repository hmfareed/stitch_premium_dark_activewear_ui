'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist, useToast } from '@/context/AppContext';

export default function WishlistPage() {
  const router = useRouter();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { showToast } = useToast();

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleRemoveSelected = () => {
    selectedItemIds.forEach(id => removeFromWishlist(id));
    showToast(`Removed ${selectedItemIds.length} item(s)`);
    setSelectedItemIds([]);
    setIsEditMode(false);
  };

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
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>Wishlist</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isEditMode && selectedItemIds.length > 0 && (
              <button
                onClick={handleRemoveSelected}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: 'none', borderRadius: 8,
                  padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700
                }}
              >
                Delete ({selectedItemIds.length})
              </button>
            )}

            {wishlist.length > 0 && (
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                style={{
                  background: 'none', border: 'none', color: 'var(--lime-400, #2563EB)', cursor: 'pointer',
                  fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700
                }}
              >
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        {wishlist.length === 0 ? (
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
              favorite
            </span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px 0', color: 'var(--foreground)' }}>
              Your wishlist is empty
            </h3>
            <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Tap the heart icon on any product to save it here for later.
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
              Browse Products
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
        ) : (
          /* 2-Column Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 8 }}>
            {wishlist.map((product, i) => {
              const isSelected = selectedItemIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
                  style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}
                >
                  {isEditMode && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(product.id)}
                      style={{
                        position: 'absolute', top: 10, left: 10, zIndex: 10,
                        width: 18, height: 18, accentColor: '#2563EB', cursor: 'pointer'
                      }}
                    />
                  )}

                  {/* Product Thumbnail */}
                  <Link href={`/product/${product.id}`} style={{
                    position: 'relative', aspectRatio: '1', background: 'var(--surface-container-high, rgba(0,0,0,0.04))',
                    borderRadius: 16, overflow: 'hidden', marginBottom: 8, display: 'block',
                    border: isSelected ? '2px solid #2563EB' : '1px solid var(--outline)'
                  }}>
                    <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} src={product.image} />

                    {/* Red Filled Heart Icon Top-Right */}
                    <button
                      onClick={(e) => { e.preventDefault(); removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }}
                      aria-label="Remove item"
                      style={{
                        position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', border: 'none',
                        cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    </button>
                  </Link>

                  {/* Product Title & Price */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                      {product.name}
                    </p>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>
                      GHS {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

