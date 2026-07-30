'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableRoles: string[];
  currentRole: string;
  onSelectRole: (role: string) => void;
}

const ROLE_METADATA: Record<string, { title: string; subtitle: string; icon: string; path: string }> = {
  customer: {
    title: 'Customer',
    subtitle: 'Browse marketplace, manage orders & wishlist',
    icon: 'shopping_bag',
    path: '/',
  },
  vendor: {
    title: 'Vendor Store',
    subtitle: 'Manage inventory, incoming orders & payouts',
    icon: 'storefront',
    path: '/vendor',
  },
  rider: {
    title: 'Rider Courier',
    subtitle: 'Active deliveries, pickup routes & earnings',
    icon: 'two_wheeler',
    path: '/rider',
  },
  super_admin: {
    title: 'Super Admin',
    subtitle: 'Platform controls, approvals & operations',
    icon: 'admin_panel_settings',
    path: '/admin',
  },
};

export default function RoleSwitcherModal({
  isOpen,
  onClose,
  availableRoles = ['customer'],
  currentRole,
  onSelectRole,
}: RoleSwitcherModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleRoleClick = (role: string) => {
    onSelectRole(role);
    const meta = ROLE_METADATA[role];
    if (meta) {
      router.push(meta.path);
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ backgroundColor: 'var(--surface-container-high)', borderRadius: '20px', padding: '28px', maxWidth: '440px', width: '100%', border: '1px solid var(--outline-variant)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Choose Account View</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Select which hat you are wearing for this session</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {availableRoles.map(role => {
            const meta = ROLE_METADATA[role] || { title: role, subtitle: 'Access workspace', icon: 'account_circle', path: '/' };
            const isActive = currentRole === role;

            return (
              <button
                key={role}
                onClick={() => handleRoleClick(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '14px',
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface)',
                  color: 'var(--on-surface)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-container-high)',
                    color: isActive ? '#FFFFFF' : 'var(--on-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span className="material-symbols-outlined">{meta.icon}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {meta.title}
                    {isActive && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--primary)', color: '#FFF' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginTop: '2px' }}>{meta.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
