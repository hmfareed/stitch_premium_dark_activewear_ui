'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

/* ─── Status Badge Component ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const stylesMap: Record<string, { bg: string; color: string }> = {
    Delivered: { bg: 'rgba(34, 197, 94, 0.15)', color: '#10B981' },
    Processing: { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
    Shipped: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
    Pending: { bg: 'rgba(156, 163, 175, 0.15)', color: 'var(--on-surface-variant)' },
    Cancelled: { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' },
  };
  const style = stylesMap[status] || { bg: 'var(--surface-container)', color: 'var(--on-surface-variant)' };
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontWeight: 600,
      backgroundColor: style.bg,
      color: style.color,
      display: 'inline-block',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
};

export default function AdminDashboard() {
  const {
    allOrders,
    totalRevenue: contextRevenue, totalOrderCount: contextOrderCount,
    totalCustomers: contextCustomers, totalAdmins: contextAdmins,
  } = useAdmin();

  const [timeRange, setTimeRange] = useState('Last 7 days');
  const [liveStats, setLiveStats] = useState<{
    totalCustomers: number;
    totalVendors: number;
    totalRiders: number;
    totalAdmins: number;
    totalOrdersCount: number;
    totalRevenue: number;
    platformCommission: number;
    revenueGrowthPct: string;
    orderGrowthPct: string;
  } | null>(null);

  React.useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.stats) {
          setLiveStats(data.stats);
        }
      })
      .catch(err => console.error('Failed to fetch admin live stats:', err));
  }, []);

  const analytics7Days = React.useMemo(() => {
    const days = ['19 Jul', '20 Jul', '21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul'];
    return { days };
  }, []);

  const displayedOrders = allOrders.length > 0 ? allOrders.slice(0, 4) : [
    { id: 'ORD-548752', customerName: 'John Doe', total: 320.00, status: 'Delivered', date: '25 Jul, 10:45 AM' },
    { id: 'ORD-548751', customerName: 'Ama Serwaa', total: 150.00, status: 'Processing', date: '25 Jul, 10:30 AM' },
    { id: 'ORD-548750', customerName: 'Kwame Mensah', total: 560.00, status: 'Shipped', date: '25 Jul, 10:15 AM' },
    { id: 'ORD-548749', customerName: 'Akosua Boateng', total: 89.00, status: 'Pending', date: '25 Jul, 10:05 AM' },
  ];

  const totalUsers = liveStats ? liveStats.totalCustomers : contextCustomers;
  const totalVendors = liveStats ? liveStats.totalVendors : contextAdmins;
  const totalRiders = liveStats ? liveStats.totalRiders : 0;
  const totalOrders = liveStats ? liveStats.totalOrdersCount : (allOrders.length || contextOrderCount);
  const revenue = liveStats ? liveStats.totalRevenue : (contextRevenue || allOrders.reduce((sum, o) => sum + (o.total || 0), 0));
  const commission = liveStats ? liveStats.platformCommission : revenue * 0.14;
  const revGrowth = liveStats ? liveStats.revenueGrowthPct : '+0%';
  const ordGrowth = liveStats ? liveStats.orderGrowthPct : '+0%';

  const statCards = [
    {
      title: 'Total Users',
      value: totalUsers.toLocaleString(),
      change: '+100%',
      subtext: 'active users',
      icon: 'person',
      iconBg: 'rgba(108, 92, 231, 0.15)',
      iconColor: '#6C5CE7',
    },
    {
      title: 'Total Vendors',
      value: totalVendors.toLocaleString(),
      change: '+100%',
      subtext: 'registered stores',
      icon: 'storefront',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#3B82F6',
    },
    {
      title: 'Total Riders',
      value: totalRiders.toLocaleString(),
      change: '+100%',
      subtext: 'active fleet',
      icon: 'two_wheeler',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10B981',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toLocaleString(),
      change: `${ordGrowth}%`,
      subtext: 'from last month',
      icon: 'shopping_bag',
      iconBg: 'rgba(245, 158, 11, 0.15)',
      iconColor: '#F59E0B',
    },
    {
      title: 'Total Revenue',
      value: `GHS ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${revGrowth}%`,
      subtext: 'from last month',
      icon: 'payments',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#10B981',
    },
    {
      title: 'Platform Commission',
      value: `GHS ${commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: `${revGrowth}%`,
      subtext: 'from last month',
      icon: 'show_chart',
      iconBg: 'rgba(139, 92, 246, 0.15)',
      iconColor: '#8B5CF6',
    },
  ];


  const systemServices = [
    { name: 'API Server', status: 'Operational' },
    { name: 'Database', status: 'Operational' },
    { name: 'Payment Gateway', status: 'Operational' },
    { name: 'Storage', status: 'Operational' },
    { name: 'AI Service', status: 'Operational' },
    { name: 'Notification Service', status: 'Operational' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Dashboard Top Title Banner */}
      <div style={{ width: '100%' }}>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
          Welcome back, Super Admin 👋
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem', marginTop: '4px' }}>
          Here's what's happening on your platform today.
        </p>
      </div>

      {/* 2-Column Mobile & Multi-Column Desktop Stat Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        width: '100%',
      }} className="sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
              <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 'clamp(0.95rem, 3vw, 1.3rem)', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      {/* Main 3 Column Dashboard Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '20px',
        alignItems: 'start',
        width: '100%',
      }}>
        {/* Card 1: Revenue Overview Line Chart */}
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
              Revenue Overview
            </h3>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--outline)',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--on-surface)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>

          <div style={{ width: '100%', height: '180px', position: 'relative' }}>
            <svg viewBox="0 0 500 200" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="adminChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--lime-400)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--lime-400)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="40" x2="500" y2="40" stroke="var(--outline)" strokeDasharray="4 4" opacity="0.4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="var(--outline)" strokeDasharray="4 4" opacity="0.4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="var(--outline)" strokeDasharray="4 4" opacity="0.4" />
              
              <path
                d="M 0,140 C 70,110 120,130 180,90 C 240,110 300,60 370,50 C 420,40 460,70 500,45 L 500,180 L 0,180 Z"
                fill="url(#adminChartGradient)"
              />
              <path
                d="M 0,140 C 70,110 120,130 180,90 C 240,110 300,60 370,50 C 420,40 460,70 500,45"
                fill="none"
                stroke="var(--lime-400)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="370" cy="50" r="6" fill="var(--lime-400)" stroke="var(--surface)" strokeWidth="3" />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--on-surface-variant)', fontSize: '0.7rem', fontWeight: 500 }}>
              {analytics7Days.days.map((day, i) => (
                <span key={i}>{day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Recent Orders List */}
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
            <Link href="/admin/orders" style={{ color: 'var(--lime-400)', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>
              View All
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedOrders.map((order: any, idx: number) => {
              const orderId = order.id.startsWith('#') ? order.id : `#${order.id.substring(0, 10)}`;
              const displayDate = order.date ? (typeof order.date === 'string' ? order.date : new Date(order.date).toLocaleDateString()) : '25 Jul, 10:45 AM';
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface-container)',
                  border: '1px solid var(--outline)',
                  minWidth: 0,
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: 'rgba(108, 92, 231, 0.12)', color: 'var(--lime-400)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shopping_bag</span>
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderId}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.customerName || 'Customer'} • {displayDate}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--on-surface)', marginBottom: '2px' }}>
                      GHS {(order.total || 320.00).toFixed(2)}
                    </div>
                    <StatusBadge status={order.status || 'Delivered'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: System Status */}
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
              System Status
            </h3>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', padding: '3px 8px', borderRadius: '100px', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
              Operational
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {systemServices.map((service, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--surface-container)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--on-surface-variant)' }}>dns</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.name}</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                  {service.status}
                </span>
              </div>
            ))}
          </div>

          <button style={{
            marginTop: '4px',
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid var(--outline)',
            backgroundColor: 'var(--surface-container-high)',
            color: 'var(--lime-400)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}>
            View System Logs
          </button>
        </div>
      </div>
    </div>
  );
}
