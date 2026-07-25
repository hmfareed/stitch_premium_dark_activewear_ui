'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, useAuth, useToast } from '@/context/AppContext';

/* ── Ghana location suggestions ── */
const GHANA_CITIES = [
  'Tamale', 'Accra', 'Kumasi', 'Savelugu', 'Yendi', 'Bolgatanga', 'Salaga',
  'Wa', 'Navrongo', 'Bawku', 'Sunyani', 'Takoradi', 'Cape Coast', 'Obuasi',
  'Teshie', 'Madina', 'Tema', 'Kasoa', 'Koforidua', 'Ho', 'Techiman',
];

const GHANA_REGIONS = [
  'Northern', 'Upper East', 'Upper West', 'North East', 'Savannah',
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Bono', 'Bono East', 'Ahafo', 'Western North', 'Oti',
];

const GHANA_ADDRESSES = [
  // ── Core & Highly Popular Tamale Neighborhoods ──
  'Lamashegu Market Road',
  'Nyohini West Road',
  'Vittin Estate Block C',
  'Kalpohin Estate Road',
  'Choggu Main Road',
  'Jisonayili Residential Road',
  'Kukuo Health Center Road',
  'Sagnarigu Main Street',
  'Kanvili Estate Area',
  'Fuo Residential Area',
  'Kpalsi Residential Road',
  'Dungu UDS Campus Road',
  'Banvim Residential Zone',
  'Gurugu Main Road',
  'Tishigu Street',
  'Gumbihini West',
  'Bolgatanga Road, Tamale',
  'Salaga Road, Tamale',

  // ── Specific Unpopular & Niche Tamale Suburbs ──
  'Shishegu Area, Tamale',
  'Lamankara Street',
  'Changli Main Street',
  'Kasaligu Residential Area',
  'Tuutingli Community Area',
  'Yapalsi Lane',
  'Katariga Village Road',
  'Sanvili Road, Tamale',
  'Zogbeli Lane',
  'Dakpema Palaces Area',
  'Sakasaka Residential Area',
  'Moshie Zongo Area',
  'Ward K Suburb',
  'Suhuyini Street',
  'Fooshegu Community Area',
  'Tamale Industrial Area'
];

/* ── Network detection by prefix ── */
const MTN_PREFIXES = ['054', '024', '025', '055', '029', '059', '027', '057'];
const TELECEL_PREFIXES = ['050', '020'];
const AIRTELTIGO_PREFIXES = ['026', '056'];

type MobileNetwork = 'MTN' | 'TELECEL' | 'AIRTELTIGO';

