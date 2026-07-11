'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/AppContext';

/* ── Helpers ── */
const GHANA_CATEGORIES = [
  'Electronics', 'Phones & Accessories', 'Fashion', 'Home & Living',
  'Beauty & Personal Care', 'Groceries & Food', 'Health & Fitness',
  'Baby & Kids', 'Sports & Outdoors', 'Automotive', 'Books & Stationery',
  'Office & Industrial', 'Art & Collectibles',
];

const MTN_NETS   = ['054', '024', '025', '055', '029', '059', '027', '057'];
const TELECEL    = ['050', '020'];
const AIRTELTIGO = ['026', '056'];
function detectNetwork(p: string) {
  const c = p.replace(/[\s\-]/g,'').replace(/^(\+233|233)/,'0').substring(0,3);
  if (MTN_NETS.includes(c)) return 'MTN MoMo';
  if (TELECEL.includes(c)) return 'Telecel Cash';
  if (AIRTELTIGO.includes(c)) return 'AT Cash';
  return '';
}

/* ── Image compressor ── */
function compressImage(file: File, maxSize = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
        else        { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Styles ── */
const INPUT: React.CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 12,
  border: '1px solid var(--outline)', background: 'var(--surface-container)',
  color: 'var(--foreground)', fontSize: 13, fontFamily: 'var(--font-inter)',
  outline: 'none', transition: 'border-color 0.2s',
};
const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 800,
  color: 'var(--on-surface-variant)', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 7, display: 'block',
};
const BTN_PRIMARY: React.CSSProperties = {
  padding: '14px 24px', borderRadius: 12, border: 'none',
  background: 'var(--lime-400)', color: '#000',
  fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 13,
  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};
const BTN_OUTLINE: React.CSSProperties = {
  padding: '14px 24px', borderRadius: 12, border: '1px solid var(--outline)',
  background: 'transparent', color: 'var(--foreground)',
  fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 13,
  textTransform: 'uppercase', cursor: 'pointer',
};

/* ── Types ── */
interface FormState {
  // Step 1
  name: string; email: string; phone: string; role: string;
  // Step 2 (vendors)
  businessType: string; businessRegNumber: string;
  // Step 3 (vendors)
  storeName: string; storeHandle: string; storeBio: string;
  storeCategories: string[]; returnPolicy: string;
  storeLogo: string; storeBanner: string;
  // Step 4 (vendors)
  documentUrl: string; proofOfAddress: string;
  // Step 5
  payoutMethod: string;
  momoNumber: string; momoNetwork: string;
  bankName: string; accountNumber: string; accountName: string;
  reason: string; acceptTerms: boolean;
}

const INITIAL: FormState = {
  name:'', email:'', phone:'', role:'Vendor',
  businessType:'sole_trader', businessRegNumber:'',
  storeName:'', storeHandle:'', storeBio:'',
  storeCategories:[], returnPolicy:'',
  storeLogo:'', storeBanner:'',
  documentUrl:'', proofOfAddress:'',
  payoutMethod:'momo', momoNumber:'', momoNetwork:'',
  bankName:'', accountNumber:'', accountName:'',
  reason:'', acceptTerms:false,
};

const VENDOR_STEPS = ['Personal','Business','Branding','Verification','Payout & Review'];
const ADMIN_STEPS  = ['Personal','Details','Review'];

