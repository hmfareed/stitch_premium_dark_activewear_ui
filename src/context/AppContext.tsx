'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, products as defaultProducts } from '@/data/products';

/* ========== AUTH CONTEXT ========== */
interface User {
  email: string;
  name: string;
  phone?: string;
  profilePic?: string;
  role?: 'user' | 'admin' | 'super_admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  updateProfilePic: (picData: string | undefined) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('reed-user');
    if (saved) {
      try { 
        let parsedUser = JSON.parse(saved);
        
        // Always sync with the master accounts list to get the latest role
        const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
        const updatedAccount = accounts.find((a: any) => a.email === parsedUser.email);
        if (updatedAccount && updatedAccount.role) {
          parsedUser.role = updatedAccount.role;
        }

        // Auto-heal: If this user exists in reed-admins, force their role to 'admin'
        const admins = JSON.parse(localStorage.getItem('reed-admins') || '[]');
        if (admins.some((a: any) => a.email === parsedUser.email)) {
          parsedUser.role = 'admin';
          if (updatedAccount) {
            updatedAccount.role = 'admin';
            localStorage.setItem('reed-accounts', JSON.stringify(accounts));
          }
        }

        // Retroactively apply super_admin to existing sessions
        if (parsedUser.email === 'superadmin@reed.com') {
          parsedUser.role = 'super_admin';
        }
        
        localStorage.setItem('reed-user', JSON.stringify(parsedUser));
        setUser(parsedUser); 
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
    let found = accounts.find((a: { email: string }) => a.email === email);
    
    // Auto-provision Super Admin if it doesn't exist locally
    if (!found && email === 'superadmin@reed.com') {
      found = { email: 'superadmin@reed.com', name: 'Super Admin', phone: '', role: 'super_admin' };
      accounts.push(found);
      localStorage.setItem('reed-accounts', JSON.stringify(accounts));
    }

    if (found) {
      let finalRole: 'user' | 'admin' | 'super_admin' = (found.role as any) || 'user';
      
      // Auto-heal admin role if they exist in reed-admins but weren't updated in accounts
      const admins = JSON.parse(localStorage.getItem('reed-admins') || '[]');
      if (admins.some((a: any) => a.email === email)) {
         finalRole = 'admin';
         found.role = 'admin';
         localStorage.setItem('reed-accounts', JSON.stringify(accounts));
      }

      // Force super_admin role for specific email
      if (email === 'superadmin@reed.com') finalRole = 'super_admin';

      const u: User = { email: found.email, name: found.name, phone: found.phone, profilePic: found.profilePic, role: finalRole };
      setUser(u);
      localStorage.setItem('reed-user', JSON.stringify(u));
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, phone: string, _password: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 800));
    const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
    
    // Check for duplicate email
    if (accounts.some((a: { email: string }) => a.email.toLowerCase() === email.toLowerCase())) {
      return false; // Email already in use
    }

    const finalRole: 'user' | 'admin' | 'super_admin' = email === 'superadmin@reed.com' ? 'super_admin' : 'user';
    accounts.push({ name, email, phone, role: finalRole });
    localStorage.setItem('reed-accounts', JSON.stringify(accounts));
    const u: User = { email, name, phone, role: finalRole };
    setUser(u);
    localStorage.setItem('reed-user', JSON.stringify(u));
    return true;
  };

  const updateProfilePic = (picData: string | undefined) => {
    if (!user) return;
    const updatedUser = { ...user, profilePic: picData };
    setUser(updatedUser);
    localStorage.setItem('reed-user', JSON.stringify(updatedUser));
    
    // Update accounts array
    const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
    const updatedAccounts = accounts.map((a: any) => a.email === user.email ? { ...a, profilePic: picData } : a);
    localStorage.setItem('reed-accounts', JSON.stringify(updatedAccounts));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('reed-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, updateProfilePic, logout, isLoading }}>
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
    const saved = localStorage.getItem('reed-wishlist');
    if (saved) { try { setWishlist(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    localStorage.setItem('reed-wishlist', JSON.stringify(wishlist));
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('reed-cart');
    if (saved) { try { setCart(JSON.parse(saved)); } catch {} }
  }, []);

  useEffect(() => {
    localStorage.setItem('reed-cart', JSON.stringify(cart));
  }, [cart]);

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
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
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
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('reed-theme') as ThemeMode | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (theme === 'system') {
        root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', theme);
      }
    };

    applyTheme();
    localStorage.setItem('reed-theme', theme);

    // Listen for device theme changes when in 'system' mode
    const handleChange = () => {
      if (theme === 'system') {
        root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
interface StoreContextType {
  allProducts: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  followers: { vendorEmail: string, userEmail: string }[];
  followVendor: (vendorEmail: string, userEmail: string) => void;
  unfollowVendor: (vendorEmail: string, userEmail: string) => void;
  isFollowing: (vendorEmail: string, userEmail: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [followers, setFollowers] = useState<{ vendorEmail: string, userEmail: string }[]>([]);

  useEffect(() => {
    const savedProducts = localStorage.getItem('reed-products');
    if (savedProducts) {
      setAllProducts(JSON.parse(savedProducts));
    } else {
      setAllProducts(defaultProducts);
      localStorage.setItem('reed-products', JSON.stringify(defaultProducts));
    }

    const savedFollowers = localStorage.getItem('reed-followers');
    if (savedFollowers) {
      setFollowers(JSON.parse(savedFollowers));
    }
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: `PROD-${Date.now()}` };
    setAllProducts(prev => {
      const updated = [newProduct, ...prev];
      localStorage.setItem('reed-products', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const followVendor = useCallback((vendorEmail: string, userEmail: string) => {
    setFollowers(prev => {
      if (prev.some(f => f.vendorEmail === vendorEmail && f.userEmail === userEmail)) return prev;
      const updated = [...prev, { vendorEmail, userEmail }];
      localStorage.setItem('reed-followers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const unfollowVendor = useCallback((vendorEmail: string, userEmail: string) => {
    setFollowers(prev => {
      const updated = prev.filter(f => !(f.vendorEmail === vendorEmail && f.userEmail === userEmail));
      localStorage.setItem('reed-followers', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFollowing = useCallback((vendorEmail: string, userEmail: string) => {
    return followers.some(f => f.vendorEmail === vendorEmail && f.userEmail === userEmail);
  }, [followers]);

  return (
    <StoreContext.Provider value={{ allProducts, addProduct, followers, followVendor, unfollowVendor, isFollowing }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};

