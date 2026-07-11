'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/AppContext';

function useCountdown(targetDate: string | undefined) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    if (!targetDate) return;
    const end = new Date(targetDate).getTime();
    const tick = () => {
      const dist = end - Date.now();
      if (dist <= 0) { setTime({ h: 0, m: 0, s: 0, expired: true }); return; }
      setTime({
        h: Math.floor(dist / 3_600_000),
        m: Math.floor((dist % 3_600_000) / 60_000),
        s: Math.floor((dist % 60_000) / 1_000),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { str: `${pad(time.h)}:${pad(time.m)}:${pad(time.s)}`, expired: time.expired };
}

export default function FlashSaleBanner() {
  const { allProducts } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const [tick, setTick] = useState(0); // for message rotation

  const flashProducts = allProducts.filter(p => p.isFlashSale && p.flashSaleEnd);
  const flashEnd = flashProducts[0]?.flashSaleEnd;
  const { str: countdown, expired } = useCountdown(flashEnd);

  // Rotate teaser messages
  const messages = [
    `⚡ FLASH SALE LIVE — ${flashProducts.length} items up to 60% OFF`,
    '🔥 Limited stock — grab yours before it\'s gone!',
    '🛒 Free shipping on flash sale orders over GH₵100',
  ];
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3500);
    return () => clearInterval(id);
  }, []);

  if (!flashProducts.length || expired || dismissed) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'linear-gradient(90deg, #cc0000 0%, #ff2200 40%, #ff4400 70%, #cc0000 100%)',
        backgroundSize: '200% 100%',
        animation: 'flashBannerShift 3s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        height: 36,
        overflow: 'hidden',
      }}
    >
      {/* Pulsing dot */}
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: '#fff',
        marginRight: 10, flexShrink: 0,
        animation: 'flashDotPulse 1s ease-in-out infinite',
      }} />

      {/* Rotating message */}
      <Link
        href="/shop?filter=flash"
        style={{
          color: '#fff', textDecoration: 'none', flex: 1, textAlign: 'center',
          fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800,
          letterSpacing: '0.05em', textTransform: 'uppercase',
          animation: 'fadeIn 0.5s ease-out both',
        }}
        key={tick}
      >
        {messages[tick % messages.length]}
      </Link>

      {/* Countdown */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'rgba(0,0,0,0.25)', borderRadius: 4,
        padding: '2px 8px', marginRight: 6, flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 900, color: '#fff', letterSpacing: '0.08em' }}>
          {countdown}
        </span>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss flash sale banner"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.7)', padding: '4px 8px',
          display: 'flex', alignItems: 'center', flexShrink: 0,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>

      <style>{`
        @keyframes flashBannerShift {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes flashDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.6); }
        }
      `}</style>
    </div>
  );
}
