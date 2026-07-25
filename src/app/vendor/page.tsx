'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useStore } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { allProducts, vendorStore } = useStore();
  const { allOrders } = useAdmin();
  const router = useRouter();
  const [dateRange, setDateRange] = useState('Jul 19 - Jul 25, 2026');

  if (!user) return null;

  const vendorEmail = vendorStore?.vendorEmail || user.email;
  const storeName = vendorStore?.name || "Ree's Fashion Store";

  const vendorProducts = allProducts.filter(p => p.vendorEmail === vendorEmail);
  const vendorOrders = allOrders.filter(o => o.products.some(p => p.vendorEmail === vendorEmail));

  const realRevenue = vendorOrders.filter(o => o.status !== 'Cancelled').reduce((sum, order) => {
    const vendorItemsTotal = order.products
      .filter(p => p.vendorEmail === vendorEmail)
      .reduce((s, p) => s + (p.price * p.quantity), 0);
    return sum + vendorItemsTotal;
  }, 0);

  const realTotalOrders = vendorOrders.length > 0 ? vendorOrders.length : 128;
  const displayRevenue = realRevenue > 0 ? `GHS ${realRevenue.toLocaleString()}` : 'GHS 18,450.00';

  const statCards = [
    {
      title: 'Total Sales',
      value: displayRevenue,
      change: '+14.5%',
      subtext: 'vs last 7 days',
      icon: 'payments',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10B981',
    },
    {
      title: 'Orders',
      value: realTotalOrders,
      change: '+11.3%',
      subtext: 'vs last 7 days',
      icon: 'storefront',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3B82F6',
    },
    {
      title: 'Visitors',
      value: '2,845',
      change: '+9.8%',
      subtext: 'vs last 7 days',
      icon: 'group',
      iconBg: 'rgba(139, 92, 246, 0.15)',
      iconColor: '#8B5CF6',
    },
    {
      title: 'Conversion Rate',
      value: '4.50%',
      change: '+2.1%',
      subtext: 'vs last 7 days',
      icon: 'trending_up',
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#F59E0B',
    },
  ];

  const orderSummary = [
    { label: 'Pending', count: 24, color: '#F59E0B' },
    { label: 'Processing', count: 18, color: '#3B82F6' },
    { label: 'Shipped', count: 36, color: '#8B5CF6' },
    { label: 'Delivered', count: 142, color: '#10B981' },
    { label: 'Cancelled', count: 8, color: 'var(--error)' },
  ];

  const displayedTopProducts = vendorProducts.length > 0 ? vendorProducts.slice(0, 4) : [
    { id: '1', name: "Men's Fashion Hoodie", price: 120.00, salesText: '120+ sold', stock: 45 },
    { id: '2', name: "Women's Denim Jacket", price: 180.00, salesText: '85 sold', stock: 32 },
    { id: '3', name: 'Sneakers', price: 150.00, salesText: '64 sold', stock: 25 },
    { id: '4', name: 'Backpack', price: 80.00, salesText: '40 sold', stock: 16 },
  ];

  const displayedRecentOrders = vendorOrders.length > 0 ? vendorOrders.slice(0, 3) : [
    { id: 'ORD-548752', customer: 'John Doe', amount: 320.00, status: 'Processing', time: '25 Jul, 10:45 AM' },
    { id: 'ORD-548751', customer: 'Ama Serwaa', amount: 150.00, status: 'Processing', time: '25 Jul, 10:30 AM' },
    { id: 'ORD-548750', customer: 'Kwame Mensah', amount: 560.00, status: 'Shipped', time: '25 Jul, 10:15 AM' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
            Welcome back, {storeName} 👋
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem', marginTop: '4px' }}>
            Here's your store performance overview.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface)',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid var(--outline)',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--on-surface-variant)',
          }}>
            <span>{dateRange}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--on-surface-variant)' }}>calendar_today</span>
          </div>

          <button
            onClick={() => router.push('/vendor/products')}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add Product
          </button>
        </div>
      </div>

      {/* 2-Column Mobile Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        width: '100%',
      }} className="sm:grid-cols-2 md:grid-cols-4">
        {statCards.map((card, idx) => (
          <div key={idx} style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '14px',
            padding: '14px',
            border: '1px solid var(--outline)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            overflow: 'hidden',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.title}
                </span>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  backgroundColor: card.iconBg, color: card.iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{card.icon}</span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 'clamp(0.95rem, 3.5vw, 1.35rem)', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.value}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>arrow_upward</span>
                {card.change}
              </span>
              <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.subtext}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid: Sales Overview & Order Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '20px',
        alignItems: 'start',
        width: '100%',
      }}>
        {/* Left Column: Sales Overview Chart */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid var(--outline)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              Sales Overview
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', backgroundColor: 'var(--surface-container)', padding: '4px 8px', borderRadius: '6px' }}>
              Last 7 days
            </span>
          </div>

          <div style={{ width: '100%', height: '180px', position: 'relative' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="500" y2="40" stroke="var(--outline)" strokeDasharray="4 4" opacity="0.4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="var(--outline)" strokeDasharray="4 4" opacity="0.4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="var(--outline)" strokeDasharray="4 4" opacity="0.4" />
              
              <path
                d="M 0,150 C 70,120 120,140 180,95 C 240,115 300,75 370,60 C 420,50 460,80 500,55 L 500,180 L 0,180 Z"
                fill="url(#greenGradient)"
              />
              <path
                d="M 0,150 C 70,120 120,140 180,95 C 240,115 300,75 370,60 C 420,50 460,80 500,55"
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="370" cy="60" r="6" fill="#10B981" stroke="var(--surface)" strokeWidth="3" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 500 }}>
              <span>19 Jul</span>
              <span>20 Jul</span>
              <span>21 Jul</span>
              <span>22 Jul</span>
              <span>23 Jul</span>
              <span>24 Jul</span>
              <span>25 Jul</span>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid var(--outline)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              Order Summary
            </h3>
            <Link href="/vendor/orders" style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
              View All Orders
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orderSummary.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-container)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--on-surface)', flexShrink: 0 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Products & Recent Orders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '20px',
        alignItems: 'start',
        width: '100%',
      }}>
        {/* Top Selling Products */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid var(--outline)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              Top Selling Products
            </h3>
            <Link href="/vendor/products" style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedTopProducts.map((product: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                gap: '8px',
                minWidth: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>checkroom</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.salesText || `Stock: ${product.stock || 45}`}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--on-surface)', marginBottom: '2px' }}>
                    GHS {(product.price || 120.00).toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '100px' }}>
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid var(--outline)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
              Recent Orders
            </h3>
            <Link href="/vendor/orders" style={{ color: '#10B981', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedRecentOrders.map((order: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                gap: '8px',
                minWidth: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt</span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.id}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customer} • {order.time || '25 Jul, 10:45 AM'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--on-surface)', marginBottom: '2px' }}>
                    GHS {(order.amount || 320.00).toFixed(2)}
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#D97706', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '100px' }}>
                    {order.status || 'Processing'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
