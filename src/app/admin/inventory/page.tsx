'use client';

import React, { useState, useEffect, useCallback } from 'react';

type SubView = 'warehouses' | 'stock' | 'transfers' | 'adjustments' | 'suppliers' | 'purchase_orders';

export default function AdminInventoryPage() {
  const [subView, setSubView] = useState<SubView>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data Arrays
  const [stockList, setStockList] = useState<any[]>([]);
  const [warehousesList, setWarehousesList] = useState<any[]>([]);
  const [transfersList, setTransfersList] = useState<any[]>([]);
  const [adjustmentsList, setAdjustmentsList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [posList, setPosList] = useState<any[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal Operation States
  const [modalType, setModalType] = useState<'stock_in' | 'stock_out' | 'damaged' | 'expired' | 'transfer' | 'create_po' | 'create_supplier' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formQty, setFormQty] = useState('10');
  const [formReason, setFormReason] = useState('');
  const [formTargetWarehouse, setFormTargetWarehouse] = useState('AfriCart Accra Fulfilment Hub');
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAmount, setFormAmount] = useState('500');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Data by SubView
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (subView === 'purchase_orders') {
        const res = await fetch('/api/admin/inventory/purchase-orders');
        const data = await res.json();
        if (data.success) {
          setPosList(data.purchaseOrders || []);
          setSuppliersList(data.suppliers || []);
        }
      } else if (subView === 'transfers') {
        const res = await fetch('/api/admin/inventory/transfers');
        const data = await res.json();
        if (data.success) {
          setTransfersList(data.transfers || []);
        }
      } else {
        const res = await fetch(`/api/admin/inventory?view=${subView}&q=${encodeURIComponent(searchQuery)}&lowStockOnly=${lowStockFilter}`);
        const data = await res.json();
        if (data.success) {
          if (subView === 'stock') {
            setStockList(data.stock || []);
            setLowStockCount(data.lowStockCount || 0);
          } else if (subView === 'warehouses') {
            setWarehousesList(data.warehouses || []);
          } else if (subView === 'adjustments') {
            setAdjustmentsList(data.adjustments || []);
          } else if (subView === 'suppliers') {
            setSuppliersList(data.suppliers || []);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, [subView, searchQuery, lowStockFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Operations: Stock In / Stock Out / Damaged / Expired
  const handleStockOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !formQty) return;
    setActionLoading(true);
    try {
      const actionKey = modalType === 'stock_in' ? 'stock_in'
        : modalType === 'stock_out' ? 'stock_out'
        : modalType === 'damaged' ? 'damaged_stock'
        : 'expired_product';

      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionKey,
          productId: selectedProduct.id,
          quantity: formQty,
          reason: formReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchData();
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Inventory action error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Operation: Warehouse Transfer
  const handleWarehouseTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !formQty) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          sourceWarehouseName: 'AfriCart Tamale Central Hub',
          targetWarehouseName: formTargetWarehouse,
          quantity: formQty,
          notes: formReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('Transfer error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Operation: Create PO / Supplier
  const handleCreatePOorSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const actionKey = modalType === 'create_supplier' ? 'create_supplier' : 'create_po';
      const res = await fetch('/api/admin/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionKey,
          supplierName: formSupplierName,
          phone: formPhone,
          email: formEmail,
          totalAmount: formAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setModalType(null);
        resetForm();
        fetchData();
      }
    } catch (err) {
      console.error('PO error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormQty('10'); setFormReason(''); setFormSupplierName(''); setFormPhone(''); setFormEmail(''); setFormAmount('500');
  };

  const formatGhs = (val: number) => `GH₵ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1400, margin: '0 auto' }}>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={toastStyle}>
          <span className="material-symbols-outlined" style={{ color: '#38bdf8' }}>check_circle</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar & Quick Operation Triggers */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: 900, color: '#0f172a', margin: 0, fontFamily: 'var(--font-lexend, sans-serif)' }}>
            Inventory & Supply Chain Module
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            Multi-warehouse stock control, inter-hub transfers, stock adjustments & supplier procurement
          </p>
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => { resetForm(); setModalType('create_po'); }} style={btnPrimaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>post_add</span>
            <span>+ Create Purchase Order</span>
          </button>
          <button onClick={() => { resetForm(); setModalType('create_supplier'); }} style={btnSecondaryStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>domain</span>
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Low Stock Telemetry Alert Banner */}
      {lowStockCount > 0 && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: 24 }}>running_with_errors</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#9f1239' }}>Low Stock Alert: {lowStockCount} Product(s) Below Reorder Level</div>
              <div style={{ fontSize: 12, color: '#be123c', marginTop: 2 }}>Immediate inventory restock or PO procurement recommended to prevent out-of-stock orders.</div>
            </div>
          </div>
          <button
            onClick={() => { setSubView('stock'); setLowStockFilter(prev => !prev); }}
            style={{ border: 'none', background: '#dc2626', color: '#fff', padding: '6px 14px', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
          >
            {lowStockFilter ? 'Show All Stock' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {/* 6 Sub-Page Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { id: 'stock', label: 'Stock Matrix', icon: 'inventory' },
            { id: 'warehouses', label: 'Warehouses', icon: 'warehouse' },
            { id: 'transfers', label: 'Transfers', icon: 'move_down' },
            { id: 'adjustments', label: 'Adjustments', icon: 'find_replace' },
            { id: 'suppliers', label: 'Suppliers', icon: 'domain' },
            { id: 'purchase_orders', label: 'Purchase Orders', icon: 'receipt_long' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setSubView(tab.id as SubView); setLowStockFilter(false); }}
              style={{
                border: 'none',
                background: subView === tab.id ? '#0f172a' : 'transparent',
                color: subView === tab.id ? '#ffffff' : '#64748b',
                fontWeight: subView === tab.id ? 800 : 600,
                fontSize: 12,
                padding: '8px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: 240 }}>
          <input
            type="text"
            placeholder="Search stock, warehouse, PO..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: 9, fontSize: 18, color: '#94a3b8' }}>
            search
          </span>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: 12, fontWeight: 600, fontSize: 13 }}>Loading inventory telemetry...</p>
        </div>
      ) : subView === 'stock' ? (

        /* SUB-VIEW 1: MASTER PRODUCT STOCK MATRIX */
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Master Product Inventory Stock Matrix ({stockList.length})
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Product Name & Barcode</th>
                  <th style={{ padding: 10 }}>Vendor / Category</th>
                  <th style={{ padding: 10 }}>Fulfillment Hub</th>
                  <th style={{ padding: 10 }}>Stock Quantity</th>
                  <th style={{ padding: 10 }}>Reorder Threshold</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Inventory Operations</th>
                </tr>
              </thead>
              <tbody>
                {stockList.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc', background: s.isLowStock ? '#fff1f2' : 'transparent' }}>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>
                        {s.name} {s.isLowStock && <span style={badgeStyle('#dc2626', '#fee2e2')}>LOW STOCK</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>ID: {s.id} • Barcode: {s.barcode}</div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{s.vendorStoreName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.category}</div>
                    </td>
                    <td style={{ padding: 12, color: '#475569', fontWeight: 600 }}>
                      {s.warehouseName}
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, fontSize: 14, color: s.isLowStock ? '#dc2626' : '#16a34a' }}>
                      {s.stock} {s.unit}
                    </td>
                    <td style={{ padding: 12, color: '#64748b' }}>
                      Min Level: {s.minReorderLevel} {s.unit}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* Stock In */}
                        <button onClick={() => { setSelectedProduct(s); resetForm(); setModalType('stock_in'); }} style={{ border: 'none', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Stock In
                        </button>
                        {/* Stock Out */}
                        <button onClick={() => { setSelectedProduct(s); resetForm(); setModalType('stock_out'); }} style={{ border: 'none', background: '#dbeafe', color: '#2563eb', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Stock Out
                        </button>
                        {/* Transfer */}
                        <button onClick={() => { setSelectedProduct(s); resetForm(); setModalType('transfer'); }} style={{ border: 'none', background: '#f3e8ff', color: '#7c3aed', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Transfer
                        </button>
                        {/* Damaged */}
                        <button onClick={() => { setSelectedProduct(s); resetForm(); setModalType('damaged'); }} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Damaged
                        </button>
                        {/* Expired */}
                        <button onClick={() => { setSelectedProduct(s); resetForm(); setModalType('expired'); }} style={{ border: 'none', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: 6, fontWeight: 800, fontSize: 10, cursor: 'pointer' }}>
                          Expired
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : subView === 'warehouses' ? (

        /* SUB-VIEW 2: WAREHOUSES */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Central Fulfillment Hubs ({warehousesList.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {warehousesList.map(w => (
              <div key={w.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{w.name}</div>
                <div style={{ marginTop: 4 }}><span style={badgeStyle('#7c3aed', '#f3e8ff')}>{w.code}</span></div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}>Address: {w.address}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Manager: {w.managerName} • {w.phone}</div>
              </div>
            ))}
          </div>
        </div>
      ) : subView === 'transfers' ? (

        /* SUB-VIEW 3: TRANSFERS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Inter-Warehouse Stock Transfers ({transfersList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Transfer ID</th>
                  <th style={{ padding: 10 }}>Product</th>
                  <th style={{ padding: 10 }}>From (Source)</th>
                  <th style={{ padding: 10 }}>To (Target)</th>
                  <th style={{ padding: 10 }}>Quantity</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transfersList.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#4338ca', '#e0e7ff')}>{t.transferId}</span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{t.productName}</td>
                    <td style={{ padding: 12, color: '#334155' }}>{t.sourceWarehouseName}</td>
                    <td style={{ padding: 12, color: '#2563eb', fontWeight: 700 }}>{t.targetWarehouseName}</td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>{t.quantity} units</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle('#166534', '#dcfce7')}>{t.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : subView === 'adjustments' ? (

        /* SUB-VIEW 4: ADJUSTMENTS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Inventory Stock Adjustments Log ({adjustmentsList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>Adjustment ID</th>
                  <th style={{ padding: 10 }}>Product</th>
                  <th style={{ padding: 10 }}>Adjustment Type</th>
                  <th style={{ padding: 10 }}>Quantity</th>
                  <th style={{ padding: 10 }}>Reason / Audit Notes</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentsList.map(a => (
                  <tr key={a._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}><span style={badgeStyle('#1e293b', '#e2e8f0')}>{a.adjustmentId}</span></td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{a.productName}</td>
                    <td style={{ padding: 12 }}>
                      <span style={badgeStyle(a.type === 'stock_in' ? '#166534' : a.type === 'damaged' ? '#991b1b' : '#b45309', a.type === 'stock_in' ? '#dcfce7' : a.type === 'damaged' ? '#fee2e2' : '#fef3c7')}>
                        {a.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#0f172a' }}>{a.quantity} units</td>
                    <td style={{ padding: 12, color: '#475569' }}>{a.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : subView === 'suppliers' ? (

        /* SUB-VIEW 5: SUPPLIERS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Supplier Directory ({suppliersList.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {suppliersList.map(s => (
              <div key={s.id || s._id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, marginTop: 2 }}>{s.category} • {s.city}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Contact: {s.contactName} • {s.phone} • {s.email}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (

        /* SUB-VIEW 6: PURCHASE ORDERS */
        <div style={cardStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Procurement Purchase Orders ({posList.length})</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: 10 }}>PO ID</th>
                  <th style={{ padding: 10 }}>Supplier Name</th>
                  <th style={{ padding: 10 }}>Total Amount</th>
                  <th style={{ padding: 10 }}>Date</th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {posList.map(po => (
                  <tr key={po.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: 12 }}><span style={badgeStyle('#7c3aed', '#f3e8ff')}>{po.poId}</span></td>
                    <td style={{ padding: 12, fontWeight: 800, color: '#0f172a' }}>{po.supplierName}</td>
                    <td style={{ padding: 12, fontWeight: 900, color: '#16a34a' }}>{formatGhs(po.totalAmount)}</td>
                    <td style={{ padding: 12, color: '#64748b' }}>{po.orderDate}</td>
                    <td style={{ padding: 12 }}><span style={badgeStyle('#166534', '#dcfce7')}>{po.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── OPERATION MODALS ────────────────────────────────────────── */}

      {/* Stock In / Out / Damaged / Expired Modal */}
      {(modalType === 'stock_in' || modalType === 'stock_out' || modalType === 'damaged' || modalType === 'expired') && selectedProduct && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, textTransform: 'capitalize' }}>
              {modalType.replace('_', ' ')}: {selectedProduct.name}
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Current Stock Level: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong></p>

            <form onSubmit={handleStockOperation} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Quantity ({selectedProduct.unit}) *</label>
                <input type="number" value={formQty} onChange={e => setFormQty(e.target.value)} required min={1} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Reason / Notes *</label>
                <input type="text" value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="e.g. Restock batch shipment #893" required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Submit Operation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Warehouse Transfer Modal */}
      {modalType === 'transfer' && selectedProduct && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>Inter-Warehouse Transfer</h3>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>Transferring: <strong>{selectedProduct.name}</strong></p>

            <form onSubmit={handleWarehouseTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Source Warehouse</label>
                <input type="text" value="AfriCart Tamale Central Hub" disabled style={{ ...inputStyle, background: '#f1f5f9' }} />
              </div>
              <div>
                <label style={labelStyle}>Target Destination Hub *</label>
                <select value={formTargetWarehouse} onChange={e => setFormTargetWarehouse(e.target.value)} style={inputStyle}>
                  <option value="AfriCart Accra Fulfilment Hub">AfriCart Accra Fulfilment Hub</option>
                  <option value="AfriCart Kumasi Regional Logistics Hub">AfriCart Kumasi Regional Logistics Hub</option>
                  <option value="AfriCart Takoradi Coastal Hub">AfriCart Takoradi Coastal Hub</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Transfer Quantity *</label>
                <input type="number" value={formQty} onChange={e => setFormQty(e.target.value)} required min={1} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Execute Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      {modalType === 'create_po' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Create Procurement Purchase Order</h3>
            <form onSubmit={handleCreatePOorSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Supplier Name *</label>
                <input type="text" value={formSupplierName} onChange={e => setFormSupplierName(e.target.value)} placeholder="e.g. Ghana Agro Producers Ltd" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Total PO Amount (GH₵) *</label>
                <input type="number" step="0.01" value={formAmount} onChange={e => setFormAmount(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Issue Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Supplier Modal */}
      {modalType === 'create_supplier' && (
        <div style={modalBackdropStyle} onClick={() => setModalType(null)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>Add Supplier / Partner</h3>
            <form onSubmit={handleCreatePOorSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Supplier Business Name *</label>
                <input type="text" value={formSupplierName} onChange={e => setFormSupplierName(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Contact Phone *</label>
                  <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Email *</label>
                  <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setModalType(null)} style={btnSecondaryStyle}>Cancel</button>
                <button type="submit" disabled={actionLoading} style={btnPrimaryStyle}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Reusable Component Styles ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
};

const toastStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 9999,
  background: '#0f172a',
  color: '#38bdf8',
  padding: '12px 20px',
  borderRadius: 12,
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  fontSize: 13,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #0284c7',
};

const btnPrimaryStyle: React.CSSProperties = {
  border: 'none',
  background: '#16a34a',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const btnSecondaryStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#475569',
  fontWeight: 700,
  fontSize: 13,
  padding: '8px 16px',
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  background: bg,
  color: color,
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 6,
  textTransform: 'uppercase',
});

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: 20,
  padding: 24,
  width: '100%',
  maxWidth: 520,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#334155',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  outline: 'none',
};
