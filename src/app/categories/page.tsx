'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const categoriesList = [
  { id: 'phones', name: 'Phones & Tablets', icon: 'smartphone', color: '#00E5FF' },
  { id: 'electronics', name: 'Electronics', icon: 'tv', color: '#6366F1' },
  { id: 'computers', name: 'Computers', icon: 'laptop_mac', color: '#A855F7' },
  { id: 'fashion', name: 'Fashion', icon: 'apparel', color: '#FB7185' },
  { id: 'shoes', name: 'Shoes', icon: 'steps', color: '#FF9100' },
  { id: 'beauty', name: 'Beauty', icon: 'styler', color: '#FBBF24' },
  { id: 'home', name: 'Home & Kitchen', icon: 'blender', color: '#10B981' },
  { id: 'groceries', name: 'Groceries', icon: 'shopping_basket', color: '#14B8A6' },
  { id: 'health', name: 'Health', icon: 'health_and_safety', color: '#FF4081' },
  { id: 'sports', name: 'Sports', icon: 'sports_soccer', color: '#00E5FF' },
  { id: 'automotive', name: 'Automotive', icon: 'directions_car', color: '#6366F1' },
  { id: 'baby', name: 'Baby Products', icon: 'child_care', color: '#FB7185' },
  { id: 'books', name: 'Books', icon: 'auto_stories', color: '#FBBF24' },
  { id: 'games', name: 'Games', icon: 'sports_esports', color: '#A855F7' },
  { id: 'toys', name: 'Toys', icon: 'smart_toy', color: '#FF9100' },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = categoriesList.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '0 16px', paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      {/* Header matching Screen 12 */}
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, color: 'var(--foreground)' }}>Categories</h1>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>search</span>
        </button>
      </div>

      {showSearch && (
        <div className="animate-fade-in-up" style={{
          background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 14,
          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16
        }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: 18 }}>search</span>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none', width: '100%',
              color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontSize: 13
            }}
          />
        </div>
      )}

      {/* 3-Column Categories Icon Grid matching Screen 12 reference image */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {filtered.map((cat, i) => (
          <div
            key={cat.id}
            onClick={() => router.push(`/shop?category=${encodeURIComponent(cat.name)}`)}
            className={`animate-fade-in-up stagger-${(i % 5) + 1}`}
            style={{
              background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16,
              padding: '16px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 10, cursor: 'pointer', transition: 'all 0.15s ease'
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'var(--surface-container-high)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ color: cat.color, fontSize: 22 }}>{cat.icon}</span>
            </div>

            <span style={{
              fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
              color: 'var(--foreground)', textAlign: 'center', lineHeight: 1.2
            }}>
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
