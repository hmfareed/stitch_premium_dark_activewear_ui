'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, useAuth, useToast } from '@/context/AppContext';

/* ── Ghana location suggestions ── */
const GHANA_CITIES = [
  'Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Obuasi', 'Teshie',
  'Madina', 'Tema', 'Kasoa', 'Koforidua', 'Sunyani', 'Ho', 'Wa', 'Bolgatanga',
  'Techiman', 'Nkawkaw', 'Berekum', 'Winneba', 'Dunkwa-on-Offin', 'Ashaiman',
  'Asamankese', 'Konongo', 'Agona Swedru', 'Sefwi Wiawso', 'Aflao', 'Keta',
  'Aburi', 'Nsawam', 'Ejura', 'Saltpond', 'Elmina', 'Axim', 'Bogoso',
  'Prestea', 'Tarkwa', 'Bibiani', 'Goaso', 'Dormaa Ahenkro', 'Kintampo',
  'Yeji', 'Salaga', 'Yendi', 'Savelugu', 'Navrongo', 'Zebilla', 'Bawku',
];

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Northern', 'Western', 'Central', 'Eastern',
  'Brong-Ahafo', 'Volta', 'Upper East', 'Upper West', 'Bono', 'Bono East',
  'Ahafo', 'Western North', 'Oti', 'North East', 'Savannah',
];

const GHANA_ADDRESSES = [
  'Ring Road Central', 'Independence Avenue', 'Oxford Street, Osu',
  'Spintex Road', 'Tema Community 1', 'Madina Road', 'Legon Road',
  'Sakumono Estate', 'East Legon', 'Cantonments Road', 'Airport Residential',
  'Dzorwulu', 'Roman Ridge', 'Adabraka', 'Asylum Down',
];

/* ── Network detection by prefix ── */
const MTN_PREFIXES = ['054', '024', '025', '055', '029', '059', '027', '057'];
const TELECEL_PREFIXES = ['050', '020'];
const AIRTELTIGO_PREFIXES = ['026', '056'];

type MobileNetwork = 'MTN' | 'TELECEL' | 'AIRTELTIGO';

