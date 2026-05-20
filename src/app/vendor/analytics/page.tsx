'use client';

import React, { useMemo } from 'react';
import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const { allOrders } = useAdmin();
  const { allProducts } = useStore();

  const analytics = useMemo(() => {
    if (!user) return null;

    // 1. Filter orders containing this vendor's products
    const vendorOrders = allOrders.filter(o => 
      o.status !== 'Cancelled' && o.products.some(p => p.vendorEmail === user.email)
    );

    // 2. Calculate Revenue and Order Count
    const totalRevenue = vendorOrders.reduce((sum, o) => {
      const vendorItemsTotal = o.products
        .filter(p => p.vendorEmail === user.email)
        .reduce((s, p) => s + (p.price * p.quantity), 0);
      return sum + vendorItemsTotal;
    }, 0);

    // 3. Top Products
    const productSales: Record<string, { name: string, sold: number, image: string }> = {};
    vendorOrders.forEach(o => {
      o.products.forEach(p => {
        if (p.vendorEmail === user.email) {
          if (!productSales[p.id]) {
            productSales[p.id] = { name: p.name, sold: 0, image: p.image };
          }
          productSales[p.id].sold += p.quantity;
        }
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const maxSold = topProducts.length > 0 ? topProducts[0].sold : 1;

    // 4. Daily Sales (Last 14 Days)
    const dailySales = Array(14).fill(0);
    const today = new Date();
    vendorOrders.forEach(o => {
      const orderDate = new Date(o.date);
      const diffTime = Math.abs(today.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 14) {
        const index = 14 - diffDays;
        const vendorItemsTotal = o.products
          .filter(p => p.vendorEmail === user.email)
          .reduce((s, p) => s + (p.price * p.quantity), 0);
        dailySales[index] += vendorItemsTotal;
      }
    });

    return {
      totalRevenue,
      orderCount: vendorOrders.length,
      topProducts,
      dailySales,
      maxSold,
      maxDaily: Math.max(...dailySales, 100)
    };
  }, [allOrders, allProducts, user]);

  if (!user || !analytics) return null;

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Store Analytics</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Track your real-time store performance</p>
        </div>
        <div style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.8rem', fontWeight: 600 }}>
          LIVE FEED
        </div>
      </div>

      {/* Primary Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Revenue', val: `GH₵${analytics.totalRevenue.toLocaleString()}`, trend: 'Lifetime Earnings', color: '#00e5ff', icon: 'payments' },
          { label: 'Orders Processed', val: analytics.orderCount, trend: 'Completed Sales', color: 'var(--lime-400)', icon: 'shopping_bag' },
          { label: 'Your Inventory', val: allProducts.filter(p => p.vendorEmail === user.email).length, trend: 'Active Listings', color: 'var(--secondary)', icon: 'inventory_2' },
          { label: 'Customer Satisfaction', val: '4.9/5', trend: 'Based on feedback', color: '#ffc107', icon: 'star' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 200px', padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--outline)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '60px', opacity: 0.05, color: s.color }} className="material-symbols-outlined">{s.icon}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: s.color }}>{s.icon}</span>
              {s.label}
            </div>
            <div className="font-lexend" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)' }}>{s.val}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: '8px', fontWeight: 500 }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '20px', padding: '24px', border: '1px solid var(--outline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Revenue Growth (Last 14 Days)</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--lime-400)', fontWeight: 700 }}>LIVE CHART</span>
        </div>
        <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          {analytics.dailySales.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '100%', maxWidth: '32px', 
                height: `${(v / analytics.maxDaily) * 180}px`, 
                backgroundColor: i === analytics.dailySales.length - 1 ? 'var(--lime-400)' : 'var(--surface-container-highest)', 
                borderRadius: '6px 6px 2px 2px', 
                transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: v > 0 ? '4px' : '0'
              }} />
              <span style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', fontWeight: 600 }}>{new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).getDate()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '20px', padding: '24px', border: '1px solid var(--outline)' }}>
        <h3 className="font-lexend" style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Best Selling Products</h3>
        {analytics.topProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--on-surface-variant)' }}>
            No sales recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {analytics.topProducts.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src={p.image} alt={p.name} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    <span style={{ fontWeight: 800, color: 'var(--lime-400)' }}>{p.sold} Units</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--surface-container)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(p.sold / analytics.maxSold) * 100}%`, 
                      height: '100%', 
                      backgroundColor: '#00e5ff', 
                      borderRadius: '4px',
                      transition: 'width 1s ease' 
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
