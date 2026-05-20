'use client';

import React from 'react';
import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';

const VendorMetricCard = ({ title, value, trend, icon, color }: { title: string, value: string, trend: number, icon: string, color: string }) => {
  const isPositive = trend >= 0;
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '240px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, GH₵{color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div>
        <h2 className="font-lexend" style={{ fontSize: '2rem', margin: '0 0 8px 0' }}>{value}</h2>
        {trend !== 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: isPositive ? '#00e5ff' : 'var(--error)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{isPositive ? 'trending_up' : 'trending_down'}</span>
              {Math.abs(trend)}%
            </span>
            <span style={{ color: 'var(--on-surface-variant)' }}>vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const { allProducts, followers, getVendorSettings } = useStore();
  const { allOrders, allAdmins } = useAdmin();
  const router = useRouter();

  if (!user) return null;

  const vendorProducts = allProducts.filter(p => p.vendorEmail === user.email);
  const vendorOrders = allOrders.filter(o => o.products.some(p => p.vendorEmail === user.email));
  const vendorFollowers = followers.filter(f => f.vendorEmail === user.email);
  const vendorSettings = getVendorSettings(user.email);

  const totalRevenue = vendorOrders.filter(o => o.status !== 'Cancelled').reduce((sum, order) => {
    const vendorItemsTotal = order.products
      .filter(p => p.vendorEmail === user.email)
      .reduce((s, p) => s + (p.price * p.quantity), 0);
    return sum + vendorItemsTotal;
  }, 0);

  const totalOrders = vendorOrders.length;
  const pendingOrders = vendorOrders.filter(o => o.status === 'Pending').length;
  const processingOrders = vendorOrders.filter(o => o.status === 'Processing').length;
  const avgRating = vendorProducts.length > 0 
    ? (vendorProducts.reduce((sum, p) => sum + p.rating, 0) / vendorProducts.length).toFixed(1)
    : '0.0';

  const storeName = vendorSettings.storeName || allAdmins.find(a => a.email === user.email)?.storeName || user.name;

  // Revenue Data for Chart (Last 7 days)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }).reverse();

  const chartData = last7Days.map(dateStr => {
    const dayTotal = vendorOrders.filter(o => {
      const orderDate = new Date(o.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return orderDate === dateStr && o.status !== 'Cancelled';
    }).reduce((sum, order) => {
      const vendorItemsTotal = order.products
        .filter(p => p.vendorEmail === user.email)
        .reduce((s, p) => s + (p.price * p.quantity), 0);
      return sum + vendorItemsTotal;
    }, 0);
    return dayTotal;
  });

  const maxChartValue = Math.max(...chartData, 100);

  // Top Selling Products
  const topProducts = vendorProducts
    .map(p => ({
      ...p,
      sales: vendorOrders.filter(o => o.status === 'Delivered').reduce((sum, o) => {
        const item = o.products.find((item: any) => item.id === p.id);
        return sum + (item?.quantity || 0);
      }, 0)
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  // Status colors
  const statusColors: Record<string, string> = { 
    Pending: '#ff9800', Processing: '#00e5ff', Ongoing: '#00e5ff', 
    Shipped: '#7c4dff', Delivered: 'var(--lime-400)', 'Picked Up': '#26a69a', Cancelled: 'var(--error)' 
  };

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
        <VendorMetricCard title="Store Revenue" value={`GH₵${totalRevenue.toLocaleString()}`} trend={0} icon="payments" color="#00e5ff" />
        <VendorMetricCard title="Store Orders" value={`${totalOrders}`} trend={0} icon="shopping_bag" color="var(--lime-400)" />
        <VendorMetricCard title="Followers" value={`${vendorFollowers.length}`} trend={0} icon="group" color="var(--secondary)" />
        <VendorMetricCard title="Avg Rating" value={avgRating.toString()} trend={0} icon="star" color="#ffc107" />
      </div>

      {/* Analytics Row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Revenue Chart */}
        <div style={{ flex: '2 1 500px', backgroundColor: 'var(--surface)', borderRadius: '24px', padding: '24px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Revenue Trends</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>Daily earnings for the last 7 days</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--surface-container)', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--lime-400)' }}>calendar_today</span>
              Last 7 Days
            </div>
          </div>
          
          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px', gap: '12px' }}>
            {chartData.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', height: '100%' }}>
                <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
                  {/* Bar */}
                  <div 
                    className="animate-grow-y"
                    style={{ 
                      width: '100%', 
                      maxWidth: '40px',
                      height: `${(val / maxChartValue) * 100}%`, 
                      background: 'linear-gradient(to top, var(--lime-400), #00e5ff)',
                      borderRadius: '8px 8px 4px 4px',
                      position: 'relative',
                      minHeight: val > 0 ? '4px' : '0'
                    }} 
                  >
                    {/* Tooltip on hover simulation */}
                    <div className="chart-tooltip" style={{ position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)', background: '#000', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap', opacity: val > 0 ? 1 : 0 }}>
                      GH₵{val}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase' }}>{last7Days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div style={{ flex: '1 1 300px', backgroundColor: 'var(--surface)', borderRadius: '24px', padding: '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Top Sellers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {topProducts.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={p.image} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} alt={p.name} />
                  <div style={{ position: 'absolute', top: '-8px', left: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900 }}>{i + 1}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }} className="line-clamp-1">{p.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{p.sales} units sold</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, color: 'var(--lime-400)', fontSize: '0.9rem' }}>GH₵{(p.price * p.sales).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p style={{ textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>Start selling to see analytics!</p>}
          </div>
        </div>
      </div>

      {/* Quick Activity Status */}
      {(pendingOrders > 0 || processingOrders > 0) && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {pendingOrders > 0 && (
            <div onClick={() => router.push('/vendor/orders')} style={{ 
              flex: '1 1 200px', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
              background: 'color-mix(in srgb, #ff9800 10%, transparent)', border: '1px solid color-mix(in srgb, #ff9800 30%, transparent)',
              display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#ff9800', fontSize: '24px' }}>pending</span>
              <div>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#ff9800' }}>{pendingOrders}</span>
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginLeft: '6px' }}>pending order{pendingOrders > 1 ? 's' : ''} need attention</span>
              </div>
            </div>
          )}
          {processingOrders > 0 && (
            <div onClick={() => router.push('/vendor/orders')} style={{ 
              flex: '1 1 200px', padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
              background: 'color-mix(in srgb, #00e5ff 10%, transparent)', border: '1px solid color-mix(in srgb, #00e5ff 30%, transparent)',
              display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.2s'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#00e5ff', fontSize: '24px' }}>autorenew</span>
              <div>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#00e5ff' }}>{processingOrders}</span>
                <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem', marginLeft: '6px' }}>order{processingOrders > 1 ? 's' : ''} being processed</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Recent Orders */}
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
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.id}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{order.customerName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{order.date}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{ fontWeight: 600 }}>GH₵{order.total.toFixed(2)}</span>
                    <span style={{ 
                      fontSize: '0.78rem', padding: '3px 8px', borderRadius: '12px', fontWeight: 600,
                      backgroundColor: `color-mix(in srgb, GH₵{statusColors[order.status] || '#888'} 15%, transparent)`,
                      color: statusColors[order.status] || '#888'
                    }}>{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Your Products */}
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
                    <span style={{ fontWeight: 600 }}>GH₵{product.price.toFixed(2)}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: (product.stock || 0) === 0 ? 'var(--error)' : (product.stock || 0) <= 5 ? '#ff9800' : 'var(--on-surface-variant)' 
                    }}>
                      Stock: {product.stock || 0}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Success Guide Section */}
      <section style={{ backgroundColor: 'var(--surface)', padding: '32px', borderRadius: '16px', border: '1px solid var(--outline)', background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, rgba(195, 244, 0, 0.05) 100%)', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="font-lexend" style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '4px' }}>Grow Your Business</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>Learn how to boost your sales and build customer trust on AfriCart.</p>
          </div>
          <button style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: '#00e5ff', fontWeight: 600, cursor: 'pointer' }}>View Success Guide</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[
            { icon: 'photo_camera', title: 'High Quality Photos', desc: 'Products with at least 3 clear photos sell 60% faster.' },
            { icon: 'verified', title: 'Get Verified', desc: 'Verified sellers get higher visibility in search results.' },
            { icon: 'reviews', title: 'Engage with Reviews', desc: 'Responding to customer reviews builds long-term loyalty.' },
            { icon: 'local_shipping', title: 'Fast Fulfillment', desc: 'Shipping orders within 24h boosts your store rating.' },
          ].map((tip, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '16px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="material-symbols-outlined" style={{ color: idx % 2 === 0 ? '#00e5ff' : 'var(--lime-400)', fontSize: '24px' }}>{tip.icon}</span>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{tip.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
