'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useStore } from '@/context/AppContext';
import { topLevelCategories } from '@/data/products';

/* ── Category icon map ── */
const CATEGORY_ICONS: Record<string, string> = {
  'Electronics':      'devices',
  'Phones':           'smartphone',
  'Home':             'home',
  'Fashion':          'checkroom',
  'Beauty':           'face',
  'Groceries':        'shopping_basket',
  'Health & Wellness':'favorite',
  'Baby & Kids':      'child_care',
  'Automotive':       'directions_car',
  'Books':            'menu_book',
  'Pet Supplies':     'pets',
};

const MOMO_NETWORKS = ['MTN', 'TELECEL', 'AIRTELTIGO'];
const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Northern', 'Upper East', 'Upper West', 'Volta', 'Brong-Ahafo',
  'Oti', 'Bono East', 'Ahafo', 'Western North', 'North East', 'Savannah'
];

type Step = 1 | 2 | 3 | 4 | 5;

interface FormData {
  // Step 1
  name: string;
  slug: string;
  slugStatus: 'idle' | 'checking' | 'available' | 'taken';
  slugSuggestions: string[];
  // Step 2
  category: string;
  // Step 3
  businessType: 'individual' | 'registered_business';
  businessRegNumber: string;
  // Step 4
  contactPhone: string;
  contactEmail: string;
  // Step 5
  pickupStreet: string;
  pickupCity: string;
  pickupRegion: string;
}

const STEP_LABELS = [
  'Store Name',
  'Category',
  'Business Type',
  'Contact',
  'Address',
];

