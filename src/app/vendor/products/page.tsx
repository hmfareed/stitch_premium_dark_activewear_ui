'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorAllProductsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/vendor/products?category=${categoryFilter}&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (product: any) => {
    try {
      const res = await fetch('/api/vendor/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product._id,
          isFeatured: !product.isFeatured,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Product ${!product.isFeatured ? 'marked as featured' : 'removed from featured'}`, 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product from catalog?')) return;
    try {
      const res = await fetch(`/api/vendor/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Product deleted from catalog', 'info');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Delete error', 'error');
    }
  };

  // Bulk CSV Export
  const handleBulkExport = () => {
    if (products.length === 0) {
      showToast('No products available to export', 'error');
      return;
    }
    const headers = ['ID', 'Title', 'SKU', 'Barcode', 'Price', 'SalePrice', 'Stock', 'Category', 'Status', 'IsFeatured'];
    const rows = products.map(p => [
      p._id,
      `"${(p.title || p.name || '').replace(/"/g, '""')}"`,
      p.sku || '',
      p.barcode || '',
      p.price || 0,
      p.salePrice || '',
      p.stock || 0,
      `"${p.category || ''}"`,
      p.isDraft ? 'Draft' : p.status || 'Approved',
      p.isFeatured ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor-catalog-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Catalog exported to CSV!', 'success');
  };

  // Mock CSV Bulk Import
  const handleSimulateImport = async () => {
    setImporting(true);
    setTimeout(async () => {
      showToast('Successfully imported 5 sample products from CSV!', 'success');
      setImporting(false);
      setShowImportModal(false);
      fetchProducts();
    }, 1200);
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* Module 5 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Products', path: '/vendor/products', active: true, icon: 'inventory_2' },
          { label: 'Create Product', path: '/vendor/products/create', active: false, icon: 'add_circle' },
          { label: 'Categories', path: '/vendor/categories', active: false, icon: 'category' },
          { label: 'Brands', path: '/vendor/brands', active: false, icon: 'branding_watermark' },
          { label: 'Attributes', path: '/vendor/attributes', active: false, icon: 'tune' },
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

      {/* Main Catalog Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Product Catalog Management
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Manage products, SKUs, EAN-13 barcodes, stock levels, variants, and bulk CSV operations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowImportModal(true)}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
              Bulk CSV Import
            </button>

            <button
              onClick={handleBulkExport}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
              Export Catalog
            </button>

            <Link
              href="/vendor/products/create"
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 3px 10px rgba(16,185,129,0.3)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Add New Product
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, fontSize: 18, color: '#94a3b8' }}>search</span>
            <input
              type="text"
              placeholder="Search product title, SKU, or barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchProducts()}
              style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none' }}
          >
            <option value="all">All Categories</option>
            <option value="Fashion & Activewear">Fashion & Activewear</option>
            <option value="Running & Training">Running & Training</option>
            <option value="Gym Accessories">Gym Accessories</option>
            <option value="Footwear & Sneakers">Footwear & Sneakers</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, color: '#0f172a', outline: 'none' }}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved & Live</option>
            <option value="draft">Draft Products</option>
            <option value="pending">Pending Review</option>
          </select>
        </div>

        {/* Catalog Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading product catalog...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#cbd5e1' }}>inventory_2</span>
            <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700 }}>No products found</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Try clearing search or filters, or add your first product.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 8px' }}>Product</th>
                  <th style={{ padding: '10px 8px' }}>SKU & Barcode</th>
                  <th style={{ padding: '10px 8px' }}>Category</th>
                  <th style={{ padding: '10px 8px' }}>Price</th>
                  <th style={{ padding: '10px 8px' }}>Stock</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Featured</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const title = p.title || p.name;
                  const img = p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200';
                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      
                      {/* Product Thumbnail & Title */}
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, backgroundColor: '#f1f5f9' }}>
                            <Image src={img} alt={title} fill style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{title}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>ID: {p._id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{p.sku || 'AFR-PRD-101'}</div>
                        <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{p.barcode || '603123456789'}</div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '10px 8px', color: '#475569', fontWeight: 600 }}>
                        {p.category || 'General'}
                      </td>

                      {/* Price & Sale Price */}
                      <td style={{ padding: '10px 8px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>GH₵ {(p.salePrice || p.price).toFixed(2)}</div>
                        {p.salePrice && <div style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through' }}>GH₵ {p.price.toFixed(2)}</div>}
                      </td>

                      {/* Stock Badge */}
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          backgroundColor: p.stock <= 5 ? '#fee2e2' : '#dcfce7',
                          color: p.stock <= 5 ? '#dc2626' : '#16a34a',
                        }}>
                          {p.stock} in stock
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: 6,
                          backgroundColor: p.isDraft ? '#f1f5f9' : p.status === 'approved' ? '#dcfce7' : '#fef3c7',
                          color: p.isDraft ? '#64748b' : p.status === 'approved' ? '#16a34a' : '#d97706',
                        }}>
                          {p.isDraft ? 'DRAFT' : (p.status || 'APPROVED').toUpperCase()}
                        </span>
                      </td>

                      {/* Featured Toggle */}
                      <td style={{ padding: '10px 8px' }}>
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: p.isFeatured ? '#f59e0b' : '#cbd5e1',
                          }}
                          title={p.isFeatured ? 'Featured Product' : 'Make Featured'}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                            {p.isFeatured ? 'star' : 'star_outline'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <Link
                            href={`/vendor/products/create?editId=${p._id}`}
                            style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#334155', textDecoration: 'none', fontWeight: 700, fontSize: 11 }}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* CSV Bulk Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 460, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Bulk CSV Product Import</h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
              Upload a `.csv` file containing product title, price, stock, category, SKU, and image URL columns.
            </p>

            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, padding: 24, textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: 20 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#10b981' }}>cloud_upload</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 8 }}>Drop CSV catalog file here</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Supports UTF-8 .csv format</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowImportModal(false)} style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSimulateImport} disabled={importing} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                {importing ? 'Importing...' : 'Upload & Import'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
