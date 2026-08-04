'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorPOSPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // POS Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [orderDiscount, setOrderDiscount] = useState(0); // GH₵
  const [couponCode, setCouponCode] = useState('');

  // Held Sales State
  const [heldSales, setHeldSales] = useState<any[]>([]);
  const [showHeldDrawer, setShowHeldDrawer] = useState(false);

  // Split Payment Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [cashTender, setCashTender] = useState('');
  const [cardTender, setCardTender] = useState('');
  const [momoTender, setMomoTender] = useState('');
  const [walletTender, setWalletTender] = useState('');
  const [customerName, setCustomerName] = useState('In-Store Walk-in Buyer');

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any>(null);

  // Cash Drawer Float State
  const [cashDrawer, setCashDrawer] = useState({ openFloat: 500.00, cashSales: 0.00 });
  const [showDrawerModal, setShowDrawerModal] = useState(false);

  // Offline Mode State
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPOSData();

    // Online/Offline Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Barcode Listener Simulation
    let barcodeBuffer = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && barcodeBuffer.length >= 6) {
        handleBarcodeScan(barcodeBuffer);
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchPOSData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/pos');
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setHeldSales(data.heldSales || []);
        if (data.cashDrawerFloat) setCashDrawer(data.cashDrawerFloat);
      }
    } catch (err) {
      console.error('Failed to load POS:', err);
    } finally {
      setLoading(false);
    }
  };

  // Barcode Handler
  const handleBarcodeScan = (barcode: string) => {
    const matched = products.find(p => p.barcode === barcode || p.sku === barcode);
    if (matched) {
      addToCart(matched);
      showToast(`Scanned barcode: ${matched.name}`, 'info');
    }
  };

  // Cart Functions
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product._id);
      if (existing) {
        return prev.map(item => item.id === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, {
          id: product._id,
          name: product.title || product.name,
          price: product.price,
          quantity: 1,
          image: (product.images && product.images[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200',
        }];
      }
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Cart Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = Math.max(0, subtotal - orderDiscount);

  // Split Payment Calculations
  const cashVal = Number(cashTender) || 0;
  const cardVal = Number(cardTender) || 0;
  const momoVal = Number(momoTender) || 0;
  const walletVal = Number(walletTender) || 0;
  const totalPaid = cashVal + cardVal + momoVal + walletVal;
  const changeDue = Math.max(0, cashVal - (totalAmount - (cardVal + momoVal + walletVal)));
  const balanceRemaining = Math.max(0, totalAmount - totalPaid);

  // Hold Sale
  const handleHoldSale = async () => {
    if (cart.length === 0) { showToast('Cart is empty', 'error'); return; }
    try {
      const res = await fetch('/api/vendor/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hold_sale',
          items: cart,
          totalAmount,
          customer: { name: customerName },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Sale held on draft!', 'info');
      setHeldSales(data.heldSales || []);
      setCart([]);
      setOrderDiscount(0);
    } catch (err: any) {
      showToast(err.message || 'Error holding sale', 'error');
    }
  };

  // Resume Sale
  const handleResumeSale = (held: any) => {
    setCart(held.items);
    setOrderDiscount(0);
    handleDeleteHeld(held.id);
    setShowHeldDrawer(false);
    showToast('Held sale restored to cart!', 'success');
  };

  const handleDeleteHeld = async (heldSaleId: string) => {
    try {
      const res = await fetch('/api/vendor/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume_sale', heldSaleId }),
      });
      const data = await res.json();
      if (res.ok) setHeldSales(data.heldSales || []);
    } catch (err) {
      console.error('Error deleting held sale:', err);
    }
  };

  // Complete POS Checkout
  const handleCompleteCheckout = async () => {
    if (cart.length === 0) return;
    if (totalPaid < totalAmount) {
      showToast(`Insufficient payment! Balance remaining: GH₵ ${balanceRemaining.toFixed(2)}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const tendersList = [
        ...(cashVal > 0 ? [{ method: 'Cash', amount: cashVal - changeDue }] : []),
        ...(cardVal > 0 ? [{ method: 'Card Terminal', amount: cardVal }] : []),
        ...(momoVal > 0 ? [{ method: 'Mobile Money', amount: momoVal }] : []),
        ...(walletVal > 0 ? [{ method: 'Store Wallet', amount: walletVal }] : []),
      ];

      const res = await fetch('/api/vendor/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkout',
          items: cart,
          tenders: tendersList,
          discount: orderDiscount,
          totalAmount,
          customer: { name: customerName },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('POS Transaction Complete!', 'success');
      setReceiptData(data.receipt);
      setCart([]);
      setOrderDiscount(0);
      setShowCheckoutModal(false);
      setCashTender('');
      setCardTender('');
      setMomoTender('');
      setWalletTender('');
      fetchPOSData();
    } catch (err: any) {
      showToast(err.message || 'Checkout failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Categories list
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.title || p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (!user) return null;

  return (
    <div style={{ display: 'flex', gap: 20, width: '100%', height: 'calc(100vh - 110px)', margin: '0 auto', overflow: 'hidden' }}>
      
      {/* LEFT SECTION: PRODUCT SEARCH & CATALOG GRID */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 20, overflow: 'hidden' }}>
        
        {/* Top Controls: Search + Network Status + Hold Sales Drawer Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: 10, fontSize: 18, color: '#94a3b8' }}>search</span>
            <input
              type="text"
              placeholder="Search product name, SKU, or scan barcode..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Network Indicator */}
            <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, backgroundColor: isOnline ? '#dcfce7' : '#fee2e2', color: isOnline ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isOnline ? '#16a34a' : '#dc2626' }}></span>
              {isOnline ? 'ONLINE POS' : 'OFFLINE MODE'}
            </span>

            {/* Held Sales Trigger */}
            <button
              onClick={() => setShowHeldDrawer(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pause_circle</span>
              Held Sales ({heldSales.length})
            </button>

            {/* Cash Drawer Float Trigger */}
            <button
              onClick={() => setShowDrawerModal(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>point_of_sale</span>
              Drawer: GH₵ {(cashDrawer.openFloat + cashDrawer.cashSales).toFixed(2)}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                fontWeight: selectedCategory === cat ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? '#10b981' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, paddingRight: 4 }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#10b981', fontWeight: 700 }}>Loading POS inventory catalog...</div>
          ) : filteredProducts.map(p => (
            <div
              key={p._id}
              onClick={() => addToCart(p)}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 10,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', marginBottom: 8, backgroundColor: '#e2e8f0' }}>
                <Image
                  src={(p.images && p.images[0]) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200'}
                  alt={p.name || 'Product'}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 9, fontWeight: 900, backgroundColor: 'rgba(15,23,42,0.75)', color: '#a3e635', padding: '2px 6px', borderRadius: 4 }}>
                  {p.stock} left
                </span>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, height: 28, overflow: 'hidden' }}>{p.title || p.name}</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#10b981', marginTop: 4 }}>GH₵ {p.price?.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* RIGHT SECTION: INTERACTIVE POS CART SIDEBAR */}
      <div style={{ width: 380, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 20, justifyContent: 'space-between' }}>
        
        {/* Cart Header & Customer selector */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ color: '#10b981' }}>shopping_cart</span>
              Current Cart ({cart.length})
            </h3>

            {cart.length > 0 && (
              <button onClick={() => setCart([])} style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>CUSTOMER NAME</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="In-Store Walk-in Buyer"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          {/* Cart Item List */}
          <div style={{ height: 'calc(100vh - 460px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 13 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#cbd5e1', display: 'block', marginBottom: 6 }}>barcode_reader</span>
                Tap catalog products or scan barcode to build POS sale
              </div>
            ) : cart.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 10, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800 }}>GH₵ {item.price.toFixed(2)}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 900, cursor: 'pointer' }}>-</button>
                  <span style={{ fontSize: 12, fontWeight: 900 }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 900, cursor: 'pointer' }}>+</button>
                  <button onClick={() => removeFromCart(item.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 4 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Totals & Checkout Trigger */}
        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: 14 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#475569', marginBottom: 6 }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: 800 }}>GH₵ {subtotal.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#475569', marginBottom: 10 }}>
            <span>Order Discount:</span>
            <input
              type="number"
              min={0}
              value={orderDiscount}
              onChange={e => setOrderDiscount(Number(e.target.value))}
              placeholder="0.00"
              style={{ width: 80, padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, textAlign: 'right' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#0f172a', marginBottom: 14 }}>
            <span>Total Pay:</span>
            <span style={{ color: '#10b981' }}>GH₵ {totalAmount.toFixed(2)}</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
            <button
              onClick={handleHoldSale}
              disabled={cart.length === 0}
              style={{ padding: '12px', borderRadius: 10, backgroundColor: '#f1f5f9', color: '#334155', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
            >
              Hold Sale
            </button>
            <button
              onClick={() => setShowCheckoutModal(true)}
              disabled={cart.length === 0}
              style={{ padding: '12px', borderRadius: 10, backgroundColor: '#10b981', color: '#ffffff', border: 'none', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}
            >
              Pay GH₵ {totalAmount.toFixed(2)}
            </button>
          </div>

        </div>

      </div>

      {/* SPLIT PAYMENT CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Split Payment Tenders</h3>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 900, color: '#0f172a' }}>
              <span>Total Payable:</span>
              <span style={{ color: '#10b981' }}>GH₵ {totalAmount.toFixed(2)}</span>
            </div>

            {/* Split Tenders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              
              {/* Cash */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#16a34a' }}>payments</span> Cash
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cashTender}
                  onChange={e => setCashTender(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              {/* Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#2563eb' }}>credit_card</span> Card
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={cardTender}
                  onChange={e => setCardTender(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              {/* Mobile Money */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#d97706' }}>smartphone</span> Mobile Money
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={momoTender}
                  onChange={e => setMomoTender(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

              {/* Wallet */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9333ea' }}>account_balance_wallet</span> Store Wallet
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={walletTender}
                  onChange={e => setWalletTender(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                />
              </div>

            </div>

            {/* Change & Balance summary */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 12, borderRadius: 10, marginBottom: 20, fontSize: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <div>Total Paid: GH₵ {totalPaid.toFixed(2)}</div>
              {changeDue > 0 ? (
                <div style={{ color: '#16a34a' }}>Change Due: GH₵ {changeDue.toFixed(2)}</div>
              ) : balanceRemaining > 0 ? (
                <div style={{ color: '#dc2626' }}>Remaining: GH₵ {balanceRemaining.toFixed(2)}</div>
              ) : (
                <div style={{ color: '#16a34a' }}>✓ Exact Payment</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowCheckoutModal(false)} style={{ padding: '10px 16px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
              <button onClick={handleCompleteCheckout} disabled={submitting || totalPaid < totalAmount} style={{ padding: '10px 24px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 900 }}>
                Confirm & Complete Sale
              </button>
            </div>

          </div>
        </div>
      )}

      {/* HELD SALES DRAWER */}
      {showHeldDrawer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 480, width: '100%', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Held Sales Drafts</h3>
              <button onClick={() => setShowHeldDrawer(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {heldSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No held sales.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {heldSales.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{h.customerName} ({h.items.length} items)</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Parked at {h.date} • Total: GH₵ {h.totalAmount.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleResumeSale(h)} style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Restore</button>
                      <button onClick={() => handleDeleteHeld(h.id)} style={{ padding: '6px 10px', borderRadius: 6, backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Discard</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 80mm THERMAL RECEIPT MODAL */}
      {receiptData && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', padding: 24, borderRadius: 16, maxWidth: 360, width: '100%', border: '2px solid #000', color: '#0f172a', fontFamily: 'monospace' }}>
            
            <div style={{ borderBottom: '1px dashed #000', paddingBottom: 10, marginBottom: 12, textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontFamily: 'sans-serif' }}>AFRICART STORE</h3>
              <div style={{ fontSize: 11 }}>{receiptData.storeName || 'Accra Main Branch'}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Receipt #: {receiptData.receiptNo}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Date: {receiptData.date}</div>
            </div>

            <div style={{ fontSize: 11, marginBottom: 12 }}>
              {receiptData.items.map((it: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>{it.quantity}x {it.name}</span>
                  <span>GH₵ {(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #000', paddingTop: 8, fontSize: 11 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>GH₵ {receiptData.subtotal.toFixed(2)}</span>
              </div>
              {receiptData.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <span>-GH₵ {receiptData.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 13, marginTop: 4 }}>
                <span>TOTAL:</span>
                <span>GH₵ {receiptData.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #000', marginTop: 10, paddingTop: 8, fontSize: 10, textAlign: 'center' }}>
              <div>Served by: {receiptData.cashier}</div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>THANK YOU FOR SHOPPING!</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button onClick={() => setReceiptData(null)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 12 }}>Close</button>
              <button onClick={() => window.print()} style={{ padding: '6px 16px', borderRadius: 6, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: 12 }}>Print Receipt</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