function detectNetwork(phoneNumber: string): MobileNetwork | null {
  // Strip spaces, dashes, and leading +233 or 233
  const cleaned = phoneNumber.replace(/[\s\-]/g, '').replace(/^(\+233|233)/, '0');
  const prefix = cleaned.substring(0, 3);

  if (MTN_PREFIXES.includes(prefix)) return 'MTN';
  if (TELECEL_PREFIXES.includes(prefix)) return 'TELECEL';
  if (AIRTELTIGO_PREFIXES.includes(prefix)) return 'AIRTELTIGO';
  return null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPrice, clearCart } = useCart();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARD'>('MOBILE_MONEY');
  const [mobileNetwork, setMobileNetwork] = useState<MobileNetwork>('MTN');
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'verifying' | 'success' | 'failed'>('idle');

  /* ── Promo Code State ── */
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  /* ── Shipping form state (pre-filled from profile) ── */
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Fetch shipping rates
  useEffect(() => {
    fetch('/api/shipping-rates')
      .then(res => res.json())
      .then(data => {
        if (data.success) setShippingRates(data.rates);
      })
      .catch(err => console.error('Failed to fetch shipping rates:', err));
  }, []);

  // Load Paystack script dynamically for Phase 5 Inline Modal
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // Clean up script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Update shipping fee when region changes
  useEffect(() => {
    const rate = shippingRates.find(r => r.region === region);
    if (rate) {
      setShippingFee(rate.fee);
    } else {
      setShippingFee(0);
    }
  }, [region, shippingRates]);

  /* Pre-fill from user profile if logged in (guest checkout allowed) */
  useEffect(() => {
    if (user) {
      setFullName(prev => prev || user.name || '');
      setEmail(prev => prev || user.email || '');
      setPhone(prev => prev || user.phone || '');
      // Fetch saved addresses
      fetch(`/api/addresses?email=${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.addresses?.length > 0) {
            setSavedAddresses(data.addresses);
            // Auto-select default address
            const defaultAddr = data.addresses.find((a: any) => a.isDefault);
            if (defaultAddr) selectSavedAddress(defaultAddr);
          }
        })
        .catch(() => {});
    }
  }, [user, isLoading, router]);

  const selectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr._id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddress(addr.address);
    setCity(addr.city);
    setRegion(addr.region);
  };

  const clearSavedAddress = () => {
    setSelectedAddressId(null);
    setFullName(user?.name || '');
    setPhone(user?.phone || '');
    setAddress('');
    setCity('');
    setRegion('');
  };

  const handleMomoPhoneChange = (value: string) => {
    setMomoPhone(value);
    const detected = detectNetwork(value);
    if (detected) {
      setMobileNetwork(detected);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    setPromoLoading(true);
    try {
      const vendorEmails = Array.from(new Set(cart.map(item => item.vendorEmail).filter(Boolean)));
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput, vendorEmails })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedPromo(data.promotion);
        setPromoInput('');
        showToast('Promo code applied!', 'success');
      } else {
        setPromoError(data.error || 'Invalid promo code');
      }
    } catch (err) {
      setPromoError('Network error validating promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
  };

  // Calculate discount
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'Percentage') {
      discountAmount = totalPrice * (appliedPromo.discountValue / 100);
    } else if (appliedPromo.type === 'Fixed') {
      discountAmount = appliedPromo.discountValue;
    } else if (appliedPromo.type === 'Shipping') {
      // We will handle free shipping below
    }
  }

  // Ensure discount doesn't exceed total
  if (discountAmount > totalPrice) discountAmount = totalPrice;

  const actualShippingFee = (appliedPromo && appliedPromo.type === 'Shipping') ? 0 : shippingFee;
  const finalTotal = totalPrice - discountAmount + actualShippingFee;

  const buildOrderData = (paymentRef?: string) => ({
    orderId: `ORD-${Math.floor(Math.random() * 900000) + 100000}`,
    date: new Date(),
    status: paymentRef ? 'Confirmed' : 'Pending',
    total: finalTotal,
    itemsCount: cart.length,
    shippingAddress: { fullName, email, phone, address, city, region },
    paymentInfo: {
      method: paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Card',
      ...(paymentMethod === 'MOBILE_MONEY' ? { network: mobileNetwork, momoPhone } : {}),
      ...(paymentRef ? { paystackRef: paymentRef, verified: true } : {}),
    },
    products: cart.map(item => ({
      id: item.id, name: item.name, price: item.price, image: item.image,
      quantity: item.quantity, selectedSize: item.selectedSize,
      category: item.category, vendorEmail: item.vendorEmail, vendorStoreName: item.vendorStoreName,
    })),
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    promoCode: appliedPromo ? appliedPromo.code : undefined,
    discountAmount: discountAmount || undefined,
  });

  const saveOrderAndRedirect = async (paymentRef?: string) => {
    const orderData = buildOrderData(paymentRef);
    try {
      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
    } catch (err) { console.error('Failed to save order:', err); }
    clearCart();
    setLoading(false);
    setPaymentStatus('success');
    showToast('Order placed successfully!');
    router.push('/confirmation');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerEmail = user?.email || email;
    const customerName = user?.name || fullName;
    if (!customerEmail || !fullName) {
      showToast('Please fill in your name and email', 'error');
      setStep(1);
      return;
    }
    setLoading(true);
    setPaymentStatus('processing');

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

    // If Paystack is not configured, fall back to direct order (simulation)
    if (!paystackKey || paystackKey === 'pk_test_xxxx' || paystackKey === 'pk_live_xxxx' || paystackKey.includes('xxxx')) {
      console.warn('Paystack public key is missing or using placeholder. Falling back to simulated checkout.');
      await saveOrderAndRedirect();
      return;
    }

    const orderId = `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
    const paystackChannels = paymentMethod === 'MOBILE_MONEY' ? ['mobile_money'] : ['card', 'bank', 'bank_transfer'];

    // If dynamic inline script is loaded, launch the interactive popup modal!
    if ((window as any).PaystackPop) {
      try {
        const handler = (window as any).PaystackPop.setup({
          key: paystackKey,
          email: customerEmail,
          amount: Math.round(finalTotal * 100), // convert GHS to pesewas
          currency: 'GHS',
          ref: orderId,
          metadata: {
            custom_fields: [
              { display_name: 'Customer Name', variable_name: 'customer_name', value: customerName },
              { display_name: 'Order ID', variable_name: 'order_id', value: orderId }
            ]
          },
          callback: async (response: any) => {
            setPaymentStatus('verifying');
            try {
              const verifyRes = await fetch(`/api/payment/verify?reference=${response.reference}`);
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                await saveOrderAndRedirect(response.reference);
              } else {
                showToast('Payment verification failed', 'error');
                setLoading(false);
                setPaymentStatus('failed');
              }
            } catch (err) {
              console.error('Verify error:', err);
              showToast('Verification failed, please check orders.', 'error');
              setLoading(false);
              setPaymentStatus('failed');
            }
          },
          onClose: () => {
            showToast('Payment cancelled', 'info');
            setLoading(false);
            setPaymentStatus('idle');
          }
        });
        handler.openIframe();
        return;
      } catch (err) {
        console.warn('Paystack inline checkout failed. Falling back to hosted checkout:', err);
      }
    }

    // Fallback: Hosted payment redirect if inline setup is unavailable
    try {
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          amount: finalTotal,
          callback_url: `${window.location.origin}/confirmation`,
          metadata: { orderId, customerName, items: cart.length },
          channels: paystackChannels,
          ...(paymentMethod === 'MOBILE_MONEY' && momoPhone ? { phone: momoPhone } : {}),
        }),
      });
      const initData = await initRes.json();

      if (!initData.success) {
        showToast(initData.error || 'Payment initialization failed', 'error');
        setLoading(false); setPaymentStatus('failed');
        return;
      }

      if (initData.authorization_url) {
        const orderData = buildOrderData(initData.reference);
        localStorage.setItem('africart-pending-order', JSON.stringify(orderData));
        localStorage.setItem('africart-pending-ref', initData.reference);
        window.location.href = initData.authorization_url;
      } else {
        showToast('Payment gateway not available. Please try again.', 'error');
        setLoading(false); setPaymentStatus('failed');
      }
    } catch (err: any) {
      console.error('Paystack error:', err);
      showToast(`Payment error: ${err.message || 'Please try again.'}`, 'error');
      setLoading(false); setPaymentStatus('failed');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: 'var(--surface-container)',
    border: '1px solid var(--outline)', borderRadius: 10,
    color: 'var(--foreground)', fontSize: 14, fontFamily: 'var(--font-inter)',
    outline: 'none', transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700,
    color: 'var(--on-surface-variant)', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 6, display: 'block',
  };

  if (isLoading) return null;

  if (cart.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24, textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: 'var(--foreground)', marginBottom: 16 }}>Your cart is empty</p>
        <button onClick={() => router.push('/shop')} style={{ background: 'var(--lime-400)', color: 'var(--on-lime-400)', padding: '12px 24px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-lexend)', fontSize: 13 }}>
          Continue Shopping
        </button>
      </div>
    );
  }

  /* Network button config */
  const networkOptions: { key: MobileNetwork; label: string; bg: string; color: string }[] = [
    { key: 'MTN', label: 'MTN MoMo', bg: '#FFCB05', color: '#000' },
    { key: 'TELECEL', label: 'Telecel Cash', bg: '#E60012', color: '#fff' },
    { key: 'AIRTELTIGO', label: 'AT Cash', bg: '#E4002B', color: '#fff' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 16px', paddingBottom: 140 }}>

      {/* Hidden datalists for browser autocomplete suggestions */}
      <datalist id="ghana-cities">
        {GHANA_CITIES.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="ghana-addresses">
        {GHANA_ADDRESSES.map(a => <option key={a} value={a} />)}
      </datalist>

      {/* Progress */}
      <div className="animate-fade-in" style={{ padding: '16px 0 24px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          <div style={{ height: 3, flex: 1, background: 'var(--lime-400)', borderRadius: 4, transition: 'all 0.3s' }} />
          <div style={{ height: 3, flex: 1, background: step >= 2 ? 'var(--lime-400)' : 'var(--outline)', borderRadius: 4, transition: 'all 0.3s' }} />
        </div>
      </div>

      <form onSubmit={handlePlaceOrder}>
        {/* Step 1: Shipping */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Shipping Details</h2>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.08em' }}>STEP 1/2</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Saved Addresses Picker */}
              {savedAddresses.length > 0 && (
                <div>
                  <label style={labelStyle}>Saved Addresses</label>
                  <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {savedAddresses.map((addr: any) => (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() => selectSavedAddress(addr)}
                        style={{
                          flexShrink: 0, padding: '10px 14px', borderRadius: 10, textAlign: 'left',
                          minWidth: 160, maxWidth: 200,
                          border: selectedAddressId === addr._id ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                          background: selectedAddressId === addr._id ? 'color-mix(in srgb, var(--lime-400) 8%, transparent)' : 'var(--surface-container)',
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: selectedAddressId === addr._id ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>
                            {addr.label === 'Home' ? 'home' : addr.label === 'Work' ? 'business' : 'location_on'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: selectedAddressId === addr._id ? 'var(--lime-400)' : 'var(--foreground)', fontFamily: 'var(--font-lexend)', textTransform: 'uppercase' }}>{addr.label}</span>
                          {addr.isDefault && <span style={{ fontSize: 8, background: 'var(--lime-400)', color: '#000', padding: '1px 4px', borderRadius: 3, fontWeight: 800 }}>DEFAULT</span>}
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addr.address}, {addr.city}</p>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={clearSavedAddress}
                      style={{
                        flexShrink: 0, padding: '10px 14px', borderRadius: 10, minWidth: 100,
                        border: !selectedAddressId ? '2px solid var(--lime-400)' : '1px dashed var(--outline)',
                        background: !selectedAddressId ? 'color-mix(in srgb, var(--lime-400) 8%, transparent)' : 'transparent',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: !selectedAddressId ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>add</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: !selectedAddressId ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>New</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  required
                  style={inputStyle}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  required
                  type="email"
                  style={inputStyle}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  required
                  type="tel"
                  style={inputStyle}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="050 000 0000"
                  autoComplete="tel"
                />
              </div>

              {/* Address */}
              <div>
                <label style={labelStyle}>Address</label>
                <input
                  required
                  list="ghana-addresses"
                  style={inputStyle}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street address"
                  autoComplete="street-address"
                />
              </div>

              {/* City + Region */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input
                    required
                    list="ghana-cities"
                    style={inputStyle}
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="City"
                    autoComplete="address-level2"
                  />
                </div>
                 <div>
                   <label style={labelStyle}>Region</label>
                   <select
                     required
                     style={inputStyle}
                     value={region}
                     onChange={e => setRegion(e.target.value)}
                   >
                     <option value="">Select Region</option>
                     {shippingRates.map(r => (
                       <option key={r.region} value={r.region}>{r.region}</option>
                     ))}
                     <option value="Other">Other (Contact Support)</option>
                   </select>
                   {region && region !== 'Other' && shippingRates.find(r => r.region === region) && (
                     <p style={{ fontSize: 10, color: 'var(--lime-400)', marginTop: 4, fontWeight: 600 }}>
                       Est. Delivery: {shippingRates.find(r => r.region === region).estimatedDays}
                     </p>
                   )}
                 </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                width: '100%', padding: '16px', marginTop: 24,
                background: 'var(--lime-400)', color: 'var(--on-lime-400)',
                fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 14,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Continue to Payment
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginBottom: 16, fontFamily: 'var(--font-inter)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span> Back to Shipping
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: 'var(--foreground)' }}>Payment Method</h2>
              <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: 'var(--lime-400)', letterSpacing: '0.08em' }}>STEP 2/2</span>
            </div>

            {/* Payment method toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['MOBILE_MONEY', 'CARD'] as const).map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)} style={{
                  flex: 1, padding: '14px', borderRadius: 10,
                  border: paymentMethod === m ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                  background: paymentMethod === m ? 'rgba(195,244,0,0.06)' : 'var(--surface-container)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: paymentMethod === m ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>
                    {m === 'MOBILE_MONEY' ? 'smartphone' : 'credit_card'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: paymentMethod === m ? 'var(--lime-400)' : 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                    {m === 'MOBILE_MONEY' ? 'Mobile Money' : 'Card'}
                  </span>
                </button>
              ))}
            </div>

            {paymentMethod === 'MOBILE_MONEY' ? (
              <div className="animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 20 }}>
                {/* Network selection — 3 options */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {networkOptions.map(n => (
                    <button key={n.key} type="button" onClick={() => setMobileNetwork(n.key)} style={{
                      flex: 1, padding: '10px 6px', borderRadius: 8,
                      background: mobileNetwork === n.key ? n.bg : 'var(--surface-container)',
                      color: mobileNetwork === n.key ? n.color : 'var(--on-surface-variant)',
                      border: mobileNetwork === n.key ? 'none' : '1px solid var(--outline)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 800,
                      transition: 'all 0.2s',
                    }}>{n.label}</button>
                  ))}
                </div>

                {/* Detected network hint */}
                {momoPhone.replace(/[\s\-]/g, '').length >= 3 && detectNetwork(momoPhone) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(195,244,0,0.08)', border: '1px solid rgba(195,244,0,0.2)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--lime-400)' }}>check_circle</span>
                    <span style={{ fontSize: 11, color: 'var(--lime-400)', fontWeight: 600 }}>
                      {detectNetwork(momoPhone) === 'MTN' ? 'MTN Mobile Money' :
                       detectNetwork(momoPhone) === 'TELECEL' ? 'Telecel Cash' :
                       'AirtelTigo Cash'} number detected
                    </span>
                  </div>
                )}

                <label style={labelStyle}>Mobile Money Number</label>
                <input
                  required
                  type="tel"
                  style={inputStyle}
                  value={momoPhone}
                  onChange={e => handleMomoPhoneChange(e.target.value)}
                  placeholder="Enter your mobile money number"
                  autoComplete="off"
                />
                <p style={{ fontSize: 10, color: 'var(--on-surface-variant)', marginTop: 8, lineHeight: 1.5 }}>
                  Network is auto-detected from your number prefix. MTN: 054, 024, 025, 055, 029, 059, 027, 057 · Telecel: 050, 020 · AirtelTigo: 026, 056
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in srgb, var(--lime-400) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--lime-400)' }}>credit_card</span>
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--foreground)', marginBottom: 6 }}>Secure Card Payment</h3>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6, maxWidth: 280 }}>
                    Your card details will be securely collected by Paystack&apos;s encrypted payment form when you click &quot;Pay&quot;.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'color-mix(in srgb, var(--lime-400) 6%, transparent)', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--lime-400) 15%, transparent)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--lime-400)' }}>verified_user</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)' }}>PCI-DSS Compliant · 256-bit SSL</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: 0.5 }}>
                  <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Accepts: Visa, Mastercard, Verve, Bank Transfer</span>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div style={{ marginTop: 24, background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Order Summary</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: 'var(--surface-container)' }}>
                      <img style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.name} src={item.image} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{item.name}</p>
                      <p style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>Qty: {item.quantity}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</p>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>GH₵{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              {/* Shipping address recap */}
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface-container)', borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Shipping to</p>
                <p style={{ fontSize: 12, color: 'var(--foreground)' }}>{fullName}</p>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{address}{city ? `, ${city}` : ''}{region ? `, ${region}` : ''}</p>
              </div>

              <div style={{ height: 1, background: 'var(--outline)', margin: '12px 0' }} />

              {/* Promo Code Input */}
              <div style={{ marginBottom: 16 }}>
                {!appliedPromo ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      value={promoInput} 
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo Code" 
                      style={{ flex: 1, padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 8, color: 'var(--foreground)', textTransform: 'uppercase', outline: 'none' }} 
                    />
                    <button 
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoInput.trim()}
                      style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--surface-container-high)', border: '1px solid var(--outline)', color: 'var(--foreground)', fontWeight: 700, cursor: (promoLoading || !promoInput.trim()) ? 'not-allowed' : 'pointer' }}
                    >
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'color-mix(in srgb, var(--lime-400) 10%, transparent)', border: '1px solid var(--lime-400)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 18 }}>local_activity</span>
                      <span style={{ fontWeight: 700, color: 'var(--lime-400)' }}>{appliedPromo.code}</span>
                    </div>
                    <button type="button" onClick={removePromo} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Remove</button>
                  </div>
                )}
                {promoError && <p style={{ color: 'var(--error)', fontSize: 11, marginTop: 6 }}>{promoError}</p>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--on-surface-variant)', fontSize: 13 }}>Subtotal</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--foreground)', fontSize: 13 }}>GH₵{totalPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--on-surface-variant)', fontSize: 13 }}>Delivery</span>
                {appliedPromo && appliedPromo.type === 'Shipping' ? (
                  <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--lime-400)', fontSize: 13 }}>FREE</span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: shippingFee > 0 ? 'var(--foreground)' : 'var(--on-surface-variant)', fontSize: 13 }}>{shippingFee > 0 ? `GH₵${shippingFee.toFixed(2)}` : 'Select Region'}</span>
                )}
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--lime-400)', fontSize: 13 }}>Discount ({appliedPromo?.code})</span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--lime-400)', fontSize: 13 }}>-GH₵{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 900, color: 'var(--foreground)', fontSize: 16 }}>Total</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 900, color: 'var(--price-color)', fontSize: 20 }}>GH₵{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '18px', marginTop: 24,
                background: loading ? 'var(--on-surface-variant)' : 'var(--lime-400)', color: 'var(--on-lime-400)',
                fontFamily: 'var(--font-lexend)', fontWeight: 900, fontSize: 15,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                border: 'none', borderRadius: 10, cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
                  {paymentStatus === 'verifying' ? 'Verifying Payment...' : 'Processing Payment...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
                  Pay with Paystack — GH₵{finalTotal.toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
