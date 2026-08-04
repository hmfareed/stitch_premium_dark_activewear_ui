'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorAttributesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [attributes, setAttributes] = useState([
    { name: 'Color', values: ['Black', 'Emerald Green', 'Olive Drab', 'Crisp White', 'Navy Blue', 'Burgundy'] },
    { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
    { name: 'Fabric Material', values: ['Nylon-Spandex Blend', '100% Organic Cotton', 'Polyester Mesh', 'Bamboo Viscose'] },
    { name: 'Compression Fit', values: ['Light Compression', 'Medium Support', 'High Impact Firm'] },
  ]);

  const [newVal, setNewVal] = useState('');
  const [activeAttrIdx, setActiveAttrIdx] = useState(0);

  const handleAddValue = () => {
    if (!newVal.trim()) return;
    const updated = [...attributes];
    updated[activeAttrIdx].values.push(newVal.trim());
    setAttributes(updated);
    setNewVal('');
    showToast('Attribute option added!', 'success');
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 5 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Products', path: '/vendor/products', active: false, icon: 'inventory_2' },
          { label: 'Create Product', path: '/vendor/products/create', active: false, icon: 'add_circle' },
          { label: 'Categories', path: '/vendor/categories', active: false, icon: 'category' },
          { label: 'Brands', path: '/vendor/brands', active: false, icon: 'branding_watermark' },
          { label: 'Attributes', path: '/vendor/attributes', active: true, icon: 'tune' },
          { label: 'Variants Matrix', path: '/vendor/variants', active: false, icon: 'style' },
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

      {/* Main Attributes Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Product Attribute Specifications
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
            Define reusable attribute swatches, size guides, and material options for catalog variants.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
          {/* Attribute Types Menu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attributes.map((attr, idx) => (
              <button
                key={attr.name}
                onClick={() => setActiveAttrIdx(idx)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: 'none',
                  textAlign: 'left',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                  backgroundColor: idx === activeAttrIdx ? '#10b981' : '#f8fafc',
                  color: idx === activeAttrIdx ? '#ffffff' : '#334155',
                }}
              >
                {attr.name} ({attr.values.length})
              </button>
            ))}
          </div>

          {/* Values Manager */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
              {attributes[activeAttrIdx].name} Options
            </h3>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                type="text"
                placeholder={`Add new ${attributes[activeAttrIdx].name} option...`}
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddValue()}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={handleAddValue}
                style={{ padding: '10px 18px', borderRadius: 10, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                Add Option
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {attributes[activeAttrIdx].values.map(val => (
                <div key={val} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{val}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>check_circle</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
