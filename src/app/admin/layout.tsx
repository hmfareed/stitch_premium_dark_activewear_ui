'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/');
      } else if (user.role === 'vendor') {
        router.push('/vendor');
      } else if (user.role !== 'super_admin') {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'super_admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--lime-400)' }} />
      </div>
    );
  }

  interface NavSubItem {
    name: string;
    path: string;
  }

  interface NavSection {
    title: string;
    icon: string;
    path?: string;
    subItems?: NavSubItem[];
  }

  const navSections: NavSection[] = [
    { title: 'Dashboard', icon: 'grid_view', path: '/admin' },
    {
      title: 'Orders',
      icon: 'shopping_bag',
      path: '/admin/orders',
      subItems: [
        { name: 'All Orders', path: '/admin/orders' },
        { name: 'Pending', path: '/admin/orders' },
        { name: 'Processing', path: '/admin/orders' },
        { name: 'Ready for Pickup', path: '/admin/orders' },
        { name: 'Picked Up', path: '/admin/orders' },
        { name: 'In Transit', path: '/admin/orders' },
        { name: 'Delivered', path: '/admin/orders' },
        { name: 'Cancelled', path: '/admin/orders' },
        { name: 'Returned', path: '/admin/orders' },
        { name: 'Refunded', path: '/admin/orders' },
      ],
    },
    {
      title: 'Products',
      icon: 'inventory_2',
      path: '/admin/products',
      subItems: [
        { name: 'All Products', path: '/admin/products' },
        { name: 'Pending Approval', path: '/admin/products' },
        { name: 'Categories', path: '/admin/products' },
        { name: 'Brands', path: '/admin/products' },
        { name: 'Attributes', path: '/admin/products' },
        { name: 'Reviews', path: '/admin/products' },
        { name: 'Inventory', path: '/admin/products' },
      ],
    },
    {
      title: 'Vendors',
      icon: 'storefront',
      path: '/admin/vendors',
      subItems: [
        { name: 'Pending Applications', path: '/admin/vendors' },
        { name: 'Approved', path: '/admin/vendors' },
        { name: 'Suspended', path: '/admin/vendors' },
        { name: 'Performance', path: '/admin/vendors' },
        { name: 'Reviews', path: '/admin/vendors' },
        { name: 'KYC', path: '/admin/vendors' },
      ],
    },
    {
      title: 'Riders',
      icon: 'two_wheeler',
      path: '/admin/riders',
      subItems: [
        { name: 'Applications', path: '/admin/riders' },
        { name: 'Active', path: '/admin/riders' },
        { name: 'Performance', path: '/admin/riders' },
        { name: 'Delivery Stats', path: '/admin/riders' },
        { name: 'Earnings', path: '/admin/riders' },
        { name: 'Verification', path: '/admin/riders' },
      ],
    },
    { title: 'Customers', icon: 'group', path: '/admin/customers' },
    {
      title: 'Admin Staff',
      icon: 'admin_panel_settings',
      path: '/admin/admins',
      subItems: [
        { name: 'All Admins', path: '/admin/admins' },
        { name: 'Role Applications', path: '/admin/admins' },
      ],
    },
    {
      title: 'Finance',
      icon: 'account_balance_wallet',
      path: '/admin/finance',
      subItems: [
        { name: 'Transactions', path: '/admin/finance' },
        { name: 'Vendor Payouts', path: '/admin/finance' },
        { name: 'Rider Payments', path: '/admin/finance' },
        { name: 'Revenue', path: '/admin/finance' },
        { name: 'Commission', path: '/admin/finance' },
        { name: 'Wallets', path: '/admin/finance' },
        { name: 'Refunds', path: '/admin/finance' },
        { name: 'Taxes', path: '/admin/finance' },
      ],
    },
    {
      title: 'Marketing',
      icon: 'campaign',
      path: '/admin/campaigns',
      subItems: [
        { name: 'Coupons', path: '/admin/campaigns' },
        { name: 'Promo Codes', path: '/admin/campaigns' },
        { name: 'Flash Sales', path: '/admin/campaigns' },
        { name: 'Featured Products', path: '/admin/campaigns' },
        { name: 'Banners', path: '/admin/campaigns' },
        { name: 'Push/Email/SMS Campaigns', path: '/admin/campaigns' },
      ],
    },
    {
      title: 'Reports',
      icon: 'description',
      path: '/admin/compliance',
      subItems: [
        { name: 'Sales', path: '/admin/compliance' },
        { name: 'Customer', path: '/admin/compliance' },
        { name: 'Vendor', path: '/admin/compliance' },
        { name: 'Rider', path: '/admin/compliance' },
        { name: 'Product', path: '/admin/compliance' },
        { name: 'Financial', path: '/admin/compliance' },
      ],
    },
    {
      title: 'Logistics',
      icon: 'local_shipping',
      path: '/admin/hub',
      subItems: [
        { name: 'Delivery Zones', path: '/admin/hub' },
        { name: 'Shipping Methods', path: '/admin/hub' },
        { name: 'Rates', path: '/admin/hub' },
        { name: 'Warehouses', path: '/admin/hub' },
        { name: 'Pickup Stations', path: '/admin/hub' },
      ],
    },
    {
      title: 'Reviews',
      icon: 'rate_review',
      path: '/admin/compliance',
      subItems: [
        { name: 'Product Reviews', path: '/admin/compliance' },
        { name: 'Vendor Reviews', path: '/admin/compliance' },
        { name: 'Rider Reviews', path: '/admin/compliance' },
        { name: 'Reported Reviews', path: '/admin/compliance' },
      ],
    },
    {
      title: 'Communication',
      icon: 'chat',
      path: '/admin/messages',
      subItems: [
        { name: 'Customer Support', path: '/admin/messages' },
        { name: 'Live Chat', path: '/admin/messages' },
        { name: 'Vendor/Rider Chat', path: '/admin/messages' },
        { name: 'Announcements', path: '/admin/messages' },
      ],
    },
    {
      title: 'Payments',
      icon: 'credit_card',
      path: '/admin/finance',
      subItems: [
        { name: 'Gateways', path: '/admin/finance' },
        { name: 'History', path: '/admin/finance' },
        { name: 'Failed', path: '/admin/finance' },
        { name: 'Withdrawals', path: '/admin/finance' },
      ],
    },
    {
      title: 'Content',
      icon: 'article',
      path: '/admin/tickets',
      subItems: [
        { name: 'Blog', path: '/admin/tickets' },
        { name: 'FAQs', path: '/admin/tickets' },
        { name: 'Terms', path: '/admin/tickets' },
        { name: 'Privacy Policy', path: '/admin/tickets' },
        { name: 'Help Center', path: '/admin/tickets' },
      ],
    },
    {
      title: 'Settings',
      icon: 'settings_suggest',
      path: '/admin/settings',
      subItems: [
        { name: 'General', path: '/admin/settings' },
        { name: 'Branding', path: '/admin/settings' },
        { name: 'Currency', path: '/admin/settings' },
        { name: 'Language', path: '/admin/settings' },
        { name: 'Tax', path: '/admin/settings' },
        { name: 'Commission', path: '/admin/settings' },
        { name: 'Email', path: '/admin/settings' },
        { name: 'SMS', path: '/admin/settings' },
        { name: 'AI', path: '/admin/settings' },
        { name: 'API Keys', path: '/admin/settings' },
        { name: 'Security', path: '/admin/settings' },
        { name: 'Backup', path: '/admin/settings' },
      ],
    },
    { title: 'Audit Logs', icon: 'history', path: '/admin/audit-logs' },
    {
      title: 'Security',
      icon: 'shield',
      path: '/admin/security',
      subItems: [
        { name: 'Login Logs', path: '/admin/security' },
        { name: 'Access Logs', path: '/admin/security' },
        { name: 'Fraud Detection', path: '/admin/security' },
        { name: 'Sessions', path: '/admin/security' },
      ],
    },
    { title: 'Profile', icon: 'person', path: '/admin/settings' },
  ];

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Auto expand active section
    navSections.forEach((section) => {
      if (section.path && pathname?.startsWith(section.path) && section.path !== '/admin') {
        setExpandedSections((prev) => ({ ...prev, [section.title]: true }));
      }
    });
  }, [pathname]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--on-surface)', fontFamily: 'var(--font-inter)', width: '100%', overflowX: 'hidden' }}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 40 }}
        />
      )}

      {/* Dark Sidebar */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px',
        backgroundColor: '#131127', color: '#FFFFFF',
        display: 'flex', flexDirection: 'column', zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        overflowY: 'auto',
      }} className="md:translate-x-0">
        {/* Brand Header */}
        <div style={{ padding: '24px 20px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/icon.svg" alt="AfriCart Logo" width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                <span style={{ color: 'var(--lime-400)' }}>Afri</span><span style={{ color: '#FFFFFF' }}>Cart</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9B96BE', fontWeight: 500 }}>Super Admin</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
            style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '50%', width: '32px', height: '32px', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Menu Navigation */}
        <nav style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navSections.map((section) => {
            const hasSub = section.subItems && section.subItems.length > 0;
            const isExpanded = !!expandedSections[section.title];
            const isSectionActive = section.path === '/admin'
              ? pathname === '/admin'
              : section.path && pathname?.startsWith(section.path);

            if (!hasSub) {
              return (
                <Link
                  key={section.title}
                  href={section.path || '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    color: isSectionActive ? '#FFFFFF' : '#9B96BE',
                    backgroundColor: isSectionActive ? 'var(--lime-400)' : 'transparent',
                    fontWeight: isSectionActive ? 600 : 400,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ marginRight: '12px', fontSize: '20px', color: isSectionActive ? '#FFF' : '#8580AA' }}>
                    {section.icon}
                  </span>
                  <span>{section.title}</span>
                </Link>
              );
            }

            return (
              <div key={section.title} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => toggleSection(section.title)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    color: isSectionActive ? '#FFFFFF' : '#9B96BE',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: isSectionActive ? 600 : 400,
                    fontSize: '0.88rem',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isSectionActive ? 'var(--lime-400)' : '#8580AA' }}>
                      {section.icon}
                    </span>
                    <span>{section.title}</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#8580AA', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                    expand_more
                  </span>
                </button>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '24px', paddingLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginTop: '2px', marginBottom: '4px', gap: '2px' }}>
                    {section.subItems!.map((sub, idx) => (
                      <Link
                        key={idx}
                        href={sub.path}
                        onClick={() => setSidebarOpen(false)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          color: '#B0AACD',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          fontWeight: 400,
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>


        {/* Footer actions: View storefront & Logout Section */}
        <div style={{ padding: '16px 14px 24px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              color: '#FFFFFF',
              backgroundColor: 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxSizing: 'border-box',
              transition: 'background-color 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ marginRight: '14px', fontSize: '20px', color: 'var(--lime-400)' }}>storefront</span>
            <span>View storefront</span>
          </Link>
          <button
            onClick={() => { logout(); window.location.href = '/'; }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: '12px',
              color: '#FF6B6B',
              backgroundColor: 'rgba(255,107,107,0.08)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          >
            <span className="material-symbols-outlined" style={{ marginRight: '14px', fontSize: '20px' }}>logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: '0px' }} className="md:ml-[260px]">
        {/* Header Bar: Hamburger inline with Super Admin title, Notification bell on right */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--outline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Left: Hamburger + Super Admin inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>menu</span>
            </button>
            <div style={{ fontFamily: 'var(--font-lexend)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--on-surface)' }}>
              Super Admin
            </div>
          </div>

          {/* Right: Notification Bell only */}
          <button style={{ background: 'none', border: 'none', color: 'var(--on-surface)', cursor: 'pointer', display: 'flex', padding: '4px', position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '7px', height: '7px', backgroundColor: 'var(--error)', borderRadius: '50%' }} />
          </button>
        </header>

        {/* Page Content Container */}
        <main style={{ flex: 1, padding: '16px', overflowY: 'auto', width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
