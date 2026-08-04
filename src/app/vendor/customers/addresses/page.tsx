'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AppContext';

export default function VendorCustomerAddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([
    { id: 'addr-1', customer: 'Abena Osei', phone: '+233 24 123 4567', street: 'Oxford Street, House #42', city: 'Accra', region: 'Greater Accra', landmark: 'Opposite Shell Station', isDefault: true },
    { id: 'addr-2', customer: 'Kwesi Appiah', phone: '+233 20 999 8888', street: 'Boundary Road, Suite 12', city: 'East Legon', region: 'Greater Accra', landmark: 'Near Anomo Restaurant', isDefault: false },
    { id: 'addr-3', customer: 'Fatima Mohammed', phone: '+233 55 777 6666', street: 'Commercial Street, Block B', city: 'Kumasi', region: 'Ashanti', landmark: 'Near Central Market', isDefault: true },
  ]);

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 7 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Customers Base', path: '/vendor/customers', active: false, icon: 'group' },
          { label: 'Customer Groups', path: '/vendor/customers/groups', active: false, icon: 'groups' },
          { label: 'Loyalty & Rewards', path: '/vendor/customers/loyalty', active: false, icon: 'military_tech' },
          { label: 'Wallets & Credit', path: '/vendor/customers/wallets', active: false, icon: 'account_balance_wallet' },
          { label: 'Delivery Addresses', path: '/vendor/customers/addresses', active: true, icon: 'pin_drop' },
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

      {/* Main Addresses Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Customer Delivery Addresses Directory
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Directory of saved customer delivery locations, landmarks, and regional logistics coverage.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {addresses.map(a => (
            <div key={a.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#10b981' }}>location_on</span>
                  <span>{a.customer}</span>
                </div>
                {a.isDefault && (
                  <span style={{ fontSize: 9, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 4 }}>
                    PRIMARY
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569' }}>
                <div><strong>Phone:</strong> {a.phone}</div>
                <div><strong>Street:</strong> {a.street}</div>
                <div><strong>City / Region:</strong> {a.city}, {a.region}</div>
                <div><strong>Landmark:</strong> {a.landmark}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
