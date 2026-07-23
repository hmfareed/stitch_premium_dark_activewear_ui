'use client';

import React from 'react';

export function ProductLoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', background: 'var(--background)', paddingBottom: 90 }}>
      {/* CSS Shimmer Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes skeleton-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .shimmer-bg {
          background: linear-gradient(90deg,
            var(--surface-container) 25%,
            var(--surface-container-high) 50%,
            var(--surface-container) 75%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite linear;
        }
      `}} />

      {/* ── 1. Greeting Bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px 12px',
        borderBottom: '1px solid var(--outline)',
      }}>
        <div className="shimmer-bg" style={{ width: 180, height: 24, borderRadius: 8 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="shimmer-bg" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div className="shimmer-bg" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        </div>
      </div>

      {/* ── 2. Search Bar + Filter Button ── */}
      <div style={{ padding: '12px 18px 16px', display: 'flex', gap: 10 }}>
        <div className="shimmer-bg" style={{ flex: 1, height: 48, borderRadius: 14 }} />
        <div className="shimmer-bg" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0 }} />
      </div>

      {/* ── 3. Category Circles Horizontal Scroll ── */}
      <div style={{ display: 'flex', gap: 14, padding: '4px 18px 16px', overflowX: 'hidden' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div className="shimmer-bg" style={{ width: 60, height: 60, borderRadius: '50%' }} />
            <div className="shimmer-bg" style={{ width: 44, height: 10, borderRadius: 4 }} />
          </div>
        ))}
      </div>

      {/* ── 4. Hero Banner ── */}
      <div style={{ padding: '0 18px 24px' }}>
        <div className="shimmer-bg" style={{
          borderRadius: 20, height: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px', overflow: 'hidden',
        }}>
          {/* Left text block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, paddingRight: 12 }}>
            <div className="shimmer-bg" style={{ width: 80, height: 18, borderRadius: 100, background: 'var(--surface-container-high)' }} />
            <div className="shimmer-bg" style={{ width: '80%', height: 20, borderRadius: 6, background: 'var(--surface-container-high)' }} />
            <div className="shimmer-bg" style={{ width: '55%', height: 16, borderRadius: 6, background: 'var(--surface-container-high)' }} />
            <div className="shimmer-bg" style={{ width: 90, height: 30, borderRadius: 100, marginTop: 4, background: 'var(--surface-container-high)' }} />
          </div>
          {/* Right image block */}
          <div className="shimmer-bg" style={{ width: 110, height: 110, borderRadius: 14, flexShrink: 0, background: 'var(--surface-container-high)' }} />
        </div>
      </div>

      {/* ── 5. Flash Deals Section ── */}
      <div style={{ paddingBottom: 24 }}>
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 12px' }}>
          <div className="shimmer-bg" style={{ width: 140, height: 20, borderRadius: 6 }} />
          <div className="shimmer-bg" style={{ width: 50, height: 14, borderRadius: 4 }} />
        </div>
        {/* Horizontal scroll row */}
        <div style={{ display: 'flex', gap: 12, padding: '0 18px', overflowX: 'hidden' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: 150, flexShrink: 0, background: 'var(--surface-container)',
              borderRadius: 14, border: '1px solid var(--outline)', padding: 10,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div className="shimmer-bg" style={{ width: '100%', height: 110, borderRadius: 10 }} />
              <div className="shimmer-bg" style={{ width: '75%', height: 12, borderRadius: 4 }} />
              <div className="shimmer-bg" style={{ width: '45%', height: 14, borderRadius: 4 }} />
              <div className="shimmer-bg" style={{ width: '100%', height: 28, borderRadius: 8, marginTop: 2 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Pick Up Where You Left Off ── */}
      <div style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 12px' }}>
          <div className="shimmer-bg" style={{ width: 200, height: 20, borderRadius: 6 }} />
          <div className="shimmer-bg" style={{ width: 50, height: 14, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 18px', overflowX: 'hidden' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: 180, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface-container)', border: '1px solid var(--outline)',
              borderRadius: 12, padding: 8,
            }}>
              <div className="shimmer-bg" style={{ width: 50, height: 50, borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="shimmer-bg" style={{ width: '80%', height: 11, borderRadius: 4 }} />
                <div className="shimmer-bg" style={{ width: '50%', height: 11, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Shop by Vendor ── */}
      <div style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 12px' }}>
          <div className="shimmer-bg" style={{ width: 150, height: 20, borderRadius: 6 }} />
          <div className="shimmer-bg" style={{ width: 60, height: 14, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', gap: 14, padding: '0 18px', overflowX: 'hidden' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: 160, flexShrink: 0, background: 'var(--surface-container)',
              border: '1px solid var(--outline)', borderRadius: 16,
              padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div className="shimmer-bg" style={{ width: 54, height: 54, borderRadius: '50%' }} />
              <div className="shimmer-bg" style={{ width: '70%', height: 12, borderRadius: 4 }} />
              <div className="shimmer-bg" style={{ width: '55%', height: 10, borderRadius: 4 }} />
              <div className="shimmer-bg" style={{ width: '60%', height: 10, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. Popular Right Now — 2-column grid ── */}
      <div style={{ padding: '0 18px 24px' }}>
        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="shimmer-bg" style={{ width: 170, height: 20, borderRadius: 6 }} />
          <div className="shimmer-bg" style={{ width: 50, height: 14, borderRadius: 4 }} />
        </div>

        {/* 2-column product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              background: 'var(--surface-container)', border: '1px solid var(--outline)',
              borderRadius: 14, overflow: 'hidden', padding: 10,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {/* Square image */}
              <div className="shimmer-bg" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10 }} />
              {/* Product name */}
              <div className="shimmer-bg" style={{ width: '80%', height: 12, borderRadius: 4 }} />
              {/* Vendor name */}
              <div className="shimmer-bg" style={{ width: '55%', height: 10, borderRadius: 4 }} />
              {/* Price row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="shimmer-bg" style={{ width: 55, height: 14, borderRadius: 4 }} />
                <div className="shimmer-bg" style={{ width: 35, height: 10, borderRadius: 4 }} />
              </div>
              {/* Rating row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div className="shimmer-bg" style={{ width: 12, height: 12, borderRadius: '50%' }} />
                <div className="shimmer-bg" style={{ width: 60, height: 10, borderRadius: 4 }} />
              </div>
              {/* Add to Cart button */}
              <div className="shimmer-bg" style={{ width: '100%', height: 32, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
