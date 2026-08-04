'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, useToast } from '@/context/AppContext';

export default function VendorSuppliersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('3');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/inventory/suppliers');
      const data = await res.json();
      if (res.ok) setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) { showToast('Supplier company name is required', 'error'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/vendor/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_supplier',
          supplier: {
            companyName: companyName.trim(),
            contactPerson,
            email,
            phone,
            leadTimeDays: Number(leadTimeDays),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Supplier added to directory!', 'success');
      setSuppliers(data.suppliers || []);
      setShowAddModal(false);
      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
    } catch (err: any) {
      showToast(err.message || 'Error adding supplier', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 1200, margin: '0 auto' }}>
      
      {/* Module 6 Sub-Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, overflowX: 'auto' }}>
        {[
          { label: 'Stock & Audit Log', path: '/vendor/inventory', active: false, icon: 'inventory' },
          { label: 'Warehouses', path: '/vendor/inventory/warehouses', active: false, icon: 'warehouse' },
          { label: 'Stock Adjustments', path: '/vendor/inventory/adjustments', active: false, icon: 'edit_note' },
          { label: 'Transfers', path: '/vendor/inventory/transfers', active: false, icon: 'swap_horiz' },
          { label: 'Suppliers', path: '/vendor/inventory/suppliers', active: true, icon: 'local_shipping' },
          { label: 'Purchase Orders', path: '/vendor/inventory/purchase-orders', active: false, icon: 'receipt_long' },
        ].map(tab => (
          <Link
            key={tab.label}
            href={tab.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: tab.active ? 800 : 600,
              color: tab.active ? '#ffffff' : '#475569',
              backgroundColor: tab.active ? '#10b981' : '#ffffff',
              border: '1px solid #e2e8f0',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>

      {/* Main Suppliers Card */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 18, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Vendor Suppliers Directory
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, margin: 0 }}>
              Maintain contact records, lead times, and active status for product suppliers and manufacturers.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add Supplier
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#10b981' }}>Loading suppliers...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {suppliers.map(sup => (
              <div key={sup.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{sup.companyName}</div>
                  <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>
                    ACTIVE
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569' }}>
                  <div><strong>Contact Person:</strong> {sup.contactPerson}</div>
                  <div><strong>Email:</strong> {sup.email}</div>
                  <div><strong>Phone:</strong> {sup.phone}</div>
                  <div><strong>Avg Lead Time:</strong> {sup.leadTimeDays} days</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 28, maxWidth: 440, width: '100%', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Add New Supplier</h3>
            <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Supplier Company Name *</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Accra Textiles Ltd" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Contact Person</label>
                <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="Kojo Addo" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kojo@accra.com" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Phone</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+233 24 111 2222" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Lead Time (Days)</label>
                <input type="number" min={1} value={leadTimeDays} onChange={e => setLeadTimeDays(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, backgroundColor: '#f1f5f9', border: 'none', fontWeight: 700 }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 800 }}>Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
