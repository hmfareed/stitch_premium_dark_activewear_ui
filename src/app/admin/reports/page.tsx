'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

type AnalyticsTab = 
  | 'forecasting'
  | 'vendor_perf'
  | 'retention'
  | 'product_perf'
  | 'geographic'
  | 'conversion'
  | 'subscriptions'
  | 'inventory_turnover'
  | 'margins';

export default function AdminReportsAnalyticsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('forecasting');
  const [timeframe, setTimeframe] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${activeTab}&timeframe=${timeframe}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        showToast(result.message || 'Failed to load analytics', 'error');
      }
    } catch (err) {
      showToast('Error connecting to analytics service', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tabs: Array<{ id: AnalyticsTab; label: string; icon: string }> = [
    { id: 'forecasting', label: 'Revenue Forecasting', icon: 'trending_up' },
    { id: 'vendor_perf', label: 'Vendor Performance', icon: 'storefront' },
    { id: 'retention', label: 'Customer Retention', icon: 'group_work' },
    { id: 'product_perf', label: 'Product Performance', icon: 'inventory_2' },
    { id: 'geographic', label: 'Geographic Sales', icon: 'public' },
    { id: 'conversion', label: 'Conversion Rates', icon: 'filter_alt' },
    { id: 'subscriptions', label: 'Subscription Analytics', icon: 'card_membership' },
    { id: 'inventory_turnover', label: 'Inventory Turnover', icon: 'warehouse' },
    { id: 'margins', label: 'Profit Margins', icon: 'account_balance_wallet' },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-inter, sans-serif)', color: '#0f172a' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b', marginBottom: 4 }}>
            <Link href="/admin" style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>Admin Portal</Link>
            <span>/</span>
            <span>Business Intelligence</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 30, color: '#16a34a' }}>analytics</span>
            Module 22 — Enterprise Business Intelligence & Analytics
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: 4 }}>
            Deep executive analytics covering forecasting, vendor SLAs, customer retention, geographic distribution, sales funnels, and margins.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Timeframe Controls */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: 4, borderRadius: 10 }}>
            {(['monthly', 'quarterly', 'yearly'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: timeframe === tf ? '#16a34a' : 'transparent',
                  color: timeframe === tf ? '#ffffff' : '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#64748b' }}>refresh</span>
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 9 NAVIGATION TABS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid #16a34a' : '3px solid transparent',
                color: isActive ? '#15803d' : '#64748b',
                fontWeight: isActive ? 800 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: isActive ? '#16a34a' : '#94a3b8' }}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ANALYTICS CONTENT ENGINE */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          Loading enterprise analytics data...
        </div>
      ) : data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* TAB 1: REVENUE FORECASTING */}
          {activeTab === 'forecasting' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>PROJECTED GROWTH RATE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>+{data.revenueForecasting?.growthRatePercentage}%</div>
                  <div style={kpiSubStyle}>MoM Forecast Trajectory</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>TARGET ACHIEVEMENT</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{data.revenueForecasting?.targetAchievementRate}%</div>
                  <div style={kpiSubStyle}>On track for Q3 targets</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>PROJECTED Q3 REVENUE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{formatGhs(data.revenueForecasting?.projectedQuarterlyRevenue)}</div>
                  <div style={kpiSubStyle}>Confidence Interval 95%</div>
                </div>
              </div>

              {/* Forecast Chart */}
              <div style={boxStyle}>
                <h3 style={boxTitleStyle}>Revenue Forecast vs Historical Actuals</h3>
                <div style={{ width: '100%', height: 260, display: 'flex', alignItems: 'flex-end', gap: 16, paddingTop: 20 }}>
                  {(data.revenueForecasting?.historicalVsForecast ?? []).map((item: any, i: number) => {
                    const maxVal = 40000;
                    const actPct = item.actual ? (item.actual / maxVal) * 100 : 0;
                    const fctPct = (item.forecast / maxVal) * 100;
                    const isForecast = item.period.includes('Forecast');

                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isForecast ? '#8b5cf6' : '#16a34a', marginBottom: 4 }}>
                          GH₵ {item.actual || item.forecast}
                        </div>
                        <div style={{ width: '100%', display: 'flex', gap: 4, alignItems: 'flex-end', height: '80%' }}>
                          {item.actual && (
                            <div style={{ flex: 1, height: `${actPct}%`, backgroundColor: '#16a34a', borderRadius: '4px 4px 0 0' }} title={`Actual: GH₵ ${item.actual}`} />
                          )}
                          <div style={{ flex: 1, height: `${fctPct}%`, backgroundColor: isForecast ? '#8b5cf6' : '#cbd5e1', borderRadius: '4px 4px 0 0', borderStyle: isForecast ? 'dashed' : 'solid' }} title={`Forecast: GH₵ ${item.forecast}`} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 8, textAlign: 'center', fontWeight: 600 }}>
                          {item.period}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VENDOR PERFORMANCE */}
          {activeTab === 'vendor_perf' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>ACTIVE VENDORS</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{data.vendorPerformance?.totalActiveVendors}</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>AVG FULFILLMENT SLA</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{data.vendorPerformance?.avgFulfillmentSLA}%</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>AVG DISPUTE RATE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{data.vendorPerformance?.avgDisputeRate}%</div>
                </div>
              </div>

              {/* Vendor Leaderboard Table */}
              <div style={boxStyle}>
                <h3 style={boxTitleStyle}>Top Performing Vendor Stores</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Store Name</th>
                      <th style={{ padding: '10px 14px' }}>Rating</th>
                      <th style={{ padding: '10px 14px' }}>Order Count</th>
                      <th style={{ padding: '10px 14px' }}>SLA Compliance</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Gross Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vendorPerformance?.topVendors.map((v: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{v.storeName}</td>
                        <td style={{ padding: '12px 14px', color: '#eab308', fontWeight: 700 }}>⭐ {v.rating}</td>
                        <td style={{ padding: '12px 14px' }}>{v.orderCount} orders</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>
                            {v.slaPercent}% SLA
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{formatGhs(v.sales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER RETENTION */}
          {activeTab === 'retention' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>REPEAT CUSTOMER RATE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{data.retention?.repeatCustomerRatePercentage}%</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>AVG CUSTOMER LTV</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{formatGhs(data.retention?.avgCustomerLTV)}</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>MONTHLY CHURN RATE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{data.retention?.monthlyChurnRatePercentage}%</div>
                </div>
              </div>

              {/* Cohort Retention Bar Chart */}
              <div style={boxStyle}>
                <h3 style={boxTitleStyle}>Cohort Retention Curve (6-Month Cohort Analysis)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {data.retention?.cohortRetentionCurve.map((c: any, i: number) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>
                        <span>{c.month}</span>
                        <span style={{ color: '#16a34a' }}>{c.retentionPercentage}% Active</span>
                      </div>
                      <div style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${c.retentionPercentage}%`, height: '100%', backgroundColor: '#16a34a' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCT PERFORMANCE */}
          {activeTab === 'product_perf' && (
            <div style={boxStyle}>
              <h3 style={boxTitleStyle}>Top Grossing & Fast Moving Products</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Product Title</th>
                    <th style={{ padding: '10px 14px' }}>Category</th>
                    <th style={{ padding: '10px 14px' }}>Units Sold</th>
                    <th style={{ padding: '10px 14px' }}>Stock Remaining</th>
                    <th style={{ padding: '10px 14px' }}>Conversion Rate</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts?.map((p: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b' }}>{p.category}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>{p.salesCount} units</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, backgroundColor: p.stock < 20 ? '#fef3c7' : '#f1f5f9', color: p.stock < 20 ? '#b45309' : '#334155', fontWeight: 700, fontSize: '0.75rem' }}>
                          {p.stock} in stock
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#2563eb', fontWeight: 700 }}>{p.conversionRate}%</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{formatGhs(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: GEOGRAPHIC SALES */}
          {activeTab === 'geographic' && (
            <div style={boxStyle}>
              <h3 style={boxTitleStyle}>Geographic Revenue & Destination Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                {data.geographicSales?.map((g: any, i: number) => (
                  <div key={i} style={{ padding: 14, border: '1px solid #e2e8f0', borderRadius: 10, backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>🌐 {g.region}</span>
                      <span style={{ fontWeight: 800, color: '#16a34a' }}>{formatGhs(g.sales)} ({g.percentage}%)</span>
                    </div>
                    <div style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${g.percentage}%`, height: '100%', backgroundColor: '#16a34a' }} />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>Total Orders: {g.orders} orders processed</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CONVERSION RATES */}
          {activeTab === 'conversion' && (
            <div style={boxStyle}>
              <h3 style={boxTitleStyle}>Sales Funnel Progression & Conversion Drop-Off</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {data.conversionFunnel?.map((f: any, i: number) => (
                  <div key={i} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, backgroundColor: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, marginBottom: 6 }}>
                      <span>{f.stage}</span>
                      <span style={{ color: '#2563eb' }}>{f.count.toLocaleString()} sessions ({f.conversionRatePercentage}%)</span>
                    </div>
                    <div style={{ height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${f.conversionRatePercentage}%`, height: '100%', backgroundColor: '#2563eb' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SUBSCRIPTION ANALYTICS */}
          {activeTab === 'subscriptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>MONTHLY RECURRING REVENUE (MRR)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{formatGhs(data.subscriptionsAnalytics?.mrr)}</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>ANNUAL RECURRING REVENUE (ARR)</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{formatGhs(data.subscriptionsAnalytics?.arr)}</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>SUBSCRIPTION CHURN RATE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{data.subscriptionsAnalytics?.churnRatePercentage}%</div>
                </div>
              </div>

              <div style={boxStyle}>
                <h3 style={boxTitleStyle}>Vendor Plan Tier Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {data.subscriptionsAnalytics?.tierBreakdown.map((t: any, i: number) => (
                    <div key={i} style={{ padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{t.tier}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Active Subscribers: {t.activeCount} vendors</div>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>{formatGhs(t.revenue)} / mo</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: INVENTORY TURNOVER */}
          {activeTab === 'inventory_turnover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>STOCK TURNOVER RATIO</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{data.inventoryTurnover?.stockTurnoverRatio}x / yr</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>SELL-THROUGH RATE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{data.inventoryTurnover?.sellThroughRatePercentage}%</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>DAYS INVENTORY OUTSTANDING</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{data.inventoryTurnover?.daysInventoryOutstanding} Days</div>
                </div>
              </div>

              <div style={boxStyle}>
                <h3 style={boxTitleStyle}>Stock Warning & Inventory Velocity Summary</h3>
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  <div style={{ flex: 1, padding: 16, borderRadius: 10, backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309' }}>LOW STOCK ITEMS (&lt;10 UNITS)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#92400e', marginTop: 4 }}>{data.inventoryTurnover?.lowStockItemCount} Items</div>
                  </div>

                  <div style={{ flex: 1, padding: 16, borderRadius: 10, backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b91c1c' }}>OUT OF STOCK ITEMS</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#991b1b', marginTop: 4 }}>{data.inventoryTurnover?.outOfStockItemCount} Items</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: PROFIT MARGINS */}
          {activeTab === 'margins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>GROSS PROFIT MARGIN</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{data.profitMargins?.grossMarginPercentage}%</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>NET PROFIT MARGIN</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{data.profitMargins?.netMarginPercentage}%</div>
                </div>

                <div style={kpiCardStyle}>
                  <div style={kpiLabelStyle}>NET PLATFORM PROFIT</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{formatGhs(data.profitMargins?.netProfit)}</div>
                </div>
              </div>

              <div style={boxStyle}>
                <h3 style={boxTitleStyle}>Category Margin Breakdown</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Category Name</th>
                      <th style={{ padding: '10px 14px' }}>Gross Margin</th>
                      <th style={{ padding: '10px 14px' }}>Net Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.profitMargins?.categoryMargins.map((cm: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{cm.category}</td>
                        <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: 700 }}>{cm.grossMargin}</td>
                        <td style={{ padding: '12px 14px', color: '#2563eb', fontWeight: 700 }}>{cm.netMargin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

// ── Reusable Styling ──────────────────────────────────────────
const boxStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

const boxTitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 12px 0',
};

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  padding: '18px 20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#64748b',
  marginBottom: 4,
};

const kpiSubStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#64748b',
  marginTop: 4,
  fontWeight: 500,
};
