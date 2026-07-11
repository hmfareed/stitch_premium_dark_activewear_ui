'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

interface ReferralEntry {
  _id: string;
  referreeEmail: string;
  referreeName?: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardPoints: number;
  createdAt: string;
}

interface ReferralStats {
  referralCode: string;
  referrals: ReferralEntry[];
  rewarded: number;
  totalPoints: number;
}

const TIER_THRESHOLDS = [
  { label: 'Starter', min: 0, max: 5, color: '#888', icon: 'emoji_events' },
  { label: 'Bronze', min: 5, max: 15, color: '#CD7F32', icon: 'emoji_events' },
  { label: 'Silver', min: 15, max: 30, color: '#C0C0C0', icon: 'emoji_events' },
  { label: 'Gold', min: 30, max: 50, color: '#FFD700', icon: 'emoji_events' },
  { label: 'Diamond', min: 50, max: Infinity, color: '#00e5ff', icon: 'diamond' },
];

export default function AccountReferralsPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/referrals?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      } catch { /* fail silently */ }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  if (!user) return null;

  const referralLink = stats?.referralCode
    ? `https://africart-one.vercel.app/?ref=${stats.referralCode}`
    : '';

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      showToast('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleShareWhatsApp = () => {
    if (!referralLink) return;
    const msg = `Join me on AfriCart — Ghana's best online marketplace! Use my referral link to sign up and we both earn rewards: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleShareTwitter = () => {
    if (!referralLink) return;
    const msg = `Shop smarter on AfriCart 🛒 Use my referral link to join and we both earn loyalty points! #AfriCart #Ghana`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const totalReferrals = stats?.referrals?.length || 0;
  const currentTier = TIER_THRESHOLDS.find(t => totalReferrals >= t.min && totalReferrals < t.max) || TIER_THRESHOLDS[0];
  const nextTier = TIER_THRESHOLDS[TIER_THRESHOLDS.indexOf(currentTier) + 1];
  const tierProgress = nextTier
    ? Math.round(((totalReferrals - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: 8 }}>Referral Programme</h1>
        <p style={{ color: 'var(--on-surface-variant)' }}>
          Invite friends to AfriCart. You earn <strong style={{ color: 'var(--lime-400)' }}>500 loyalty points</strong> for every friend who signs up through your link.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
          <p style={{ marginTop: 12 }}>Loading your referral dashboard…</p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Referrals', value: totalReferrals, icon: 'group_add', color: '#00e5ff' },
              { label: 'Successful', value: stats?.rewarded || 0, icon: 'check_circle', color: 'var(--lime-400)' },
              { label: 'Points Earned', value: `${(stats?.totalPoints || 0).toLocaleString()} pts`, icon: 'stars', color: '#FFD700' },
              { label: 'GHS Value', value: `GH₵${((stats?.totalPoints || 0) / 100).toFixed(2)}`, icon: 'payments', color: 'var(--lime-400)' },
            ].map(s => (
              <div key={s.label} style={{ flex: '1 1 140px', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--outline)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <div>
                  <div className="font-lexend" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tier Progress */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className="font-lexend" style={{ fontSize: '1.2rem', margin: '0 0 4px 0' }}>Referral Tier</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                  {nextTier ? `${nextTier.min - totalReferrals} more referrals to reach ${nextTier.label}` : 'You\'ve reached the highest tier!'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: currentTier.color, fontVariationSettings: "'FILL' 1" }}>
                  {currentTier.icon}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: currentTier.color }}>{currentTier.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{totalReferrals} referrals</div>
                </div>
              </div>
            </div>

            {/* Tier milestones */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {TIER_THRESHOLDS.map((t, i) => {
                const reached = totalReferrals >= t.min;
                const isCurrent = t === currentTier;
                return (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        backgroundColor: reached ? `color-mix(in srgb, ${t.color} 20%, transparent)` : 'var(--surface-container-high)',
                        border: `2px solid ${isCurrent ? t.color : reached ? t.color : 'var(--outline)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: t.color,
                        transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.2s',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>{t.icon}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: isCurrent ? t.color : 'var(--on-surface-variant)', fontWeight: isCurrent ? 700 : 400, whiteSpace: 'nowrap' }}>
                        {t.label}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--on-surface-variant)' }}>
                        {t.min}+
                      </span>
                    </div>
                    {i < TIER_THRESHOLDS.length - 1 && (
                      <div style={{ width: 40, height: 2, backgroundColor: totalReferrals >= TIER_THRESHOLDS[i + 1].min ? t.color : 'var(--outline)', marginBottom: 30, flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}
            </div>

            {nextTier && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>
                  <span>{currentTier.label}</span>
                  <span>{tierProgress}% to {nextTier.label}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, backgroundColor: 'var(--surface-container-high)', overflow: 'hidden' }}>
                  <div style={{ width: `${tierProgress}%`, height: '100%', background: `linear-gradient(to right, ${currentTier.color}, ${nextTier.color})`, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}
          </div>

          {/* Referral Link Card */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', padding: '28px', background: 'linear-gradient(135deg, rgba(0,229,255,0.05), rgba(195,244,0,0.05))' }}>
            <h2 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Your Referral Link</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginBottom: 20 }}>
              Share this link with friends. When they sign up, you both earn rewards.
            </p>

            {/* Link Box */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 280px', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--lime-400)', flexShrink: 0 }}>link</span>
                <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: 'var(--on-surface-variant)', fontFamily: 'monospace' }}>
                  {referralLink || 'Loading your link…'}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                style={{
                  padding: '12px 20px', borderRadius: 12, border: 'none',
                  background: copied ? 'var(--lime-400)' : 'var(--surface-container-high)',
                  color: copied ? '#000' : 'var(--on-surface)', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem',
                  transition: 'all 0.3s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Your Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '10px 16px', borderRadius: 10, backgroundColor: 'var(--surface-container)', border: '1px solid var(--outline)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Your code:</span>
              <code style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--lime-400)', letterSpacing: '0.1em' }}>
                {stats?.referralCode || '—'}
              </code>
              <button
                onClick={() => { navigator.clipboard.writeText(stats?.referralCode || ''); showToast('Code copied!'); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
              </button>
            </div>

            {/* Share Buttons */}
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Share via</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={handleShareWhatsApp}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#25D366', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </button>
                <button
                  onClick={handleShareTwitter}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#000', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                </button>
                <button
                  onClick={handleCopyLink}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>link</span>
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', padding: '28px' }}>
            <h2 className="font-lexend" style={{ fontSize: '1.2rem', marginBottom: 20 }}>How It Works</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
              {[
                { step: '1', icon: 'share', title: 'Share Your Link', desc: 'Send your unique referral link to friends on WhatsApp, social media, or any channel.' },
                { step: '2', icon: 'person_add', title: 'Friend Signs Up', desc: 'Your friend creates an AfriCart account using your link or enters your code at signup.' },
                { step: '3', icon: 'stars', title: 'Both Earn Points', desc: 'You earn 500 loyalty points instantly. Your friend gets a welcome bonus too.' },
                { step: '4', icon: 'shopping_cart', title: 'Redeem at Checkout', desc: 'Use your points at checkout. 100 points = GH₵1 off any purchase.' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 6px 0' }}>{s.title}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral History */}
          <div>
            <h2 className="font-lexend" style={{ fontSize: '1.4rem', marginBottom: 20 }}>Referral History</h2>
            {!stats?.referrals || stats.referrals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--on-surface-variant)', backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 60 }}>group_add</span>
                <p style={{ marginTop: 12, fontSize: '1rem' }}>No referrals yet. Share your link to get started!</p>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', overflow: 'hidden' }}>
                {stats.referrals.map((ref, idx) => (
                  <div key={ref._id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 24px', borderBottom: idx < stats.referrals.length - 1 ? '1px solid var(--outline-variant)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: ref.status === 'rewarded' ? 'color-mix(in srgb, var(--lime-400) 15%, transparent)' : 'var(--surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ref.status === 'rewarded' ? 'var(--lime-400)' : 'var(--on-surface-variant)', fontWeight: 700, fontSize: '1rem' }}>
                      {(ref.referreeName || ref.referreeEmail)?.substring(0, 1).toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: '0 0 2px 0' }}>{ref.referreeName || ref.referreeEmail}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, backgroundColor: ref.status === 'rewarded' ? 'color-mix(in srgb, var(--lime-400) 15%, transparent)' : 'var(--surface-container-high)', color: ref.status === 'rewarded' ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>
                        {ref.status === 'rewarded' ? `+${ref.rewardPoints || 500} pts` : ref.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
