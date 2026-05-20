'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useAuth, useToast } from '@/context/AppContext';

const FinanceMetric = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
  <div style={{ flex: '1 1 220px', padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
    </div>
    <h2 className="font-lexend" style={{ fontSize: '1.8rem', margin: 0 }}>{value}</h2>
  </div>
);

export default function AdminFinancePage() {
  const { allOrders, totalRevenue, totalOrderCount, deliveredOrders, allAdmins, allPayouts, updatePayoutStatus, refreshData } = useAdmin();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSystem = async () => {
    if (!user || user.role !== 'super_admin') {
      showToast('Only Super Admins can reset the system', 'error');
      return;
    }

    if (!confirm('CRITICAL ACTION: This will delete ALL orders and reset all revenue metrics to 0. This cannot be undone. Are you sure?')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch('/api/orders', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('System reset successful. All orders deleted.', 'success');
        refreshData();
      } else {
        showToast(`Reset failed: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Compute real finance data from orders
  const commissionRate = 0.03; // 3% platform commission
  const platformCommission = totalRevenue * commissionRate;
  const vendorPayouts = totalRevenue * (1 - commissionRate);
  
  // Escrow Calculations
  const heldFunds = allOrders
    .filter(o => o.status !== 'Cancelled' && o.paymentInfo?.escrowStatus === 'Locked')
    .reduce((sum, o) => sum + (o.total || 0), 0) * (1 - commissionRate);
    
  const availableFunds = allOrders
    .filter(o => o.status !== 'Cancelled' && o.paymentInfo?.escrowStatus === 'Released')
    .reduce((sum, o) => sum + (o.total || 0), 0) * (1 - commissionRate);

  // Revenue by category
  const categoryRevenue: Record<string, number> = {};
  allOrders.filter(o => o.status !== 'Cancelled').forEach(order => {
    (order.products || []).forEach(p => {
      const cat = p.category || 'Uncategorized';
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (p.price * (p.quantity || 1));
    });
  });
  const categoryList = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1]);
  const maxCatRevenue = categoryList.length > 0 ? categoryList[0][1] : 1;

  // Revenue by customer
  const customerRevenue: Record<string, { name: string; total: number; orders: number }> = {};
  allOrders.filter(o => o.status !== 'Cancelled').forEach(order => {
    const key = order.customerEmail || 'unknown';
    if (!customerRevenue[key]) customerRevenue[key] = { name: order.customerName || 'Unknown', total: 0, orders: 0 };
    customerRevenue[key].total += order.total || 0;
    customerRevenue[key].orders++;
  });
  const topCustomers = Object.values(customerRevenue).sort((a, b) => b.total - a.total).slice(0, 5);

  // Revenue by STORE (vendor)
  const storeRevenue: Record<string, { storeName: string; vendorEmail: string; grossRevenue: number; commission: number; netPayout: number; heldPayout: number; orderCount: number; productsSold: number }> = {};
  allOrders.filter(o => o.status !== 'Cancelled').forEach(order => {
    (order.products || []).forEach(p => {
      const vEmail = p.vendorEmail || 'platform';
      const vName = p.vendorStoreName || 'Platform Store';
      if (!storeRevenue[vEmail]) {
        storeRevenue[vEmail] = { storeName: vName, vendorEmail: vEmail, grossRevenue: 0, commission: 0, netPayout: 0, heldPayout: 0, orderCount: 0, productsSold: 0 };
      }
      const itemRevenue = p.price * (p.quantity || 1);
      const itemCommission = itemRevenue * commissionRate;
      const itemNet = itemRevenue - itemCommission;
      
      storeRevenue[vEmail].grossRevenue += itemRevenue;
      storeRevenue[vEmail].commission += itemCommission;
      
      if (order.paymentInfo?.escrowStatus === 'Released') {
        storeRevenue[vEmail].netPayout += itemNet;
      } else {
        storeRevenue[vEmail].heldPayout += itemNet;
      }
      
      storeRevenue[vEmail].productsSold += p.quantity || 1;
    });
    // Count unique orders per store
    const storesInOrder = new Set((order.products || []).map(p => p.vendorEmail || 'platform'));
    storesInOrder.forEach(ve => {
      if (storeRevenue[ve]) storeRevenue[ve].orderCount++;
    });
  });
  const storeList = Object.values(storeRevenue).sort((a, b) => b.grossRevenue - a.grossRevenue);
  const maxStoreRevenue = storeList.length > 0 ? storeList[0].grossRevenue : 1;

  // Cancelled orders = potential refunds
  const cancelledTotal = allOrders.filter(o => o.status === 'Cancelled').reduce((s, o) => s + (o.total || 0), 0);

  const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.4 }}>{icon}</span>
      <p style={{ fontSize: '0.9rem' }}>{text}</p>
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Finance Panel</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Revenue and commission data calculated from real orders</p>
      </div>

      {/* Metrics — all computed from real orders */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <FinanceMetric title="Gross Revenue" value={`GH₵${totalRevenue.toFixed(2)}`} icon="payments" color="var(--lime-400)" />
        <FinanceMetric title="Platform Earnings" value={`GH₵${platformCommission.toFixed(2)}`} icon="percent" color="#00e5ff" />
        <FinanceMetric title="Held in Escrow" value={`GH₵${heldFunds.toFixed(2)}`} icon="lock" color="#fbbf24" />
        <FinanceMetric title="Available Payouts" value={`GH₵${availableFunds.toFixed(2)}`} icon="account_balance_wallet" color="var(--secondary)" />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['overview', 'store_earnings', 'payout_requests', 'revenue_breakdown', 'top_customers'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', backgroundColor: activeTab === tab ? 'var(--lime-400)' : 'var(--surface)', color: activeTab === tab ? 'black' : 'var(--on-surface-variant)', transition: 'all 0.2s' }}>
            {tab.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Financial Summary</h3>
            {totalOrderCount === 0 ? (
              <EmptyState icon="account_balance" text="No financial data yet. Revenue will be calculated from real orders." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Total Orders', value: totalOrderCount.toString() },
                  { label: 'Delivered Orders', value: deliveredOrders.toString() },
                  { label: 'Average Order Value', value: totalOrderCount > 0 ? `GH₵${(totalRevenue / totalOrderCount).toFixed(2)}` : 'GH₵0.00' },
                  { label: 'Gross Revenue', value: `GH₵${totalRevenue.toFixed(2)}` },
                  { label: 'Platform Earnings (3%)', value: `GH₵${platformCommission.toFixed(2)}` },
                  { label: 'Vendor Share (97%)', value: `GH₵${vendorPayouts.toFixed(2)}` },
                  { label: 'Active Stores', value: storeList.length.toString() },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'var(--surface-container)', borderRadius: '10px' }}>
                    <span style={{ color: 'var(--on-surface-variant)' }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'rgba(255, 68, 68, 0.05)', borderRadius: '10px', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                  <span style={{ color: 'var(--error)' }}>Refundable (Cancelled)</span>
                  <span style={{ fontWeight: 600, color: 'var(--error)' }}>GH₵{cancelledTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Store Earnings */}
      {activeTab === 'store_earnings' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Store Earnings Breakdown</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Revenue per store with 3% platform commission deducted</p>
          </div>
          {storeList.length === 0 ? (
            <EmptyState icon="storefront" text="No store revenue data yet. Store earnings will appear as orders come in." />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '14px 24px', fontWeight: 500 }}>Store</th>
                      <th style={{ padding: '14px 24px', fontWeight: 500 }}>Orders</th>
                      <th style={{ padding: '14px 24px', fontWeight: 500 }}>Items</th>
                      <th style={{ padding: '14px 24px', fontWeight: 500 }}>Gross</th>
                      <th style={{ padding: '14px 24px', fontWeight: 500 }}>Comm.</th>
                      <th style={{ padding: '14px 24px', fontWeight: 500 }}>Held (Escrow)</th>
                      <th style={{ padding: '14px 24px', fontWeight: 500 }}>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeList.map((store, idx) => (
                      <tr key={store.vendorEmail} style={{ borderBottom: idx < storeList.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'color-mix(in srgb, #00e5ff 20%, transparent)', color: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                              {store.storeName[0]?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{store.storeName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{store.vendorEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{store.orderCount}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{store.productsSold}</td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, fontSize: '0.9rem' }}>GH₵{store.grossRevenue.toFixed(2)}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#00e5ff' }}>GH₵{store.commission.toFixed(2)}</td>
                        <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#fbbf24' }}>GH₵{store.heldPayout.toFixed(2)}</td>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--lime-400)', fontSize: '0.9rem' }}>GH₵{store.netPayout.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Visual bars */}
              <div style={{ padding: '24px', borderTop: '1px solid var(--outline)' }}>
                <h4 className="font-lexend" style={{ fontSize: '1rem', marginBottom: '16px' }}>Revenue Distribution</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {storeList.slice(0, 8).map(store => (
                    <div key={store.vendorEmail}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 500 }}>{store.storeName}</span>
                        <span style={{ fontWeight: 600 }}>GH₵{store.grossRevenue.toFixed(2)}</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--surface-container)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${(store.grossRevenue / maxStoreRevenue) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--lime-400), #00e5ff)', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payout Requests */}
      {activeTab === 'payout_requests' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Vendor Payout Requests</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: 4 }}>Manage and process withdrawal requests from vendors</p>
          </div>
          {allPayouts.length === 0 ? (
            <EmptyState icon="account_balance_wallet" text="No payout requests found." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Date</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Vendor</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Amount</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Method</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayouts.map((payout, idx) => (
                    <tr key={payout._id} style={{ borderBottom: idx < allPayouts.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                      <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{new Date(payout.requestDate).toLocaleDateString()}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{payout.vendorName || 'Vendor'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{payout.vendorEmail}</div>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, fontSize: '0.95rem' }}>GH₵{payout.amount.toFixed(2)}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '0.9rem' }}>{payout.paymentMethod}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', userSelect: 'all' }}>{payout.accountDetails}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                          backgroundColor: payout.status === 'Paid' ? 'color-mix(in srgb, var(--lime-400) 15%, transparent)' : 
                                         payout.status === 'Rejected' ? 'color-mix(in srgb, var(--error) 15%, transparent)' :
                                         payout.status === 'Processing' ? 'color-mix(in srgb, #00e5ff 15%, transparent)' :
                                         'color-mix(in srgb, var(--warning) 15%, transparent)',
                          color: payout.status === 'Paid' ? 'var(--lime-400)' : 
                                 payout.status === 'Rejected' ? 'var(--error)' :
                                 payout.status === 'Processing' ? '#00e5ff' :
                                 'var(--warning)'
                        }}>
                          {payout.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {payout.status !== 'Paid' && payout.status !== 'Rejected' && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {payout.status === 'Pending' && (
                              <button onClick={() => updatePayoutStatus(payout._id, 'Processing')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: '#00e5ff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                                Process
                              </button>
                            )}
                            {(payout.status === 'Pending' || payout.status === 'Processing') && (
                              <button onClick={() => updatePayoutStatus(payout._id, 'Paid')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', border: 'none', color: 'var(--lime-400)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                Mark Paid
                              </button>
                            )}
                            <button onClick={() => { if(confirm('Reject this payout request?')) updatePayoutStatus(payout._id, 'Rejected') }} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Revenue by Category */}
      {activeTab === 'revenue_breakdown' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '24px', border: '1px solid var(--outline)' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px' }}>Revenue by Product Category</h3>
          {categoryList.length === 0 ? (
            <EmptyState icon="pie_chart" text="No category data yet. As orders come in, revenue by category will appear here." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {categoryList.map(([cat, rev]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 500 }}>{cat}</span>
                    <span style={{ fontWeight: 600 }}>GH₵{rev.toFixed(2)} ({totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--surface-container)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${(rev / maxCatRevenue) * 100}%`, height: '100%', backgroundColor: 'var(--lime-400)', borderRadius: '5px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Customers */}
      {activeTab === 'top_customers' && (
        <div className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--outline)' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', margin: 0 }}>Top Spending Customers</h3>
          </div>
          {topCustomers.length === 0 ? (
            <EmptyState icon="group" text="No customer spending data yet." />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Orders</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, idx) => (
                  <tr key={c.name + idx} style={{ borderBottom: idx !== topCustomers.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '16px 24px' }}>{c.orders}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--lime-400)' }}>GH₵{c.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {/* Danger Zone */}
      {user?.role === 'super_admin' && (
        <div style={{ marginTop: '40px', padding: '32px', backgroundColor: 'rgba(255, 68, 68, 0.05)', borderRadius: '16px', border: '1px solid var(--error)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', color: 'var(--error)', marginBottom: '4px' }}>Danger Zone</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>System-wide reset actions. These actions are permanent.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Delete All Orders & Reset Metrics</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Clears the entire order database and resets all financial statistics to zero.</p>
            </div>
            <button 
              onClick={handleResetSystem} 
              disabled={isResetting}
              style={{ 
                padding: '12px 24px', borderRadius: '10px', background: 'var(--error)', border: 'none', 
                color: 'white', fontWeight: 800, fontSize: '0.85rem', cursor: isResetting ? 'not-allowed' : 'pointer',
                opacity: isResetting ? 0.6 : 1, transition: 'all 0.2s', fontFamily: 'var(--font-lexend)'
              }}
            >
              {isResetting ? 'RESETTING...' : 'RESET SYSTEM TO 0'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
