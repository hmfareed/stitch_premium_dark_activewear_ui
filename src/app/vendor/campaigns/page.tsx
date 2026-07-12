'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useStore, useToast } from '@/context/AppContext';

interface Campaign {
  id: string;
  name: string;
  description: string;
  discountValue: number;
  bannerGradient: string;
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
}

export default function VendorCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  const { allProducts, updateProduct } = useStore();
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch {
      showToast('Failed to load platform campaigns.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  if (!user) return null;

  // Filter vendor's own products
  const vendorProducts = allProducts.filter(p => p.vendorEmail === user.email);

  const toggleParticipation = async (productId: string, campaignId: string | null) => {
    try {
      await updateProduct(productId, { campaignId });
      showToast(campaignId ? 'Product added to campaign!' : 'Product removed from campaign.', 'success');
    } catch {
      showToast('Error modifying campaign participation.', 'error');
    }
  };

  const getStatusLabel = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return <span style={{ color: 'var(--lime-400)', fontWeight: 600 }}>● LIVE EVENT</span>;
      case 'upcoming':
        return <span style={{ color: '#00e5ff', fontWeight: 600 }}>● UPCOMING</span>;
      case 'completed':
        return <span style={{ color: 'var(--on-surface-variant)' }}>● ARCHIVED</span>;
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Back button when in studio */}
      {selectedCampaign && (
        <button
          onClick={() => setSelectedCampaign(null)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: '#00e5ff', cursor: 'pointer', fontWeight: 600, padding: 0 }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Campaigns
        </button>
      )}

      {/* Header */}
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>
          {selectedCampaign ? `Campaign Opt-In Studio` : 'Platform Campaigns'}
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>
          {selectedCampaign
            ? `Select which of your activewear items should participate in the "${selectedCampaign.name}" blowout sale.`
            : 'Opt-in your products to platform-wide flash sales and holiday discounts to maximize your storefront sales.'
          }
        </p>
      </div>

      {!selectedCampaign ? (
        /* Campaign grid list view */
        loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <div className="animate-spin-glow" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--outline)', borderTopColor: '#00e5ff' }} />
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '16px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>campaign</span>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', margin: 0 }}>There are currently no active platform campaigns scheduled by Administrators.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {campaigns.map(c => {
              const count = vendorProducts.filter(p => p.campaignId === c.id).length;
              return (
                <div key={c.id} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Banner */}
                  <div style={{ background: c.bannerGradient, padding: '24px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>AfriCart Promo</span>
                    <h3 className="font-lexend" style={{ fontSize: '1.3rem', margin: 0, fontWeight: 800 }}>{c.name}</h3>
                    <div style={{ marginTop: '8px', fontSize: '1.5rem', fontWeight: 900 }}>{c.discountValue}% FLAT DISCOUNT</div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: 1.5 }}>{c.description}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--on-surface-variant)', borderTop: '1px solid var(--outline)', paddingTop: '16px' }}>
                      <span>Timeline:</span>
                      <span style={{ fontWeight: 500 }}>{c.startDate} to {c.endDate}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                      <span>Status:</span>
                      {getStatusLabel(c.status)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                      <span>My Participating Products:</span>
                      <span style={{ fontWeight: 700, color: '#00e5ff' }}>{count} items</span>
                    </div>

                    {c.status !== 'completed' && (
                      <button
                        onClick={() => setSelectedCampaign(c)}
                        style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: '#00e5ff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
                        Opt-In Studio
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Campaign Opt-In Studio Product List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Campaign Header */}
          <div style={{ background: selectedCampaign.bannerGradient, padding: '32px', borderRadius: '16px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>Opt-In Management Studio</span>
              <h2 className="font-lexend" style={{ fontSize: '1.75rem', margin: '4px 0 8px', fontWeight: 800 }}>{selectedCampaign.name}</h2>
              <p style={{ margin: 0, opacity: 0.9, maxWidth: '500px', fontSize: '0.92rem' }}>{selectedCampaign.description}</p>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.9, display: 'block', fontWeight: 700 }}>Campaign Discount</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>{selectedCampaign.discountValue}% OFF</span>
            </div>
          </div>

          {/* Product selection grid */}
          <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--outline)' }}>
              <h3 className="font-lexend" style={{ margin: 0, fontSize: '1.2rem' }}>Participating Activewear Catalog</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>Select which activewear listings qualify for the flat {selectedCampaign.discountValue}% campaign discount</p>
            </div>

            {vendorProducts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'var(--on-surface-variant)', margin: 0 }}>You don't have any products uploaded to your store yet.</p>
              </div>
            ) : (
              <div className="responsive-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
                      <th style={{ padding: '16px 24px' }}>Product</th>
                      <th style={{ padding: '16px 24px' }}>Category</th>
                      <th style={{ padding: '16px 24px' }}>Original Price</th>
                      <th style={{ padding: '16px 24px' }}>Campaign Price</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right' }}>Opt-In Participation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorProducts.map(p => {
                      const isParticipating = p.campaignId === selectedCampaign.id;
                      const discountedPrice = (p.price * (1 - selectedCampaign.discountValue / 100)).toFixed(2);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--outline)' }}>
                          <td style={{ padding: '16px 24px' }} data-label="Product">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                              <span style={{ fontWeight: 600 }}>{p.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }} data-label="Category">
                            {p.category}
                          </td>
                          <td style={{ padding: '16px 24px' }} data-label="Original">
                            GH₵ {p.price.toFixed(2)}
                          </td>
                          <td style={{ padding: '16px 24px', color: 'var(--lime-400)', fontWeight: 600 }} data-label="Campaign Price">
                            GH₵ {discountedPrice}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }} data-label="Opt-In">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '0.8rem', color: isParticipating ? 'var(--lime-400)' : 'var(--on-surface-variant)', fontWeight: 500 }}>
                                {isParticipating ? 'Participating' : 'Inactive'}
                              </span>
                              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                <input
                                  type="checkbox"
                                  checked={isParticipating}
                                  onChange={() => toggleParticipation(p.id, isParticipating ? null : selectedCampaign.id)}
                                  style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                  position: 'absolute', cursor: 'pointer', inset: 0, borderRadius: '24px',
                                  backgroundColor: isParticipating ? 'var(--lime-400)' : 'var(--surface-container-high)',
                                  border: isParticipating ? 'none' : '1px solid var(--outline)',
                                  transition: 'all 0.2s'
                                }}>
                                  <span style={{
                                    position: 'absolute', content: '""', height: '16px', width: '16px', left: isParticipating ? '28px' : '4px', bottom: '3px',
                                    backgroundColor: isParticipating ? 'var(--surface)' : 'var(--on-surface-variant)',
                                    borderRadius: '50%', transition: 'all 0.2s'
                                  }} />
                                </span>
                              </label>
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
        </div>
      )}
    </div>
  );
}
