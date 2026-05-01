'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';

export default function AdminCustomersPage() {
  const { allCustomers } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = allCustomers.filter(c => {
    if (!searchQuery) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleMakeVendor = (customer: any) => {
    // Add to admins
    const admins = JSON.parse(localStorage.getItem('reed-admins') || '[]');
    if (!admins.find((a: any) => a.email === customer.email)) {
      admins.push({
        id: `A-${Date.now()}`,
        name: customer.name,
        email: customer.email,
        role: 'Vendor Admin',
        status: 'Active',
        lastActive: 'Just now'
      });
      localStorage.setItem('reed-admins', JSON.stringify(admins));
    }
    
    // Update accounts role
    const accounts = JSON.parse(localStorage.getItem('reed-accounts') || '[]');
    const updatedAccounts = accounts.map((a: any) => 
      a.email === customer.email ? { ...a, role: 'admin' } : a
    );
    localStorage.setItem('reed-accounts', JSON.stringify(updatedAccounts));
    
    // Show toast and manually trigger an event to update AdminContext if it listens to storage
    window.dispatchEvent(new Event('storage'));
    alert(`${customer.name} is now a Vendor Admin!`);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Registered Customers</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>Only accounts that have signed up on the platform appear here</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lime-400)' }}>
            <span className="material-symbols-outlined">group</span>
          </div>
          <div>
            <div className="font-lexend" style={{ fontSize: '1.5rem', fontWeight: 600 }}>{allCustomers.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Total Registered</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-lexend" style={{ fontWeight: 600 }}>Customer Accounts</span>
          <div style={{ position: 'relative', width: '280px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', fontSize: '20px' }}>search</span>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search customers..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '56px', marginBottom: '16px', opacity: 0.4 }}>group</span>
            <p style={{ fontSize: '1rem', marginBottom: '4px', fontWeight: 500 }}>
              {searchQuery ? 'No customers match your search' : 'No customers registered yet'}
            </p>
            <p style={{ fontSize: '0.85rem' }}>When users sign up on the platform, they will appear here automatically.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Customer</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Email</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500 }}>Phone</th>
                  <th style={{ padding: '14px 24px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  // Determine if they are already an admin
                  const isAdmin = c.role === 'admin' || c.role === 'super_admin';
                  return (
                    <tr key={c.email + idx} style={{ borderBottom: idx !== filtered.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'color-mix(in srgb, var(--lime-400) 20%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--lime-400)', flexShrink: 0 }}>
                            {c.profilePic ? (
                              <img src={c.profilePic} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              c.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                            )}
                          </div>
                          <span style={{ fontWeight: 500 }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>{c.email}</td>
                      <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>{c.phone || '—'}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {!isAdmin ? (
                          <button onClick={() => handleMakeVendor(c)} style={{
                            background: 'var(--surface-container-high)', border: '1px solid var(--outline)', padding: '6px 12px',
                            borderRadius: '6px', color: 'var(--on-surface)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-lexend)',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--lime-400)'}
                          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--outline)'}>
                            Make Vendor
                          </button>
                        ) : (
                          <span style={{ color: 'var(--lime-400)', fontSize: '0.8rem', fontWeight: 600, padding: '6px 12px', background: 'rgba(195, 244, 0, 0.1)', borderRadius: '6px' }}>
                            {c.role === 'super_admin' ? 'Super Admin' : 'Vendor'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--outline)', fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>
            Showing {filtered.length} of {allCustomers.length} registered customers
          </div>
        )}
      </div>
    </div>
  );
}
