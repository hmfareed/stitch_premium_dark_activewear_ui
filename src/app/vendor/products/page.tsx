'use client';

import React, { useState } from 'react';
import { useStore, useAuth } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';

export default function VendorProductsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { allProducts, addProduct } = useStore();
  const { user } = useAuth();
  const { allAdmins } = useAdmin();

  // New product state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Fashion');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  if (!user) return null;

  const vendorProducts = allProducts.filter(p => p.vendorEmail === user.email);
  const storeName = allAdmins.find(a => a.email === user.email)?.storeName || 'Vendor Store';

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !description) return;
    
    addProduct({
      name,
      category,
      price: parseFloat(price),
      description,
      subCategory: 'Store Addition',
      rating: 0,
      image: image || 'https://images.unsplash.com/photo-1555529733-0e670560f8e1?auto=format&fit=crop&q=80&w=800',
      vendorEmail: user.email,
      vendorStoreName: storeName,
    });

    setName('');
    setPrice('');
    setDescription('');
    setImage('');
    setShowAddModal(false);
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>My Products</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Manage your store's product catalog</p>
        </div>
        <button onClick={() => setShowAddModal(!showAddModal)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showAddModal ? 'close' : 'add'}</span>
          {showAddModal ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleAddProduct} className="animate-fade-in" style={{ backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="font-lexend" style={{ fontSize: '1.2rem' }}>Add New Product</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Product Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} placeholder="e.g. Compression Shirt" />
            </div>
            <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Price ($)</label>
              <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} placeholder="0.00" />
            </div>
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }}>
                <option>Fashion</option>
                <option>Electronics</option>
                <option>Home</option>
                <option>Beauty</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Image URL (optional)</label>
            <input value={image} onChange={e => setImage(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} placeholder="https://..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Description</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', resize: 'vertical' }} placeholder="Product description..." />
          </div>
          <button type="submit" style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'black', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Publish Product
          </button>
        </form>
      )}

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Products', val: vendorProducts.length.toString(), color: '#00e5ff' },
          { label: 'Total Sales', val: '0', color: 'var(--lime-400)' },
          { label: 'Low Stock', val: '0', color: '#ff9800' },
          { label: 'Out of Stock', val: '0', color: 'var(--error)' },
        ].map(s => (
          <div key={s.label} style={{ flex: '1 1 150px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>{s.label}</div>
            <div className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 600, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Product</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Category</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Price</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Rating</th>
                <th style={{ padding: '14px 24px', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendorProducts.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>No products published yet.</td></tr>
              ) : vendorProducts.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: idx !== vendorProducts.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={p.image} alt={p.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div><span style={{ fontWeight: 500 }}>{p.name}</span><br /><span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>ID: {p.id}</span></div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{p.category}</span></td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>${p.price.toFixed(2)}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface)' }}>{p.rating} / 5</td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span></button>
                      <button style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span></button>
                    </div>
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
