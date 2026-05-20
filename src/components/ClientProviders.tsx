'use client';

import React from 'react';
import { CartProvider, AuthProvider, WishlistProvider, ToastProvider, ThemeProvider, StoreProvider, NotificationProvider, UserActivityProvider } from '@/context/AppContext';
import { AdminProvider } from '@/context/AdminContext';

const ClientProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <StoreProvider>
              <AdminProvider>
                <NotificationProvider>
                  <UserActivityProvider>
                    <ToastProvider>
                      {children}
                    </ToastProvider>
                  </UserActivityProvider>
                </NotificationProvider>
              </AdminProvider>
            </StoreProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default ClientProviders;
