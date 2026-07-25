'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, products as defaultProducts } from '@/data/products';
import { isSuperAdminEmail, resolveUserRole } from '@/lib/super-admin';

/* ========== AUTH CONTEXT ========== */
interface User {
  email: string;
  name: string;
  phone?: string;
  profilePic?: string;
  role?: 'customer' | 'vendor' | 'super_admin' | 'rider';
  points?: number;
  isVerified?: boolean;
}

interface LocalAccount extends User {
  password?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  loginWithUser: (userData: User, token?: string) => void;
  vendorSignup: (data: {
    name: string; email: string; phone: string; password: string;
    businessName: string; businessCategory: string; momoNumber: string;
  }) => Promise<{ success: boolean; vendorStatus?: string; error?: string }>;
  updateProfilePic: (picData: string | undefined) => void;
  updateName: (newName: string) => Promise<boolean>;
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  updateUserVerification: (isVerified: boolean) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tryLocalLogin = useCallback((email: string, password: string): boolean => {
    const normalizedEmail = email.toLowerCase();

    if (isSuperAdminEmail(normalizedEmail) && password === 'admin') {
      const u: User = {
        name: 'Super Admin',
        email: normalizedEmail,
        role: 'super_admin',
      };
      setUser(u);
      localStorage.setItem('africart-user', JSON.stringify(u));
      return true;
    }

    const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
    const localUser = accounts.find(
      (a) => a.email.toLowerCase() === normalizedEmail && a.password === password
    );
    if (localUser) {
      const u: User = {
        ...localUser,
        role: resolveUserRole(localUser.email, localUser.role),
      };
      setUser(u);
      localStorage.setItem('africart-user', JSON.stringify(u));
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('africart-user');
    
    const syncUser = (parsedUser: User) => {
      fetch(`/api/users/${encodeURIComponent(parsedUser.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            const syncedRole = resolveUserRole(parsedUser.email, data.user.role);
            setUser(prev => {
              if (!prev) return prev;
              if (prev.role !== syncedRole || prev.name !== data.user.name || prev.isVerified !== data.user.isVerified) {
                const updatedUser = { ...prev, role: syncedRole, name: data.user.name, isVerified: data.user.isVerified };
                localStorage.setItem('africart-user', JSON.stringify(updatedUser));
                return updatedUser;
              }
              return prev;
            });
          }
        })
        .catch(err => console.error('Failed to sync user role:', err));
    };

    if (saved) {
      try { 
        const rawUser = JSON.parse(saved) as User;
        
        // Ensure rawUser has required fields
        if (rawUser && rawUser.email) {
          const resolvedRole = resolveUserRole(
            rawUser.email,
            rawUser.role ?? (
              (JSON.parse(localStorage.getItem('africart-vendors') || '[]') as User[])
                .some((a) => a.email === rawUser.email) ? 'vendor' : 'customer'
            )
          );
          // Build a new object instead of mutating the parsed value
          const parsedUser: User = { ...rawUser, role: resolvedRole };
          
          setUser(parsedUser);
          
          // Initial sync on mount
          syncUser(parsedUser);

          // Sync on window focus
          const handleFocus = () => syncUser(parsedUser);
          window.addEventListener('focus', handleFocus);
          
          // Set loading to false AFTER user is set
          setIsLoading(false);
          return () => window.removeEventListener('focus', handleFocus);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse saved user:', err);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Persist JWT if the API returns one
        if (data.token) localStorage.setItem('africart-token', data.token);
        const u: User = { ...data.user, role: resolveUserRole(data.user.email, data.user.role) };
        setUser(u);
        localStorage.setItem('africart-user', JSON.stringify(u));
        return true;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const localSuccess = tryLocalLogin(email, password);
      if (!localSuccess) {
        throw new Error('Invalid email or password');
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      // Determine if this is a network/connectivity error to trigger local fallback
      const isNetworkError = error instanceof TypeError || 
        (error instanceof Error && (
          error.message === 'Failed to fetch' ||
          error.message.toLowerCase().includes('fetch') ||
          error.message.toLowerCase().includes('network') ||
          error.message.toLowerCase().includes('load failed')
        ));

      if (!isNetworkError && error instanceof Error) {
        throw error;
      }
      
      const localSuccess = tryLocalLogin(email, password);
      if (!localSuccess) {
        throw new Error('Connection error: Offline login failed');
      }
      return true;
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        if (data.pendingApproval) {
          // Pending superadmin approval — do NOT log in or store token
          return true;
        }

        // Persist JWT
        if (data.token) localStorage.setItem('africart-token', data.token);
        const u: User = data.user;
        setUser(u);
        localStorage.setItem('africart-user', JSON.stringify(u));
        
        // Also save locally to keep local cache in sync (avoiding duplicates)
        const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
        if (!accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
          localStorage.setItem('africart-accounts', JSON.stringify([...accounts, { ...u, password }]));
        }
        return true;
      }
      
      // If API fails (e.g. 500 DB error), fallback to local storage
      const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
      if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) return false; // email in use
      
      const roleToAssign: 'super_admin' | 'customer' = isSuperAdminEmail(email.toLowerCase()) ? 'super_admin' : 'customer';
      
      const newAccount = { name, email, phone, password, role: roleToAssign };
      const newUser: User = { name, email, phone, role: roleToAssign };
      
      localStorage.setItem('africart-accounts', JSON.stringify([...accounts, newAccount]));
      setUser(newUser);
      localStorage.setItem('africart-user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
      if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) return false;
      
      const roleToAssign: 'super_admin' | 'customer' = isSuperAdminEmail(email.toLowerCase()) ? 'super_admin' : 'customer';
      
      const newAccount = { name, email, phone, password, role: roleToAssign };
      const newUser: User = { name, email, phone, role: roleToAssign };
      
      localStorage.setItem('africart-accounts', JSON.stringify([...accounts, newAccount]));
      setUser(newUser);
      localStorage.setItem('africart-user', JSON.stringify(newUser));
      return true;
    }
  };

  const vendorSignup = async (data: {
    name: string; email: string; phone: string; password: string;
    businessName: string; businessCategory: string; momoNumber: string;
  }): Promise<{ success: boolean; vendorStatus?: string; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register/vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.pendingApproval) {
          // Vendor account is pending superadmin review — do NOT set session
          return { success: true, vendorStatus: json.vendorStatus || 'pending' };
        }
        if (json.token) localStorage.setItem('africart-token', json.token);
        const u: User = { ...json.user, role: 'vendor' as const };
        setUser(u);
        localStorage.setItem('africart-user', JSON.stringify(u));
        return { success: true, vendorStatus: json.vendorStatus };
      }
      return { success: false, error: json.error || 'Registration failed' };
    } catch (err) {
      console.error('Vendor signup error:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const updateProfilePic = (picData: string | undefined) => {
    if (!user) return;
    const updatedUser = { ...user, profilePic: picData };
    setUser(updatedUser);
    localStorage.setItem('africart-user', JSON.stringify(updatedUser));
    
    // Update accounts array
    const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
    const updatedAccounts = accounts.map((a) => a.email === user.email ? { ...a, profilePic: picData } : a);
    localStorage.setItem('africart-accounts', JSON.stringify(updatedAccounts));
  };

  const updateName = async (newName: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Update in DB
      const res = await fetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      
      if (!res.ok) throw new Error('Failed to update name in DB');
    } catch (err) {
      console.error('Failed to update name in DB:', err);
      // We still update locally as a fallback
    }

    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);
    localStorage.setItem('africart-user', JSON.stringify(updatedUser));
    
    // Update accounts array
    const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
    const updatedAccounts = accounts.map((a) => a.email === user.email ? { ...a, name: newName } : a);
    localStorage.setItem('africart-accounts', JSON.stringify(updatedAccounts));
    
    return true;
  };

  const updateEmail = async (newEmail: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };
    if (newEmail.toLowerCase() === user.email.toLowerCase()) return { success: false, error: 'Same as current email' };

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update email' };
      }

      const oldEmail = user.email;
      const updatedUser = { ...user, email: newEmail.toLowerCase() };
      setUser(updatedUser);
      localStorage.setItem('africart-user', JSON.stringify(updatedUser));

      // Migrate local accounts cache
      const accounts: LocalAccount[] = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
      const updatedAccounts = accounts.map((a) =>
        a.email.toLowerCase() === oldEmail.toLowerCase() ? { ...a, email: newEmail.toLowerCase() } : a
      );
      localStorage.setItem('africart-accounts', JSON.stringify(updatedAccounts));

      // Migrate local notification/order caches
      const keysToMigrate = ['africart-orders-', 'africart-notifications-', 'africart-order-statuses-'];
      keysToMigrate.forEach(prefix => {
        const oldData = localStorage.getItem(`${prefix}${oldEmail}`);
        if (oldData) {
          localStorage.setItem(`${prefix}${newEmail.toLowerCase()}`, oldData);
          localStorage.removeItem(`${prefix}${oldEmail}`);
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to update email:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const updateUserVerification = async (isVerified: boolean): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified }),
      });
      if (res.ok) {
        const updatedUser = { ...user, isVerified };
        setUser(updatedUser);
        localStorage.setItem('africart-user', JSON.stringify(updatedUser));
        return true;
      }
    } catch (err) {
      console.error('Failed to update verification status:', err);
    }
    const updatedUser = { ...user, isVerified };
    setUser(updatedUser);
    localStorage.setItem('africart-user', JSON.stringify(updatedUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('africart-user');
    localStorage.removeItem('africart-token');
    localStorage.removeItem('africart-vendor-store');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'africart-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  };

  /**
   * Set the authenticated user directly from an API response.
   * Used by registration flows that already called the API themselves
   * and should NOT trigger a second signup request.
   */
  const loginWithUser = (userData: User, token?: string) => {
    setUser(userData);
    localStorage.setItem('africart-user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('africart-token', token);
      document.cookie = `africart-token=${token}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithUser, vendorSignup, updateProfilePic, updateName, updateEmail, updateUserVerification, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/* ========== WISHLIST CONTEXT ========== */
interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  totalWishlist: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('africart-wishlist');
    if (saved) { try { setWishlist(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    localStorage.setItem('africart-wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product: Product) => {
    setWishlist(prev => prev.some(p => p.id === product.id) ? prev : [...prev, product]);
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(p => p.id === productId);
  }, [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, totalWishlist: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};

/* ========== CART CONTEXT ========== */
export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  cartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  getCartItemPrice: (item: CartItem) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const openCartDrawer = () => setCartDrawerOpen(true);
  const closeCartDrawer = () => setCartDrawerOpen(false);

  useEffect(() => {
    const saved = localStorage.getItem('africart-cart');
    if (saved) { try { setCart(JSON.parse(saved)); } catch {} }

    // Fetch campaigns for price calculations
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCampaigns(data.campaigns || []);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem('africart-cart', JSON.stringify(cart));
  }, [cart]);

  const getCartItemPrice = useCallback((item: CartItem) => {
    let finalPrice = item.price;
    let appliedDiscount = 0;

    // 1. Check Wholesale Tiers
    if (item.wholesaleTiers && item.wholesaleTiers.length > 0) {
      const sortedTiers = [...item.wholesaleTiers].sort((a, b) => b.minQuantity - a.minQuantity);
      const matchingTier = sortedTiers.find(tier => item.quantity >= tier.minQuantity);
      if (matchingTier) {
        appliedDiscount = Math.max(appliedDiscount, matchingTier.discountPercent);
      }
    }

    // 2. Check Campaigns
    if (item.campaignId) {
      const activeCampaign = campaigns.find(c => c.id === item.campaignId && c.status === 'active');
      if (activeCampaign) {
        appliedDiscount = Math.max(appliedDiscount, activeCampaign.discountValue);
      }
    }

    if (appliedDiscount > 0) {
      finalPrice = finalPrice * (1 - appliedDiscount / 100);
    }

    return finalPrice;
  }, [campaigns]);

  const addToCart = (product: Product, size?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
        .filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, cartDrawerOpen, openCartDrawer, closeCartDrawer, getCartItemPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

/* ========== TOAST CONTEXT ========== */
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, width: '90%', maxWidth: 400 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast-enter"
            style={{
              background: t.type === 'success' ? '#c3f400' : t.type === 'error' ? '#ff4444' : '#333',
              color: t.type === 'success' ? '#000' : '#fff',
              padding: '12px 20px',
              borderRadius: 8,
              fontFamily: 'var(--font-lexend)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

/* ========== THEME CONTEXT ========== */
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start with 'system' to avoid SSR/client hydration mismatch.
  // The real saved theme is loaded in the useEffect below.
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<string>('#00E5FF');
  const isLoaded = useRef(false);

  // Load saved theme and accent color from localStorage AFTER mount (prevents hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('africart-theme') as ThemeMode | null;
    if (saved && saved !== 'system') {
      setThemeState(saved);
    }
    const savedAccent = localStorage.getItem('africart-accent-color');
    if (savedAccent) {
      setAccentColorState(savedAccent);
      document.documentElement.style.setProperty('--lime-400', savedAccent);
    }
    isLoaded.current = true;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme: ThemeMode) => {
      if (currentTheme === 'system') {
        root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', currentTheme);
      }
    };

    applyTheme(theme);
    localStorage.setItem('africart-theme', theme);

    // Listen for OS-level theme changes when in 'system' mode
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Apply accent color dynamically when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded.current) {
      const root = document.documentElement;
      root.style.setProperty('--lime-400', accentColor);
      localStorage.setItem('africart-accent-color', accentColor);
    }
  }, [accentColor]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const setAccentColor = (newColor: string) => {
    setAccentColorState(newColor);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

/* ========== STORE CONTEXT (Products & Followers) ========== */
export interface VendorSettings {
  storeName: string;
  storeEmail: string;
  storeContact: string;
  storeDescription: string;
  returnPolicy: string;
  deliveryFee: string;
  estimatedTime: string;
  deliveryPlaces: string[];
  notifNewOrders: boolean;
  notifLowStock: boolean;
  notifCustomerMessages: boolean;
  notifWeeklyReports: boolean;
}

export interface VendorStore {
  id: string;
  name: string;
  email: string;
}

/** @deprecated — static store list removed. Use vendorStore from useStore() instead. */
export const VENDOR_STORES: VendorStore[] = [];

/** Shape of the real Store document returned from /api/stores */
export interface VendorStoreDoc {
  _id: string;
  name: string;
  slug: string;
  vendorEmail: string;
  category: string;
  businessType: string;
  status: 'setup' | 'payment_pending' | 'under_review' | 'active' | 'suspended';
  paystackSubaccountCode?: string;
  paystackSubaccountStatus: 'none' | 'pending' | 'active' | 'failed';
  verificationTier: string;
  storeLogo?: string;
  storeBanner?: string;
  storeBio?: string;
  goLiveAt?: string;
}

interface StoreContextType {
  allProducts: Product[];
  productsLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (productId: string) => void;
  deleteAllProducts: () => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  refreshProducts: () => void;
  followers: { vendorEmail: string, userEmail: string, userName?: string }[];
  followVendor: (vendorEmail: string, userEmail: string, userName?: string) => void;
  unfollowVendor: (vendorEmail: string, userEmail: string) => void;
  isFollowing: (vendorEmail: string, userEmail: string) => boolean;
  getVendorSettings: (vendorEmail: string) => VendorSettings;
  saveVendorSettings: (vendorEmail: string, settings: VendorSettings) => void;
  campaigns: any[];
  refreshCampaigns: () => void;
  activeStoreId: string;
  setActiveStoreId: (id: string) => void;
  /** The logged-in vendor's real Store document from the database */
  vendorStore: VendorStoreDoc | null;
  vendorStoreLoading: boolean;
  /** True if the store fetch failed with a network/server error (do NOT redirect to onboarding in this case) */
  vendorStoreError: boolean;
  refreshVendorStore: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_VENDOR_SETTINGS: VendorSettings = {
  storeName: '',
  storeEmail: '',
  storeContact: '',
  storeDescription: '',
  returnPolicy: '',
  deliveryFee: '',
  estimatedTime: '',
  deliveryPlaces: [],
  notifNewOrders: true,
  notifLowStock: true,
  notifCustomerMessages: true,
  notifWeeklyReports: false,
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [followers, setFollowers] = useState<{ vendorEmail: string, userEmail: string, userName?: string }[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string>('');
  const [vendorStore, setVendorStore] = useState<VendorStoreDoc | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('africart-vendor-store');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });
  // Initialize as true to prevent race condition: layout must not see loading=false,store=null before fetch starts
  const [vendorStoreLoading, setVendorStoreLoading] = useState(true);
  const [vendorStoreError, setVendorStoreError] = useState(false);

  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('africart-active-store-id');
    if (saved) setActiveStoreIdState(saved);
  }, []);

  const setActiveStoreId = useCallback((id: string) => {
    setActiveStoreIdState(id);
    localStorage.setItem('africart-active-store-id', id);
  }, []);

  /** Fetch the current vendor's real Store document from the DB */
  const fetchVendorStore = useCallback(async () => {
    // Wait for auth hydration to finish before deciding whether a vendor has a store.
    // Without this, a hard refresh can briefly look like "no user + no store" and
    // incorrectly kick an existing vendor back into onboarding.
    if (authLoading) {
      setVendorStoreLoading(true);
      return;
    }
    if (!user?.email || (user.role !== 'vendor' && user.role !== 'super_admin')) {
      setVendorStore(null);
      setVendorStoreError(false);
      setVendorStoreLoading(false);
      if (typeof window !== 'undefined') localStorage.removeItem('africart-vendor-store');
      return;
    }
    setVendorStoreLoading(true);
    setVendorStoreError(false);
    try {
      const res = await fetch(`/api/stores?vendorEmail=${encodeURIComponent(user.email.trim().toLowerCase())}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.stores?.length > 0) {
        // Use the most recent active store, or the most recent any-status store
        const active = data.stores.find((s: VendorStoreDoc) => s.status === 'active');
        const targetStore = active || data.stores[0];
        setVendorStore(targetStore);
        setVendorStoreError(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('africart-vendor-store', JSON.stringify(targetStore));
        }
      } else {
        setVendorStore(null);
        setVendorStoreError(false);
        if (typeof window !== 'undefined') localStorage.removeItem('africart-vendor-store');
      }
    } catch (err) {
      console.error('Failed to fetch vendor store:', err);
      // Mark as error so layout does NOT redirect to onboarding on API failures
      setVendorStoreError(true);
    } finally {
      setVendorStoreLoading(false);
    }
  }, [user, authLoading]);

  const refreshVendorStore = useCallback(() => {
    fetchVendorStore();
  }, [fetchVendorStore]);

  useEffect(() => {
    fetchVendorStore();
  }, [fetchVendorStore]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns in AppContext:', err);
    }
  }, []);

  const refreshCampaigns = useCallback(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const fetchProducts = useCallback(() => {
    setProductsLoading(true);
    const startTime = Date.now();
    const minDisplayTime = 800; // ms — ensure skeleton is visible

    fetch('/api/products')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setAllProducts(data.products);
          localStorage.setItem('africart-products', JSON.stringify(data.products));
        } else {
          throw new Error(data.error || 'Failed to fetch products');
        }
      })
      .catch(err => {
        console.error('Failed to fetch products from DB:', err);
        const savedProducts = localStorage.getItem('africart-products');
        if (savedProducts) {
          try {
            setAllProducts(JSON.parse(savedProducts));
          } catch {
            setAllProducts(defaultProducts);
          }
        } else {
          setAllProducts(defaultProducts);
        }
      })
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minDisplayTime - elapsed);
        setTimeout(() => {
          setProductsLoading(false);
        }, remaining);
      });

    // Also fetch followers
    fetch('/api/followers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFollowers(data.followers);
          localStorage.setItem('africart-followers', JSON.stringify(data.followers));
        }
      })
      .catch(() => {
        const savedFollowers = localStorage.getItem('africart-followers');
        if (savedFollowers) setFollowers(JSON.parse(savedFollowers));
      });
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refreshProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      
      if (data.success) {
        setAllProducts(prev => {
          const updated = [data.product, ...prev];
          localStorage.setItem('africart-products', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to add product to DB:', error);
      const newProduct = { ...product, id: `PROD-${Date.now()}` } as Product;
      setAllProducts(prev => {
        const updated = [newProduct, ...prev];
        localStorage.setItem('africart-products', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string) => {
    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete product from DB:', error);
    }
    setAllProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      localStorage.setItem('africart-products', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteAllProducts = useCallback(async () => {
    try {
      await fetch('/api/products', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete all products from DB:', error);
    }
    setAllProducts([]);
    localStorage.setItem('africart-products', JSON.stringify([]));
  }, []);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Failed to update product in DB:', error);
    }
    setAllProducts(prev => {
      const updated = prev.map(p => p.id === productId ? { ...p, ...updates } : p);
      localStorage.setItem('africart-products', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const followVendor = useCallback(async (vendorEmail: string, userEmail: string, userName?: string) => {
    try {
      await fetch('/api/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorEmail, userEmail, userName: userName || userEmail.split('@')[0] })
      });
      fetchProducts(); // Refresh followers
    } catch (error) {
      console.error('Failed to follow vendor:', error);
    }
  }, [fetchProducts]);

  const unfollowVendor = useCallback(async (vendorEmail: string, userEmail: string) => {
    try {
      await fetch(`/api/followers?vendorEmail=${encodeURIComponent(vendorEmail)}&userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });
      fetchProducts(); // Refresh followers
    } catch (error) {
      console.error('Failed to unfollow vendor:', error);
    }
  }, [fetchProducts]);

  const isFollowing = useCallback((vendorEmail: string, userEmail: string) => {
    return followers.some(f => f.vendorEmail === vendorEmail && f.userEmail === userEmail);
  }, [followers]);

  const getVendorSettings = useCallback((vendorEmail: string): VendorSettings => {
    try {
      const saved = localStorage.getItem(`africart-vendor-settings-${vendorEmail}`);
      if (saved) return { ...DEFAULT_VENDOR_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return { ...DEFAULT_VENDOR_SETTINGS };
  }, []);

  const saveVendorSettings = useCallback((vendorEmail: string, settings: VendorSettings) => {
    localStorage.setItem(`africart-vendor-settings-${vendorEmail}`, JSON.stringify(settings));
  }, []);

  return (
    <StoreContext.Provider value={{ allProducts, productsLoading, addProduct, deleteProduct, deleteAllProducts, updateProduct, refreshProducts, followers, followVendor, unfollowVendor, isFollowing, getVendorSettings, saveVendorSettings, campaigns, refreshCampaigns, activeStoreId, setActiveStoreId, vendorStore, vendorStoreLoading, vendorStoreError, refreshVendorStore }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};

/* ========== NOTIFICATION & STATUS CONTEXT (with Browser Push) ========== */
interface NotificationContextType {
  unreadCount: number;
  activeOrderCount: number;
  refreshCounts: () => void;
  pushEnabled: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/* Helper: Fire a native browser notification */
const fireBrowserNotification = (title: string, body: string, icon?: string) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `africart-${Date.now()}`,
    });
  } catch {
    // Silent fail — some browsers block Notification constructor outside SW
  }
};

/* Status transition messages */
const ORDER_STATUS_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  'Confirmed': { title: '✅ Order Confirmed!', body: 'Your order has been confirmed and is being prepared.', emoji: '✅' },
  'Processing': { title: '🔄 Order Processing', body: 'Your order is now being processed by the vendor.', emoji: '🔄' },
  'Shipped': { title: '🚚 Order Shipped!', body: 'Your order is on its way! Track it in your orders.', emoji: '🚚' },
  'Delivered': { title: '📦 Order Delivered!', body: 'Your order has been delivered. Enjoy your purchase!', emoji: '📦' },
  'Picked Up': { title: '✨ Order Picked Up', body: 'Your order has been picked up successfully!', emoji: '✨' },
  'Cancelled': { title: '❌ Order Cancelled', body: 'Your order has been cancelled.', emoji: '❌' },
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeOrderCount, setActiveOrderCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // Check push support on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushPermission('unsupported');
      return;
    }
    setPushPermission(Notification.permission);
    setPushEnabled(Notification.permission === 'granted');
  }, []);

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      const granted = permission === 'granted';
      setPushEnabled(granted);
      if (granted) {
        fireBrowserNotification('🔔 Notifications Enabled', 'You\'ll receive updates on your orders!');
      }
      return granted;
    } catch {
      return false;
    }
  }, []);

  const refreshCounts = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setActiveOrderCount(0);
      return;
    }

