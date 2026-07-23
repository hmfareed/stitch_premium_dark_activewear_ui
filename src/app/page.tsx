'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

/* ─── Ghana Phone Regex ──────────────────────────────────────────────────── */
const GHANA_PHONE_RE = /^(\+233|0)[235][0-9]{8}$/;

/* ─── Floating Constellation Canvas ──────────────────────────────────────────
   "the dots connecting with lines should be short and many all over the landing page"
   - 120 particles spread randomly across the full viewport.
   - Max link distance = 85px to ensure short & dense connection lines everywhere.
   - Central geometric polygon frame matching the reference layout design.
──────────────────────────────────────────────────────────────────────────── */
function FloatingConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize, { passive: true });

    // 45 particles for smooth 60-120fps rendering without main thread scroll lag
    const COUNT = 45;
    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
    };

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1.2 + Math.random() * 1.5,
      alpha: 0.35 + Math.random() * 0.5,
    }));

    const LINK_DIST = 90;
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
    let frame = 0;
    let raf: number;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Move particles
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      // Draw connecting lines with squared distance check
      for (let i = 0; i < COUNT; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < COUNT; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < LINK_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            const opacity = (1 - dist / LINK_DIST) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(195,244,0,${opacity})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw crisp dots without expensive shadowBlur context operations
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        const pulse = p.alpha * (0.75 + 0.25 * Math.sin(frame * 0.03 + i * 1.1));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(195,244,0,${pulse})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        willChange: 'transform',
        contain: 'strict',
      }}
    />
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 70 }}>
      <span style={{
        fontFamily: 'var(--font-lexend)',
        fontSize: 'clamp(20px, 5vw, 30px)',
        fontWeight: 900,
        color: '#c3f400',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>{value}</span>
      <span style={{
        fontFamily: 'var(--font-lexend)',
        fontSize: 'clamp(8px, 2.2vw, 10px)',
        fontWeight: 700,
        color: 'rgba(195,244,0,0.7)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        textAlign: 'center',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }}>{label}</span>
    </div>
  );
}

function StatDivider() {
  return <div style={{ width: 1, height: 38, background: 'rgba(195,244,0,0.18)', flexShrink: 0 }} />;
}

function SearchParamAuthListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const mode = searchParams?.get('auth');
    if (mode === 'login') {
      router.replace('/login');
    } else if (mode === 'vendor') {
      router.replace('/register/vendor');
    } else if (mode === 'rider') {
      router.replace('/register/rider');
    } else if (mode === 'register' || mode === 'customer') {
      router.replace('/register/customer');
    }
  }, [searchParams, router]);
  return null;
}


