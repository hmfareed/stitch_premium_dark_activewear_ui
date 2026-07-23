'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import ClientProviders from './ClientProviders';
import { CartDrawer } from './CartDrawer';
import FlashSaleBanner from './FlashSaleBanner';
import { Footer } from './Footer';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor');
  const isChat = pathname === '/chat';
  const isLanding = pathname === '/';
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const noNav = isAdmin || isChat || isLanding || isAuthPage;

  // Render footer exclusively on the homepage (/shop)
  const isHomepage = pathname === '/shop';

  return (
    <ClientProviders>
      {!noNav && <FlashSaleBanner />}
      {!noNav && (
        <React.Suspense fallback={null}>
          <TopAppBar />
        </React.Suspense>
      )}
      {/* CartDrawer always rendered so landing page cart button works */}
      <CartDrawer />
      <main style={{ paddingTop: noNav ? 0 : 100, paddingBottom: noNav ? 0 : 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        {isHomepage && <Footer />}
      </main>
      {!noNav && (
        <React.Suspense fallback={null}>
          <BottomNavBar />
        </React.Suspense>
      )}
    </ClientProviders>
  );
};

