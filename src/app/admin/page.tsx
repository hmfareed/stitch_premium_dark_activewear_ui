'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminContext';

export default function AdminDashboard() {
  const { allOrders } = useAdmin();

  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Action Modal States
  const [activeModal, setActiveModal] = useState<'pending' | 'suspend' | 'broadcast' | null>(null);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [vendorSearch, setVendorSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Dashboard Aggregation Data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?timeframe=${timeframe}`);
      const data = await res.json();
      if (data.success) {
        setDashData(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Format Helper
  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Quick Action: Approve / Reject Vendor Application
  const handleVendorApplicationAction = async (applicationId: string, actionType: 'approve_vendor' | 'reject_vendor') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, applicationId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchDashboardData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error('Error handling vendor action:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Toggle Vendor Active/Suspended
  const handleToggleVendorStatus = async (vendorId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_vendor_status', vendorId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchDashboardData();
      } else {
        alert(data.message || 'Failed to update vendor status');
      }
    } catch (err) {
      console.error('Error toggling vendor status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Broadcast Announcement
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast_alert',
          title: broadcastTitle,
          message: broadcastMessage,
          targetRole: broadcastTarget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setActiveModal(null);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (err) {
      console.error('Error broadcasting alert:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Action: Export Report CSV
  const handleExportReport = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_report' }),
      });
      const data = await res.json();
      if (data.success && data.csvContent) {
        const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', data.filename || 'africart_executive_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Executive CSV Report downloaded!');
      }
    } catch (err) {
      console.error('Error exporting report:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = dashData?.stats || {
    totalVendors: 1256,
    activeVendors: 1180,
    suspendedVendors: 76,
    pendingApprovals: 14,
    totalStores: 2341,
    totalProducts: 18450,
    totalCustomers: 8674,
    totalOrders: 4892,
    grossSales: 468360.80,
    totalCommissions: 65570.51,
    subscriptionRevenue: 34200.00,
    refundsTotal: 12450.00,
    orderBreakdown: {
      completed: { count: 2890, pct: '59.1' },
      processing: { count: 1245, pct: '25.4' },
      cancelled: { count: 457, pct: '9.3' },
      refunded: { count: 300, pct: '6.2' },
    },
  };

  const timeframeData = dashData?.timeframeData || {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    salesSeries: [45000, 68000, 52000, 41000, 89000, 76000, 97000],
    vendorGrowthSeries: [12, 18, 15, 9, 24, 19, 28],
  };

  const recentOrders = dashData?.recentOrders || [
    { id: '#ORD-89321', vendor: 'Fresh Mart', customer: 'Kwame Mensah', amount: 1250.00, status: 'Completed', date: 'May 26, 2025' },
    { id: '#ORD-89320', vendor: 'BestDeal Store', customer: 'Ama Serwaa', amount: 980.00, status: 'Processing', date: 'May 25, 2025' },
    { id: '#ORD-89319', vendor: 'TechHub Ghana', customer: 'Kofi Boateng', amount: 1560.00, status: 'Completed', date: 'May 25, 2025' },
    { id: '#ORD-89318', vendor: 'Daily Needs', customer: 'Yaw Asare', amount: 670.00, status: 'Processing', date: 'May 24, 2025' },
    { id: '#ORD-89317', vendor: 'Mega Store', customer: 'Abena Owusu', amount: 2300.00, status: 'Completed', date: 'May 24, 2025' },
  ];

  const recentVendors = dashData?.recentVendors || [
    { id: 'v1', name: 'Akosua Mensah', email: 'akosua@gmail.com', store: "Akosua's Store", plan: 'Premium', status: 'Active', date: 'May 26, 2025', avatarBg: '#818cf8' },
    { id: 'v2', name: 'Kofi Boateng', email: 'kofi@example.com', store: 'Kofi Mart', plan: 'Standard', status: 'Active', date: 'May 25, 2025', avatarBg: '#f43f5e' },
    { id: 'v3', name: 'Ama Serwaa', email: 'ama@example.com', store: "Serwaa's Shop", plan: 'Basic', status: 'Pending', date: 'May 24, 2025', avatarBg: '#fbbf24' },
    { id: 'v4', name: 'Yaw Asare', email: 'yaw@example.com', store: 'Asare Store', plan: 'Standard', status: 'Active', date: 'May 23, 2025', avatarBg: '#34d399' },
    { id: 'v5', name: 'Abena Owusu', email: 'abena@example.com', store: 'Abena Collection', plan: 'Premium', status: 'Active', date: 'May 22, 2025', avatarBg: '#fb7185' },
  ];

  const systemAlerts = dashData?.systemAlerts || [
    { id: 'alert-1', type: 'warning', title: 'Pending Vendor Approvals', message: '14 vendor application(s) awaiting KYC approval.', actionLabel: 'Review Now', actionType: 'review_vendors', count: 14 },
    { id: 'alert-2', type: 'info', title: 'Expiring Subscriptions', message: '8 vendor subscription(s) expire within 7 days.', actionLabel: 'View Subscriptions', actionType: 'view_subscriptions', count: 8 },
  ];

  // SVG Max Calculations for Revenue Chart
  const maxSales = Math.max(...timeframeData.salesSeries, 100);
  const maxVendorGrowth = Math.max(...timeframeData.vendorGrowthSeries, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          background: '#0f172a', color: '#38bdf8', padding: '12px 20px', borderRadius: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #0284c7'
        }}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar & Quick Actions Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Super Admin Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Real-time multi-module enterprise telemetry & platform analytics
          </p>
        </div>

        {/* Timeframe Selector & Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Timeframe Selector Pills */}
          <div style={{ display: 'flex', background: '#e2e8f0', padding: 4, borderRadius: 12, gap: 4 }}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  border: 'none',
                  background: timeframe === tf ? '#ffffff' : 'transparent',
                  color: timeframe === tf ? '#0f172a' : '#64748b',
                  fontWeight: timeframe === tf ? 800 : 600,
                  fontSize: 12,
                  padding: '6px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: timeframe === tf ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease',
                  textTransform: 'capitalize',
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Quick Action: Pending Approvals Drawer Button */}
          <button
            onClick={() => setActiveModal('pending')}
            style={actionButtonStyle('#16a34a', '#dcfce7')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>how_to_reg</span>
            <span>Approvals ({stats.pendingApprovals})</span>
          </button>

          {/* Quick Action: Broadcast Announcement */}
          <button
            onClick={() => setActiveModal('broadcast')}
            style={actionButtonStyle('#2563eb', '#dbeafe')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
            <span>Broadcast</span>
          </button>

          {/* Quick Action: Export Executive CSV */}
          <button
            onClick={handleExportReport}
            disabled={actionLoading}
            style={actionButtonStyle('#7c3aed', '#f3e8ff')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Aggregated Metrics Grid (Primary Module Telemetry) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Card 1: Total Vendors */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={statTitleStyle}>Total Vendors</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>storefront</span>
            </div>
          </div>
          <div style={statValueStyle}>{stats.totalVendors.toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <span style={badgeStyle('#166534', '#dcfce7')}>{stats.activeVendors} Active</span>
            <span style={badgeStyle('#991b1b', '#fee2e2')}>{stats.suspendedVendors} Suspended</span>
          </div>
        </div>

        {/* Card 2: Total Stores */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={statTitleStyle}>Total Stores</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>store</span>
            </div>
          </div>
          <div style={statValueStyle}>{stats.totalStores.toLocaleString()}</div>
          <div style={growthStyle}><span style={{ color: '#16a34a', fontWeight: 800 }}>↑ 10.3%</span> vs last period</div>
        </div>

        {/* Card 3: Total Products */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={statTitleStyle}>Total Products</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>inventory_2</span>
            </div>
          </div>
          <div style={statValueStyle}>{stats.totalProducts.toLocaleString()}</div>
          <div style={growthStyle}><span style={{ color: '#16a34a', fontWeight: 800 }}>↑ 14.2%</span> catalog growth</div>
        </div>

        {/* Card 4: Total Customers & Orders */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={statTitleStyle}>Total Customers</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>group</span>
            </div>
          </div>
          <div style={statValueStyle}>{stats.totalCustomers.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>Total Orders: <strong>{stats.totalOrders.toLocaleString()}</strong></div>
        </div>

        {/* Card 5: Gross Sales */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={statTitleStyle}>Gross Sales</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>payments</span>
            </div>
          </div>
          <div style={{ ...statValueStyle, fontSize: 17, color: '#0f172a' }}>{formatGhs(stats.grossSales)}</div>
          <div style={growthStyle}><span style={{ color: '#16a34a', fontWeight: 800 }}>↑ 15.6%</span> revenue volume</div>
        </div>

        {/* Card 6: Platform Commissions & Subscription Revenue */}
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={statTitleStyle}>Commissions & Subs</span>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>account_balance_wallet</span>
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#0d9488' }}>Commissions: {formatGhs(stats.totalCommissions)}</div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 4 }}>Subs: {formatGhs(stats.subscriptionRevenue)} | Refunds: {formatGhs(stats.refundsTotal)}</div>
        </div>
      </div>

      {/* 2. Live Dynamic Analytics Row (Revenue Bar Chart | Vendor Growth Chart | Order Donut) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* Live Interactive Revenue Bar & Curve Chart */}
        <div style={{ ...cardStyle, flex: 1.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={cardHeaderStyle}>Revenue Analytics</h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>Timeframe: <strong style={{ textTransform: 'capitalize' }}>{timeframe}</strong></p>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>
              {formatGhs(timeframeData.salesSeries.reduce((a: number, b: number) => a + b, 0))}
            </div>
          </div>

          {/* SVG Bar Chart with Hover Tooltips */}
          <div style={{ width: '100%', height: 210, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 180" preserveAspectRatio="none">
              {/* Horizontal Grid lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="#cbd5e1" />

              {/* Dynamic Live Bars */}
              {timeframeData.salesSeries.map((val: number, idx: number) => {
                const count = timeframeData.salesSeries.length;
                const barWidth = Math.min(30, 400 / count);
                const x = 30 + idx * (440 / count);
                const height = maxSales > 0 ? (val / maxSales) * 120 : 10;
                const y = 160 - height;
                return (
                  <g key={idx} className="chart-bar-group">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx="6"
                      fill={idx % 2 === 0 ? '#16a34a' : '#22c55e'}
                      opacity="0.9"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-Axis Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
              {timeframeData.labels.map((lbl: string, idx: number) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Live Vendor Growth Bar Chart */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={cardHeaderStyle}>Vendor Onboarding Growth</h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>New vendor signups</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 6 }}>
              +{(timeframeData.vendorGrowthSeries.reduce((a: number, b: number) => a + b, 0))} Vendors
            </span>
          </div>

          <div style={{ width: '100%', height: 210, position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 180" preserveAspectRatio="none">
              <line x1="0" y1="160" x2="400" y2="160" stroke="#cbd5e1" />
              {timeframeData.vendorGrowthSeries.map((val: number, idx: number) => {
                const count = timeframeData.vendorGrowthSeries.length;
                const barWidth = Math.min(24, 320 / count);
                const x = 20 + idx * (360 / count);
                const height = maxVendorGrowth > 0 ? (val / maxVendorGrowth) * 120 : 8;
                const y = 160 - height;
                return (
                  <rect
                    key={idx}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    rx="4"
                    fill="#2563eb"
                  />
                );
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 4 }}>
              {timeframeData.labels.map((lbl: string, idx: number) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Order Status Distribution Donut Chart */}
        <div style={cardStyle}>
          <h3 style={{ ...cardHeaderStyle, marginBottom: 16 }}>Order Status Breakdown</h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
              <svg width="140" height="140" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#16a34a" strokeWidth="16" strokeDasharray="141 238" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#eab308" strokeWidth="16" strokeDasharray="60 238" strokeDashoffset="-141" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" strokeWidth="16" strokeDasharray="22 238" strokeDashoffset="-201" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8b5cf6" strokeWidth="16" strokeDasharray="15 238" strokeDashoffset="-223" transform="rotate(-90 50 50)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{stats.totalOrders.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>Total Orders</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>Completed</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{stats.orderBreakdown.completed.count} <span style={{ color: '#94a3b8', fontSize: 10 }}>({stats.orderBreakdown.completed.pct}%)</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>Processing</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{stats.orderBreakdown.processing.count} <span style={{ color: '#94a3b8', fontSize: 10 }}>({stats.orderBreakdown.processing.pct}%)</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>Cancelled</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{stats.orderBreakdown.cancelled.count} <span style={{ color: '#94a3b8', fontSize: 10 }}>({stats.orderBreakdown.cancelled.pct}%)</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }} />
                <span style={{ color: '#475569', fontWeight: 600 }}>Refunded</span>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>{stats.orderBreakdown.refunded.count} <span style={{ color: '#94a3b8', fontSize: 10 }}>({stats.orderBreakdown.refunded.pct}%)</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Alerts Banner */}
      {systemAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={cardHeaderStyle}>Real-time System Telemetry & Alerts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
            {systemAlerts.map((alert: any) => (
              <div
                key={alert.id}
                style={{
                  background: alert.type === 'warning' ? '#fffbeb' : alert.type === 'alert' ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${alert.type === 'warning' ? '#fcd34d' : alert.type === 'alert' ? '#fca5a5' : '#86efac'}`,
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="material-symbols-outlined" style={{
                    color: alert.type === 'warning' ? '#d97706' : alert.type === 'alert' ? '#dc2626' : '#16a34a',
                    fontSize: 24,
                  }}>
                    {alert.type === 'warning' ? 'warning' : alert.type === 'alert' ? 'error' : 'check_circle'}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{alert.title}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{alert.message}</div>
                  </div>
                </div>

                {alert.actionType === 'review_vendors' ? (
                  <button
                    onClick={() => setActiveModal('pending')}
                    style={alertButtonStyle('#d97706', '#fef3c7')}
                  >
                    {alert.actionLabel}
                  </button>
                ) : (
                  <Link href="/admin/vendors" style={alertButtonStyle('#16a34a', '#dcfce7')}>
                    {alert.actionLabel}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Bottom Activity Feeds Row: Recent Vendors | Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* Recent Vendors List with Live Quick Toggle */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={cardHeaderStyle}>Recent Vendors</h3>
            <Link href="/admin/vendors" style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>
              Manage All ({stats.totalVendors})
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Vendor</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Store</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600, textAlign: 'right' }}>Quick Toggle</th>
                </tr>
              </thead>
              <tbody>
                {recentVendors.map((rv: any) => (
                  <tr key={rv.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: rv.avatarBg || '#818cf8', color: '#fff', fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {rv.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{rv.name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{rv.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 4px', color: '#475569', fontWeight: 600 }}>{rv.store}</td>
                    <td style={{ padding: '10px 4px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 800,
                        background: rv.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: rv.status === 'Active' ? '#166534' : '#991b1b',
                      }}>
                        {rv.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleVendorStatus(rv.id)}
                        disabled={actionLoading}
                        style={{
                          border: 'none',
                          background: rv.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                          color: rv.status === 'Active' ? '#dc2626' : '#16a34a',
                          fontWeight: 700,
                          fontSize: 10,
                          padding: '3px 8px',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        {rv.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders List */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={cardHeaderStyle}>Recent Orders</h3>
            <Link href="/admin/orders" style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>
              View All ({stats.totalOrders})
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Vendor / Customer</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '8px 4px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ro: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 4px', fontWeight: 700, color: '#0f172a' }}>{ro.id}</td>
                    <td style={{ padding: '10px 4px' }}>
                      <div style={{ fontWeight: 600, color: '#334155' }}>{ro.vendor}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{ro.customer}</div>
                    </td>
                    <td style={{ padding: '10px 4px', fontWeight: 800, color: '#0f172a' }}>{formatGhs(ro.amount)}</td>
                    <td style={{ padding: '10px 4px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 800,
                        background: ro.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                        color: ro.status === 'Completed' ? '#166534' : '#b45309',
                      }}>
                        {ro.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODALS FOR QUICK ACTIONS ────────────────────────────────── */}

      {/* Modal 1: Pending Applications Review Drawer */}
      {activeModal === 'pending' && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Pending Vendor Applications ({dashData?.pendingApplications?.length || 0})
              </h3>
              <button onClick={() => setActiveModal(null)} style={closeButtonStyle}>×</button>
            </div>

            {(!dashData?.pendingApplications || dashData.pendingApplications.length === 0) ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#16a34a' }}>task_alt</span>
                <p style={{ marginTop: 8, fontWeight: 600 }}>No pending vendor applications awaiting review!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                {dashData.pendingApplications.map((app: any) => (
                  <div key={app.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{app.name} ({app.storeName})</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{app.email} • {app.phone}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Applied: {app.appliedAt} • Type: {app.businessType}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleVendorApplicationAction(app.id, 'approve_vendor')}
                          disabled={actionLoading}
                          style={{ border: 'none', background: '#16a34a', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVendorApplicationAction(app.id, 'reject_vendor')}
                          disabled={actionLoading}
                          style={{ border: 'none', background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Broadcast Announcement */}
      {activeModal === 'broadcast' && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Broadcast System Announcement
              </h3>
              <button onClick={() => setActiveModal(null)} style={closeButtonStyle}>×</button>
            </div>

            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Target Audience</label>
                <select
                  value={broadcastTarget}
                  onChange={e => setBroadcastTarget(e.target.value)}
                  style={inputStyle}
                >
                  <option value="all">All Platform Users (Vendors & Customers)</option>
                  <option value="vendor">All Vendors Only</option>
                  <option value="customer">All Customers Only</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Announcement Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled System Maintenance"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Message Details</label>
                <textarea
                  rows={4}
                  placeholder="Enter the broadcast message description..."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  required
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ border: '1px solid #cbd5e1', background: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} style={{ border: 'none', background: '#2563eb', color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}>
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Styles & Components ──────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const cardHeaderStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: '#0f172a',
  margin: 0,
  fontFamily: 'var(--font-lexend, sans-serif)',
};

const statTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
};

const statValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: '#0f172a',
};

const growthStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  marginTop: 6,
};

const actionButtonStyle = (color: string, bg: string): React.CSSProperties => ({
  border: 'none',
  background: bg,
  color: color,
  fontWeight: 700,
  fontSize: 12,
  padding: '8px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'opacity 0.2s ease',
});

const alertButtonStyle = (color: string, bg: string): React.CSSProperties => ({
  border: 'none',
  background: bg,
  color: color,
  fontWeight: 800,
  fontSize: 11,
  padding: '6px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
});

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 6px',
  borderRadius: 6,
});

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 20,
  padding: 24,
  width: '100%',
  maxWidth: 540,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

const closeButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 24,
  fontWeight: 700,
  color: '#64748b',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  outline: 'none',
};
