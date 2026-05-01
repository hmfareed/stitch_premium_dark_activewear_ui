'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopAppBar } from './TopAppBar';
import { BottomNavBar } from './BottomNavBar';
import { CartProvider, AuthProvider, WishlistProvider, ToastProvider, ThemeProvider, StoreProvider } from '@/context/AppContext';
import { AdminProvider } from '@/context/AdminContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor');

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <StoreProvider>
              <AdminProvider>
                <ToastProvider>
                  {!isAdmin && <TopAppBar />}
                  <main style={{ paddingTop: isAdmin ? 0 : 100, paddingBottom: isAdmin ? 0 : 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                    {children}
                  </main>
                  {!isAdmin && <BottomNavBar />}
                </ToastProvider>
              </AdminProvider>
            </StoreProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