export default function VendorOnboardingPage() {
  const { user, isLoading } = useAuth();
  const { vendorStore } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    name: '', slug: '', slugStatus: 'idle', slugSuggestions: [],
    category: '',
    businessType: 'individual', businessRegNumber: '',
    contactPhone: '', contactEmail: '',
    pickupStreet: '', pickupCity: '', pickupRegion: '',
  });

  // Pre-fill contact from user account
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        contactPhone: user.phone || '',
        contactEmail: user.email || '',
      }));
    }
  }, [user]);

  // Redirect if not a vendor or if store already exists
  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (!isLoading && user && user.role !== 'vendor' && user.role !== 'super_admin') router.push('/');
    if (!isLoading && user && vendorStore) {
      if (vendorStore.status === 'payment_pending') {
        router.push(`/vendor/onboarding/payment?storeId=${vendorStore._id}`);
      } else if (vendorStore.status === 'under_review') {
        router.push(`/vendor/onboarding/pending?storeId=${vendorStore._id}`);
      } else {
        router.push('/vendor');
      }
    }
  }, [user, isLoading, vendorStore, router]);

  /* ── Slug generation & uniqueness check ── */
  const checkSlug = useCallback(async (slug: string) => {
    if (!slug || slug.length < 3) return;
    setForm(prev => ({ ...prev, slugStatus: 'checking' }));
    try {
      const res = await fetch(`/api/stores?checkSlug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setForm(prev => ({
        ...prev,
        slugStatus: data.available ? 'available' : 'taken',
        slug: data.slug || prev.slug,
        slugSuggestions: data.suggestions || [],
      }));
    } catch {
      setForm(prev => ({ ...prev, slugStatus: 'idle' }));
    }
  }, []);

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
    setForm(prev => ({ ...prev, name, slug, slugStatus: 'idle', slugSuggestions: [] }));
  };

  useEffect(() => {
    if (!form.slug || form.slug.length < 3) return;
    const t = setTimeout(() => checkSlug(form.slug), 700);
    return () => clearTimeout(t);
  }, [form.slug, checkSlug]);

  /* ── Step validation ── */
  const canProceed = () => {
    if (step === 1) return form.name.trim().length >= 3 && form.slugStatus === 'available';
    if (step === 2) return !!form.category;
    if (step === 3) return !!form.businessType;
    if (step === 4) return form.contactPhone.trim().length >= 10;
    if (step === 5) return form.pickupCity.trim().length > 0 && form.pickupRegion.trim().length > 0;
    return false;
  };

  /* ── Final submit → create store ── */
  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorEmail: user!.email,
          name: form.name,
          category: form.category,
          businessType: form.businessType,
          businessRegNumber: form.businessRegNumber || undefined,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          pickupAddress: {
            street: form.pickupStreet,
            city: form.pickupCity,
            region: form.pickupRegion,
            country: 'Ghana',
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.suggestions?.length) {
          setForm(prev => ({ ...prev, slugStatus: 'taken', slugSuggestions: data.suggestions }));
          setStep(1);
          setError(data.error + '. Try one of the suggested names.');
        } else {
          throw new Error(data.error || 'Failed to create store');
        }
        return;
      }
      // Phase 1 done → go to Phase 2 (payment setup)
      router.push(`/vendor/onboarding/payment?storeId=${data.store._id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--lime-400)' }} />
      </div>
    );
  }

  const pct = ((step - 1) / 4) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top progress bar ── */}
      <div style={{ height: 3, background: 'var(--outline)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #00e5ff, var(--lime-400))', transition: 'width 0.5s ease' }} />
      </div>

      {/* ── Header ── */}
      <header className="onboarding-header" style={{ borderBottom: '1px solid var(--outline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '1.4rem', background: 'linear-gradient(45deg, #00e5ff, var(--lime-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AfriCart
          </span>
          <span className="onboarding-brand-sub">/ Create Store</span>
        </div>
        <div className="onboarding-steps-pills" style={{ display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 1, minWidth: 0, WebkitOverflowScrolling: 'touch' as any, msOverflowStyle: 'none' as any, scrollbarWidth: 'none' as any }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                background: step > i + 1 ? 'var(--lime-400)' : step === i + 1 ? '#00e5ff' : 'var(--surface-container)',
                color: step >= i + 1 ? '#000' : 'var(--on-surface-variant)',
                transition: 'all 0.3s'
              }}>
                {step > i + 1 ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> : i + 1}
              </div>
              <span className="onboarding-step-label" style={{ color: step === i + 1 ? 'var(--on-surface)' : 'var(--on-surface-variant)', fontWeight: step === i + 1 ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ── Main layout ── */}
      <div className="onboarding-layout" style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%' }}>

        {/* Left rail — step guide */}
        <aside className="onboarding-aside">
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: '0.1em', marginBottom: 8 }}>SETUP STEPS</p>
          {STEP_LABELS.map((label, i) => {
            const stepNum = (i + 1) as Step;
            const done = step > stepNum;
            const active = step === stepNum;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12,
                background: active ? 'var(--surface-container-high)' : 'transparent',
                border: active ? '1px solid var(--outline)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: done ? 'var(--lime-400)' : active ? '#00e5ff' : 'var(--surface-container)',
                  color: (done || active) ? '#000' : 'var(--on-surface-variant)',
                }}>
                  {done
                    ? <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                    : <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{stepNum}</span>}
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400, color: active ? 'var(--on-surface)' : done ? 'var(--on-surface-variant)' : 'var(--on-surface-variant)' }}>{label}</div>
                  {done && <div style={{ fontSize: '0.72rem', color: 'var(--lime-400)', fontWeight: 500 }}>Complete</div>}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 32, padding: 20, background: 'var(--surface-container)', borderRadius: 16, border: '1px solid var(--outline)' }}>
            <span className="material-symbols-outlined" style={{ color: '#00e5ff', fontSize: 28, marginBottom: 8, display: 'block' }}>storefront</span>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Setting up your store takes about <strong style={{ color: 'var(--on-surface)' }}>3 minutes</strong>. You can save and continue later at any step.
            </p>
          </div>
        </aside>

        {/* Right — active step panel */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* ── STEP 1: Store Name & Slug ── */}
          {step === 1 && (
            <StepCard
              title="Name your store"
              subtitle="Your store name is how customers will find and remember you. You can always change your display name later — your URL slug is permanent once set."
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <FieldGroup label="Store Name">
                  <input
                    id="store-name"
                    type="text"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Kente Village Co."
                    maxLength={60}
                    style={inputStyle}
                  />
                </FieldGroup>

                <FieldGroup label="Your Store URL">
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-container)', borderRadius: 12, border: `1px solid ${form.slugStatus === 'available' ? 'var(--lime-400)' : form.slugStatus === 'taken' ? 'var(--error)' : 'var(--outline)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <span style={{ padding: '14px 16px', color: 'var(--on-surface-variant)', fontSize: '0.88rem', borderRight: '1px solid var(--outline)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      africart.com/store/
                    </span>
                    <input
                      id="store-slug"
                      type="text"
                      value={form.slug}
                      onChange={e => {
                        const s = e.target.value.toLowerCase().replace(/[^\w-]/g, '');
                        setForm(prev => ({ ...prev, slug: s, slugStatus: 'idle', slugSuggestions: [] }));
                      }}
                      placeholder="your-store-name"
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '14px 16px', color: 'var(--on-surface)', fontFamily: 'monospace', fontSize: '0.95rem' }}
                    />
                    <div style={{ padding: '14px 16px', flexShrink: 0 }}>
                      {form.slugStatus === 'checking' && <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--on-surface-variant)', animation: 'spin 1s linear infinite' }}>sync</span>}
                      {form.slugStatus === 'available' && <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)' }}>check_circle</span>}
                      {form.slugStatus === 'taken' && <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--error)' }}>cancel</span>}
                    </div>
                  </div>
                  {form.slugStatus === 'available' && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--lime-400)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                      This URL is available!
                    </p>
                  )}
                  {form.slugStatus === 'taken' && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--error)' }}>This URL is already taken. Try one of these:</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                        {form.slugSuggestions.map(s => (
                          <button key={s} onClick={() => { setForm(prev => ({ ...prev, slug: s, slugStatus: 'idle' })); }} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: 'var(--on-surface)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.2s' }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </FieldGroup>
              </div>
            </StepCard>
          )}

          {/* ── STEP 2: Category ── */}
          {step === 2 && (
            <StepCard title="What will you sell?" subtitle="Choose your primary store category. You can sell across multiple categories later — this just helps customers discover your store.">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {topLevelCategories.map(cat => {
                  const selected = form.category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setForm(prev => ({ ...prev, category: cat }))}
                      style={{
                        padding: '20px 16px', borderRadius: 14, border: `2px solid ${selected ? '#00e5ff' : 'var(--outline)'}`,
                        background: selected ? 'rgba(0,229,255,0.08)' : 'var(--surface-container)',
                        color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        transition: 'all 0.2s', transform: selected ? 'scale(1.03)' : 'scale(1)',
                        boxShadow: selected ? '0 0 0 4px rgba(0,229,255,0.15)' : 'none',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 32, color: selected ? '#00e5ff' : 'var(--on-surface-variant)' }}>
                        {CATEGORY_ICONS[cat] || 'category'}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: selected ? 700 : 500, textAlign: 'center' }}>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* ── STEP 3: Business Type ── */}
          {step === 3 && (
            <StepCard title="What kind of seller are you?" subtitle="This helps us tailor your store setup and determines your initial listing limits.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { value: 'individual', label: 'Individual / Sole Trader', desc: 'I sell personally without a formal business registration.', icon: 'person' },
                  { value: 'registered_business', label: 'Registered Business', desc: 'I have a business registered with Ghana\'s Registrar General\'s Department.', icon: 'business' },
                ].map(opt => {
                  const selected = form.businessType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setForm(prev => ({ ...prev, businessType: opt.value as any }))}
                      className="business-type-btn"
                      style={{
                        borderRadius: 16, border: `2px solid ${selected ? '#00e5ff' : 'var(--outline)'}`,
                        background: selected ? 'rgba(0,229,255,0.06)' : 'var(--surface-container)',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.2s', boxShadow: selected ? '0 0 0 4px rgba(0,229,255,0.12)' : 'none',
                      }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: selected ? 'rgba(0,229,255,0.15)' : 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 28, color: selected ? '#00e5ff' : 'var(--on-surface-variant)' }}>{opt.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>{opt.label}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{opt.desc}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selected ? '#00e5ff' : 'var(--outline)'}`, background: selected ? '#00e5ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selected && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#000' }}>check</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {form.businessType === 'registered_business' && (
                  <FieldGroup label="Business Registration Number (optional for now)">
                    <input
                      type="text"
                      value={form.businessRegNumber}
                      onChange={e => setForm(prev => ({ ...prev, businessRegNumber: e.target.value }))}
                      placeholder="e.g. CS-0000123"
                      style={inputStyle}
                    />
                    <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>
                      You can add this later to unlock full listing limits and the Verified badge.
                    </p>
                  </FieldGroup>
                )}
              </div>
            </StepCard>
          )}

          {/* ── STEP 4: Contact Details ── */}
          {step === 4 && (
            <StepCard title="Store contact details" subtitle="These are shown publicly on your store page so customers can reach you. They can differ from your personal account contact.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <FieldGroup label="Public Phone Number *">
                  <input type="tel" value={form.contactPhone} onChange={e => setForm(prev => ({ ...prev, contactPhone: e.target.value }))} placeholder="+233 XX XXX XXXX" style={inputStyle} />
                </FieldGroup>
                <FieldGroup label="Public Email Address (optional)">
                  <input type="email" value={form.contactEmail} onChange={e => setForm(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="store@yourbusiness.com" style={inputStyle} />
                </FieldGroup>
              </div>
            </StepCard>
          )}

          {/* ── STEP 5: Pickup / Return Address ── */}
          {step === 5 && (
            <StepCard title="Pickup & return address" subtitle="This address is used for delivery estimates and return logistics. It doesn't have to be a shop — it can be your home or warehouse.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <FieldGroup label="Street Address (optional)">
                  <input type="text" value={form.pickupStreet} onChange={e => setForm(prev => ({ ...prev, pickupStreet: e.target.value }))} placeholder="e.g. 12 Accra New Town Rd" style={inputStyle} />
                </FieldGroup>
                <FieldGroup label="City / Town *">
                  <input type="text" value={form.pickupCity} onChange={e => setForm(prev => ({ ...prev, pickupCity: e.target.value }))} placeholder="e.g. Accra" style={inputStyle} />
                </FieldGroup>
                <FieldGroup label="Region *">
                  <select value={form.pickupRegion} onChange={e => setForm(prev => ({ ...prev, pickupRegion: e.target.value }))} style={inputStyle}>
                    <option value="">Select region…</option>
                    {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </FieldGroup>
              </div>
            </StepCard>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{ marginTop: 16, padding: '14px 20px', background: 'rgba(244,67,54,0.08)', border: '1px solid var(--error)', borderRadius: 12, color: 'var(--error)', fontSize: '0.9rem', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>error</span>
              {error}
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'space-between' }}>
            {step > 1 ? (
              <button onClick={() => { setError(''); setStep(s => (s - 1) as Step); }} style={{ ...btnSecondary }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={() => { setError(''); setStep(s => (s + 1) as Step); }}
                disabled={!canProceed()}
                style={{ ...btnPrimary, opacity: canProceed() ? 1 : 0.4, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
              >
                Continue
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canProceed() || saving}
                style={{ ...btnPrimary, opacity: canProceed() && !saving ? 1 : 0.4, cursor: canProceed() && !saving ? 'pointer' : 'not-allowed' }}
              >
                {saving ? 'Creating…' : 'Create Store'}
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{saving ? 'sync' : 'storefront'}</span>
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */
function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-fade-in-up">
      <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--on-surface)' }}>{title}</h1>
      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.95rem', margin: '0 0 36px 0', lineHeight: 1.6 }}>{subtitle}</p>
      {children}
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)', letterSpacing: '0.03em' }}>{label}</label>
      {children}
    </div>
  );
}

/* ── Shared style objects ── */
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '14px 18px', borderRadius: 12,
  background: 'var(--surface-container)', border: '1px solid var(--outline)',
  color: 'var(--on-surface)', fontSize: '0.95rem', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.2s',
};

const btnPrimary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 28px', borderRadius: 12,
  background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', border: 'none',
  color: '#000', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
  fontFamily: 'var(--font-lexend)', transition: 'all 0.2s',
};

const btnSecondary: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '14px 24px', borderRadius: 12,
  background: 'var(--surface-container)', border: '1px solid var(--outline)',
  color: 'var(--on-surface)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
  fontFamily: 'var(--font-lexend)', transition: 'all 0.2s',
};
