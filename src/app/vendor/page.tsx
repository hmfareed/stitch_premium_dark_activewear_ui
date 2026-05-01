'use client';

import React from 'react';

const VendorMetricCard = ({ title, value, trend, icon, color }: { title: string, value: string, trend: number, icon: string, color: string }) => {
  const isPositive = trend >= 0;
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '240px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div>
        <h2 className="font-lexend" style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>{value}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <span style={{ color: isPositive ? '#00e5ff' : 'var(--error)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{isPositive ? 'trending_up' : 'trending_down'}</span>
            {Math.abs(trend)}%
          </span>
          <span style={{ color: 'var(--on-surface-variant)' }}>vs last month</span>
        </div>
      </div>
    </div>
  );
};

import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { allProducts } = useStore();
  const { allOrders, allAdmins } = useAdmin();
  const router = useRouter();

  if (!user) return null;

  const vendorProducts = allProducts.filter(p => p.vendorEmail === user.email);
  const vendorOrders = allOrders.filter(o => o.products.some(p => p.vendorEmail === user.email));

  const totalRevenue = vendorOrders.reduce((sum, order) => {
    // Only sum up the vendor's products in the order
    const vendorItemsTotal = order.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((s, p) => s + (p.price * p.quantity), 0);
    return sum + vendorItemsTotal;
  }, 0);

  const totalOrders = vendorOrders.length;
  const avgRating = vendorProducts.length > 0 
    ? (vendorProducts.reduce((sum, p) => sum + p.rating, 0) / vendorProducts.length).toFixed(1)
    : '0.0';

  const storeName = allAdmins.find(a => a.email === user.email)?.storeName || 'Vendor Store';

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Store Overview</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Welcome back, {storeName}. Here's what's happening today.</p>
        </div>
        <button onClick={() => router.push('/vendor/products')} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Product
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <VendorMetricCard title="Store Revenue" value={`$${totalRevenue.toLocaleString()}`} trend={0} icon="payments" color="#00e5ff" />
        <VendorMetricCard title="Store Orders" value={`${totalOrders}`} trend={0} icon="shopping_bag" color="var(--lime-400)" />
        <VendorMetricCard title="Store Views" value="0" trend={0} icon="visibility" color="var(--secondary)" />
        <VendorMetricCard title="Avg Rating" value={avgRating.toString()} trend={0} icon="star" color="#ffc107" />
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem' }}>Recent Store Orders</h3>
            <button onClick={() => router.push('/vendor/orders')} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {vendorOrders.length === 0 ? (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No orders yet.</p>
            ) : (
              vendorOrders.slice(0, 5).map((order) => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{order.id}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{order.customerName}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontWeight: 600 }}>${order.total.toFixed(2)}</span>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      color: order.status === 'Delivered' ? 'var(--lime-400)' : order.status === 'Processing' || order.status === 'Ongoing' ? '#00e5ff' : 'var(--secondary)'
                    }}>{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 400px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem' }}>Your Products</h3>
            <button onClick={() => router.push('/vendor/products')} style={{ background: 'none', border: 'none', color: '#00e5ff', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>Inventory</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {vendorProducts.length === 0 ? (
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>No products found. Start adding products!</p>
            ) : (
              vendorProducts.slice(0, 5).map((product, idx) => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: idx !== Math.min(vendorProducts.length, 5) - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img src={product.image} alt={product.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{product.name}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{product.category}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontWeight: 600 }}>${product.price.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