// Map our internal network label → Paystack mobile_money_type value
const NETWORK_TO_PAYSTACK: Record<MobileNetwork, string> = {
  MTN: 'mtn',
  TELECEL: 'vod',
  AIRTELTIGO: 'tgo',
};

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
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARD' | 'CASH_ON_DELIVERY' | 'INSTALLMENT'>('MOBILE_MONEY');
  const [mobileNetwork, setMobileNetwork] = useState<MobileNetwork>('MTN');
  const [loading, setLoading] = useState(false);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'verifying' | 'success' | 'failed'>('idle');
  const [paystackReady, setPaystackReady] = useState(false);

  /* ── OTP State ── */
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSimCode, setOtpSimCode] = useState(''); // dev: show simulated code

  /* ── BNPL / Installment State ── */
  const [installmentMonths, setInstallmentMonths] = useState(3);

  /* ── Loyalty Points State ── */
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const POINTS_PER_CEDI = 1000;

  /* ── Click-and-Collect State ── */
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');

  /* ── Promo Code State ── */
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  /* Fetch loyalty balance when user logs in */
  useEffect(() => {
    if (user?.email) {
      fetch(`/api/loyalty?email=${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(data => { if (data.success) setLoyaltyBalance(data.points); })
        .catch(() => { });
    }
  }, [user]);

  /* ── Shipping form state (pre-filled from profile) ── */
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Tamale');
  const [region, setRegion] = useState('Northern');
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

  // Load Paystack inline script — track when it is ready so Pay button can use popup
  useEffect(() => {
    // If already loaded by a previous mount, mark ready immediately
    if ((window as any).PaystackPop) {
      setPaystackReady(true);
      return;
    }
    // Avoid injecting duplicate scripts
    const existing = document.querySelector('script[src*="paystack"]');
    if (existing) {
      existing.addEventListener('load', () => setPaystackReady(true));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackReady(true);
    script.onerror = () => console.warn('Paystack inline script failed to load — will use hosted redirect.');
    document.body.appendChild(script);
    return () => {
      // Leave the script in DOM so it stays available; just clean up state
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

  /* Whether the current region allows Cash on Delivery */
  const selectedRateData = shippingRates.find(r => r.region === region);
  const regionCoversCOD = selectedRateData ? selectedRateData.coversCOD : true;

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
        .catch(() => { });
    }
  }, [user, isLoading, router]);

  /* If CoD was selected but region no longer supports it, fall back to MoMo */
  useEffect(() => {
    if (paymentMethod === 'CASH_ON_DELIVERY' && !regionCoversCOD && region) {
      setPaymentMethod('MOBILE_MONEY');
    }
  }, [region, regionCoversCOD]);

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

  /* ── Loyalty Points Discount ── */
  const maxRedeemablePts = Math.min(loyaltyBalance, Math.floor(totalPrice * POINTS_PER_CEDI * 0.2)); // max 20% of order
  const loyaltyDiscount = redeemPoints ? parseFloat((pointsToRedeem / POINTS_PER_CEDI).toFixed(2)) : 0;

  const actualShippingFee = (deliveryType === 'pickup') ? 0 : ((appliedPromo && appliedPromo.type === 'Shipping') ? 0 : shippingFee);
  const finalTotal = Math.max(0, totalPrice - discountAmount - loyaltyDiscount + actualShippingFee);

  /* ── MoMo OTP Handlers ── */
  const handleSendOTP = async () => {
    if (!momoPhone) { setOtpError('Enter your MoMo number first'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: momoPhone, purpose: 'checkout' }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        if (data.simulated && data.message) {
          // Extract code from dev message for testing
          const match = data.message.match(/Code: (\d{6})/);
          if (match) setOtpSimCode(match[1]);
        }
        showToast('OTP sent to your phone!', 'success');
      } else {
        setOtpError(data.error || 'Failed to send OTP');
      }
    } catch { setOtpError('Network error'); }
    setOtpLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) { setOtpError('Enter the 6-digit code'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      const res = await fetch(`/api/otp?phone=${encodeURIComponent(momoPhone)}&code=${otpCode}`);
      const data = await res.json();
      if (data.success) {
        setOtpVerified(true);
        showToast('Phone verified! ✅', 'success');
      } else {
        setOtpError(data.error || 'Invalid OTP');
      }
    } catch { setOtpError('Verification failed'); }
    setOtpLoading(false);
  };

  /* ── Cash on Delivery handler ── */
  const handlePlaceOrderCOD = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerEmail = user?.email || email;
    if (!customerEmail || !fullName) {
      showToast('Please fill in your name and email', 'error');
      setStep(1);
      return;
    }
    setLoading(true);
    setPaymentStatus('processing');
    const orderId = `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
    const orderData = {
      orderId,
      date: new Date(),
      status: 'Pending',
      total: finalTotal,
      itemsCount: cart.length,
      shippingAddress: { fullName, email: customerEmail, phone, address, city, region },
      paymentInfo: {
        method: deliveryType === 'pickup' ? 'Click & Collect' : 'Cash on Delivery',
        paymentStatus: 'Pending',
        escrowStatus: 'NA',
      },
      products: cart.map(item => ({
        id: item.id, name: item.name, price: item.price, image: item.image,
        quantity: item.quantity, selectedSize: item.selectedSize,
        category: item.category, vendorEmail: item.vendorEmail, vendorStoreName: item.vendorStoreName,
      })),
      customerName: user?.name || fullName || '',
      customerEmail,
      promoCode: appliedPromo ? appliedPromo.code : undefined,
      discountAmount: discountAmount || undefined,
    };
    try {
      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
      // SMS order confirmation
      if (phone) {
        try {
          await fetch('/api/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, purpose: 'checkout' }),
          });
        } catch { }
      }
      // Award loyalty points (1 point per GH₵1 spent)
      if (user?.email) {
        const earnedPoints = Math.floor(finalTotal);
        fetch('/api/loyalty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, action: 'award', points: earnedPoints, reason: `Order ${orderId}` }),
        }).catch(() => { });
        // Deduct redeemed points
        if (redeemPoints && pointsToRedeem > 0) {
          fetch('/api/loyalty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, action: 'redeem', points: pointsToRedeem, reason: `Redeemed on ${orderId}` }),
          }).catch(() => { });
        }
      }
    } catch (err) { console.error('Failed to save COD order:', err); }
    clearCart();
    setLoading(false);
    setPaymentStatus('success');
    showToast('Order placed! Pay cash on delivery.', 'success');
    router.push(`/confirmation?orderId=${orderId}&verified=true&cod=true`);
  };

  const buildOrderData = (customOrderId?: string, paymentRef?: string) => {
    const finalOrderId = customOrderId || `ORD-${Math.floor(Math.random() * 900000) + 100000}`;
    return {
      orderId: finalOrderId,
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
      customerName: user?.name || fullName || '',
      customerEmail: user?.email || email || '',
      promoCode: appliedPromo ? appliedPromo.code : undefined,
      discountAmount: discountAmount || undefined,
    };
  };

  const saveOrderAndRedirect = async (customOrderId: string, paymentRef?: string) => {
    const orderData = buildOrderData(customOrderId, paymentRef);
    try {
      await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
    } catch (err) { console.error('Failed to save order:', err); }
    clearCart();
    setLoading(false);
    setPaymentStatus('success');
    showToast('Order placed successfully!');
    router.push(`/confirmation?reference=${paymentRef || customOrderId}&orderId=${customOrderId}&verified=true`);
  };

  /**
   * Wait up to `maxMs` milliseconds for window.PaystackPop to become available.
   * Returns true if it becomes available, false on timeout.
   */
  const waitForPaystackPop = (maxMs = 4000): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).PaystackPop) { resolve(true); return; }
      const interval = setInterval(() => {
        if ((window as any).PaystackPop) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(true);
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        resolve(false);
      }, maxMs);
    });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    if (paymentMethod === 'CASH_ON_DELIVERY') {
      return handlePlaceOrderCOD(e);
    }
    // MoMo OTP check
    if (paymentMethod === 'MOBILE_MONEY' && !otpVerified) {
      showToast('Please verify your MoMo number with the OTP first', 'error');
      return;
    }
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

    const orderId = `ORD-${Math.floor(Math.random() * 900000) + 100000}`;

    // If Paystack is not configured, fall back to direct order (simulation)
    if (!paystackKey || paystackKey === 'pk_test_xxxx' || paystackKey === 'pk_live_xxxx' || paystackKey.includes('xxxx')) {
      console.warn('Paystack public key is missing or using placeholder. Falling back to simulated checkout.');
      await saveOrderAndRedirect(orderId);
      return;
    }

    const paystackChannels = paymentMethod === 'MOBILE_MONEY' ? ['mobile_money'] : ['card', 'bank', 'bank_transfer'];
    const momoType = paymentMethod === 'MOBILE_MONEY' ? NETWORK_TO_PAYSTACK[mobileNetwork] : undefined;

    const orderDataForMetadata = buildOrderData(orderId);

    // Wait up to 4s for the Paystack inline script to fully load
    const isPopAvailable = await waitForPaystackPop(4000);

    // If the Paystack inline popup is available, use it — best UX
    if (isPopAvailable && (window as any).PaystackPop) {
      try {
        const popupConfig: Record<string, any> = {
          key: paystackKey,
          email: customerEmail,
          amount: Math.round(finalTotal * 100), // convert GHS to pesewas
          currency: 'GHS',
          ref: orderId,
          channels: paystackChannels,
          metadata: {
            custom_fields: [
              { display_name: 'Customer Name', variable_name: 'customer_name', value: customerName },
              { display_name: 'Order ID', variable_name: 'order_id', value: orderId },
            ],
            orderData: orderDataForMetadata,
          },
          callback: async (response: any) => {
            setPaymentStatus('verifying');
            try {
              const verifyRes = await fetch(`/api/paystack/verify?reference=${response.reference}`);
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                await saveOrderAndRedirect(orderId, response.reference);
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
          },
        };

        // Pass mobile_money_type so Paystack routes to the correct MoMo provider
        if (momoType) popupConfig.mobile_money_type = momoType;
        if (paymentMethod === 'MOBILE_MONEY' && momoPhone) popupConfig.phone = momoPhone;

        const handler = (window as any).PaystackPop.setup(popupConfig);
        handler.openIframe();
        return; // popup opened — do not fall through to hosted redirect
      } catch (err) {
        console.warn('Paystack inline popup setup failed, falling back to hosted redirect:', err);
        // Fall through to hosted checkout below
      }
    } else {
      console.warn('PaystackPop not available after waiting — using hosted redirect.');
    }

    // ── Fallback: Hosted payment page redirect ──────────────────────────────
    try {
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          amount: finalTotal,
          reference: orderId,
          callback_url: `${window.location.origin}/confirmation`,
          metadata: {
            orderId,
            customerName,
            items: cart.length,
            custom_fields: [
              { display_name: 'Customer Name', variable_name: 'customer_name', value: customerName },
              { display_name: 'Order ID', variable_name: 'order_id', value: orderId },
            ],
            orderData: orderDataForMetadata,
          },
          channels: paystackChannels,
          ...(paymentMethod === 'MOBILE_MONEY' && momoPhone ? { phone: momoPhone } : {}),
          ...(momoType ? { mobile_money_type: momoType } : {}),
        }),
      });
      const initData = await initRes.json();

      if (!initData.success) {
        showToast(initData.error || 'Payment initialization failed', 'error');
        setLoading(false);
        setPaymentStatus('failed');
        return;
      }

      if (initData.authorization_url) {
        const pendingOrder = buildOrderData(orderId);
        localStorage.setItem('africart-pending-order', JSON.stringify(pendingOrder));
        localStorage.setItem('africart-pending-ref', initData.reference || orderId);
        // Navigate to Paystack-hosted payment page
        window.location.href = initData.authorization_url;
      } else {
        showToast('Payment gateway not available. Please try again.', 'error');
        setLoading(false);
        setPaymentStatus('failed');
      }
    } catch (err: any) {
      console.error('Paystack hosted checkout error:', err);
      showToast(`Payment error: ${err.message || 'Please try again.'}`, 'error');
      setLoading(false);
      setPaymentStatus('failed');
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

  // Award loyalty points and save order after successful payment
  const finalizeOrderWithLoyalty = async (orderId: string, paymentRef?: string) => {
    if (user?.email) {
      const earnedPoints = Math.floor(finalTotal);
      fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, action: 'award', points: earnedPoints, reason: `Order ${orderId}` }),
      }).catch(() => { });
      if (redeemPoints && pointsToRedeem > 0) {
        fetch('/api/loyalty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, action: 'redeem', points: pointsToRedeem, reason: `Redeemed on ${orderId}` }),
        }).catch(() => { });
      }
    }
    await saveOrderAndRedirect(orderId, paymentRef);
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

  /* Guest checkout banner — shown when visitor is not logged in */
  const GuestBanner = !user ? (
    <div className="animate-fade-in" style={{
      margin: '0 0 20px', padding: '12px 16px', borderRadius: 12,
      background: 'linear-gradient(135deg, rgba(195,244,0,0.06) 0%, rgba(0,229,255,0.06) 100%)',
      border: '1px solid rgba(195,244,0,0.18)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--lime-400)', flexShrink: 0 }}>person_outline</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 800, color: 'var(--foreground)', marginBottom: 2 }}>
          Checking out as Guest
        </p>
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
          You&apos;re not signed in. Fill in your details below to complete your order.
        </p>
      </div>
      <a href="/login?redirect=/checkout" style={{
        flexShrink: 0, padding: '6px 12px', borderRadius: 8,
        background: 'var(--lime-400)', color: '#000',
        fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>login</span>
        Sign In
      </a>
    </div>
  ) : null;

  /* Network button config */
  const networkOptions: { key: MobileNetwork; label: string; bg: string; color: string }[] = [
    { key: 'MTN', label: 'MTN MoMo', bg: '#FFCB05', color: '#000' },
    { key: 'TELECEL', label: 'Telecel Cash', bg: '#E60012', color: '#fff' },
    { key: 'AIRTELTIGO', label: 'AT Cash', bg: '#E4002B', color: '#fff' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '80vh', padding: '0 16px', paddingBottom: 140 }}>

      {/* Guest checkout banner */}
      {GuestBanner}

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
          {paymentMethod === 'MOBILE_MONEY' && <div style={{ height: 3, flex: 1, background: step >= 3 ? 'var(--lime-400)' : 'var(--outline)', borderRadius: 4, transition: 'all 0.3s' }} />}
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

            {/* Click-and-Collect Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['delivery', 'pickup'] as const).map(type => (
                <button key={type} type="button" onClick={() => setDeliveryType(type)} style={{
                  flex: 1, padding: '12px 8px', borderRadius: 10,
                  border: deliveryType === type ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                  background: deliveryType === type ? 'rgba(195,244,0,0.06)' : 'var(--surface-container)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: deliveryType === type ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>
                    {type === 'delivery' ? 'local_shipping' : 'storefront'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 10, fontWeight: 700, color: deliveryType === type ? 'var(--lime-400)' : 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                    {type === 'delivery' ? 'Home Delivery' : 'Pickup at Store'}
                  </span>
                  {type === 'pickup' && <span style={{ fontSize: 9, color: 'var(--lime-400)', fontWeight: 600 }}>FREE · No delivery fee</span>}
                </button>
              ))}
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {([
                { key: 'MOBILE_MONEY', label: 'Mobile Money', icon: 'smartphone', disabled: false },
                { key: 'CARD', label: 'Card', icon: 'credit_card', disabled: false },
                { key: 'INSTALLMENT', label: 'Installment', icon: 'calendar_month', disabled: false },
                { key: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', icon: 'local_shipping', disabled: !regionCoversCOD && deliveryType !== 'pickup' },
              ] as const).map(m => (
                <button
                  key={m.key}
                  type="button"
                  disabled={m.disabled}
                  onClick={() => !m.disabled && setPaymentMethod(m.key as typeof paymentMethod)}
                  title={m.disabled ? 'Not available in your region' : undefined}
                  style={{
                    flex: '1 1 80px', padding: '12px 8px', borderRadius: 10,
                    border: paymentMethod === m.key ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                    background: m.disabled ? 'var(--surface-container)' : paymentMethod === m.key ? 'rgba(195,244,0,0.06)' : 'var(--surface-container)',
                    cursor: m.disabled ? 'not-allowed' : 'pointer',
                    opacity: m.disabled ? 0.38 : 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    position: 'relative',
                  }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: m.disabled ? 'var(--on-surface-variant)' : paymentMethod === m.key ? 'var(--lime-400)' : 'var(--on-surface-variant)' }}>
                    {m.icon}
                  </span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 9, fontWeight: 700, color: m.disabled ? 'var(--on-surface-variant)' : paymentMethod === m.key ? 'var(--lime-400)' : 'var(--on-surface-variant)', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2 }}>
                    {m.label}
                  </span>
                  {m.disabled && (
                    <span style={{ position: 'absolute', bottom: 3, fontSize: 7, color: 'var(--error)', fontWeight: 700, fontFamily: 'var(--font-lexend)', letterSpacing: '0.02em' }}>N/A IN REGION</span>
                  )}
                </button>
              ))}
            </div>

            {/* CoD unavailable notice */}
            {!regionCoversCOD && region && region !== 'Other' && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.2)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ff9800', flexShrink: 0 }}>info</span>
                <p style={{ fontFamily: 'var(--font-inter)', fontSize: 11, color: '#ff9800', lineHeight: 1.5 }}>
                  Cash on Delivery is not available in <strong>{region}</strong>. Please pay via Mobile Money or Card.
                </p>
              </div>
            )}

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

                {/* OTP Verification */}
                {!otpVerified ? (
                  <div style={{ marginTop: 16, padding: 16, background: 'var(--surface-container)', borderRadius: 10, border: '1px solid var(--outline)' }}>
                    <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Verify Your MoMo Number</p>
                    {!otpSent ? (
                      <button type="button" onClick={handleSendOTP} disabled={otpLoading || !momoPhone} style={{ width: '100%', padding: '12px', borderRadius: 8, background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, border: 'none', cursor: otpLoading || !momoPhone ? 'not-allowed' : 'pointer', opacity: !momoPhone ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {otpLoading ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>progress_activity</span> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sms</span>}
                        {otpLoading ? 'Sending...' : 'Send OTP to My Phone'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {otpSimCode && (
                          <div style={{ padding: '8px 12px', background: 'rgba(255,152,0,0.1)', borderRadius: 8, border: '1px solid rgba(255,152,0,0.3)' }}>
                            <p style={{ fontSize: 11, color: '#ff9800', fontWeight: 700 }}>🔧 DEV MODE — OTP: <strong>{otpSimCode}</strong></p>
                          </div>
                        )}
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 6-digit OTP"
                          style={{ ...inputStyle, letterSpacing: '0.3em', fontSize: 18, textAlign: 'center', fontWeight: 800 }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" onClick={handleVerifyOTP} disabled={otpLoading} style={{ flex: 1, padding: '12px', borderRadius: 8, background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer' }}>
                            {otpLoading ? 'Verifying...' : 'Verify OTP'}
                          </button>
                          <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setOtpSimCode(''); }} style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--outline)', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: 12 }}>Resend</button>
                        </div>
                      </div>
                    )}
                    {otpError && <p style={{ color: 'var(--error)', fontSize: 11, marginTop: 8 }}>{otpError}</p>}
                  </div>
                ) : (
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(195,244,0,0.08)', border: '1px solid var(--lime-400)', borderRadius: 10 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)', fontSize: 20, fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: 'var(--lime-400)' }}>MoMo number verified ✅</span>
                  </div>
                )}
              </div>
            ) : paymentMethod === 'INSTALLMENT' ? (
              <div className="animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'color-mix(in srgb, #a855f7 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#a855f7' }}>calendar_month</span>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--foreground)', marginBottom: 2 }}>Pay in Installments (BNPL)</h3>
                    <p style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Powered by Paystack Payment Plans</p>
                  </div>
                </div>
                <label style={labelStyle}>Select Payment Plan</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  {[3, 6, 12].map(months => {
                    const monthly = (finalTotal / months).toFixed(2);
                    return (
                      <button key={months} type="button" onClick={() => setInstallmentMonths(months)} style={{
                        flex: 1, padding: '14px 8px', borderRadius: 10, textAlign: 'center',
                        border: installmentMonths === months ? '2px solid #a855f7' : '1px solid var(--outline)',
                        background: installmentMonths === months ? 'color-mix(in srgb, #a855f7 8%, transparent)' : 'var(--surface-container)',
                        cursor: 'pointer',
                      }}>
                        <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, fontWeight: 800, color: installmentMonths === months ? '#a855f7' : 'var(--foreground)' }}>{months}</div>
                        <div style={{ fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>months</div>
                        <div style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: installmentMonths === months ? '#a855f7' : 'var(--on-surface-variant)', marginTop: 4 }}>GH₵{monthly}/mo</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: '14px', background: 'var(--surface-container)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Monthly payment</span><span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, color: '#a855f7' }}>GH₵{(finalTotal / installmentMonths).toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Duration</span><span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700 }}>{installmentMonths} months</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Total amount</span><span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, color: 'var(--price-color)' }}>GH₵{finalTotal.toFixed(2)}</span></div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'color-mix(in srgb, #a855f7 8%, transparent)', borderRadius: 8, border: '1px solid color-mix(in srgb, #a855f7 20%, transparent)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#a855f7' }}>info</span>
                  <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 600 }}>First payment processed today · Powered by Paystack</span>
                </div>
              </div>
            ) : paymentMethod === 'CARD' ? (
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
            ) : (
              /* Cash on Delivery Info Box */
              <div className="animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in srgb, #ff9800 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ff9800' }}>local_shipping</span>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--foreground)', marginBottom: 4 }}>Cash on Delivery</h3>
                    <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Pay in cash when your order arrives at your door. No upfront payment needed.</p>
                  </div>
                </div>
                {[
                  { icon: 'check_circle', text: 'Place your order now — no upfront payment' },
                  { icon: 'local_shipping', text: 'Your items will be prepared and shipped' },
                  { icon: 'payments', text: 'Pay the rider in cash upon delivery' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface-container)', borderRadius: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ff9800' }}>{step.icon}</span>
                    <span style={{ fontSize: 13, color: 'var(--foreground)', fontFamily: 'var(--font-inter)' }}>{step.text}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'color-mix(in srgb, #ff9800 8%, transparent)', borderRadius: 10, border: '1px solid color-mix(in srgb, #ff9800 20%, transparent)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ff9800' }}>info</span>
                  <span style={{ fontSize: 11, color: '#ff9800', fontWeight: 600, fontFamily: 'var(--font-lexend)' }}>Available in all Ghana regions · Exact change appreciated</span>
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

              {/* Loyalty Points Redemption */}
              {user && loyaltyBalance >= POINTS_PER_CEDI && (
                <div style={{ marginBottom: 16, padding: '14px', background: 'color-mix(in srgb, #fbbf24 6%, transparent)', border: '1px solid color-mix(in srgb, #fbbf24 25%, transparent)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fbbf24' }}>stars</span>
                      <span style={{ fontFamily: 'var(--font-lexend)', fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>Loyalty Points: {loyaltyBalance.toLocaleString()} pts</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <div onClick={() => { setRedeemPoints(!redeemPoints); if (!redeemPoints) setPointsToRedeem(Math.min(loyaltyBalance, Math.floor(finalTotal * POINTS_PER_CEDI * 0.2))); else setPointsToRedeem(0); }} style={{ width: 40, height: 22, borderRadius: 11, background: redeemPoints ? '#fbbf24' : 'var(--outline-variant)', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: redeemPoints ? '#000' : 'var(--on-surface-variant)', position: 'absolute', top: 2, left: redeemPoints ? 20 : 2, transition: 'left 0.3s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Redeem</span>
                    </label>
                  </div>
                  {redeemPoints && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Redeeming {pointsToRedeem.toLocaleString()} pts</span>
                      <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, color: '#fbbf24', fontSize: 13 }}>-GH₵{loyaltyDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--on-surface-variant)', fontSize: 13 }}>Subtotal</span>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--foreground)', fontSize: 13 }}>GH₵{totalPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--on-surface-variant)', fontSize: 13 }}>Delivery</span>
                {deliveryType === 'pickup' ? (
                  <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: 'var(--lime-400)', fontSize: 13 }}>FREE (Pickup)</span>
                ) : appliedPromo && appliedPromo.type === 'Shipping' ? (
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
              {loyaltyDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: '#fbbf24', fontSize: 13 }}>Points Discount</span>
                  <span style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, color: '#fbbf24', fontSize: 13 }}>-GH₵{loyaltyDiscount.toFixed(2)}</span>
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
