'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/context/AppContext';

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

const PRESET_GRADIENTS = [
  { name: 'Sunset Fusion', css: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' },
  { name: 'Neon Cyberpunk', css: 'linear-gradient(135deg, #f107a3 0%, #7b2ff7 100%)' },
  { name: 'Teal Surge', css: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Oceanic Wave', css: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
  { name: 'Solar Lime', css: 'linear-gradient(135deg, var(--lime-400) 0%, #f9d423 100%)' },
];

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('15');
  const [bannerGradient, setBannerGradient] = useState(PRESET_GRADIENTS[0].css);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      showToast('Error loading campaigns from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !discountValue || !startDate || !endDate) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          discountValue: parseFloat(discountValue),
          bannerGradient,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Platform campaign created successfully!', 'success');
        setName('');
        setDescription('');
        setDiscountValue('15');
        setStartDate('');
        setEndDate('');
        setShowAddModal(false);
        fetchCampaigns();
      } else {
        showToast(data.error || 'Failed to create campaign.', 'error');
      }
    } catch (err) {
      showToast('Connection error occurred while saving campaign.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'upcoming' | 'active' | 'completed') => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Campaign status updated to ${newStatus}!`, 'success');
        fetchCampaigns();
      }
    } catch {
      showToast('Failed to update status on server.', 'error');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? All participating products will be detached.')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Campaign deleted.', 'success');
        fetchCampaigns();
      }
    } catch {
      showToast('Failed to delete campaign.', 'error');
    }
  };

  const getStatusStyle = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return { backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)', border: '1px solid var(--lime-400)' };
      case 'upcoming':
        return { backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)', color: '#00e5ff', border: '1px solid #00e5ff' };
      case 'completed':
        return { backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: '1px solid var(--outline)' };
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: '8px' }}>Platform Campaigns</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Coordinated platform-wide discount events for activewear sales campaigns</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'var(--on-lime-400)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Create Campaign
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', padding: '24px', borderRadius: '16px' }}>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>Total Campaigns</span>
          <h3 className="font-lexend" style={{ fontSize: '2rem', margin: '8px 0 0' }}>{campaigns.length}</h3>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', padding: '24px', borderRadius: '16px' }}>
          <span style={{ color: 'var(--lime-400)', fontSize: '0.9rem' }}>Active Live Deals</span>
          <h3 className="font-lexend" style={{ fontSize: '2rem', margin: '8px 0 0', color: 'var(--lime-400)' }}>{campaigns.filter(c => c.status === 'active').length}</h3>
        </div>
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', padding: '24px', borderRadius: '16px' }}>
          <span style={{ color: '#00e5ff', fontSize: '0.9rem' }}>Upcoming Releases</span>
          <h3 className="font-lexend" style={{ fontSize: '2rem', margin: '8px 0 0', color: '#00e5ff' }}>{campaigns.filter(c => c.status === 'upcoming').length}</h3>
        </div>
      </div>

      {/* Campaigns list */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="font-lexend" style={{ margin: 0, fontSize: '1.2rem' }}>All Coordinated Sales Events</h3>
        </div>

        {loading ? (
          <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
            <div className="animate-spin-glow" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--outline)', borderTopColor: 'var(--lime-400)' }} />
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>campaign</span>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', margin: 0 }}>No campaigns have been configured yet.</p>
            <button onClick={() => setShowAddModal(true)} style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--lime-400)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Create your first campaign</button>
          </div>
        ) : (
          <div className="responsive-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', color: 'var(--on-surface-variant)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '16px 24px' }}>Campaign Event</th>
                  <th style={{ padding: '16px 24px' }}>Offer Rate</th>
                  <th style={{ padding: '16px 24px' }}>Dates</th>
                  <th style={{ padding: '16px 24px' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--outline)' }}>
                    <td style={{ padding: '20px 24px' }} data-label="Campaign">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '56px', height: '36px', borderRadius: '8px', background: c.bannerGradient, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontWeight: 600, display: 'block', fontSize: '1.05rem' }}>{c.name}</span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)' }}>{c.description}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', fontWeight: 600, color: 'var(--lime-400)' }} data-label="Offer Rate">
                      {c.discountValue}% Off
                    </td>
                    <td style={{ padding: '20px 24px', fontSize: '0.88rem' }} data-label="Dates">
                      <div>Start: {c.startDate}</div>
                      <div style={{ color: 'var(--on-surface-variant)' }}>End: {c.endDate}</div>
                    </td>
                    <td style={{ padding: '20px 24px' }} data-label="Status">
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, ...getStatusStyle(c.status) }}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }} data-label="Actions">
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {c.status !== 'active' && (
                          <button onClick={() => handleUpdateStatus(c.id, 'active')} style={{ background: 'none', border: '1px solid var(--lime-400)', color: 'var(--lime-400)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            Activate
                          </button>
                        )}
                        {c.status !== 'completed' && (
                          <button onClick={() => handleUpdateStatus(c.id, 'completed')} style={{ background: 'none', border: '1px solid var(--outline)', color: 'var(--on-surface-variant)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                            Complete
                          </button>
                        )}
                        <button onClick={() => handleDeleteCampaign(c.id)} style={{ padding: '6px', borderRadius: '6px', background: 'color-mix(in srgb, var(--error) 12%, transparent)', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Campaign Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="animate-scale-up" style={{ backgroundColor: 'var(--surface-container-high)', border: '1px solid var(--outline)', width: '100%', maxWidth: '520px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--outline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-lexend" style={{ margin: 0, fontSize: '1.25rem' }}>Create Coordinated Campaign</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Fit Blast"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Short Description</label>
                <textarea
                  placeholder="Describe the campaign theme..."
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Flat Discount (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface-variant)' }}>End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Campaign Banner Theme</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                  {PRESET_GRADIENTS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => setBannerGradient(g.css)}
                      style={{ height: '40px', borderRadius: '8px', background: g.css, border: bannerGradient === g.css ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                      title={g.name}
                    />
                  ))}
                </div>
              </div>

              {/* Action Banner Preview */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px', color: 'var(--on-surface-variant)' }}>Glow Banner Preview</label>
                <div style={{ background: bannerGradient, padding: '16px', borderRadius: '12px', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>AfriCart Mega Sale</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>{name || 'Campaign Name Preview'}</span>
                  <span style={{ fontSize: '0.82rem', opacity: 0.8 }}>{description || 'Flash sales event details...'}</span>
                  <div style={{ marginTop: '4px', fontSize: '1.25rem', fontWeight: 900 }}>FLAT {discountValue || '0'}% OFF</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--outline)', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--outline)', background: 'transparent', color: 'var(--on-surface)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: 'var(--lime-400)', color: 'var(--on-lime-400)', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
