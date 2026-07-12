'use client';

import React, { useState } from 'react';
import { useStore, useAuth, useToast } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { categories } from '@/data/products';

export default function VendorProductsPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { allProducts, addProduct, deleteProduct, updateProduct } = useStore();
  const { user } = useAuth();
  const { allAdmins } = useAdmin();
  const { showToast } = useToast();

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',');
          return {
            name: values[0]?.trim(),
            category: values[1]?.trim() || 'Fashion',
            price: parseFloat(values[2]?.trim()) || 0,
            stock: parseInt(values[3]?.trim()) || 0,
            description: values[4]?.trim() || 'No description provided.',
            image: values[5]?.trim() || 'https://images.unsplash.com/photo-1555529733-0e670560f8e1?auto=format&fit=crop&q=80&w=800'
          };
        });
        setBulkFile(data);
      };
      reader.readAsText(file);
    }
  };

  const confirmBulkUpload = async () => {
    const isUnverified = user && !user.isVerified;
    const currentCount = allProducts.filter(p => p.vendorEmail === user?.email).length;
    const totalFutureProducts = currentCount + bulkFile.length;

    if (isUnverified && totalFutureProducts > 5) {
      showToast(`Upload failed. Unverified vendors are capped at 5 products maximum. Please verify your ID.`, 'error');
      return;
    }

    showToast(`Uploading ${bulkFile.length} products to database…`, 'info');
    let successCount = 0;
    let failCount = 0;

    for (const p of bulkFile) {
      const productPayload = {
        ...p,
        subCategory: 'Bulk Upload',
        rating: 0,
        vendorEmail: user?.email || '',
        vendorStoreName: storeName,
      };
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload),
        });
        const data = await res.json();
        if (data.success && data.product) {
          // Also update local state for instant UI feedback
          addProduct({ ...productPayload, id: data.product.id || data.product._id });
          successCount++;
        } else {
          // Fallback: persist to local state even if API fails
          addProduct(productPayload);
          failCount++;
        }
      } catch {
        addProduct(productPayload);
        failCount++;
      }
    }

    setBulkFile([]);
    setShowBulkModal(false);
    if (failCount === 0) {
      showToast(`${successCount} products saved to database successfully!`, 'success');
    } else {
      showToast(`${successCount} saved to DB, ${failCount} saved locally only.`, 'info');
    }
  };

  const downloadCSVTemplate = () => {
    const headers = 'Name,Category,Price,Stock,Description,Image URL';
    const example = 'Premium Activewear Tee,Fashion,149.99,50,High-quality moisture-wicking performance tee,https://images.unsplash.com/photo-1555529733-0e670560f8e1?auto=format&fit=crop&q=80&w=800';
    const csv = [headers, example].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'africart-bulk-product-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV template downloaded!', 'success');
  };



  // New product state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Fashion');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [stock, setStock] = useState('');
  const [wholesaleTiers, setWholesaleTiers] = useState<Array<{ minQuantity: number; discountPercent: number }>>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editWholesaleTiers, setEditWholesaleTiers] = useState<Array<{ minQuantity: number; discountPercent: number }>>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as base64 first
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImageUploading(true);

      try {
        // Upload to Cloudinary via API
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, folder: 'africart/products' }),
        });
        const data = await res.json();
        if (data.success) {
          setImage(data.url);
          showToast(data.source === 'cloudinary' ? 'Image uploaded to CDN!' : 'Image ready!', 'success');
        } else {
          setImage(base64); // Fallback to base64
          showToast('CDN upload failed — using local image', 'info');
        }
      } catch {
        setImage(base64); // Fallback
        showToast('Upload error — using local image', 'info');
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 4 - additionalImages.length;
    if (remaining <= 0) { showToast('Maximum 4 additional images allowed', 'error'); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setGalleryUploading(true);
    for (const file of toUpload) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      try {
        const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, folder: 'africart/products' }) });
        const data = await res.json();
        setAdditionalImages(prev => [...prev, data.success ? data.url : base64]);
      } catch {
        setAdditionalImages(prev => [...prev, base64]);
      }
    }
    setGalleryUploading(false);
    showToast(`${toUpload.length} image(s) added!`);
  };

  if (!user) return null;

  const vendorProducts = allProducts.filter(p => p.vendorEmail === user.email);
  const storeName = allAdmins.find(a => a.email === user.email)?.storeName || '';

  // Search filter
  const filteredProducts = searchQuery.trim()
    ? vendorProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : vendorProducts;

  // Stats
  const lowStockCount = vendorProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const outOfStockCount = vendorProducts.filter(p => (p.stock || 0) === 0).length;
  const totalStockValue = vendorProducts.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !description) return;

    const isUnverified = user && !user.isVerified;
    if (isUnverified && vendorProducts.length >= 5) {
      showToast(`Listing failed. Unverified vendors are capped at 5 products. Complete verification to list more.`, 'error');
      return;
    }
    
    addProduct({
      name,
      category,
      price: parseFloat(price),
      description,
      subCategory: 'Store Addition',
      rating: 0,
      image: image || 'https://images.unsplash.com/photo-1555529733-0e670560f8e1?auto=format&fit=crop&q=80&w=800',
      images: additionalImages,
      vendorEmail: user.email,
      vendorStoreName: storeName,
      stock: parseInt(stock) || 0,
      wholesaleTiers,
    });

    setName('');
    setPrice('');
    setDescription('');
    setImage('');
    setAdditionalImages([]);
    setStock('');
    setWholesaleTiers([]);
    setActiveTab('list');
    showToast('Product published successfully!');
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
    setDeleteConfirm(null);
    showToast('Product deleted');
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditDescription(product.description);
    setEditStock((product.stock || 0).toString());
    setEditCategory(product.category);
    setEditWholesaleTiers(product.wholesaleTiers || []);
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, {
      name: editName,
      price: parseFloat(editPrice),
      description: editDescription,
      stock: parseInt(editStock) || 0,
      category: editCategory as any,
      wholesaleTiers: editWholesaleTiers,
    });
    setEditingProduct(null);
    showToast('Product updated successfully!');
  };

  const handleStockUpdate = (productId: string, newStock: number) => {
    const stockVal = Math.max(0, newStock);
    updateProduct(productId, { stock: stockVal });
    if (stockVal === 0) {
      showToast('Product out of stock. Listing is now automatically hidden from buyers!', 'info');
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>My Products</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Manage your store's product catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={downloadCSVTemplate} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface-variant)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            CSV Template
          </button>
          <button onClick={() => setShowBulkModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
            Bulk Upload
          </button>
          <button 
            onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')} 
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              backgroundColor: activeTab === 'list' ? '#00e5ff' : 'var(--surface-container-high)', 
              color: activeTab === 'list' ? '#000' : 'var(--on-surface)', 
              border: activeTab === 'list' ? 'none' : '1px solid var(--outline)', 
              fontWeight: 600, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{activeTab === 'add' ? 'arrow_back' : 'add'}</span>
            {activeTab === 'add' ? 'Back to List' : 'Add Product'}
          </button>
        </div>

      </div>

      {/* Sliding Tab Switcher */}
      <div className="responsive-tabs-row" style={{ display: 'flex', borderBottom: '1px solid var(--outline)', gap: '24px', overflowX: 'auto', paddingBottom: '1px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          style={{
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'list' ? '2px solid var(--lime-400)' : '2px solid transparent',
            color: activeTab === 'list' ? 'var(--lime-400)' : 'var(--on-surface-variant)',
            fontWeight: 700,
            fontFamily: 'var(--font-lexend)',
            cursor: 'pointer',
            fontSize: '1rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          My Products ({vendorProducts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          style={{
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'add' ? '2px solid var(--lime-400)' : '2px solid transparent',
            color: activeTab === 'add' ? 'var(--lime-400)' : 'var(--on-surface-variant)',
            fontWeight: 700,
            fontFamily: 'var(--font-lexend)',
            cursor: 'pointer',
            fontSize: '1rem',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}
        >
          Add Product
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {user && !user.isVerified && (
            <div style={{ padding: '16px', background: 'rgba(255,152,0,0.08)', border: '1px solid #ff9800', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#ff9800', fontSize: '28px' }}>warning</span>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#ff9800', fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>Informal / Unverified Seller Tier Limits</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Your store is currently unverified. You are capped at a maximum of <strong>5 product listings</strong>. Verify your identity/business to list unlimited products.</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Products', val: vendorProducts.length.toString(), color: '#00e5ff', icon: 'inventory_2' },
              { label: 'Total Stock Value', val: `GH₵${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'var(--lime-400)', icon: 'payments' },
              { label: 'Low Stock', val: lowStockCount.toString(), color: '#ff9800', icon: 'warning' },
              { label: 'Out of Stock', val: outOfStockCount.toString(), color: 'var(--error)', icon: 'block' },
            ].map(s => (
              <div key={s.label} style={{ flex: '1 1 150px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>{s.label}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: s.color }}>{s.icon}</span>
                </div>
                <div className="font-lexend" style={{ fontSize: '1.6rem', fontWeight: 600, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--on-surface-variant)', fontSize: '22px' }}>search</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products by name, category, or ID..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--on-surface)', fontSize: '0.95rem', fontFamily: 'inherit' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            )}
          </div>

          {/* Products Table */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="responsive-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Product</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Category</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Price</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Stock</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Rating</th>
                    <th style={{ padding: '14px 24px', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', marginBottom: '8px', display: 'block', opacity: 0.5 }}>inventory_2</span>
                      {searchQuery ? 'No products match your search.' : 'No products published yet.'}
                    </td></tr>
                  ) : filteredProducts.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: idx !== filteredProducts.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                      <td data-label="Product" style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <img src={p.image} alt={p.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div><span style={{ fontWeight: 500 }}>{p.name}</span><br /><span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>ID: {p.id}</span></div>
                        </div>
                      </td>
                      <td data-label="Category" style={{ padding: '16px 24px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{p.category}</span></td>
                      <td data-label="Price" style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--price-color)' }}>GH₵{p.price.toFixed(2)}</td>
                      <td data-label="Stock" style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button 
                            onClick={() => handleStockUpdate(p.id, (p.stock || 0) - 1)} 
                            style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}
                          >−</button>
                          <span style={{ 
                            fontWeight: 600, minWidth: '28px', textAlign: 'center', 
                            color: (p.stock || 0) === 0 ? 'var(--error)' : (p.stock || 0) <= 5 ? '#ff9800' : 'var(--on-surface)' 
                          }}>{p.stock || 0}</span>
                          <button 
                            onClick={() => handleStockUpdate(p.id, (p.stock || 0) + 1)} 
                            style={{ width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}
                          >+</button>
                        </div>
                      </td>
                      <td data-label="Rating" style={{ padding: '16px 24px', color: 'var(--on-surface)' }}>{p.rating} / 5</td>
                      <td data-label="Actions" style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEditModal(p)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)', color: '#00e5ff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                          <button onClick={() => setDeleteConfirm(p.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete">
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'add' && (
        <div className="animate-scale-in" style={{ padding: '24px', backgroundColor: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--outline)', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <h2 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined">add_box</span>
            Add New Product
          </h2>
          
          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Product Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} placeholder="e.g. Compression Shirt" />
              </div>
              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Price (GH₵)</label>
                <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} placeholder="0.00" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Stock</label>
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} placeholder="0" />
              </div>
              <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', width: '100%' }}>
                  {categories.filter(cat => cat !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Product Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', opacity: imageUploading ? 0.5 : 1 }} />
                {imageUploading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--lime-400)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                    Uploading...
                  </div>
                )}
                {image && !imageUploading && (
                  <div style={{ position: 'relative' }}>
                    <img src={image} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--outline)' }} />
                    {image.includes('cloudinary') && (
                      <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--lime-400)', color: '#000', fontSize: '7px', fontWeight: 900, padding: '1px 4px', borderRadius: '4px', fontFamily: 'var(--font-lexend)' }}>CDN</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Gallery Images <span style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>({additionalImages.length}/4 — optional)</span></label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {additionalImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img} alt={`Gallery ${i + 1}`} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--outline)' }} />
                    <button type="button" onClick={() => setAdditionalImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--error)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {additionalImages.length < 4 && (
                  <label style={{ width: 52, height: 52, borderRadius: 8, border: '1px dashed var(--outline)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: galleryUploading ? 'wait' : 'pointer', opacity: galleryUploading ? 0.5 : 1 }}>
                    {galleryUploading ? (
                      <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18, color: 'var(--lime-400)' }}>progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--on-surface-variant)' }}>add_photo_alternate</span>
                        <span style={{ fontSize: 7, color: 'var(--on-surface-variant)', fontWeight: 700 }}>ADD</span>
                      </>
                    )}
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={galleryUploading} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', resize: 'vertical' }} placeholder="Product description..." />
            </div>

            {/* Wholesale Pricing Tiers Row Builder */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--outline)', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)' }}>Wholesale Volume Discounts (Optional)</label>
                <button
                  type="button"
                  onClick={() => setWholesaleTiers([...wholesaleTiers, { minQuantity: 10, discountPercent: 10 }])}
                  style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: '#00e5ff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                  Add Bracket
                </button>
              </div>
              
              {wholesaleTiers.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>No bulk purchase discount tiers configured. Click "Add Bracket" to create custom B2B volume pricing.</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {wholesaleTiers.map((tier, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>Min Buy Qty:</span>
                        <input
                          type="number"
                          min="2"
                          required
                          value={tier.minQuantity}
                          onChange={(e) => {
                            const updated = [...wholesaleTiers];
                            updated[idx].minQuantity = Math.max(2, parseInt(e.target.value) || 2);
                            setWholesaleTiers(updated);
                          }}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>Discount Rate:</span>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          required
                          value={tier.discountPercent}
                          onChange={(e) => {
                            const updated = [...wholesaleTiers];
                            updated[idx].discountPercent = Math.min(90, Math.max(1, parseFloat(e.target.value) || 1));
                            setWholesaleTiers(updated);
                          }}
                          style={{ width: '70px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.85rem' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>% Off</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWholesaleTiers(wholesaleTiers.filter((_, i) => i !== idx))}
                        style={{ padding: '8px', borderRadius: '6px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="button" onClick={() => setActiveTab('list')} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#00e5ff', color: '#000', cursor: 'pointer', fontWeight: 600 }}>Publish Product</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeleteConfirm(null)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '90%', border: '1px solid var(--outline)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--error)', marginBottom: '12px' }}>warning</span>
              <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Delete Product?</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>This action cannot be undone. The product will be permanently removed.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => handleDeleteProduct(deleteConfirm)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'var(--error)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingProduct(null)}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ background: 'var(--surface)', borderRadius: '20px', padding: '32px', maxWidth: '500px', width: '90%', border: '1px solid var(--outline)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Edit Product</h3>
            <form onSubmit={handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Product Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Price (GH₵)</label>
                  <input type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Stock</label>
                  <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Category</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', width: '100%' }}>
                  {categories.filter(cat => cat !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Description</label>
                <textarea rows={3} value={editDescription} onChange={e => setEditDescription(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface)', outline: 'none', resize: 'vertical' }} />
              </div>

              {/* Edit Wholesale Pricing Tiers Row Builder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--outline)', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)' }}>Wholesale Volume Discounts (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setEditWholesaleTiers([...editWholesaleTiers, { minQuantity: 10, discountPercent: 10 }])}
                    style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: '#00e5ff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                    Add Bracket
                  </button>
                </div>
                
                {editWholesaleTiers.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>No bulk purchase discount tiers configured. Click "Add Bracket" to create custom B2B volume pricing.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {editWholesaleTiers.map((tier, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>Min Buy Qty:</span>
                          <input
                            type="number"
                            min="2"
                            required
                            value={tier.minQuantity}
                            onChange={(e) => {
                              const updated = [...editWholesaleTiers];
                              updated[idx].minQuantity = Math.max(2, parseInt(e.target.value) || 2);
                              setEditWholesaleTiers(updated);
                            }}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap' }}>Discount Rate:</span>
                          <input
                            type="number"
                            min="1"
                            max="90"
                            required
                            value={tier.discountPercent}
                            onChange={(e) => {
                              const updated = [...editWholesaleTiers];
                              updated[idx].discountPercent = Math.min(90, Math.max(1, parseFloat(e.target.value) || 1));
                              setEditWholesaleTiers(updated);
                            }}
                            style={{ width: '70px', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)', outline: 'none', fontSize: '0.85rem' }}
                          />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>% Off</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditWholesaleTiers(editWholesaleTiers.filter((_, i) => i !== idx))}
                          style={{ padding: '8px', borderRadius: '6px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingProduct(null)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#00e5ff', color: 'var(--on-lime-400)', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowBulkModal(false); setBulkFile([]); }}>
          <div onClick={e => e.stopPropagation()} className="animate-scale-in" style={{ background: 'var(--surface)', borderRadius: '24px', padding: '32px', maxWidth: '800px', width: '90%', border: '1px solid var(--outline)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="font-lexend" style={{ fontSize: '1.5rem' }}>Bulk Product Upload</h3>
              <button onClick={() => { setShowBulkModal(false); setBulkFile([]); }} style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {bulkFile.length === 0 ? (
              <div style={{ padding: '48px', border: '2px dashed var(--outline)', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#00e5ff', opacity: 0.5 }}>csv</span>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: '4px' }}>Upload CSV File</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)' }}>Format: Name, Category, Price, Stock, Description, ImageURL</p>
                </div>
                <input type="file" accept=".csv" onChange={handleBulkUpload} style={{ display: 'none' }} id="bulk-upload-input" />
                <label htmlFor="bulk-upload-input" style={{ padding: '12px 24px', borderRadius: '10px', background: '#00e5ff', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Select File</label>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontWeight: 600 }}>Preview: {bulkFile.length} items found</p>
                <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--outline)' }}>
                  <table className="responsive-table">
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-container-high)', zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Price</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkFile.map((p, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--outline-variant)' }}>
                          <td data-label="Name" style={{ padding: '12px' }}>{p.name}</td>
                          <td data-label="Category" style={{ padding: '12px' }}>{p.category}</td>
                          <td data-label="Price" style={{ padding: '12px' }}>GH₵{p.price}</td>
                          <td data-label="Stock" style={{ padding: '12px' }}>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setBulkFile([])} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface)', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
                  <button onClick={confirmBulkUpload} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 800, cursor: 'pointer' }}>Confirm & Upload All</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
