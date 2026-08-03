'use client';

import React, { useState, useEffect, useCallback } from 'react';

type SubView = 'products' | 'categories' | 'brands' | 'units' | 'attributes' | 'variants' | 'reviews';

export default function AdminProductsPage() {
  const [subView, setSubView] = useState<SubView>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [unitsList, setUnitsList] = useState<any[]>([]);
  const [attributesList, setAttributesList] = useState<any[]>([]);
  const [variantsList, setVariantsList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Item Modal / Drawer State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'create' | 'bulk_import' | 'barcode' | 'qr' | 'review_reply' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formVendorEmail, setFormVendorEmail] = useState('');
  const [formBrand, setFormBrand] = useState('AfriCart Genuine');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formDescription, setFormDescription] = useState('');
  const [formBulkCsv, setFormBulkCsv] = useState('');
  const [formReply, setFormReply] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Data based on SubView
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products?view=${subView}&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        if (subView === 'products') setProductsList(data.products || []);
        else if (subView === 'categories') setCategoriesList(data.categories || []);
        else if (subView === 'brands') setBrandsList(data.brands || []);
        else if (subView === 'units') setUnitsList(data.units || []);
        else if (subView === 'attributes') setAttributesList(data.attributes || []);
        else if (subView === 'variants') setVariantsList(data.variants || []);
        else if (subView === 'reviews') setReviewsList(data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching products data:', err);
    } finally {
      setLoading(false);
    }
  }, [subView, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action: Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          category: formCategory,
          price: formPrice,
          stock: formStock,
          vendorEmail: formVendorEmail,
          brand: formBrand,
          unit: formUnit,
          description: formDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchData();
      } else {
        alert(data.message || 'Creation failed');
      }
    } catch (err) {
      console.error('Error creating product:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Approve Product
  const handleApproveProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Error approving product:', err);
    }
  };

  // Action: Reject Product
  const handleRejectProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Error rejecting product:', err);
    }
  };

  // Action: Toggle Feature Product
  const handleFeatureProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feature' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchData();
      }
    } catch (err) {
      console.error('Error featuring product:', err);
    }
  };

  // Action: Generate Barcode
  const handleGenerateBarcode = async (p: any) => {
    setSelectedProduct(p);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_barcode' }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedProduct({ ...p, barcode: data.barcode });
        setModalType('barcode');
        fetchData();
      }
    } catch (err) {
      console.error('Error generating barcode:', err);
    }
  };

  // Action: Generate QR Code
  const handleGenerateQR = async (p: any) => {
    setSelectedProduct(p);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_qr' }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedProduct({ ...p, qrCode: data.qrCode });
        setModalType('qr');
        fetchData();
      }
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };

  // Action: Bulk Export CSV
  const handleBulkExport = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export' }),
      });
      const data = await res.json();
      if (data.success && data.csvContent) {
        const blob = new Blob([data.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', data.filename || 'africart_products.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Products catalog exported to CSV!');
      }
    } catch (err) {
      console.error('Export CSV Error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Bulk Import CSV / Items
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBulkCsv.trim()) return;
    setActionLoading(true);
    try {
      // Simple line-based CSV parser
      const lines = formBulkCsv.split('\n').filter(l => l.trim().length > 0);
      const items = lines.map(line => {
        const parts = line.split(',');
        return {
          name: parts[0]?.trim() || 'Imported Product',
          price: parseFloat(parts[1]?.trim() || '49.99'),
          category: parts[2]?.trim() || 'General',
          stock: parseInt(parts[3]?.trim() || '25', 10),
          brand: parts[4]?.trim() || 'AfriCart Genuine',
          unit: parts[5]?.trim() || 'pcs',
        };
      });

      const res = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', items }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormBulkCsv('');
        fetchData();
      }
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Reply to Review
  const handleReviewReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewId) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/products/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: selectedReviewId, action: 'reply', vendorReply: formReply }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        setFormReply('');
        fetchData();
      }
    } catch (err) {
      console.error('Review reply error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormCategory('General'); setFormPrice(''); setFormStock('10');
    setFormVendorEmail(''); setFormBrand('AfriCart Genuine'); setFormUnit('pcs'); setFormDescription('');
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Banner */}
      {toastMsg && (
        <div style={toastStyle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Product Catalog & Taxonomy Management
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Catalog moderation, taxonomy structure, variant matrices, barcodes & customer reviews
          </p>
        </div>

        {/* Global Catalog Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { resetForm(); setModalType('create'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_box</span>
            <span>+ Add Product</span>
          </button>
          <button onClick={() => setModalType('bulk_import')} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>publish</span>
            <span>Bulk Import</span>
          </button>
          <button onClick={handleBulkExport} disabled={actionLoading} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
            <span>Bulk Export CSV</span>
          </button>
        </div>
      </div>

      {/* 7 Sub-View Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { id: 'products', label: 'Products', icon: 'inventory_2' },
            { id: 'categories', label: 'Categories', icon: 'category' },
            { id: 'brands', label: 'Brands', icon: 'branding_watermark' },
            { id: 'units', label: 'Units', icon: 'straighten' },
            { id: 'attributes', label: 'Attributes', icon: 'tune' },
            { id: 'variants', label: 'Variants (SKUs)', icon: 'grid_on' },
            { id: 'reviews', label: 'Reviews', icon: 'star' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubView(tab.id as SubView)}
              style={{
                border: 'none',
                background: subView === tab.id ? '#0f172a' : 'transparent',
                color: subView === tab.id ? '#ffffff' : '#64748b',
                fontWeight: subView === tab.id ? 800 : 600,
                fontSize: 12,
                padding: '8px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 240 }}>
          <input
            type="text"
            placeholder="Search products, SKUs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: 9, fontSize: 18, color: '#94a3b8' }}>
            search
          </span>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading product catalog data...</p>
        </div>
      ) : subView === 'products' ? (

        /* SUB-VIEW 1: PRODUCTS TABLE */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
            Master Products Catalog ({productsList.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Product Name & ID</th>
                  <th style={{ padding: 10 }}>Category / Brand</th>
                  <th style={{ padding: 10 }}>Price</th>
                  <th style={{ padding: 10 }}>Stock</th>
                  <th style={{ padding: 10 }}>Vendor</th>
                  <th style={{ padding: 10 }}>Moderation</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsList.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>
                            {p.name} {p.isFeatured && <span style={badgeStyle('#7c3aed', '#f3e8ff')}>FEATURED</span>}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>ID: {p.id} • Barcode: {p.barcode}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{p.category}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{p.brand} ({p.unit})</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>
                      {formatGhs(p.price)}
                    </td>
                    <td style={{ padding: 12, fontWeight: 700, color: p.stock > 0 ? '#0f172a' : '#dc2626' }}>
                      {p.stock} units
                    </td>
                    <td style={{ padding: 12, color: '#475569' }}>
                      {p.vendorStoreName}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(p.moderationStatus === 'approved' ? '#166534' : '#991b1b', p.moderationStatus === 'approved' ? '#dcfce7' : '#fee2e2')}>
                        {p.moderationStatus.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Approve / Reject */}
                        {p.moderationStatus !== 'approved' ? (
                          <button onClick={() => handleApproveProduct(p.id)} style={{ border: 'none', background: '#16a34a', color: '#fff', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                            Approve
                          </button>
                        ) : (
                          <button onClick={() => handleRejectProduct(p.id)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                            Reject
                          </button>
                        )}
                        {/* Feature Product */}
                        <button onClick={() => handleFeatureProduct(p.id)} style={{ border: 'none', background: p.isFeatured ? '#f3e8ff' : '#f1f5f9', color: p.isFeatured ? '#7c3aed' : '#475569', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          {p.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        {/* Barcode */}
                        <button onClick={() => handleGenerateBarcode(p)} style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          Barcode
                        </button>
                        {/* QR Code */}
                        <button onClick={() => handleGenerateQR(p)} style={{ border: 'none', background: '#ccfbf1', color: '#0d9488', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 10, cursor: 'pointer' }}>
                          QR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : subView === 'categories' ? (

        /* SUB-VIEW 2: CATEGORIES */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Taxonomy Categories ({categoriesList.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {categoriesList.map((c, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Slug: /{c.slug}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', marginTop: 8 }}>{c.count} active products</div>
              </div>
            ))}
          </div>
        </div>
      ) : subView === 'brands' ? (

        /* SUB-VIEW 3: BRANDS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Brand Directory ({brandsList.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {brandsList.map((b, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{b.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Origin: {b.origin}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', marginTop: 8 }}>{b.count} catalog items</div>
              </div>
            ))}
          </div>
        </div>
      ) : subView === 'units' ? (

        /* SUB-VIEW 4: UNITS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Measurement Units ({unitsList.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {unitsList.map((u, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#4338ca' }}>{u.name} ({u.code})</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ) : subView === 'attributes' ? (

        /* SUB-VIEW 5: ATTRIBUTES */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Global Product Attributes ({attributesList.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {attributesList.map((a, idx) => (
              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{a.name}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {a.values.map((v: string, vIdx: number) => (
                    <span key={vIdx} style={badgeStyle('#1e293b', '#e2e8f0')}>{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : subView === 'variants' ? (

        /* SUB-VIEW 6: VARIANTS (SKUS) */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>SKU Variants Matrix ({variantsList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>SKU Code</th>
                  <th style={{ padding: 10 }}>Variant Name</th>
                  <th style={{ padding: 10 }}>Parent Product</th>
                  <th style={{ padding: 10 }}>Price</th>
                  <th style={{ padding: 10 }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {variantsList.map((v, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#4338ca', '#e0e7ff')}>{v.sku}</span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{v.name}</td>
                    <td style={{ padding: 12, color: '#334155' }}>{v.productName}</td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>{formatGhs(v.price)}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{v.stock} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (

        /* SUB-VIEW 7: REVIEWS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Product Customer Reviews ({reviewsList.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviewsList.map(r => (
              <div key={r.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.customerName} ({r.customerEmail})</div>
                    <div style={{ color: '#eab308', fontSize: 14, marginTop: 2 }}>{'★'.repeat(r.rating)}</div>
                    <p style={{ fontSize: 13, color: '#334155', marginTop: 4, margin: '4px 0' }}>{r.comment}</p>
                    {r.vendorReply && (
                      <div style={{ background: '#e0e7ff', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: '#3730a3', marginTop: 6 }}>
                        <strong>Vendor Reply:</strong> {r.vendorReply}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedReviewId(r.id); setFormReply(r.vendorReply || ''); setModalType('review_reply'); }}
                    style={{ border: 'none', background: '#2563eb', color: '#fff', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                  >
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODALS FOR ACTIONS ────────────────────────────────────────── */}

      {/* Modal: Create Product */}
      {modalType === 'create' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Add New Product</h3>
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <input type="text" value={formCategory} onChange={e => setFormCategory(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Price (GH₵) *</label>
                  <input type="number" step="0.01" value={formPrice} onChange={e => setFormPrice(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Stock Quantity</label>
                  <input type="number" value={formStock} onChange={e => setFormStock(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Brand</label>
                  <input type="text" value={formBrand} onChange={e => setFormBrand(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Import */}
      {modalType === 'bulk_import' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Bulk Import Products (CSV Format)</h3>
            <form onSubmit={handleBulkImport} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: '#64748b' }}>Format per line: <code>Name, Price, Category, Stock, Brand, Unit</code></p>
              <textarea
                rows={6}
                placeholder="Fresh Organic Tomatoes, 25.00, Groceries, 50, FreshMart, kg&#10;Kente Cloth Premier, 350.00, Apparel, 10, AshantiCraft, pcs"
                value={formBulkCsv}
                onChange={e => setFormBulkCsv(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Import CSV</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Barcode Viewer */}
      {modalType === 'barcode' && selectedProduct && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Barcode Generator</h3>
              <p style={{ fontSize: 12, color: '#64748b' }}>{selectedProduct.name}</p>
              <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', padding: 24, borderRadius: 16, margin: '20px 0' }}>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 4, fontFamily: 'monospace', color: '#0f172a' }}>
                  {selectedProduct.barcode}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>EAN-13 / Code-128 Scanner Ready</div>
              </div>
              <button onClick={() => setModalType(null)} style={btnPrimaryStyle}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: QR Code Viewer */}
      {modalType === 'qr' && selectedProduct && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Product QR Code</h3>
              <p style={{ fontSize: 12, color: '#64748b' }}>{selectedProduct.name}</p>
              <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
                <img src={selectedProduct.qrCode} alt="Product QR Code" style={{ width: 180, height: 180, borderRadius: 12 }} />
              </div>
              <button onClick={() => setModalType(null)} style={btnPrimaryStyle}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Review Reply */}
      {modalType === 'review_reply' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Reply to Customer Review</h3>
            <form onSubmit={handleReviewReply} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea
                rows={4}
                placeholder="Enter official vendor / store reply..."
                value={formReply}
                onChange={e => setFormReply(e.target.value)}
                required
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Publish Reply</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  background: '#0f172a',
  color: '#38bdf8',
  padding: '12px 20px',
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  fontSize: 13,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #0284c7',
};

const btnPrimaryStyle: React.CSSProperties = {
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondaryStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#475569',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 6,
  textTransform: 'uppercase',
});

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
  maxWidth: 520,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
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