export default function LandingPage() {
  const { user, isLoading, login, signup, loginWithUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [showAuthChoice, setShowAuthChoice] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Redirect logged-in users straight to the storefront
  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/shop');
    }
  }, [user, isLoading, router]);

  // While loading auth state or redirecting, show nothing (avoid flash)
  if (isLoading || user) return null;

  return (
    <div style={{
      position: 'relative',
      minHeight: '100dvh',
      width: '100%',
      background: 'radial-gradient(ellipse at 20% 10%, #1a2200 0%, #0d1200 30%, #080c00 60%, #040600 100%)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Suspense fallback={null}>
        <SearchParamAuthListener />
      </Suspense>
      <style>{`
        @keyframes landingFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes landingGlow {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(195,244,0,0.3)); }
          50%       { filter: drop-shadow(0 0 50px rgba(195,244,0,0.5)); }
        }
        @keyframes modalBackdropFade {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(12px); }
        }
        @keyframes modalSmoothPop {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(195,244,0,0.4), 0 0 30px rgba(195,244,0,0.25); }
          50%       { box-shadow: 0 0 0 14px rgba(195,244,0,0), 0 0 48px rgba(195,244,0,0.35); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: var(--base-op); }
          50% { opacity: calc(var(--base-op) * 0.25); }
        }
        .lp-star {
          position: fixed;
          border-radius: 50%;
          background: rgba(195,244,0,0.85);
          pointer-events: none;
          animation: starTwinkle var(--twinkle-dur) ease-in-out infinite;
        }
        .explore-btn {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .explore-btn:hover {
          transform: scale(1.04) !important;
          box-shadow: 0 12px 52px rgba(195,244,0,0.45) !important;
        }
        .lp-nav-link {
          font-family: var(--font-lexend);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.52);
          text-decoration: none;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .lp-nav-link:hover { color: rgba(255,255,255,0.9); }
        .lp-login-btn {
          font-family: var(--font-lexend);
          font-size: 12px;
          font-weight: 700;
          color: rgba(255,255,255,0.72);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 16px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.14);
          transition: all 0.2s;
          background: transparent;
          cursor: pointer;
        }
        .lp-login-btn:hover {
          border-color: rgba(195,244,0,0.5);
          color: #c3f400;
          background: rgba(195,244,0,0.06);
        }
        .lp-register-btn {
          font-family: var(--font-lexend);
          font-size: 12px;
          font-weight: 800;
          color: #000;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 18px;
          border-radius: 100px;
          background: linear-gradient(135deg, #c3f400 0%, #a8e600 40%, #39d353 100%);
          transition: all 0.2s;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 14px rgba(195,244,0,0.35);
        }
        .lp-register-btn:hover {
          background: linear-gradient(135deg, #d4ff00 0%, #b8f000 40%, #4ae064 100%);
          box-shadow: 0 4px 24px rgba(195,244,0,0.55);
          transform: translateY(-1px);
        }
        .vendor-link:hover { color: #c3f400 !important; }
        .footer-link:hover { color: rgba(195,244,0,0.75) !important; }
        .lp-cart-btn:hover { opacity: 0.65; }

        .auth-input {
          width: 100%;
          padding: 12px 14px;
          background: #121800;
          border: 1px solid rgba(195,244,0,0.25);
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-family: var(--font-inter);
          outline: none;
          transition: border-color 0.2s;
        }
        .auth-input:focus {
          border-color: #c3f400;
        }

        @media (max-width: 640px) {
          .lp-header {
            padding: 16px 12px 0 !important;
          }
          .lp-nav {
            gap: 10px !important;
            flex-wrap: nowrap !important;
          }
          .lp-nav-link {
            font-size: 10px !important;
            letter-spacing: 0.04em !important;
          }
          .lp-login-btn, .lp-register-btn {
            font-size: 10px !important;
            padding: 6px 12px !important;
            letter-spacing: 0.04em !important;
            white-space: nowrap !important;
          }
        }
      `}</style>

      {/* Background stars – tiny twinkling dots spread all over */}
      {mounted && Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="lp-star"
          style={{
            left: `${(i * 41 + 7) % 99}%`,
            top: `${(i * 67 + 11) % 97}%`,
            width: i % 7 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.2,
            height: i % 7 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.2,
            ['--base-op' as string]: `${0.07 + (i % 8) * 0.04}`,
            ['--twinkle-dur' as string]: `${2.5 + (i % 5) * 1.1}s`,
            animationDelay: `${(i * 0.37) % 3}s`,
          } as React.CSSProperties}
        />
      ))}

      {/* Full-screen dense floating constellation (short & many connecting lines everywhere) */}
      <FloatingConstellation />

      {/* ── HERO FOLD (FULL VIEWPORT HEIGHT 100dvh) ─────────────────────────── */}
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        boxSizing: 'border-box',
      }}>
        {/* ── NAVIGATION ── */}
        <header className="lp-header" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px 28px 0',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <nav className="lp-nav" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 3.5vw, 24px)', flexWrap: 'nowrap', justifyContent: 'center' }}>
            <a
              href="#about"
              className="lp-nav-link"
              style={{ transition: 'color 0.2s' }}
            >
              About
            </a>
            <a
              href="#services"
              className="lp-nav-link"
              style={{ transition: 'color 0.2s' }}
            >
              Services
            </a>

            {/* Auth buttons */}
            <button
              id="lp-login-btn"
              onClick={() => router.push('/login')}
              aria-label="Log in"
              className="lp-login-btn"
            >
              Log In
            </button>

            <button
              id="lp-register-btn"
              onClick={() => setShowAuthChoice(true)}
              aria-label="Create an account"
              className="lp-register-btn"
            >
              Register
            </button>
          </nav>
        </header>

        {/* ── HERO MAIN CONTENT ── */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 28px 30px',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-lexend)',
            fontSize: 'clamp(58px, 18vw, 100px)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1,
            margin: '0 0 16px',
            letterSpacing: '-0.03em',
            animation: 'landingFadeUp 0.8s ease-out both, landingGlow 4s ease-in-out 0.8s infinite',
          }}>
            <span style={{ color: '#c3f400' }}>Afri</span>Cart
          </h1>

          <p style={{
            fontFamily: 'var(--font-lexend)',
            fontSize: 'clamp(11px, 3vw, 14px)',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.62)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            lineHeight: 1.6,
            maxWidth: 340,
            margin: '0 0 40px',
            animation: 'landingFadeUp 0.8s 0.15s ease-out both',
          }}>
            The Future of{' '}
            <span style={{ color: '#c3f400' }}>Ghanaian<br />Commerce</span>
          </p>

          {/* Stats */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(8px, 3vw, 24px)',
            marginBottom: 38,
            animation: 'landingFadeUp 0.8s 0.28s ease-out both',
            width: '100%',
            maxWidth: 440,
            padding: '0 8px',
            boxSizing: 'border-box',
          }}>
            <Stat value="10k+" label="Verified Vendors" />
            <StatDivider />
            <Stat value="MoMo" label="Instant Payments" />
            <StatDivider />
            <Stat value="24hr" label="Nationwide Delivery" />
          </div>

          {/* Primary CTA */}
          <Link
            href="/shop"
            prefetch={true}
            id="lp-explore-btn"
            className="explore-btn"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#c3f400', color: '#000',
              fontFamily: 'var(--font-lexend)', fontWeight: 900,
              fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
              textDecoration: 'none', padding: '18px 36px',
              borderRadius: 100, marginBottom: 20, width: '100%', maxWidth: 340,
              boxShadow: '0 0 30px rgba(195,244,0,0.25)',
              animation: 'landingFadeUp 0.8s 0.4s ease-out both, btnPulse 2.5s 1.2s ease-in-out infinite',
            }}
          >
            Explore Marketplace
          </Link>

        </main>

        {/* ── SCROLL DOWN INDICATOR ── */}
        <a
          href="#about"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            paddingBottom: 20,
            color: 'rgba(195,244,0,0.7)',
            textDecoration: 'none',
            animation: 'landingFadeUp 0.8s 0.65s ease-out both',
            cursor: 'pointer',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-lexend)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.4)',
          }}>
            Scroll to Explore
          </span>
          <span className="material-symbols-outlined" style={{
            fontSize: 22,
            color: '#c3f400',
            animation: 'landingFadeUp 1.5s infinite ease-in-out alternate',
          }}>
            keyboard_arrow_down
          </span>
        </a>
      </div>

      {/* ── ABOUT SECTION ─────────────────────────────────────────────────────── */}
      <section id="about" style={{ position: 'relative', zIndex: 10, padding: '70px 28px 50px', maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: 100,
          background: 'rgba(195,244,0,0.08)',
          border: '1px solid rgba(195,244,0,0.25)',
          color: '#c3f400',
          fontFamily: 'var(--font-lexend)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          About AfriCart
        </div>
        <h2 style={{
          fontFamily: 'var(--font-lexend)',
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1.2,
          marginBottom: 16,
        }}>
          Empowering Ghanaian Commerce & Local Creators
        </h2>
        <p style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'clamp(14px, 2vw, 16px)',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.7,
          maxWidth: 720,
          margin: '0 auto 48px',
        }}>
          AfriCart is Ghana&apos;s premier multi-vendor marketplace designed to connect local creators, fashion designers, electronics suppliers, and local merchants with millions of shoppers nationwide. Experience seamless mobile payments, fast delivery, and total buyer protection.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, textAlign: 'left' }}>
          {[
            {
              icon: 'public',
              title: '100% Ghanaian Driven',
              desc: 'Built specifically for Ghanaian trade dynamics, connecting businesses from Accra, Kumasi, Tamale, Takoradi, and all 16 regions.'
            },
            {
              icon: 'verified_user',
              title: 'Escrow & Buyer Protection',
              desc: 'Your money is safe. Payments are protected in escrow until your order is delivered and verified to match your expectations.'
            },
            {
              icon: 'account_balance_wallet',
              title: 'Instant Mobile Money',
              desc: 'Pay effortlessly using MTN Mobile Money, Telecel Cash, AT Money, or debit cards with zero complicated setups.'
            }
          ].map((card, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(195,244,0,0.18)',
              borderRadius: 18,
              padding: 28,
              transition: 'transform 0.2s, border-color 0.2s',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(195,244,0,0.1)',
                border: '1px solid rgba(195,244,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
                color: '#c3f400'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 26 }}>{card.icon}</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: 8 }}>{card.title}</h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── OUR SERVICES SECTION ─────────────────────────────────────────────── */}
      <section id="services" style={{ position: 'relative', zIndex: 10, padding: '60px 28px 50px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 100,
            background: 'rgba(195,244,0,0.08)',
            border: '1px solid rgba(195,244,0,0.25)',
            color: '#c3f400',
            fontFamily: 'var(--font-lexend)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Services
          </div>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
            Built for Modern Commerce
          </h2>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'rgba(255,255,255,0.62)', maxWidth: 560, margin: '0 auto' }}>
            Everything vendors and shoppers need for a smooth, trusted e-commerce experience.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { icon: 'storefront', title: 'Vendor Storefronts', desc: 'Customizable storefronts for Ghanaian creators, brands, and local retailers.' },
            { icon: 'payments', title: 'Instant MoMo Payments', desc: 'Secure local payments via MTN MoMo, Telecel Cash, AT Money, and cards.' },
            { icon: 'local_shipping', title: 'Express Delivery', desc: 'Doorstep dispatch and automated tracking across all regions in Ghana.' },
            { icon: 'gavel', title: 'Dispute Resolution', desc: 'Automated seller payouts & buyer dispute guarantees for complete safety.' }
          ].map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(195,244,0,0.15)',
              borderRadius: 16,
              padding: 24,
              textAlign: 'left'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#c3f400', marginBottom: 12, display: 'block' }}>{item.icon}</span>
              <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── POPULAR STORE CATEGORIES ─────────────────────────────────────────── */}
      <section id="categories" style={{ position: 'relative', zIndex: 10, padding: '60px 28px 50px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 100,
            background: 'rgba(195,244,0,0.08)',
            border: '1px solid rgba(195,244,0,0.25)',
            color: '#c3f400',
            fontFamily: 'var(--font-lexend)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Explore Marketplace
          </div>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
            Top Store Categories
          </h2>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.95rem', color: 'rgba(255,255,255,0.62)', maxWidth: 560, margin: '0 auto' }}>
            Discover hundreds of authentic products curated from local Ghanaian vendors.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { icon: 'styler', name: 'Fashion & Wear', count: '3.4k+ items', tag: 'Trending' },
            { icon: 'devices', name: 'Electronics & Tech', count: '1.8k+ items', tag: 'Verified' },
            { icon: 'palette', name: 'Art & Crafts', count: '920+ items', tag: 'Handmade' },
            { icon: 'spa', name: 'Beauty & Skincare', count: '1.2k+ items', tag: 'Organic' },
            { icon: 'restaurant', name: 'Local Food & Spices', count: '650+ items', tag: 'Fresh' }
          ].map((cat, idx) => (
            <Link
              key={idx}
              href="/shop"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '20px 16px',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#c3f400';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(195,244,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c3f400',
                marginBottom: 12,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{cat.icon}</span>
              </div>
              <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{cat.name}</h4>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{cat.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── VENDOR CALLOUT BANNER ────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 10, padding: '40px 28px 60px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(195,244,0,0.12) 0%, rgba(13,18,0,0.9) 60%, rgba(20,28,0,0.95) 100%)',
          border: '1px solid rgba(195,244,0,0.35)',
          borderRadius: 24,
          padding: '40px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 30px rgba(195,244,0,0.1)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
            Are You a Business Owner or Creator in Ghana?
          </h3>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '1rem', color: 'rgba(255,255,255,0.75)', maxWidth: 600, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Set up your store in under 5 minutes. Take advantage of automated Mobile Money payouts, nationwide rider delivery, and custom storefront URLs.
          </p>
          <Link
            href="/register/vendor"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#c3f400',
              color: '#000',
              fontFamily: 'var(--font-lexend)',
              fontWeight: 900,
              fontSize: 13,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              padding: '16px 32px',
              borderRadius: 100,
              boxShadow: '0 6px 30px rgba(195,244,0,0.35)',
              transition: 'transform 0.2s',
            }}
          >
            <span>Become a Vendor Today</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* ── FREQUENTLY ASKED QUESTIONS ───────────────────────────────────────── */}
      <section id="faq" style={{ position: 'relative', zIndex: 10, padding: '40px 28px 70px', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 100,
            background: 'rgba(195,244,0,0.08)',
            border: '1px solid rgba(195,244,0,0.25)',
            color: '#c3f400',
            fontFamily: 'var(--font-lexend)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            Questions & Answers
          </div>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 900, color: '#fff', margin: 0 }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            {
              q: 'How do payments work on AfriCart?',
              a: 'AfriCart supports all major Ghanaian Mobile Money providers (MTN MoMo, Telecel Cash, AT Money) and debit/credit cards. Funds are held safely in escrow until your order is delivered.'
            },
            {
              q: 'How fast is nationwide delivery?',
              a: 'Deliveries within major hubs (Accra, Kumasi, Tamale) take 12 to 24 hours. Inter-regional deliveries arrive within 24 to 48 hours with live rider tracking.'
            },
            {
              q: 'How do I start selling as a vendor?',
              a: 'Click "Become a Vendor", fill in your store details, upload your Ghana Card verification, and you can immediately start listing products and accepting MoMo payments.'
            },
            {
              q: 'What if I receive a damaged or incorrect item?',
              a: 'Our Buyer Protection policy covers all orders. You can initiate a dispute or return request within 48 hours of delivery for a full refund or exchange.'
            }
          ].map((faq, idx) => (
            <div key={idx} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(195,244,0,0.15)',
              borderRadius: 14,
              padding: '20px 24px',
            }}>
              <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.05rem', fontWeight: 700, color: '#c3f400', margin: '0 0 8px' }}>
                {faq.q}
              </h4>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 10,
        padding: '30px 28px 36px',
        borderTop: '1px solid rgba(195,244,0,0.12)',
        display: 'flex', flexWrap: 'wrap',
        justifyContent: 'space-between', alignItems: 'center',
        gap: 16,
        animation: 'landingFadeUp 0.8s 0.6s ease-out both',
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, color: '#fff' }}>
            <span style={{ color: '#c3f400' }}>Afri</span>Cart
          </span>
          <p style={{
            fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 600,
            color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase',
            margin: 0,
          }}>
            © 2026 AfriCart Ghana. All Rights Reserved.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Privacy Policy', href: '/buyer-protection' },
            { label: 'Terms of Service', href: '/buyer-protection' },
            { label: 'Support & Help', href: '/account/support' },
            { label: 'Vendor Portal', href: '/vendor' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="footer-link"
              style={{
                fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
                color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em',
                textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.2s',
              }}
            >{label}</Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#c3f400' }}>location_on</span>
          <span style={{
            fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700,
            color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>ACCRA • KUMASI • TAMALE</span>
        </div>
      </footer>

      {/* ── REGISTRATION CHOICE MODAL (Customer, Vendor, Rider) ── */}
      {showAuthChoice && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 110,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            animation: 'modalBackdropFade 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
          onClick={() => setShowAuthChoice(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 430,
              background: '#0d1200', border: '1px solid rgba(195,244,0,0.35)',
              borderRadius: 22, padding: '28px 24px', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(195,244,0,0.18)',
              position: 'relative',
              animation: 'modalSmoothPop 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAuthChoice(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(195,244,0,0.15)', border: '1px solid rgba(195,244,0,0.3)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#c3f400'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>person_add</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
              Create an Account
            </h2>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 24px' }}>
              Choose your account type to get started on AfriCart
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
              {/* Option 1: Customer Account */}
              <button
                onClick={() => { setShowAuthChoice(false); router.push('/register/customer'); }}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14,
                  background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.35)',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#c3f400', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>shopping_bag</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: '#c3f400' }}>
                    Customer Account
                  </div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    Shop products, track orders & earn rewards
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>chevron_right</span>
              </button>

              {/* Option 2: Vendor Store Account */}
              <button
                onClick={() => { setShowAuthChoice(false); router.push('/register/vendor'); }}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14,
                  background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.3)',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#00e5ff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>storefront</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: '#00e5ff' }}>
                    Vendor Store Account
                  </div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    Sell products nationwide & receive instant MoMo payouts
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>chevron_right</span>
              </button>

              {/* Option 3: Delivery Rider Account */}
              <button
                onClick={() => { setShowAuthChoice(false); router.push('/register/rider'); }}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14,
                  background: 'rgba(255,170,0,0.08)', border: '1px solid rgba(255,170,0,0.3)',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: '#ffaa00', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>two_wheeler</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, color: '#ffaa00' }}>
                    Delivery Rider Partner
                  </div>
                  <div style={{ fontFamily: 'var(--font-inter)', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    Earn money delivering orders with bike, car or walking
                  </div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>chevron_right</span>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <button
                onClick={() => { setShowAuthChoice(false); router.push('/login'); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}
              >
                Already have an account? <span style={{ color: '#c3f400', fontWeight: 700 }}>Sign In →</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
