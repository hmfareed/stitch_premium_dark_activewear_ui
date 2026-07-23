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
  lat?: number;
  lng?: number;
  gpsLocation?: string;
  mapsUrl?: string;
}

export default function AddressesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<{
    name: string;
    street: string;
    city: string;
    lat?: number;
    lng?: number;
    gpsLocation?: string;
    mapsUrl?: string;
  }>({ name: '', street: '', city: '' });
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    const saved = localStorage.getItem(`africart-addresses-${user.email}`);
    if (saved) {
      try { setAddresses(JSON.parse(saved)); } catch {}
    }
    fetch(`/api/addresses?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
          const apiAddrs: Address[] = data.addresses.map((a: any) => ({
            id: a._id || a.id || Date.now().toString(),
            name: a.label || a.name || 'Saved Address',
            street: a.address || a.street || '',
            city: a.city || 'Accra',
            isDefault: Boolean(a.isDefault),
            lat: a.lat,
            lng: a.lng,
            gpsLocation: a.gpsLocation,
            mapsUrl: a.mapsUrl,
          }));
          setAddresses(apiAddrs);
          localStorage.setItem(`africart-addresses-${user.email}`, JSON.stringify(apiAddrs));
        }
      })
      .catch(() => {});
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    let updated: Address[];
    let savedAddrObj: any;

    if (editingId) {
      updated = addresses.map(a => a.id === editingId ? { ...a, ...addressForm } : a);
      savedAddrObj = {
        _id: editingId,
        label: addressForm.name,
        address: addressForm.street,
        city: addressForm.city,
        lat: addressForm.lat,
        lng: addressForm.lng,
        gpsLocation: addressForm.gpsLocation,
        mapsUrl: addressForm.mapsUrl,
      };
      showToast('Address updated successfully');
    } else {
      const addr: Address = {
        ...addressForm,
        id: Date.now().toString(),
        isDefault: addresses.length === 0,
      };
      updated = [...addresses, addr];
      savedAddrObj = {
        label: addressForm.name,
        address: addressForm.street,
        city: addressForm.city,
        isDefault: addr.isDefault,
        lat: addressForm.lat,
        lng: addressForm.lng,
        gpsLocation: addressForm.gpsLocation,
        mapsUrl: addressForm.mapsUrl,
      };
      showToast('Address added successfully');
    }
    
    setAddresses(updated);
    localStorage.setItem(`africart-addresses-${user.email}`, JSON.stringify(updated));
    closeForm();

    try {
      await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, address: savedAddrObj }),
      });
    } catch {}
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setAddressForm({ name: '', street: '', city: '' });
  };

  const openEdit = (addr: Address) => {
    setAddressForm({
      name: addr.name,
      street: addr.street,
      city: addr.city,
      lat: addr.lat,
      lng: addr.lng,
      gpsLocation: addr.gpsLocation,
      mapsUrl: addr.mapsUrl,
    });
    setEditingId(addr.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem(`africart-addresses-${user.email}`, JSON.stringify(updated));
    showToast('Address removed', 'info');
    try {
      await fetch('/api/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, addressId: id }),
      });
    } catch {}
  };

  const setAsDefault = async (id: string) => {
    if (!user) return;
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    localStorage.setItem(`africart-addresses-${user.email}`, JSON.stringify(updated));
    showToast('Default address updated');
    const target = addresses.find(a => a.id === id);
    if (target) {
      try {
        await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            address: {
              _id: target.id,
              label: target.name,
              address: target.street,
              city: target.city,
              isDefault: true,
              lat: target.lat,
              lng: target.lng,
              gpsLocation: target.gpsLocation,
              mapsUrl: target.mapsUrl,
            }
          }),
        });
      } catch {}
    }
  };

  // Real Browser Geolocation Handler
  const autofillGPS = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLoadingGPS(true);
    showToast('Requesting real GPS location...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const gpsLocation = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        let fetchedStreet = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        let fetchedCity = 'Accra';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const streetName = addr.road || addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.subdivision || '';
            const cityName = addr.city || addr.town || addr.village || addr.county || addr.state || 'Accra';

            if (streetName) {
              fetchedStreet = `${streetName} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            } else if (data.display_name) {
              fetchedStreet = data.display_name.split(',').slice(0, 2).join(', ');
            }
            if (cityName) {
              fetchedCity = cityName;
            }
          }
        } catch {
          // Geocoding fallback to coords string
        }

        setAddressForm(prev => ({
          ...prev,
          street: fetchedStreet,
          city: fetchedCity,
          lat: latitude,
          lng: longitude,
          gpsLocation,
          mapsUrl,
        }));
        setIsLoadingGPS(false);
        showToast('Real GPS Location captured!');
      },
      (err) => {
        setIsLoadingGPS(false);
        if (err.code === err.PERMISSION_DENIED) {
          showToast('Location permission denied. Please allow location access in your browser settings.', 'error');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          showToast('GPS position unavailable. Try again outside or check device settings.', 'error');
        } else if (err.code === err.TIMEOUT) {
          showToast('GPS location request timed out. Please try again.', 'error');
        } else {
          showToast('Could not fetch GPS location. Enter details manually.', 'error');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  if (!user) return null;

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: 'var(--foreground)' }}>Addresses</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {!isAdding ? (
          <>
            {addresses.map((addr, i) => (
              <div key={addr.id} className={`animate-fade-in-up stagger-${i + 1}`} style={{
                background: 'var(--surface)', border: addr.isDefault ? '1px solid var(--lime-400)' : '1px solid var(--outline)', 
                borderRadius: 12, padding: 16, position: 'relative'
              }}>
                {addr.isDefault && (
                  <span style={{
                    position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 800,
                    background: 'var(--lime-400)', color: 'var(--on-lime-400)', padding: '4px 8px', borderRadius: 4, textTransform: 'uppercase'
                  }}>Default</span>
                )}
                <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, color: 'var(--foreground)', marginBottom: 4 }}>{addr.name}</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 4 }}>{addr.street}</p>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginBottom: 8 }}>{addr.city}</p>

                {addr.mapsUrl && (
                  <a
                    href={addr.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: 'var(--lime-400)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginBottom: 12 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>map</span>
                    View GPS Coordinates ({addr.gpsLocation || `${addr.lat?.toFixed(4)}, ${addr.lng?.toFixed(4)}`})
                  </a>
                )}
                
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  {!addr.isDefault && (
                    <button onClick={() => setAsDefault(addr.id)} style={{
                      background: 'none', border: '1px solid var(--outline)', color: 'var(--foreground)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer'
                    }}>Set Default</button>
                  )}
                  <button onClick={() => openEdit(addr)} style={{
                    background: 'none', border: 'none', color: 'var(--foreground)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span> Edit</button>
                  <button onClick={() => handleDelete(addr.id)} style={{
                    background: 'none', border: 'none', color: '#ff4444', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> Remove</button>
                </div>
              </div>
            ))}
            <button onClick={() => setIsAdding(true)} className="animate-fade-in-up" style={{
              width: '100%', padding: '16px', marginTop: 16, border: '1px dashed var(--outline)', background: 'transparent',
              color: 'var(--lime-400)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
              fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase'
            }}>
              <span className="material-symbols-outlined">add</span> Add New Address
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="animate-fade-in-up" style={{ background: 'var(--surface)', padding: 16, borderRadius: 12, border: '1px solid var(--outline)', marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-lexend)', color: 'var(--foreground)' }}>{editingId ? 'Edit Address' : 'New Address'}</h3>
              <button type="button" onClick={autofillGPS} disabled={isLoadingGPS} style={{
                background: 'rgba(195,244,0,0.15)', color: 'var(--lime-400)', border: '1px solid var(--lime-400)', padding: '6px 12px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, cursor: isLoadingGPS ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>my_location</span>
                {isLoadingGPS ? 'Locating...' : 'Use Real GPS'}
              </button>
            </div>

            {addressForm.gpsLocation && (
              <div style={{ padding: '8px 12px', background: 'rgba(195,244,0,0.08)', borderRadius: 8, border: '1px solid var(--lime-400)', fontSize: 11, color: 'var(--lime-400)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>📍 GPS Captured: {addressForm.gpsLocation}</span>
                <a href={addressForm.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline', fontSize: 10 }}>Test Map</a>
              </div>
            )}
            
            <input required placeholder="Name (e.g. Home, Work)" value={addressForm.name} onChange={e => setAddressForm({...addressForm, name: e.target.value})} style={{ width: '100%', padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', marginBottom: 12 }} />
            <input required placeholder="Street Address" value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} style={{ width: '100%', padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', marginBottom: 12 }} />
            <input required placeholder="City" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} style={{ width: '100%', padding: 12, background: 'var(--surface-container)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', marginBottom: 16 }} />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={closeForm} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid var(--outline)', color: 'var(--on-surface-variant)', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: 12, background: 'var(--lime-400)', border: 'none', color: 'var(--on-lime-400)', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