/* ── StepBar (outside component to prevent remount on each render) ── */
function StepBar({ steps, step }: { steps: string[]; step: number }) {
  return (
    <div style={{ display:'flex', borderBottom:'1px solid var(--outline)', overflowX:'auto' }} className="no-scrollbar">
      {steps.map((label, i) => {
        const s = i + 1;
        const done = s < step, curr = s === step;
        return (
          <div key={s} style={{
            flex:'1 0 auto', padding:'12px 8px', textAlign:'center', minWidth:72,
            background: curr ? 'var(--surface-container)' : 'transparent',
            borderBottom: curr ? '2px solid var(--lime-400)' : '2px solid transparent',
            transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:5,
          }}>
            <div style={{
              width:18, height:18, borderRadius:'50%', fontSize:10, fontWeight:800,
              background: done || curr ? 'var(--lime-400)' : 'var(--outline)',
              color: done || curr ? '#000' : 'var(--on-surface-variant)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              {done ? '✓' : s}
            </div>
            <span style={{
              fontFamily:'var(--font-lexend)', fontSize:9, fontWeight:800,
              color: curr ? 'var(--foreground)' : 'var(--on-surface-variant)',
              textTransform:'uppercase', letterSpacing:'0.04em',
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── ImageUpload (outside component to prevent remount on each render) ── */
function ImageUpload({ field, label, value, aspectHint, maxPx = 1200, onUpload, onClear }: {
  field: 'storeLogo'|'storeBanner'|'documentUrl'|'proofOfAddress';
  label: string; value: string; aspectHint?: string; maxPx?: number;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'storeLogo'|'storeBanner'|'documentUrl'|'proofOfAddress', maxPx?: number) => void;
  onClear: (field: 'storeLogo'|'storeBanner'|'documentUrl'|'proofOfAddress') => void;
}) {
  return (
    <div>
      <span style={LABEL}>{label}</span>
      {value ? (
        <div style={{ position:'relative', width:'100%', height:120, borderRadius:12, overflow:'hidden', border:'1px solid var(--outline)' }}>
          <img src={value} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.85 }} />
          <button type="button" onClick={() => onClear(field)} style={{
            position:'absolute', top:8, right:8, background:'var(--error)', border:'none',
            color:'white', width:26, height:26, borderRadius:'50%', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize:14 }}>close</span>
          </button>
          <div style={{ position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.7)', padding:'3px 8px', borderRadius:6, color:'white', fontSize:10, fontWeight:700 }}>UPLOADED ✓</div>
        </div>
      ) : (
        <label style={{ ...INPUT, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer', color:'var(--lime-400)', borderStyle:'dashed', padding:'20px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize:28 }}>upload_file</span>
          <span style={{ fontFamily:'var(--font-lexend)', fontSize:10, fontWeight:800 }}>CLICK TO UPLOAD</span>
          {aspectHint && <span style={{ fontSize:9, color:'var(--on-surface-variant)' }}>{aspectHint}</span>}
          <input type="file" accept="image/*" onChange={e => onUpload(e, field, maxPx)} style={{ display:'none' }} />
        </label>
      )}
    </div>
  );
}


export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL);

  const isVendor  = form.role === 'Vendor';
  const steps     = isVendor ? VENDOR_STEPS : ADMIN_STEPS;
  const totalSteps = steps.length;

  const set = (k: keyof FormState, v: any) => setForm(p => ({ ...p, [k]: v }));

  /* ── Image uploads ── */
  const handleImg = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>, field: 'storeLogo'|'storeBanner'|'documentUrl'|'proofOfAddress', maxPx = 1200
  ) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const compressed = await compressImage(file, maxPx);
      set(field, compressed);
      showToast('Image uploaded', 'success');
    } catch { showToast('Upload failed – please try a smaller image', 'error'); }
  }, []);

  /* ── Handle: storeHandle auto-fill ── */
  const handleStoreName = (v: string) => {
    set('storeName', v);
    if (!form.storeHandle) {
      set('storeHandle', v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  };

  const handleMomoChange = (v: string) => {
    set('momoNumber', v);
    set('momoNetwork', detectNetwork(v));
  };

  /* ── Category toggle ── */
  const toggleCat = (cat: string) => {
    set('storeCategories', form.storeCategories.includes(cat)
      ? form.storeCategories.filter(c => c !== cat)
      : [...form.storeCategories, cat]
    );
  };

  /* ── Validation per step ── */
  const validate = (): boolean => {
    if (step === 1) {
      if (!form.name || !form.email || !form.phone) {
        showToast('Please fill all personal details', 'error'); return false;
      }
    }
    if (isVendor) {
      if (step === 2 && form.businessType === 'registered_business' && !form.businessRegNumber) {
        showToast('Please enter your Registrar-General registration number', 'error'); return false;
      }
      if (step === 3) {
        if (!form.storeName) { showToast('Store name is required', 'error'); return false; }
        if (form.storeCategories.length === 0) { showToast('Select at least one category', 'error'); return false; }
      }
      if (step === 4 && !form.documentUrl) {
        showToast('Please upload your Ghana Card or business certificate', 'error'); return false;
      }
      if (step === 5) {
        if (form.payoutMethod === 'momo' && !form.momoNumber) {
          showToast('Please enter your MoMo number', 'error'); return false;
        }
        if (form.payoutMethod === 'bank' && (!form.bankName || !form.accountNumber)) {
          showToast('Please fill in your bank details', 'error'); return false;
        }
      }
    } else {
      if (step === 2 && !form.reason) {
        showToast('Please describe why you are applying', 'error'); return false;
      }
    }
    return true;
  };

  const handleNext = () => { if (validate()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => Math.max(1, s - 1));

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.acceptTerms) { showToast('You must accept the Terms & Conditions', 'error'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        payoutDetails: form.payoutMethod === 'momo'
          ? { momoNumber: form.momoNumber, momoNetwork: form.momoNetwork }
          : { bankName: form.bankName, accountNumber: form.accountNumber, accountName: form.accountName },
      };
      const res = await fetch('/api/vendor-applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setApplicationId(data.applicationId || data.application?._id || '');
      setSubmitted(true);
      showToast('Application submitted!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div className="animate-fade-in-up" style={{ textAlign:'center', maxWidth:480, background:'var(--surface)', border:'1px solid var(--outline)', padding:'48px 32px', borderRadius:24 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--lime-400)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 0 32px rgba(0,229,255,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize:36, color:'#000' }}>check</span>
          </div>
          <h1 className="font-lexend" style={{ fontSize:22, fontWeight:900, marginBottom:10 }}>APPLICATION SUBMITTED!</h1>
          <p style={{ color:'var(--on-surface-variant)', fontSize:13, lineHeight:1.7, marginBottom:8 }}>
            Thank you for applying to join AfriCart as a <strong>{form.role}</strong>.<br />
            Our team will review your credentials within <strong>24–48 hours</strong>.
          </p>
          {applicationId && (
            <p style={{ fontSize:11, color:'var(--on-surface-variant)', marginBottom:24, fontFamily:'var(--font-inter)' }}>
              Reference: <code style={{ background:'var(--surface-container)', padding:'2px 6px', borderRadius:4 }}>{applicationId}</code>
            </p>
          )}
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/apply/status" style={{ ...BTN_PRIMARY, textDecoration:'none', padding:'12px 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:16 }}>track_changes</span>
              Check Status
            </Link>
            <Link href="/" style={{ ...BTN_OUTLINE, textDecoration:'none', padding:'12px 20px' }}>
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }


  /* ── Image clear handler ── */
  const handleImgClear = (field: 'storeLogo'|'storeBanner'|'documentUrl'|'proofOfAddress') => set(field, '');

  return (
    <div style={{ minHeight:'90vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 16px' }}>
      {/* Title */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg, var(--lime-400)22, var(--lime-400)11)', border:'1px solid var(--lime-400)33', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize:26, color:'var(--lime-400)' }}>storefront</span>
        </div>
        <h1 className="font-lexend" style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.02em', marginBottom:6 }}>BECOME A PARTNER</h1>
        <p style={{ color:'var(--on-surface-variant)', fontSize:12, fontFamily:'var(--font-inter)' }}>
          Join AfriCart as a vendor or platform administrator
        </p>
      </div>

      <div className="animate-fade-in-up" style={{ width:'100%', maxWidth:560, background:'var(--surface)', border:'1px solid var(--outline)', borderRadius:24, overflow:'hidden' }}>
        <StepBar steps={steps} step={step} />

        <div style={{ padding:'28px 24px' }}>

          {/* ── STEP 1: Personal Details ─────────────────────────────── */}
          {step === 1 && (
            <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={LABEL}>Full Name</label>
                <input style={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your legal full name" required />
              </div>
              <div>
                <label style={LABEL}>Email Address</label>
                <input type="email" style={INPUT} value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label style={LABEL}>Phone Number (Ghana)</label>
                <input type="tel" style={INPUT} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="050 000 0000" required />
              </div>
              <div>
                <label style={LABEL}>Applying as</label>
                <select style={{ ...INPUT, cursor:'pointer' }} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="Vendor">Vendor — Sell on AfriCart</option>
                  <option value="Support Admin">Support Admin — Customer support &amp; tickets</option>
                  <option value="Finance Admin">Finance Admin — Accounts &amp; payouts</option>
                </select>
              </div>
              <button style={{ ...BTN_PRIMARY, marginTop:6 }} onClick={handleNext}>
                Continue <span className="material-symbols-outlined" style={{ fontSize:16 }}>arrow_forward</span>
              </button>
            </div>
          )}

          {/* ── STEP 2 (Vendor): Business Type ───────────────────────── */}
          {step === 2 && isVendor && (
            <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={LABEL}>Business Structure</label>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[
                    { val:'sole_trader', icon:'person', title:'Individual / Sole Trader', desc:'You sell under your personal name — no formal registration required.' },
                    { val:'registered_business', icon:'business', title:'Registered Business', desc:"Registered with Ghana's Registrar-General's Department." },
                    { val:'informal', icon:'storefront', title:'Informal / Market Seller', desc:'No formal registration yet — lower listing limits until verified.' },
                  ].map(opt => (
                    <button key={opt.val} type="button" onClick={() => set('businessType', opt.val)} style={{
                      padding:'14px 16px', borderRadius:12, border: form.businessType === opt.val ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                      background: form.businessType === opt.val ? 'color-mix(in srgb, var(--lime-400) 8%, transparent)' : 'var(--surface-container)',
                      cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                      display:'flex', alignItems:'flex-start', gap:12,
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize:20, color: form.businessType === opt.val ? 'var(--lime-400)' : 'var(--on-surface-variant)', marginTop:1 }}>{opt.icon}</span>
                      <div>
                        <p style={{ fontFamily:'var(--font-lexend)', fontSize:12, fontWeight:800, color:'var(--foreground)', marginBottom:2 }}>{opt.title}</p>
                        <p style={{ fontSize:11, color:'var(--on-surface-variant)', lineHeight:1.4 }}>{opt.desc}</p>
                      </div>
                      {form.businessType === opt.val && <span className="material-symbols-outlined" style={{ fontSize:18, color:'var(--lime-400)', marginLeft:'auto', marginTop:2, flexShrink:0 }}>check_circle</span>}
                    </button>
                  ))}
                </div>
              </div>
              {form.businessType === 'registered_business' && (
                <div>
                  <label style={LABEL}>Registrar-General Reg. Number</label>
                  <input style={INPUT} value={form.businessRegNumber} onChange={e => set('businessRegNumber', e.target.value)} placeholder="e.g. CS00001234" />
                </div>
              )}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button style={{ ...BTN_OUTLINE, flex:1 }} onClick={handleBack}>Back</button>
                <button style={{ ...BTN_PRIMARY, flex:2 }} onClick={handleNext}>Continue <span className="material-symbols-outlined" style={{ fontSize:16 }}>arrow_forward</span></button>
              </div>
            </div>
          )}

          {/* ── STEP 2 (Admin): Role Justification ───────────────────── */}
          {step === 2 && !isVendor && (
            <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={LABEL}>Why are you applying for {form.role}?</label>
                <textarea style={{ ...INPUT, resize:'vertical' }} rows={5} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Describe your relevant experience and motivation..." />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ ...BTN_OUTLINE, flex:1 }} onClick={handleBack}>Back</button>
                <button style={{ ...BTN_PRIMARY, flex:2 }} onClick={handleNext}>Continue <span className="material-symbols-outlined" style={{ fontSize:16 }}>arrow_forward</span></button>
              </div>
            </div>
          )}

          {/* ── STEP 3 (Vendor): Store Branding ──────────────────────── */}
          {step === 3 && isVendor && (
            <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={LABEL}>Store Name *</label>
                <input style={INPUT} value={form.storeName} onChange={e => handleStoreName(e.target.value)} placeholder="e.g. Premium Sports Gear" required />
              </div>
              <div>
                <label style={LABEL}>Store Handle (URL slug)</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--on-surface-variant)', fontFamily:'var(--font-inter)' }}>/store/</span>
                  <input style={{ ...INPUT, paddingLeft:60 }} value={form.storeHandle}
                    onChange={e => set('storeHandle', e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g,''))}
                    placeholder="premium-sports-gear" />
                </div>
              </div>
              <div>
                <label style={LABEL}>Store Bio (short description)</label>
                <textarea style={{ ...INPUT, resize:'vertical' }} rows={3} value={form.storeBio}
                  onChange={e => set('storeBio', e.target.value)} placeholder="Tell buyers what you sell and what makes your store special..." />
              </div>
              <div>
                <label style={LABEL}>Categories you will sell in *</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {GHANA_CATEGORIES.map(cat => (
                    <button key={cat} type="button" onClick={() => toggleCat(cat)} style={{
                      padding:'6px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
                      border: form.storeCategories.includes(cat) ? '1.5px solid var(--lime-400)' : '1px solid var(--outline)',
                      background: form.storeCategories.includes(cat) ? 'color-mix(in srgb, var(--lime-400) 12%, transparent)' : 'var(--surface-container)',
                      color: form.storeCategories.includes(cat) ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                      transition:'all 0.15s',
                    }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={LABEL}>Return Policy</label>
                <textarea style={{ ...INPUT, resize:'vertical' }} rows={2} value={form.returnPolicy}
                  onChange={e => set('returnPolicy', e.target.value)} placeholder="e.g. 7-day returns on unworn/unused items with original packaging." />
              </div>
              <ImageUpload field="storeLogo" label="Store Logo (square)" value={form.storeLogo} aspectHint="Square image recommended • Max 1MB" maxPx={400} onUpload={handleImg} onClear={handleImgClear} />
              <ImageUpload field="storeBanner" label="Store Banner (wide)" value={form.storeBanner} aspectHint="Landscape image • 3:1 ratio recommended" maxPx={1200} onUpload={handleImg} onClear={handleImgClear} />
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button style={{ ...BTN_OUTLINE, flex:1 }} onClick={handleBack}>Back</button>
                <button style={{ ...BTN_PRIMARY, flex:2 }} onClick={handleNext}>Continue <span className="material-symbols-outlined" style={{ fontSize:16 }}>arrow_forward</span></button>
              </div>
            </div>
          )}

          {/* ── STEP 4 (Vendor): ID Verification ─────────────────────── */}
          {step === 4 && isVendor && (
            <div className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ padding:'12px 16px', borderRadius:12, background:'color-mix(in srgb, var(--lime-400) 8%, transparent)', border:'1px solid var(--lime-400)33', fontSize:11, color:'var(--on-surface-variant)', lineHeight:1.5 }}>
                <strong style={{ color:'var(--foreground)' }}>Why do we need this?</strong><br />
                ID verification builds trust with buyers and qualifies you for faster payout cycles and higher listing limits.
              </div>
              <ImageUpload
                field="documentUrl"
                label={form.businessType === 'registered_business' ? 'Business Certificate (Registrar-General) *' : 'Ghana Card / National ID *'}
                value={form.documentUrl}
                aspectHint="Clear photo required — both sides if Ghana Card"
                maxPx={1200}
                onUpload={handleImg}
                onClear={handleImgClear}
              />
              <ImageUpload
                field="proofOfAddress"
                label="Proof of Address (utility bill / bank statement)"
                value={form.proofOfAddress}
                aspectHint="Must show your name + address • Dated within 3 months"
                maxPx={1200}
                onUpload={handleImg}
                onClear={handleImgClear}
              />
              <div>
                <label style={LABEL}>Why should your store be approved?</label>
                <textarea style={{ ...INPUT, resize:'vertical' }} rows={3} value={form.reason}
                  onChange={e => set('reason', e.target.value)} placeholder="Describe what you plan to sell, your experience, and why AfriCart buyers will love your store..." />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button style={{ ...BTN_OUTLINE, flex:1 }} onClick={handleBack}>Back</button>
                <button style={{ ...BTN_PRIMARY, flex:2 }} onClick={handleNext}>Continue <span className="material-symbols-outlined" style={{ fontSize:16 }}>arrow_forward</span></button>
              </div>
            </div>
          )}

          {/* ── STEP 5 (Vendor): Payout + Review ─────────────────────── */}
          {step === 5 && isVendor && (
            <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Payout method */}
              <div>
                <label style={LABEL}>Payout Method</label>
                <div style={{ display:'flex', gap:8 }}>
                  {[{ val:'momo', icon:'smartphone', label:'Mobile Money' }, { val:'bank', icon:'account_balance', label:'Bank Account' }].map(opt => (
                    <button key={opt.val} type="button" onClick={() => set('payoutMethod', opt.val)} style={{
                      flex:1, padding:'12px 8px', borderRadius:12, cursor:'pointer', textAlign:'center',
                      border: form.payoutMethod === opt.val ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                      background: form.payoutMethod === opt.val ? 'color-mix(in srgb, var(--lime-400) 8%, transparent)' : 'var(--surface-container)',
                      transition:'all 0.2s',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize:20, color: form.payoutMethod === opt.val ? 'var(--lime-400)' : 'var(--on-surface-variant)', display:'block', marginBottom:4 }}>{opt.icon}</span>
                      <span style={{ fontSize:11, fontWeight:800, color: form.payoutMethod === opt.val ? 'var(--lime-400)' : 'var(--on-surface-variant)', fontFamily:'var(--font-lexend)' }}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {form.payoutMethod === 'momo' ? (
                <>
                  <div>
                    <label style={LABEL}>Mobile Money Number</label>
                    <input type="tel" style={INPUT} value={form.momoNumber} onChange={e => handleMomoChange(e.target.value)} placeholder="050 000 0000" />
                    {form.momoNetwork && (
                      <p style={{ fontSize:10, color:'var(--lime-400)', marginTop:4, fontWeight:700 }}>✓ Detected: {form.momoNetwork}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={LABEL}>Bank Name</label>
                    <input style={INPUT} value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="e.g. GCB Bank, Ecobank, Absa..." />
                  </div>
                  <div>
                    <label style={LABEL}>Account Number</label>
                    <input style={INPUT} value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} placeholder="Your bank account number" />
                  </div>
                  <div>
                    <label style={LABEL}>Account Name</label>
                    <input style={INPUT} value={form.accountName} onChange={e => set('accountName', e.target.value)} placeholder="Must match your ID exactly" />
                  </div>
                </>
              )}

              {/* Commission disclosure */}
              <div style={{ background:'var(--surface-container-low)', border:'1px solid var(--outline)', borderRadius:12, padding:'14px 16px', fontSize:11, lineHeight:1.6, color:'var(--on-surface-variant)' }}>
                <strong style={{ color:'var(--foreground)', fontSize:12 }}>Commission Rate Disclosure</strong><br />
                AfriCart deducts a platform commission of <strong style={{ color:'var(--lime-400)' }}>5–12%</strong> per successful sale (varies by category). Your net payout is transferred weekly once sales clear escrow. View full <Link href="/buyer-protection" style={{ color:'var(--lime-400)' }}>Vendor Terms</Link>.
              </div>

              {/* Summary */}
              <div style={{ background:'var(--surface-container-low)', border:'1px solid var(--outline)', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
                <p style={{ fontFamily:'var(--font-lexend)', fontSize:10, fontWeight:800, color:'var(--lime-400)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Review Your Application</p>
                {[
                  { label:'Name', val:form.name },
                  { label:'Email', val:form.email },
                  { label:'Phone', val:form.phone },
                  { label:'Business Type', val:form.businessType?.replace('_',' ') },
                  { label:'Store Name', val:form.storeName },
                  { label:'Store Handle', val:form.storeHandle ? `/store/${form.storeHandle}` : '—' },
                  { label:'Categories', val:form.storeCategories.length ? form.storeCategories.slice(0,3).join(', ') + (form.storeCategories.length > 3 ? ` +${form.storeCategories.length-3}` : '') : '—' },
                  { label:'ID Document', val:form.documentUrl ? 'Uploaded ✓' : 'Not uploaded' },
                  { label:'Payout Method', val:form.payoutMethod === 'momo' ? `MoMo — ${form.momoNumber}` : `Bank — ${form.bankName}` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                    <span style={{ color:'var(--on-surface-variant)', fontWeight:600 }}>{label}</span>
                    <span style={{ color:'var(--foreground)', fontWeight:700, textAlign:'right', maxWidth:'55%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val || '—'}</span>
                  </div>
                ))}
              </div>

              {/* T&C */}
              <label style={{ display:'flex', gap:10, cursor:'pointer', userSelect:'none' }}>
                <input type="checkbox" required checked={form.acceptTerms} onChange={e => set('acceptTerms', e.target.checked)} style={{ width:16, height:16, cursor:'pointer', alignSelf:'flex-start', marginTop:2 }} />
                <span style={{ fontFamily:'var(--font-inter)', fontSize:11, color:'var(--on-surface-variant)', lineHeight:1.5 }}>
                  I confirm all entered details are accurate. I agree to AfriCart&apos;s <Link href="/buyer-protection" style={{ color:'var(--lime-400)' }}>Partner Code of Conduct</Link>, Vendor Guidelines, and commission rate disclosure above.
                </span>
              </label>

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" style={{ ...BTN_OUTLINE, flex:1 }} onClick={handleBack}>Back</button>
                <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, flex:2, opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}>
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin" style={{ fontSize:16 }}>progress_activity</span> Submitting...</>
                  ) : (
                    <>Submit Application <span className="material-symbols-outlined" style={{ fontSize:16 }}>send</span></>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3 (Admin): Review ────────────────────────────────── */}
          {step === 3 && !isVendor && (
            <form onSubmit={handleSubmit} className="animate-fade-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--surface-container-low)', border:'1px solid var(--outline)', borderRadius:14, padding:'16px', display:'flex', flexDirection:'column', gap:8 }}>
                <p style={{ fontFamily:'var(--font-lexend)', fontSize:10, fontWeight:800, color:'var(--lime-400)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Review Application</p>
                {[
                  { label:'Name',  val:form.name  },
                  { label:'Email', val:form.email },
                  { label:'Phone', val:form.phone },
                  { label:'Role',  val:form.role  },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                    <span style={{ color:'var(--on-surface-variant)', fontWeight:600 }}>{label}</span>
                    <span style={{ color:'var(--foreground)', fontWeight:700 }}>{val}</span>
                  </div>
                ))}
              </div>
              <label style={{ display:'flex', gap:10, cursor:'pointer', userSelect:'none' }}>
                <input type="checkbox" required checked={form.acceptTerms} onChange={e => set('acceptTerms', e.target.checked)} style={{ width:16, height:16, cursor:'pointer', alignSelf:'flex-start', marginTop:2 }} />
                <span style={{ fontFamily:'var(--font-inter)', fontSize:11, color:'var(--on-surface-variant)', lineHeight:1.5 }}>
                  I confirm all details are accurate and agree to AfriCart&apos;s Partner Code of Conduct.
                </span>
              </label>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" style={{ ...BTN_OUTLINE, flex:1 }} onClick={handleBack}>Back</button>
                <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, flex:2, opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Submitting...' : <>Submit Form <span className="material-symbols-outlined" style={{ fontSize:16 }}>send</span></>}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer note */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid var(--outline)', textAlign:'center' }}>
          <p style={{ fontSize:10, color:'var(--on-surface-variant)', fontFamily:'var(--font-inter)' }}>
            Step {step} of {totalSteps} · Already applied?{' '}
            <Link href="/apply/status" style={{ color:'var(--lime-400)', fontWeight:700 }}>Check your status</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
