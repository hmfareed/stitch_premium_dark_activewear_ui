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
  const noNav = isAdmin || isChat;

  return (
    <ClientProviders>
      {!noNav && <FlashSaleBanner />}
      {!noNav && <TopAppBar />}
      {!noNav && <CartDrawer />}
      <main style={{ paddingTop: noNav ? 0 : 100, paddingBottom: noNav ? 0 : 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
        {!noNav && pathname === '/' && <Footer />}
      </main>
      {!noNav && <BottomNavBar />}
    </ClientProviders>
  );
};

