'use client';

import React from 'react';

export function ProductLoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', padding: '16px', boxSizing: 'border-box' }}>
      {/* CSS Shimmer Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes skeleton-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer-bg {
          background: linear-gradient(90deg, var(--surface-container) 25%, var(--surface-container-high) 50%, var(--surface-container) 75%);
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite linear;
        }
      `}} />

      {/* 1. Fake Top Search Bar */}
      <div className="shimmer-bg" style={{ width: '100%', height: '48px', borderRadius: '12px', opacity: 0.6 }} />

      {/* 2. Main Hero Banner Skeleton */}
      <div 
        className="shimmer-bg" 
        style={{ 
          width: '100%', 
          height: '200px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1px solid var(--outline-variant)',
          position: 'relative'
        }}
      >
        {/* Shopping Cart Icon in Banner */}
        <span 
          className="material-symbols-outlined" 
          style={{ fontSize: '64px', color: 'var(--on-surface-variant)', opacity: 0.2 }}
        >
          shopping_cart
        </span>
      </div>

      {/* 3. Categories Grid (4x2 Rounded Squares) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div 
              className="shimmer-bg" 
              style={{ width: '56px', height: '56px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }} 
            />
            <div className="shimmer-bg" style={{ width: '40px', height: '10px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Separator / Title skeleton */}
      <div className="shimmer-bg" style={{ width: '120px', height: '18px', borderRadius: '4px', marginTop: '10px' }} />

      {/* 4. Product Cards Grid (2-column layouts) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div 
            key={idx} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              background: 'var(--surface)', 
              border: '1px solid var(--outline)', 
              borderRadius: '16px', 
              padding: '12px',
              position: 'relative'
            }}
          >
            {/* Image Placeholder */}
            <div 
              className="shimmer-bg" 
              style={{ 
                aspectRatio: '1', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'var(--surface-container)'
              }}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontSize: '32px', color: 'var(--on-surface-variant)', opacity: 0.15 }}
              >
                shopping_cart
              </span>
            </div>

            {/* Content lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Product title skeleton line */}
              <div className="shimmer-bg" style={{ width: '80%', height: '12px', borderRadius: '4px' }} />
              {/* Product category skeleton line */}
              <div className="shimmer-bg" style={{ width: '50%', height: '8px', borderRadius: '3px' }} />
              
              {/* Price skeleton line */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div className="shimmer-bg" style={{ width: '40px', height: '14px', borderRadius: '4px' }} />
                {/* Heart outline skeleton */}
                <div className="shimmer-bg" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
