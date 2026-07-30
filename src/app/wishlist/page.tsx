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

  // Sample fallback matching Screen 4 reference image if wishlist is empty
  const displayItems = wishlist.length > 0 ? wishlist : [
    { id: 'w1', name: 'iPhone 15 Pro Max', price: 8499.00, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300' },
    { id: 'w2', name: 'Nike Air Max 270', price: 1399.00, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
    { id: 'w3', name: 'Lenovo IdeaPad 3', price: 4200.00, image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300' },
    { id: 'w4', name: 'JBL Tune 760NC', price: 899.00, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' },
    { id: 'w5', name: "Order Men's Watch", price: 1150.00, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300' },
    { id: 'w6', name: "Women's Handbag", price: 350.00, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300' },
  ];

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
    <div style={{ padding: '0 16px', paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      {/* Header matching Screen 4 */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
          </button>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>Wishlist</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isEditMode && selectedItemIds.length > 0 && (
            <button
              onClick={handleRemoveSelected}
              style={{
                background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: 'none', borderRadius: 8,
                padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700
              }}
            >
              Delete ({selectedItemIds.length})
            </button>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            style={{
              background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer',
              fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700
            }}
          >
            {isEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* 2-Column Grid matching Screen 4 reference image exactly */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {displayItems.map((product, i) => {
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
                    width: 18, height: 18, accentColor: '#6366F1', cursor: 'pointer'
                  }}
                />
              )}

              {/* Product Thumbnail with Red Heart Overlay Top-Right */}
              <Link href={`/product/${product.id}`} style={{
                position: 'relative', aspectRatio: '1', background: 'var(--surface-container-high)',
                borderRadius: 16, overflow: 'hidden', marginBottom: 8, display: 'block',
                border: isSelected ? '2px solid #6366F1' : '1px solid var(--outline)'
              }}>
                <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} src={product.image} />

                {/* Red Filled Heart Icon Top-Right */}
                <button
                  onClick={(e) => { e.preventDefault(); removeFromWishlist(product.id); showToast('Removed from wishlist', 'info'); }}
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
    </div>
  );
}
