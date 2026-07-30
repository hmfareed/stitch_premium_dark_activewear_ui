'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface ConsignmentItem {
  _id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  minReorderLevel: number;
  lastRestockedAt: string;
}

export default function VendorConsignmentPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState<ConsignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConsignmentStock = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/consignment?vendorEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      showToast('Error loading consignment stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignmentStock();
  }, [user?.email]);

  const handleCreateRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !productName || quantityToAdd <= 0) {
      showToast('Please fill out product info and quantity', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/consignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'store_default',
          vendorEmail: user?.email,
          productId,
          productName,
          quantityToAdd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully logged restock for ${productName}!`, 'success');
        setShowRestockModal(false);
        setProductId('');
        setProductName('');
        fetchConsignmentStock();
      } else {
        showToast(data.error || 'Failed to submit restock', 'error');
      }
    } catch (err) {
      showToast('Error submitting restock request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--font-inter)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href="/vendor" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Vendor Dashboard</Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>Pre-Stocked Hub Consignment Inventory</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem' }}>Warehouse inventory pre-stored at Tamale Central Fulfillment Hub</p>
        </div>

        <button
          onClick={() => setShowRestockModal(true)}
          style={{
            padding: '12px 20px',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_box</span> Schedule Hub Drop-off / Restock
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>Loading consignment ledger...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--surface-container)', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--on-surface-variant)', marginBottom: '12px' }}>inventory_2</span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Consignment Stock at Hub</h3>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', marginTop: '4px', maxWidth: '480px', margin: '8px auto 20px' }}>
            Store inventory pre-stocked at the Tamale Hub allows instant fulfillment without waiting for on-demand drop-offs.
          </p>
          <button
            onClick={() => setShowRestockModal(true)}
            style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            Create First Restock Drop-off
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {items.map(item => {
            const isLowStock = item.quantity <= item.minReorderLevel;
            return (
              <div key={item._id} style={{ padding: '20px', backgroundColor: 'var(--surface-container)', borderRadius: '14px', border: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{item.productName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>SKU / Product ID: {item.productId} | Warehouse: {item.warehouseId}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Last Restocked: {new Date(item.lastRestockedAt).toLocaleDateString()}</div>
                </div>

                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Hub Stock</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: isLowStock ? 'var(--error)' : 'var(--lime-400)' }}>
                      {item.quantity} units
                    </div>
                  </div>

                  {isLowStock && (
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' }}>
                      Low Stock Alert
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Restock Request Modal */}
      {showRestockModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <form onSubmit={handleCreateRestock} style={{ backgroundColor: 'var(--surface-container-high)', borderRadius: '16px', padding: '24px', maxWidth: '460px', width: '100%', border: '1px solid var(--outline-variant)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Schedule Hub Drop-off</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: '20px' }}>
              Specify the SKU and quantity you will physically deliver to Tamale Central Warehouse.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Product ID / SKU</label>
              <input
                type="text"
                required
                placeholder="e.g. PROD-101"
                value={productId}
                onChange={e => setProductId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Product Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Handmade Kente Fabric"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Quantity to Restock</label>
              <input
                type="number"
                min={1}
                required
                value={quantityToAdd}
                onChange={e => setQuantityToAdd(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowRestockModal(false)}
                style={{ padding: '10px 18px', backgroundColor: 'transparent', color: 'var(--on-surface-variant)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                {isSubmitting ? 'Submitting...' : 'Log Hub Restock'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
