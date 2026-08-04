'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

function ProductFormContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const editId = searchParams.get('editId');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('20');
  const [category, setCategory] = useState('Fashion & Activewear');
  const [brand, setBrand] = useState('AfriCart Store');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // Variants State
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black', 'Emerald']);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL']);

  useEffect(() => {
    if (!sku) generateNewSKU();
    if (!barcode) generateNewBarcode();
    if (editId) fetchEditProduct(editId);
  }, [editId]);

  const generateNewSKU = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setSku(`AFR-VND-${rand}`);
  };

  const generateNewBarcode = () => {
    let code = '603';
    for (let i = 0; i < 9; i++) code += Math.floor(Math.random() * 10).toString();
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    const checkDigit = (10 - (sum % 10)) % 10;
    setBarcode(code + checkDigit);
  };

  const fetchEditProduct = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vendor/products?id=${id}`);
      const data = await res.json();
      if (res.ok && data.products) {
        const prod = data.products.find((p: any) => p._id === id);
        if (prod) {
          setTitle(prod.title || prod.name || '');
          setDescription(prod.description || '');
          setPrice(prod.price?.toString() || '');
          setSalePrice(prod.salePrice?.toString() || '');
          setStock(prod.stock?.toString() || '20');
          setCategory(prod.category || 'Fashion & Activewear');
          setBrand(prod.brand || 'AfriCart Store');
          setSku(prod.sku || '');
          setBarcode(prod.barcode || '');
          if (Array.isArray(prod.images) && prod.images.length > 0) setImages(prod.images);
          setIsDraft(!!prod.isDraft);
        }
      }
    } catch (err) {
      console.error('Failed to load edit product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (images.length === 1) {
      showToast('Product must have at least 1 image', 'error');
      return;
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!title.trim()) { showToast('Product title is required', 'error'); return; }
    if (!price || Number(price) <= 0) { showToast('Valid price is required', 'error'); return; }

    setSubmitting(true);
    try {
      const payload = {
        id: editId || undefined,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : undefined,
        stock: Number(stock) || 0,
        category,
        brand,
        sku,
        barcode,
        images,
        isDraft: asDraft,
        variants: [
          { name: 'Color', options: selectedColors },
          { name: 'Size', options: selectedSizes },
        ],
      };

      const res = await fetch('/api/vendor/products', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      showToast(asDraft ? 'Saved as draft' : 'Product published!', 'success');
      router.push('/vendor/products');
    } catch (err: any) {
      showToast(err.message || 'Submission error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 5 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'All Products', path: '/vendor/products', active: false, icon: 'inventory_2' },
          { label: editId ? 'Edit Product' : 'Create Product', path: '/vendor/products/create', active: true, icon: 'add_circle' },
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

      {/* Main Product Wizard Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {editId ? 'Edit Product Details' : 'Add New Catalog Product'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Configure product details, pricing, auto SKU, EAN-13 barcode, multi-image gallery, and variants.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              style={{ padding: '10px 16px', borderRadius: 10, backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              SAVE AS DRAFT
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              style={{ padding: '10px 22px', borderRadius: 10, backgroundColor: '#10b981', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 10px rgba(16,185,129,0.3)' }}
            >
              {submitting ? 'SAVING...' : editId ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#10b981' }}>Loading product details...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Row 1: General Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Product Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Pro-Performance Compression Leggings"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Full Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe materials, fit, breathability, and features..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>
              </div>

              {/* Pricing & Inventory */}
              <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 14, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0 }}>Pricing & Inventory</h4>
                
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Regular Price (GH₵) *</label>
                  <input
                    type="number"
                    placeholder="250.00"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Sale / Promo Price (GH₵)</label>
                  <input
                    type="number"
                    placeholder="199.00"
                    value={salePrice}
                    onChange={e => setSalePrice(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Stock Quantity</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: SKU, Barcode, Category, Brand */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Auto SKU Code</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="text" value={sku} onChange={e => setSku(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }} />
                  <button onClick={generateNewSKU} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>⚡</button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>EAN-13 Barcode</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontFamily: 'monospace' }} />
                  <button onClick={generateNewBarcode} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>⚡</button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}>
                  <option value="Fashion & Activewear">Fashion & Activewear</option>
                  <option value="Running & Training">Running & Training</option>
                  <option value="Gym Accessories">Gym Accessories</option>
                  <option value="Footwear & Sneakers">Footwear & Sneakers</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Brand</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }} />
              </div>
            </div>

            {/* Row 3: Product Image Gallery */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Product Image Gallery (Multi-Upload)
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="Paste Image URL e.g. https://images.unsplash.com/..."
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  style={{ padding: '10px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  Add Image
                </button>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 90, height: 90, borderRadius: 10, overflow: 'hidden', border: idx === 0 ? '3px solid #10b981' : '1px solid #cbd5e1', backgroundColor: '#f1f5f9' }}>
                    <Image src={img} alt={`Gallery ${idx}`} fill style={{ objectFit: 'cover' }} unoptimized />
                    {idx === 0 && <span style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#10b981', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 5px', borderRadius: 4 }}>COVER</span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', fontSize: 10 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Variants Builder */}
            <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>Product Variants (Colors & Sizes)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Available Colors:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Black', 'Emerald', 'Olive', 'White', 'Navy'].map(c => (
                      <label key={c} style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(c)}
                          onChange={e => setSelectedColors(e.target.checked ? [...selectedColors, c] : selectedColors.filter(x => x !== c))}
                          style={{ accentColor: '#10b981' }}
                        />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Available Sizes:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                      <label key={s} style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(s)}
                          onChange={e => setSelectedSizes(e.target.checked ? [...selectedSizes, s] : selectedSizes.filter(x => x !== s))}
                          style={{ accentColor: '#10b981' }}
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function VendorCreateProductPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#10b981' }}>Loading wizard...</div>}>
      <ProductFormContent />
    </Suspense>
  );
}
