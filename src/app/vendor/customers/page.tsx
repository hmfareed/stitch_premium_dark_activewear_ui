'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorCustomersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');

  // Customer Drawer / Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [vendorNotes, setVendorNotes] = useState('');
  const [creditAmount, setCreditAmount] = useState('50');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/customers');
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (cust: any) => {
    setSelectedCustomer(cust);
    setVendorNotes(cust.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedCustomer.email,
          notes: vendorNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Vendor notes saved to customer profile!', 'success');
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Error saving notes', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleBlacklist = async (cust: any) => {
    try {
      const res = await fetch('/api/vendor/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cust.email,
          isBlacklisted: !cust.isBlacklisted,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Customer ${!cust.isBlacklisted ? 'added to blacklist' : 'removed from blacklist'}`, 'info');
      fetchCustomers();
      if (selectedCustomer && selectedCustomer.email === cust.email) {
        setSelectedCustomer({ ...selectedCustomer, isBlacklisted: !cust.isBlacklisted });
      }
    } catch (err: any) {
      showToast(err.message || 'Blacklist update failed', 'error');
    }
  };

  const handleIssueStoreCredit = async () => {
    if (!selectedCustomer) return;
    const addCredit = Number(creditAmount);
    if (!addCredit || addCredit <= 0) {
      showToast('Enter a valid store credit amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const newBalance = (selectedCustomer.walletCredit || 0) + addCredit;
      const res = await fetch('/api/vendor/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedCustomer.email,
          walletCredit: newBalance,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Issued GH₵ ${addCredit.toFixed(2)} store credit to ${selectedCustomer.name}!`, 'success');
      setSelectedCustomer({ ...selectedCustomer, walletCredit: newBalance });
      fetchCustomers();
    } catch (err: any) {
      showToast(err.message || 'Credit issue error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (customers.length === 0) { showToast('No customer records to export', 'error'); return; }
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Segment', 'TotalOrders', 'LifetimeSpend', 'LoyaltyPoints', 'WalletCredit', 'IsBlacklisted'];
    const rows = customers.map(c => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone,
      c.segment,
      c.orderCount,
      c.totalSpend.toFixed(2),
      c.loyaltyPoints,
      c.walletCredit.toFixed(2),
      c.isBlacklisted ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer-directory-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Customer directory exported to CSV!', 'success');
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.email.toLowerCase().includes(search.toLowerCase()) ||
                          c.phone.includes(search);

    if (segmentFilter === 'all') return matchesSearch;
    if (segmentFilter === 'vip') return matchesSearch && c.segment === 'VIP Tier';
    if (segmentFilter === 'regular') return matchesSearch && c.segment === 'Regular Buyer';
    if (segmentFilter === 'blacklisted') return matchesSearch && c.isBlacklisted;
    return matchesSearch;
  });

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 7 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Customers Base', path: '/vendor/customers', active: true, icon: 'group' },
          { label: 'Customer Groups', path: '/vendor/customers/groups', active: false, icon: 'groups' },
          { label: 'Loyalty & Rewards', path: '/vendor/customers/loyalty', active: false, icon: 'military_tech' },
          { label: 'Wallets & Credit', path: '/vendor/customers/wallets', active: false, icon: 'account_balance_wallet' },
          { label: 'Delivery Addresses', path: '/vendor/customers/addresses', active: false, icon: 'pin_drop' },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#ffffff' : '#475569',
              backgroundColor: tab.active ? '#10b981' : '#ffffff',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Customers Directory Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Customer Relationship Management (CRM)
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              View customer profiles, purchase history, loyalty points, issue store credit, and manage blacklist flags.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            style={{
              padding: '9px 16px',
              borderRadius: 10,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            Export Customer CSV
          </button>
        </div>

        {/* Search & Segment Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, fontSize: 18, color: '#94a3b8' }}>search</span>
            <input
              type="text"
              placeholder="Search customer name, email, or phone number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
            />
          </div>

          <select
            value={segmentFilter}
            onChange={e => setSegmentFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none' }}
          >
            <option value="all">All Segments</option>
            <option value="vip">VIP Tier (Spend {'>'} GH₵2,000)</option>
            <option value="regular">Regular Buyers</option>
            <option value="blacklisted">Blacklisted Customers</option>
          </select>
        </div>

        {/* Customer Directory Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading customer database...</div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>No customers found matching filter criteria.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Contact Info</th>
                  <th style={{ padding: '10px 8px' }}>Segment</th>
                  <th style={{ padding: '10px 8px' }}>Total Orders</th>
                  <th style={{ padding: '10px 8px' }}>Lifetime Spend</th>
                  <th style={{ padding: '10px 8px' }}>Loyalty Points</th>
                  <th style={{ padding: '10px 8px' }}>Store Credit</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.email} style={{ borderBottom: '1px solid #f8fafc', opacity: c.isBlacklisted ? 0.6 : 1 }}>
                    
                    {/* Name & Avatar */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: c.isBlacklisted ? '#ef4444' : '#061d13', color: '#a3e635', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{c.name}</span>
                            {c.isBlacklisted && <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: 4 }}>BLACKLISTED</span>}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Member since {c.joinedDate}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{c.phone}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{c.email}</div>
                    </td>

                    {/* Segment Badge */}
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 900,
                        padding: '3px 8px',
                        borderRadius: 6,
                        backgroundColor: c.segment === 'VIP Tier' ? '#fef3c7' : c.segment === 'Regular Buyer' ? '#dbeafe' : '#f1f5f9',
                        color: c.segment === 'VIP Tier' ? '#d97706' : c.segment === 'Regular Buyer' ? '#2563eb' : '#64748b',
                      }}>
                        {c.segment}
                      </span>
                    </td>

                    {/* Orders Count */}
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{c.orderCount} orders</td>

                    {/* Lifetime Spend */}
                    <td style={{ padding: '10px 8px', fontWeight: 900, color: '#10b981' }}>GH₵ {c.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>

                    {/* Loyalty Points */}
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>stars</span>
                        <span>{c.loyaltyPoints} pts</span>
                      </span>
                    </td>

                    {/* Store Credit */}
                    <td style={{ padding: '10px 8px', fontWeight: 800, color: c.walletCredit > 0 ? '#2563eb' : '#94a3b8' }}>
                      GH₵ {c.walletCredit.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleOpenDrawer(c)}
                          style={{ padding: '5px 10px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleToggleBlacklist(c)}
                          style={{ padding: '5px 10px', borderRadius: 6, backgroundColor: c.isBlacklisted ? '#dcfce7' : '#fee2e2', color: c.isBlacklisted ? '#16a34a' : '#dc2626', border: 'none', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                        >
                          {c.isBlacklisted ? 'Unblock' : 'Blacklist'}
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Customer Profile Modal Drawer */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 540, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Customer Profile & CRM</h3>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {/* Header info */}
            <div style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{selectedCustomer.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selectedCustomer.email} • {selectedCustomer.phone}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 6, backgroundColor: '#dcfce7', color: '#16a34a' }}>
                {selectedCustomer.segment}
              </span>
            </div>

            {/* Purchase History */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Purchase Order History</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(selectedCustomer.orders || []).map((ord: any) => (
                  <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, backgroundColor: '#f8fafc', fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>{ord.id}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>{ord.date}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>GH₵ {ord.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Credit Issuing */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 16, borderRadius: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#166534', marginBottom: 8 }}>
                Store Credit Wallet: GH₵ {(selectedCustomer.walletCredit || 0).toFixed(2)}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  placeholder="Amount GH₵"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
                <button
                  onClick={handleIssueStoreCredit}
                  disabled={submitting}
                  style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  Issue Credit
                </button>
              </div>
            </div>

            {/* Vendor Private Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Private Vendor Notes</label>
              <textarea
                rows={3}
                placeholder="Add internal notes on customer preferences, sizing, or delivery requests..."
                value={vendorNotes}
                onChange={e => setVendorNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setSelectedCustomer(null)} style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Close</button>
              <button onClick={handleSaveNotes} disabled={submitting} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                Save Profile Notes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
