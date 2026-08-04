'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorVariantsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [variants, setVariants] = useState([
    { id: 'v-1', product: 'Pro Compression Leggings', sku: 'AFR-LEG-1001-EM-M', color: 'Emerald Green', size: 'M', price: 199.00, stock: 25, status: 'In Stock' },
    { id: 'v-2', product: 'Pro Compression Leggings', sku: 'AFR-LEG-1001-EM-L', color: 'Emerald Green', size: 'L', price: 199.00, stock: 18, status: 'In Stock' },
    { id: 'v-3', product: 'Pro Compression Leggings', sku: 'AFR-LEG-1001-BLK-M', color: 'Black', size: 'M', price: 199.00, stock: 4, status: 'Low Stock' },
    { id: 'v-4', product: 'Hyper-Cool Running Tank', sku: 'AFR-TNK-2004-WHT-S', color: 'Crisp White', size: 'S', price: 149.00, stock: 30, status: 'In Stock' },
    { id: 'v-5', product: 'Hyper-Cool Running Tank', sku: 'AFR-TNK-2004-NAV-L', color: 'Navy Blue', size: 'L', price: 149.00, stock: 0, status: 'Out of Stock' },
  ]);

  const handleUpdateStock = (id: string, newStock: number) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, stock: newStock, status: newStock <= 0 ? 'Out of Stock' : newStock <= 5 ? 'Low Stock' : 'In Stock' } : v));
    showToast('Variant stock level updated!', 'success');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1300, margin: '0 auto' }}>
      
      {/* Module 5 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Products', path: '/vendor/products', active: false, icon: 'inventory_2' },
          { label: 'Create Product', path: '/vendor/products/create', active: false, icon: 'add_circle' },
          { label: 'Categories', path: '/vendor/categories', active: false, icon: 'category' },
          { label: 'Brands', path: '/vendor/brands', active: false, icon: 'branding_watermark' },
          { label: 'Attributes', path: '/vendor/attributes', active: false, icon: 'tune' },
          { label: 'Variants Matrix', path: '/vendor/variants', active: true, icon: 'style' },
          { label: 'Reviews & Ratings', path: '/vendor/reviews', active: false, icon: 'star' },
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

      {/* Main Variants Matrix Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Product Variant Stock & Price Matrix
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Manage individual SKU combinations, color/size variant prices, and stock overrides.
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                <th style={{ padding: '10px 8px' }}>Product Title</th>
                <th style={{ padding: '10px 8px' }}>Variant SKU</th>
                <th style={{ padding: '10px 8px' }}>Color</th>
                <th style={{ padding: '10px 8px' }}>Size</th>
                <th style={{ padding: '10px 8px' }}>Price</th>
                <th style={{ padding: '10px 8px' }}>Stock Qty</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {variants.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>{v.product}</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#475569', fontWeight: 700 }}>{v.sku}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{v.color}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>{v.size}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#0f172a' }}>GH₵ {v.price.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <input
                      type="number"
                      value={v.stock}
                      onChange={e => handleUpdateStock(v.id, Number(e.target.value))}
                      style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
                    />
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      backgroundColor: v.stock <= 0 ? '#fee2e2' : v.stock <= 5 ? '#fef3c7' : '#dcfce7',
                      color: v.stock <= 0 ? '#dc2626' : v.stock <= 5 ? '#d97706' : '#16a34a',
                    }}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
