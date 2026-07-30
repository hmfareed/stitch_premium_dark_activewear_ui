'use client';

import React, { useState, useEffect } from 'react';

interface StoreOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}

interface StoreSwitcherProps {
  currentStoreId?: string;
  vendorEmail?: string;
  onSelectStore?: (store: StoreOption) => void;
}

export default function StoreSwitcher({
  currentStoreId,
  vendorEmail,
  onSelectStore,
}: StoreSwitcherProps) {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!vendorEmail) return;
    fetch(`/api/stores?vendorEmail=${encodeURIComponent(vendorEmail)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.stores) {
          const list: StoreOption[] = d.stores.map((s: any) => ({
            id: s._id,
            name: s.name,
            slug: s.slug,
            category: s.category,
          }));
          setStores(list);
          if (list.length > 0) {
            const initial = list.find(s => s.id === currentStoreId) || list[0];
            setSelectedStore(initial);
          }
        }
      })
      .catch(() => {});
  }, [vendorEmail, currentStoreId]);

  if (stores.length <= 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--on-surface)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>storefront</span>
        <span>{selectedStore?.name || 'My Store'}</span>
      </div>
    );
  }

  const handleSelect = (store: StoreOption) => {
    setSelectedStore(store);
    setIsOpen(false);
    if (onSelectStore) {
      onSelectStore(store);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '10px',
          backgroundColor: 'var(--surface-container-high)',
          border: '1px solid var(--outline-variant)',
          color: 'var(--on-surface)',
          fontWeight: 700,
          fontSize: '0.88rem',
          cursor: 'pointer',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>storefront</span>
        <span>{selectedStore?.name || 'Switch Store'}</span>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '6px', backgroundColor: 'var(--surface-container-high)', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '220px', zIndex: 50, padding: '6px' }}>
          <div style={{ padding: '8px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
            Managed Stores ({stores.length})
          </div>
          {stores.map(store => {
            const isSelected = store.id === selectedStore?.id;
            return (
              <button
                key={store.id}
                onClick={() => handleSelect(store)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--on-surface)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{store.name}</span>
                {isSelected && <span style={{ fontSize: '0.8rem' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