    interface CachedOrder { status: string; [key: string]: unknown; }
    interface CachedMessage { _id: string; fromRole: string; fromName: string; text: string; timestamp: string; read: boolean; }
    interface CachedNotification { _id: string; type: string; title: string; message: string; createdAt: string; read: boolean; link?: string; }
    interface MappedNotif { id: string; type: string; title: string; message: string; date: string; read: boolean; source: string; link?: string; }

    // Read active orders from localStorage (updated by order status poller)
    try {
      const savedOrders: CachedOrder[] = JSON.parse(localStorage.getItem(`africart-orders-${user.email}`) || '[]');
      const active = savedOrders.filter((o) =>
        o.status === 'Processing' || o.status === 'Ongoing' || o.status === 'Shipped' || o.status === 'Pending'
      );
      setActiveOrderCount(active.length);
    } catch {}

    // Fetch unread counts from API (not just localStorage)
    try {
      const [msgRes, notifRes] = await Promise.all([
        fetch(`/api/messages?email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(user.role || 'customer')}`),
        fetch(`/api/notifications?email=${encodeURIComponent(user.email)}`)
      ]);

      let totalUnread = 0;

      const msgData = await msgRes.json();
      if (msgData.success && msgData.messages) {
        totalUnread += (msgData.messages as CachedMessage[]).filter((m) => !m.read).length;
        // Cache for the notifications page
        const mapped: MappedNotif[] = (msgData.messages as CachedMessage[]).map((m) => ({
          id: m._id, type: m.fromRole === 'super_admin' ? 'admin' : 'order',
          title: m.fromName, message: m.text, date: m.timestamp, read: m.read, source: 'message'
        }));
        const notifData = await notifRes.json();
        let allNotifs: MappedNotif[] = mapped;
        if (notifData.success && notifData.notifications) {
          totalUnread += (notifData.notifications as CachedNotification[]).filter((n) => !n.read).length;
          allNotifs = [...mapped, ...(notifData.notifications as CachedNotification[]).map((n) => ({
            id: n._id, type: n.type, title: n.title, message: n.message,
            date: n.createdAt, read: n.read, source: 'notification', link: n.link,
          }))];
        }
        allNotifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        localStorage.setItem(`africart-notifications-${user.email}`, JSON.stringify(allNotifs));
      }

      setUnreadCount(totalUnread);
    } catch {
      // Fallback to localStorage if API fails
      try {
        const savedNotifs: { read: boolean }[] = JSON.parse(localStorage.getItem(`africart-notifications-${user.email}`) || '[]');
        setUnreadCount(savedNotifs.filter((n) => !n.read).length);
      } catch {}
    }
  }, [user]);

  // Order status change detection + push notifications
  useEffect(() => {
    if (!user) return;

    const checkOrderStatusChanges = async () => {
      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (!data.success) return;

        const currentOrders = data.orders || [];
        const cacheKey = `africart-order-statuses-${user.email}`;
        const cachedStatuses: Record<string, string> = JSON.parse(localStorage.getItem(cacheKey) || '{}');

        const newStatuses: Record<string, string> = {};
        let hasChanges = false;

        for (const order of currentOrders) {
          const orderId = order.orderId || order._id;
          newStatuses[orderId] = order.status;

          // Detect status change
          if (cachedStatuses[orderId] && cachedStatuses[orderId] !== order.status) {
            hasChanges = true;
            const statusInfo = ORDER_STATUS_MESSAGES[order.status];
            if (statusInfo) {
              fireBrowserNotification(
                statusInfo.title,
                `Order ${orderId}: ${statusInfo.body}`
              );
            }
          }
        }

        localStorage.setItem(cacheKey, JSON.stringify(newStatuses));

        // Also update the local orders cache for the notification page
        if (currentOrders.length > 0) {
          localStorage.setItem(`africart-orders-${user.email}`, JSON.stringify(currentOrders));
        }

        if (hasChanges) refreshCounts();
      } catch {
        // Silent fail — orders API might not be reachable
      }
    };

    // Initial check
    checkOrderStatusChanges();

    // Poll every 15 seconds for order status changes
    const interval = setInterval(checkOrderStatusChanges, 15000);
    return () => clearInterval(interval);
  }, [user, refreshCounts]);

  useEffect(() => {
    refreshCounts();
    // Listen for storage changes from other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.includes('africart-')) refreshCounts();
    };
    window.addEventListener('storage', handleStorage);
    
    // Polling as a backup for same-tab updates that don't trigger storage event
    const interval = setInterval(refreshCounts, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, [refreshCounts]);

  return (
    <NotificationContext.Provider value={{ unreadCount, activeOrderCount, refreshCounts, pushEnabled, pushPermission, requestPushPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

/* ========== USER ACTIVITY CONTEXT (History & Recommendations) ========== */
interface UserActivityContextType {
  recentlyViewed: Product[];
  addToHistory: (product: Product) => void;
  clearHistory: () => void;
}

const UserActivityContext = createContext<UserActivityContextType | undefined>(undefined);

export const UserActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('africart-recently-viewed');
    if (saved) {
      try { setRecentlyViewed(JSON.parse(saved)); } catch {}
    }
  }, []);

  const addToHistory = (product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 10); // Keep last 10
      localStorage.setItem('africart-recently-viewed', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setRecentlyViewed([]);
    localStorage.removeItem('africart-recently-viewed');
  };

  return (
    <UserActivityContext.Provider value={{ recentlyViewed, addToHistory, clearHistory }}>
      {children}
    </UserActivityContext.Provider>
  );
};

export const useUserActivity = () => {
  const ctx = useContext(UserActivityContext);
  if (!ctx) throw new Error('useUserActivity must be used within UserActivityProvider');
  return ctx;
};
