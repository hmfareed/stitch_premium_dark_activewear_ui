'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import AIChatAssistant from './AIChatAssistant';
import ClientProviders from './ClientProviders';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor');

  return (
    <ClientProviders>
      {!isAdmin && <TopAppBar />}
      <main style={{ paddingTop: isAdmin ? 0 : 100, paddingBottom: isAdmin ? 0 : 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
      {!isAdmin && <BottomNavBar />}
      {!isAdmin && <AIChatAssistant />}
    </ClientProviders>
  );
};
