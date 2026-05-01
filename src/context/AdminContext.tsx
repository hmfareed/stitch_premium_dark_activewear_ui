'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ─── Types ─── */
export interface PlatformOrder {
  id: string;
  date: string;
  status: string;
  total: number;
  items: number;
  products: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    selectedSize?: string;
    category?: string;
    vendorEmail?: string;
    vendorStoreName?: string;
  }>;
  customerName: string;
  customerEmail: string;
}

export interface PlatformAccount {
  name: string;
  email: string;
  phone?: string;
  profilePic?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Vendor Admin' | 'Support Admin' | 'Finance Admin';
  status: 'Active' | 'Pending' | 'Suspended';
  storeName?: string;
  createdAt: string;
}

export interface AdminApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Vendor Admin' | 'Support Admin' | 'Finance Admin';
  storeName?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface PlatformMessage {
  id: string;
  from: string;
  fromName: string;
  fromRole: 'super_admin' | 'admin' | 'customer';
  to: string; // recipient email or 'broadcast_admins' or 'broadcast_all'
  toName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface AdminContextType {
  allOrders: PlatformOrder[];
  allCustomers: PlatformAccount[];
  allAdmins: AdminUser[];
  allMessages: PlatformMessage[];
  allApplications: AdminApplication[];

  totalRevenue: number;
  totalOrderCount: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalAdmins: number;

  updateOrderStatus: (orderId: string, newStatus: string) => void;
  addAdmin: (admin: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  updateAdminStatus: (adminId: string, status: AdminUser['status']) => void;
  removeAdmin: (adminId: string) => void;
  sendMessage: (msg: Omit<PlatformMessage, 'id' | 'timestamp' | 'read'>) => void;
  broadcastMessage: (text: string, target: 'admins' | 'all') => void;
  approveApplication: (appId: string) => void;
  rejectApplication: (appId: string) => void;
  refreshData: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allOrders, setAllOrders] = useState<PlatformOrder[]>([]);
  const [allCustomers, setAllCustomers] = useState<PlatformAccount[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [allMessages, setAllMessages] = useState<PlatformMessage[]>([]);
  const [allApplications, setAllApplications] = useState<AdminApplication[]>([]);

  const refreshData = useCallback(() => {
    try { setAllOrders(JSON.parse(localStorage.getItem('reed-all-orders') || '[]')); } catch { setAllOrders([]); }
    try { setAllCustomers(JSON.parse(localStorage.getItem('reed-accounts') || '[]')); } catch { setAllCustomers([]); }
    try { setAllAdmins(JSON.parse(localStorage.getItem('reed-admins') || '[]')); } catch { setAllAdmins([]); }
    try { setAllMessages(JSON.parse(localStorage.getItem('reed-messages') || '[]')); } catch { setAllMessages([]); }
    try { setAllApplications(JSON.parse(localStorage.getItem('reed-admin-applications') || '[]')); } catch { setAllApplications([]); }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('reed-')) refreshData();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshData]);

  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrderCount = allOrders.length;
  const pendingOrders = allOrders.filter(o => o.status === 'Processing' || o.status === 'Ongoing').length;
  const shippedOrders = allOrders.filter(o => o.status === 'Shipped').length;
  const deliveredOrders = allOrders.filter(o => o.status === 'Delivered').length;
  const cancelledOrders = allOrders.filter(o => o.status === 'Cancelled').length;
  const totalCustomers = allCustomers.length;
  const totalAdmins = allAdmins.length;

  const updateOrderStatus = useCallback((orderId: string, newStatus: string) => {
    const orders: PlatformOrder[] = JSON.parse(localStorage.getItem('reed-all-orders') || '[]');
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    localStorage.setItem('reed-all-orders', JSON.stringify(updated));
    const order = orders.find(o => o.id === orderId);
    if (order?.customerEmail) {
      const userOrders: PlatformOrder[] = JSON.parse(localStorage.getItem(`reed-orders-${order.customerEmail}`) || '[]');
      localStorage.setItem(`reed-orders-${order.customerEmail}`, JSON.stringify(userOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)));
    }
    refreshData();
  }, [refreshData]);

  const addAdmin = useCallback((admin: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const admins: AdminUser[] = JSON.parse(localStorage.getItem('reed-admins') || '[]');
    admins.push({ ...admin, id: `ADM-${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] });
    localStorage.setItem('reed-admins', JSON.stringify(admins));

    // Update or provision account in authentication store
    const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
    const existingIndex = accounts.findIndex((a: any) => a.email === admin.email);
    if (existingIndex >= 0) {
      accounts[existingIndex].role = 'admin';
    } else {
      accounts.push({ name: admin.name, email: admin.email, phone: '', role: 'admin' });
    }
    localStorage.setItem('reed-accounts', JSON.stringify(accounts));

    refreshData();
  }, [refreshData]);

  const updateAdminStatus = useCallback((adminId: string, status: AdminUser['status']) => {
    const admins: AdminUser[] = JSON.parse(localStorage.getItem('reed-admins') || '[]');
    localStorage.setItem('reed-admins', JSON.stringify(admins.map(a => a.id === adminId ? { ...a, status } : a)));
    refreshData();
  }, [refreshData]);

  const removeAdmin = useCallback((adminId: string) => {
    const admins: AdminUser[] = JSON.parse(localStorage.getItem('reed-admins') || '[]');
    const adminToRemove = admins.find(a => a.id === adminId);
    if (adminToRemove) {
      // Revert role in authentication store
      const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
      const updatedAccounts = accounts.map((a: any) => a.email === adminToRemove.email ? { ...a, role: 'user' } : a);
      localStorage.setItem('reed-accounts', JSON.stringify(updatedAccounts));
    }
    localStorage.setItem('reed-admins', JSON.stringify(admins.filter(a => a.id !== adminId)));
    refreshData();
  }, [refreshData]);

  const sendMessage = useCallback((msg: Omit<PlatformMessage, 'id' | 'timestamp' | 'read'>) => {
    const messages: PlatformMessage[] = JSON.parse(localStorage.getItem('reed-messages') || '[]');
    messages.push({ ...msg, id: `MSG-${Date.now()}`, timestamp: new Date().toISOString(), read: false });
    localStorage.setItem('reed-messages', JSON.stringify(messages));
    refreshData();
  }, [refreshData]);

  const broadcastMessage = useCallback((text: string, target: 'admins' | 'all') => {
    const messages: PlatformMessage[] = JSON.parse(localStorage.getItem('reed-messages') || '[]');
    messages.push({
      id: `MSG-${Date.now()}`,
      from: 'super_admin@reed.com',
      fromName: 'Super Admin',
      fromRole: 'super_admin',
      to: target === 'admins' ? 'broadcast_admins' : 'broadcast_all',
      toName: target === 'admins' ? 'All Admins' : 'Everyone',
      text,
      timestamp: new Date().toISOString(),
      read: false,
    });
    localStorage.setItem('reed-messages', JSON.stringify(messages));
    refreshData();
  }, [refreshData]);

  const approveApplication = useCallback((appId: string) => {
    const apps: AdminApplication[] = JSON.parse(localStorage.getItem('reed-admin-applications') || '[]');
    const app = apps.find(a => a.id === appId);
    if (app) {
      localStorage.setItem('reed-admin-applications', JSON.stringify(apps.map(a => a.id === appId ? { ...a, status: 'approved' as const } : a)));
      // Auto-create admin from approved application
      const admins: AdminUser[] = JSON.parse(localStorage.getItem('reed-admins') || '[]');
      admins.push({
        id: `ADM-${Date.now()}`,
        name: app.name,
        email: app.email,
        role: app.role,
        status: 'Active',
        storeName: app.storeName,
        createdAt: new Date().toISOString().split('T')[0],
      });
      localStorage.setItem('reed-admins', JSON.stringify(admins));

      // Update role in accounts
      const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
      const updatedAccounts = accounts.map((account: any) => 
        account.email === app.email ? { ...account, role: 'admin' } : account
      );
      localStorage.setItem('reed-accounts', JSON.stringify(updatedAccounts));
    }
    refreshData();
  }, [refreshData]);

  const rejectApplication = useCallback((appId: string) => {
    const apps: AdminApplication[] = JSON.parse(localStorage.getItem('reed-admin-applications') || '[]');
    localStorage.setItem('reed-admin-applications', JSON.stringify(apps.map(a => a.id === appId ? { ...a, status: 'rejected' as const } : a)));
    refreshData();
  }, [refreshData]);

  return (
    <AdminContext.Provider value={{
      allOrders, allCustomers, allAdmins, allMessages, allApplications,
      totalRevenue, totalOrderCount, pendingOrders, shippedOrders, deliveredOrders, cancelledOrders, totalCustomers, totalAdmins,
      updateOrderStatus, addAdmin, updateAdminStatus, removeAdmin, sendMessage, broadcastMessage, approveApplication, rejectApplication, refreshData,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
