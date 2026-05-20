'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore, useAuth, useToast } from '@/context/AppContext';
import { useAdmin } from '@/context/AdminContext';
import { ProductLoadingSkeleton } from '@/components/ProductLoadingSkeleton';

export default function VendorStorePage() {
  const params = useParams();
  const vendorEmailParam = params?.vendorEmail;
  const decodedEmail = vendorEmailParam ? decodeURIComponent(vendorEmailParam as string) : '';
  const router = useRouter();
  const { allProducts, productsLoading, isFollowing, followVendor, unfollowVendor, getVendorSettings } = useStore();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { allAdmins } = useAdmin();

  const vendorProducts = useMemo(() => {
    return allProducts.filter(p => p.vendorEmail === decodedEmail);
  }, [allProducts, decodedEmail]);

  // Get vendor settings for contact info
  const vendorSettings = useMemo(() => getVendorSettings(decodedEmail), [decodedEmail, getVendorSettings]);
  
  // Get admin info for the vendor
  const vendorAdmin = useMemo(() => allAdmins.find(a => a.email === decodedEmail), [allAdmins, decodedEmail]);

  const vendorStoreName = vendorSettings.storeName 
    || vendorAdmin?.storeName
    || (vendorProducts.length > 0 && vendorProducts[0].vendorStoreName ? vendorProducts[0].vendorStoreName : '')
    || (decodedEmail ? decodedEmail.split('@')[0] : 'Store');

  const vendorContact = vendorSettings.storeContact || '';
  const vendorStoreEmail = vendorSettings.storeEmail || decodedEmail;

  const handleFollowVendor = () => {
    if (!user) {
      showToast('Please login to follow vendors', 'error');
      router.push('/login');
      return;
    }

    if (isFollowing(decodedEmail, user.email)) {
      unfollowVendor(decodedEmail, user.email);
      showToast(`Unfollowed ${vendorStoreName}`);
    } else {
      followVendor(decodedEmail, user.email, user.name);
      showToast(`Now following ${vendorStoreName}!`);
    }
  };

  if (productsLoading) {
    return <ProductLoadingSkeleton />;
  }

  if (!decodedEmail || vendorProducts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 80, alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'var(--font-inter)', marginBottom: 24 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span> Back
        </button>
        <div style={{ textAlign: 'center', color: '#fff' }}>Store not found or has no products.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Back button */}
      <div className="animate-fade-in" style={{ padding: '8px 16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontFamily: 'var(--font-inter)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span> Back
        </button>
      </div>

      {/* Store Header Hero */}
      <section className="animate-fade-in" style={{ 
        padding: '60px 24px 40px', 
        background: 'linear-gradient(180deg, var(--surface-container-high) 0%, var(--background) 100%)',
        borderBottom: '1px solid var(--outline)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20
      }}>
        <div style={{ 
          width: 90, height: 90, borderRadius: '28px', 
          background: 'var(--lime-400)', color: '#000', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 900,
          boxShadow: '0 12px 40px rgba(195,244,0,0.2)'
        }}>
          {vendorStoreName[0].toUpperCase()}
        </div>
        
        <div>
          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 32, fontWeight: 900, color: 'var(--foreground)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '-0.02em' }}>{vendorStoreName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(195,244,0,0.1)', padding: '4px 10px', borderRadius: 20 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--lime-400)', letterSpacing: '0.05em' }}>VERIFIED</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>{vendorProducts.length} PRODUCTS</span>
          </div>
        </div>

        <button 
          onClick={handleFollowVendor}
          style={{ 
            marginTop: 8, padding: '12px 40px', borderRadius: 14, 
            background: (user && isFollowing(decodedEmail, user.email)) ? 'transparent' : 'var(--foreground)',
            border: (user && isFollowing(decodedEmail, user.email)) ? '1px solid var(--outline)' : 'none',
            color: (user && isFollowing(decodedEmail, user.email)) ? 'var(--foreground)' : 'var(--background)',
            fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14, cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex', alignItems: 'center', gap: 10
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {(user && isFollowing(decodedEmail, user.email)) ? 'person_remove' : 'person_add'}
          </span>
          {(user && isFollowing(decodedEmail, user.email)) ? 'FOLLOWING' : 'FOLLOW STORE'}
        </button>
      </section>

      {/* Store Products */}
      <section className="animate-fade-in-up stagger-1" style={{ padding: '24px 16px' }}>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>All Products ({vendorProducts.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {vendorProducts.map(p => (
            <Link key={p.id} href={`/product/${p.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ background: 'var(--surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ aspectRatio: '1/1', background: '#111', position: 'relative' }}>
                  <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={p.name} src={p.image} />
                </div>
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontSize: '10px', color: 'var(--lime-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.category}</span>
                  <h3 className="line-clamp-1" style={{ fontFamily: 'var(--font-lexend)', fontSize: '13px', color: 'var(--foreground)', fontWeight: 600, margin: '4px 0' }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: '14px', fontWeight: 800, color: 'var(--foreground)' }}>${p.price.toFixed(2)}</span>
                    {p.originalPrice && <span style={{ fontSize: '11px', color: '#666', textDecoration: 'line-through' }}>${p.originalPrice.toFixed(2)}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
