'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({ name: '', street: '', city: '' });
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const saved = localStorage.getItem(`reed-addresses-${user.email}`);
    if (saved) {
      setAddresses(JSON.parse(saved));
    } else {
      setAddresses([]);
      localStorage.setItem(`reed-addresses-${user.email}`, JSON.stringify([]));
    }
  }, [user, router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    let updated;
    if (editingId) {
      updated = addresses.map(a => a.id === editingId ? { ...a, ...addressForm } : a);
      showToast('Address updated successfully');
    } else {
      const addr = {
        ...addressForm,
        id: Date.now().toString(),
        isDefault: addresses.length === 0,
      };
      updated = [...addresses, addr];
      showToast('Address added successfully');
    }
    
    setAddresses(updated);
    localStorage.setItem(`reed-addresses-${user.email}`, JSON.stringify(updated));
    closeForm();
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setAddressForm({ name: '', street: '', city: '' });
  };

  const openEdit = (addr: Address) => {
    setAddressForm({ name: addr.name, street: addr.street, city: addr.city });
    setEditingId(addr.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem(`reed-addresses-${user.email}`, JSON.stringify(updated));
    showToast('Address removed', 'info');
  };

  const setAsDefault = (id: string) => {
    if (!user) return;
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    localStorage.setItem(`reed-addresses-${user.email}`, JSON.stringify(updated));
    showToast('Default address updated');
  };

  const autofillGPS = () => {
    setIsLoadingGPS(true);
    // Simulate GPS loading
    setTimeout(() => {
      setAddressForm({ ...addressForm, street: '742 Evergreen Terrace', city: 'Springfield' });
      setIsLoadingGPS(false);
      showToast('Location fetched via GPS');
    }, 1200);
  };

  if (!user) return null;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: '#fff' }}>Addresses</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {!isAdding ? (
          <>
            {addresses.map((addr, i) => (
              <div key={addr.id} className={`animate-fade-in-up stagger-${i + 1}`} style={{
                background: '#111', border: addr.isDefault ? '1px solid var(--lime-400)' : '1px solid #1a1a1a', 
                borderRadius: 12, padding: 16, position: 'relative'
              }}>
                {addr.isDefault && (
                  <span style={{
                    position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 800,
                    background: 'var(--lime-400)', color: '#000', padding: '4px 8px', borderRadius: 4, textTransform: 'uppercase'
                  }}>Default</span>
                )}
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: '#fff', marginBottom: 4 }}>{addr.name}</h3>
                <p style={{ color: '#888', fontSize: 14, marginBottom: 4 }}>{addr.street}</p>
                <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>{addr.city}</p>
                
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {!addr.isDefault && (
                    <button onClick={() => setAsDefault(addr.id)} style={{
                      background: 'none', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
                    }}>Set Default</button>
                  )}
                  <button onClick={() => openEdit(addr)} style={{
                    background: 'none', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span> Edit</button>
                  <button onClick={() => handleDelete(addr.id)} style={{
                    background: 'none', border: 'none', color: '#ff4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> Remove</button>
                </div>
              </div>
            ))}
            <button onClick={() => setIsAdding(true)} className="animate-fade-in-up" style={{
              width: '100%', padding: '16px', marginTop: 16, border: '1px dashed #333', background: 'transparent',
              color: 'var(--lime-400)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
              fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase'
            }}>
              <span className="material-symbols-outlined">add</span> Add New Address
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="animate-fade-in-up" style={{ background: '#111', padding: 16, borderRadius: 12, border: '1px solid #1a1a1a', marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-lexend)', color: '#fff' }}>{editingId ? 'Edit Address' : 'New Address'}</h3>
              <button type="button" onClick={autofillGPS} disabled={isLoadingGPS} style={{
                background: 'rgba(195,244,0,0.1)', color: 'var(--lime-400)', border: 'none', padding: '6px 12px', borderRadius: 6,
                fontSize: 11, fontWeight: 700, cursor: isLoadingGPS ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>my_location</span>
                {isLoadingGPS ? 'Locating...' : 'Use GPS'}
              </button>
            </div>
            
            <input required placeholder="Name (e.g. Work, Home)" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', marginBottom: 12 }} />
            <input required placeholder="Street Address" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', marginBottom: 12 }} />
            <input required placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} style={{ width: '100%', padding: 12, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', marginBottom: 16 }} />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={closeForm} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: 12, background: 'var(--lime-400)', border: 'none', color: '#000', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
