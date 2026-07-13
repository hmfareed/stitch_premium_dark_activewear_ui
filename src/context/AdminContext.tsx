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
  shippingAddress?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
  paymentInfo?: {
    method?: string;
    network?: string;
    momoPhone?: string;
    paymentStatus?: 'Pending' | 'Paid' | 'Held' | 'Refunded';
    escrowStatus?: 'Locked' | 'Released' | 'Disputed' | 'NA';
  };
  timeline?: Array<{
    status: string;
    description: string;
    timestamp: string;
  }>;
}

export interface PlatformAccount {
  name: string;
  email: string;
  phone?: string;
  profilePic?: string;
  role?: string;
  isVerified?: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Vendor' | 'Support Admin' | 'Finance Admin';
  status: 'Active' | 'Pending' | 'Suspended';
  isVerified: boolean;
  storeName?: string;
  phone?: string;
  createdAt: string;
}

export interface AdminApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Vendor' | 'Support Admin' | 'Finance Admin';
  storeName?: string;
  reason: string;
  documentUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface PlatformMessage {
  id: string;
  from: string;
  fromName: string;
  fromRole: 'super_admin' | 'vendor' | 'customer';
  to: string; // recipient email or 'broadcast_admins' or 'broadcast_all'
  toName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface PlatformPayout {
  _id: string;
  vendorEmail: string;
  vendorName?: string;
  amount: number;
  status: 'Pending' | 'Processing' | 'Paid' | 'Rejected';
  requestDate: string;
  processedDate?: string;
  paymentMethod: string;
  accountDetails: string;
  notes?: string;
}

export interface AdminContextType {
  allOrders: PlatformOrder[];
  allCustomers: PlatformAccount[];
  allAdmins: AdminUser[];
  allMessages: PlatformMessage[];
  allApplications: AdminApplication[];
  allPayouts: PlatformPayout[];

  totalRevenue: number;
  totalOrderCount: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalAdmins: number;

  updateOrderStatus: (orderId: string, newStatus: string, timelineNote?: string) => void;
  addAdmin: (admin: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  updateAdminStatus: (adminId: string, status: AdminUser['status']) => void;
  removeAdmin: (adminId: string) => void;
  sendMessage: (msg: Omit<PlatformMessage, 'id' | 'timestamp' | 'read'>) => void;
  broadcastMessage: (text: string, target: 'vendors' | 'all') => void;
  approveApplication: (appId: string) => void;
  rejectApplication: (appId: string) => void;
  toggleVendorVerification: (email: string) => Promise<void>;
  updatePayoutStatus: (payoutId: string, status: PlatformPayout['status']) => Promise<void>;
  refreshData: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allOrders, setAllOrders] = useState<PlatformOrder[]>([]);
  const [allCustomers, setAllCustomers] = useState<PlatformAccount[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [allMessages, setAllMessages] = useState<PlatformMessage[]>([]);
  const [allApplications, setAllApplications] = useState<AdminApplication[]>([]);
  const [allPayouts, setAllPayouts] = useState<PlatformPayout[]>([]);

  const refreshData = useCallback(async () => {
    try {
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        const mappedOrders = (ordersData.orders || []).map((o: any) => ({
          ...o,
          id: o.orderId || o._id,
          items: o.itemsCount || (o.products ? o.products.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0) : 0),
        }));
        setAllOrders(mappedOrders);
        localStorage.setItem('africart-all-orders', JSON.stringify(mappedOrders));
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      try {
        const cached = JSON.parse(localStorage.getItem('africart-all-orders') || '[]');
        setAllOrders(cached);
      } catch {
        setAllOrders([]);
      }
    }
    
    try {
      const payoutsRes = await fetch('/api/payouts');
      const payoutsData = await payoutsRes.json();
      if (payoutsData.success) {
        setAllPayouts(payoutsData.payouts || []);
      }
    } catch (err) {
      console.error('Failed to fetch payouts:', err);
      setAllPayouts([]);
    }
    
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setAllCustomers(data.users);
        const vendors = data.users.filter((u: any) => u.role === 'vendor' || u.role === 'super_admin');
        setAllAdmins(vendors.map((u: any) => ({
          id: u.id || u._id,
          name: u.name,
          email: u.email,
          role: u.role === 'super_admin' ? 'Super Admin' : 'Vendor',
          status: 'Active',
          isVerified: u.isVerified || false,
          storeName: u.storeName || u.name,
          createdAt: u.createdAt
        })));
      }
    } catch {
      // fallback
    }

    try {
      const msgsRes = await fetch('/api/messages');
      const msgsData = await msgsRes.json();
      if (msgsData.success) {
        setAllMessages(msgsData.messages);
        localStorage.setItem('africart-messages', JSON.stringify(msgsData.messages));
      }
    } catch {
      try { setAllMessages(JSON.parse(localStorage.getItem('africart-messages') || '[]')); } catch { setAllMessages([]); }
    }
    
    try {
      const appsRes = await fetch('/api/vendor-applications');
      const appsData = await appsRes.json();
      if (appsData.success) {
        setAllApplications(appsData.applications.map((a: any) => ({
          id: a._id,
          name: a.name,
          email: a.email,
          phone: a.phone,
          role: a.role,
          storeName: a.storeName,
          reason: a.reason,
          status: a.status,
          appliedAt: new Date(a.appliedAt).toLocaleDateString()
        })));
      }
    } catch {
      setAllApplications([]);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // 30s refresh — avoids overwhelming browser/server
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('africart-')) refreshData();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refreshData]);

  const totalRevenue = allOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrderCount = allOrders.length;
  const pendingOrders = allOrders.filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Ongoing').length;
  const shippedOrders = allOrders.filter(o => o.status === 'Shipped').length;
  const deliveredOrders = allOrders.filter(o => o.status === 'Delivered').length;
  const cancelledOrders = allOrders.filter(o => o.status === 'Cancelled').length;
  const totalCustomers = allCustomers.length;
  const totalAdmins = allAdmins.length;

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string, timelineNote?: string) => {
    // Find the order — support both _id and orderId lookups
    const orderToUpdate = allOrders.find(o =>
      (o as any)._id === orderId ||
      o.id === orderId ||
      (o as any).orderId === orderId
    );

    // HARD BLOCK: Never allow changing a cancelled order's status
    if (orderToUpdate && orderToUpdate.status === 'Cancelled') {
      console.warn('Cannot update status of a cancelled order.');
      return;
    }

    // Optimistic update — update local state immediately for instant UI response
    setAllOrders(prev =>
      prev.map(o => {
        const matches =
          (o as any)._id === orderId ||
          o.id === orderId ||
          (o as any).orderId === orderId;
        return matches ? { ...o, status: newStatus } : o;
      })
    );

    try {
      const dbId = (orderToUpdate as any)?._id || orderId;

      const res = await fetch(`/api/orders/${dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, timelineNote })
      });
      
      if (res.ok && orderToUpdate) {
        // Send notification message to customer
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'system@africart.com',
            fromName: 'AfriCart',
            fromRole: 'super_admin',
            to: orderToUpdate.customerEmail,
            toName: orderToUpdate.customerName,
            text: `Your order ${orderToUpdate.id || (orderToUpdate as any).orderId} status has been updated to: ${newStatus}.`,
          })
        });
      }
      // Refresh to sync with DB (non-blocking)
      refreshData();
    } catch (error) {
      console.error('Failed to update order status:', error);
      // On failure, revert optimistic update
      refreshData();
    }
  }, [allOrders, refreshData]);

  const addAdmin = useCallback(async (admin: Omit<AdminUser, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: admin.name, 
          email: admin.email, 
          phone: '0000000000', 
          password: 'password123', // Default password
          role: 'vendor' 
        })
      });
      if (res.ok) refreshData();
    } catch (error) {
      console.error('Failed to add admin:', error);
    }
  }, [refreshData]);

  const updateAdminStatus = useCallback((adminId: string, status: AdminUser['status']) => {
    const vendors: AdminUser[] = JSON.parse(localStorage.getItem('africart-vendors') || '[]');
    localStorage.setItem('africart-vendors', JSON.stringify(vendors.map(a => a.id === adminId ? { ...a, status } : a)));
    refreshData();
  }, [refreshData]);

  const removeAdmin = useCallback(async (adminId: string) => {
    const adminToRemove = allAdmins.find(a => a.id === adminId);
    if (!adminToRemove) return;

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(adminToRemove.email)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const vendors: AdminUser[] = JSON.parse(localStorage.getItem('africart-vendors') || '[]');
        localStorage.setItem('africart-vendors', JSON.stringify(vendors.filter(a => a.email !== adminToRemove.email)));
        
        const accounts = JSON.parse(localStorage.getItem('africart-accounts') || '[]');
        localStorage.setItem('africart-accounts', JSON.stringify(accounts.filter((a: any) => a.email !== adminToRemove.email)));
      }
    } catch (error) {
      console.error('Failed to remove admin from database:', error);
    }
    refreshData();
  }, [allAdmins, refreshData]);


  const sendMessage = useCallback(async (msg: Omit<PlatformMessage, 'id' | 'timestamp' | 'read'>) => {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      });
      refreshData();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [refreshData]);

  const broadcastMessage = useCallback(async (text: string, target: 'vendors' | 'all') => {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'africartsadmin99@gmail.com',
          fromName: 'Super Admin',
          fromRole: 'super_admin',
          to: target === 'vendors' ? 'broadcast_vendors' : 'broadcast_all',
          toName: target === 'vendors' ? 'All Vendors' : 'Everyone',
          text,
        })
      });
      refreshData();
    } catch (error) {
      console.error('Failed to broadcast message:', error);
    }
  }, [refreshData]);

  const approveApplication = useCallback(async (appId: string) => {
    try {
      const res = await fetch('/api/vendor-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, status: 'approved' })
      });
      if (res.ok) refreshData();
    } catch (err) {
      console.error('Failed to approve application:', err);
    }
  }, [refreshData]);

  const rejectApplication = useCallback(async (appId: string) => {
    try {
      const res = await fetch('/api/vendor-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, status: 'rejected' })
      });
      if (res.ok) refreshData();
    } catch (err) {
      console.error('Failed to reject application:', err);
    }
  }, [refreshData]);

  const toggleVendorVerification = useCallback(async (email: string) => {
    try {
      // Find current user to get their current status
      const user = allCustomers.find(c => c.email === email);
      const newStatus = !user?.isVerified;

      // Update in local state for immediate feedback
      setAllCustomers(prev => prev.map(c => c.email === email ? { ...c, isVerified: newStatus } : c));
      setAllAdmins(prev => prev.map(a => a.email === email ? { ...a, isVerified: newStatus } : a));

      // Update in DB
      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: newStatus })
      });

      if (!res.ok) throw new Error('Failed to update verification status');
      
      refreshData();
    } catch (err) {
      console.error('Failed to toggle verification:', err);
      refreshData();
      refreshData();
    }
  }, [allCustomers, refreshData]);

  const updatePayoutStatus = useCallback(async (payoutId: string, status: PlatformPayout['status']) => {
    try {
      const res = await fetch(`/api/payouts/${payoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error('Failed to update payout status:', err);
    }
  }, [refreshData]);

  return (
    <AdminContext.Provider value={{
      allOrders, allCustomers, allAdmins, allMessages, allApplications, allPayouts,
      totalRevenue, totalOrderCount, pendingOrders, shippedOrders, deliveredOrders, cancelledOrders, totalCustomers, totalAdmins,
      updateOrderStatus, addAdmin, updateAdminStatus, removeAdmin, sendMessage, broadcastMessage, approveApplication, rejectApplication, toggleVendorVerification, updatePayoutStatus, refreshData,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
