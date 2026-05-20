'use client';

import React, { useState } from 'react';
import { useStore, useAuth, useToast } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { categories } from '@/data/products';

export default function VendorProductsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
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

  const confirmBulkUpload = () => {
    bulkFile.forEach(p => {
      addProduct({
        ...p,
        subCategory: 'Bulk Upload',
        rating: 0,
        vendorEmail: user?.email || '',
        vendorStoreName: storeName,
      });
    });
    setBulkFile([]);
    setShowBulkModal(false);
    showToast(`${bulkFile.length} products added successfully!`);
  };

  // New product state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<any>('Fashion');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [stock, setStock] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('');

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
    });

    setName('');
    setPrice('');
    setDescription('');
    setImage('');
    setAdditionalImages([]);
    setStock('');
    setShowAddModal(false);
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
    });
    setEditingProduct(null);
    showToast('Product updated successfully!');
  };

  const handleStockUpdate = (productId: string, newStock: number) => {
    updateProduct(productId, { stock: Math.max(0, newStock) });
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>My Products</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Manage your store's product catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowBulkModal(true)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
            Bulk Upload
          </button>
          <button onClick={() => setShowAddModal(!showAddModal)} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#00e5ff', color: 'var(--on-lime-400)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{showAddModal ? 'close' : 'add'}</span>
            {showAddModal ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
          onClick={() => setShowAddModal(false)}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="animate-scale-in" 
            style={{ background: 'var(--surface)', borderRadius: '24px', padding: '32px', maxWidth: '600px', width: '90%', border: '1px solid var(--outline)', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="font-lexend" style={{ fontSize: '1.4rem', margin: 0, color: 'var(--foreground)' }}>Add New Product</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                style={{ background: 'var(--surface-container-high)', border: 'none', cursor: 'pointer', color: 'var(--on-surface)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#00e5ff', color: '#000', cursor: 'pointer', fontWeight: 600 }}>Publish Product</button>
              </div>
            </form>
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
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
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
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={p.image} alt={p.name} style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div><span style={{ fontWeight: 500 }}>{p.name}</span><br /><span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>ID: {p.id}</span></div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}><span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline-variant)' }}>{p.category}</span></td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--price-color)' }}>GH₵{p.price.toFixed(2)}</td>
                  <td style={{ padding: '16px 24px' }}>
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
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface)' }}>{p.rating} / 5</td>
                  <td style={{ padding: '16px 24px' }}>
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
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
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
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
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
                          <td style={{ padding: '12px' }}>{p.name}</td>
                          <td style={{ padding: '12px' }}>{p.category}</td>
                          <td style={{ padding: '12px' }}>GH₵{p.price}</td>
                          <td style={{ padding: '12px' }}>{p.stock}</td>
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
