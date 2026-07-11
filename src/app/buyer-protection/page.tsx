'use client';

import React from 'react';
import Link from 'next/link';

const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '24px', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'color-mix(in srgb, var(--lime-400) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 15, fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.01em' }}>{title}</h2>
    </div>
    <div style={{ fontFamily: 'var(--font-inter)', fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.75 }}>
      {children}
    </div>
  </div>
);

const PolicyRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--outline)', fontSize: 13 }}>
    <span style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>{label}</span>
    <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>{value}</span>
  </div>
);

export default function BuyerProtectionPage() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 120px' }}>
      {/* Hero */}
      <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--lime-400)22, var(--lime-400)11)', border: '1px solid var(--lime-400)33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--lime-400)', fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10 }}>
          BUYER PROTECTION
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 13, maxWidth: 480, margin: '0 auto', lineHeight: 1.7, fontFamily: 'var(--font-inter)' }}>
          AfriCart is committed to safe, fair transactions. Every order is protected by our buyer guarantee — shop with confidence.
        </p>
      </div>

      {/* Trust badges */}
      <div className="animate-fade-in-up" style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { icon: 'lock', label: 'SSL Secured' },
          { icon: 'account_balance', label: 'Escrow Payments' },
          { icon: 'support_agent', label: '24/7 Dispute Support' },
          { icon: 'gpp_good', label: 'Ghana DPA 2012 Compliant' },
        ].map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, background: 'color-mix(in srgb, var(--lime-400) 8%, transparent)', border: '1px solid var(--lime-400)33', fontSize: 11, fontWeight: 700, color: 'var(--lime-400)', fontFamily: 'var(--font-lexend)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{b.icon}</span>
            {b.label}
          </div>
        ))}
      </div>

      {/* Quick policy table */}
      <div className="animate-fade-in-up" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '24px', marginBottom: 16 }}>
        <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 800, marginBottom: 16 }}>AT A GLANCE</h2>
        <PolicyRow label="Return Window"            value="7 days from delivery" />
        <PolicyRow label="Refund Processing"        value="1–5 business days" />
        <PolicyRow label="Dispute Resolution"       value="Within 5 business days" />
        <PolicyRow label="Escrow Release to Vendor" value="After buyer confirms delivery" />
        <PolicyRow label="Pay-on-Delivery Zones"    value="Accra, Kumasi, Tamale metro" />
        <PolicyRow label="Data Handling"            value="Ghana Data Protection Act 2012" />
      </div>

      <Section icon="assignment_return" title="Returns & Refunds">
        <p>You may return eligible items within <strong>7 days</strong> of confirmed delivery if:</p>
        <ul style={{ marginTop: 8, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>The item is unused and in its original packaging</li>
          <li>The item is significantly different from what was described</li>
          <li>The item arrived damaged or defective</li>
          <li>You received the wrong item</li>
        </ul>
        <p style={{ marginTop: 12 }}>Items marked as <strong>Final Sale</strong>, perishables (groceries), and digital products are not eligible for returns unless defective.</p>
        <p style={{ marginTop: 12 }}>Once your return is approved, refunds are processed to your original payment method (MoMo / Card) within <strong>1–5 business days</strong>.</p>
      </Section>

      <Section icon="gavel" title="Dispute Resolution">
        <p>If there is a problem with your order that the vendor has not resolved within <strong>48 hours</strong>, you can open a dispute:</p>
        <ol style={{ marginTop: 8, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Go to <strong>My Orders</strong> and select the order</li>
          <li>Tap <strong>Open Dispute</strong> and describe the issue</li>
          <li>Upload supporting photos or messages as evidence</li>
          <li>An AfriCart moderator will review within <strong>5 business days</strong></li>
          <li>We may issue a full/partial refund, or side with the vendor based on evidence</li>
        </ol>
        <p style={{ marginTop: 12 }}>📞 You can also reach our dispute team directly:<br /><strong>Email:</strong> disputes@africart.app | <strong>WhatsApp:</strong> +233 XX XXX XXXX</p>
      </Section>

      <Section icon="account_balance" title="Escrow & Payment Protection">
        <p>When you pay on AfriCart, your money is <strong>held in escrow</strong> and not released to the vendor until:</p>
        <ul style={{ marginTop: 8, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>You confirm delivery, <strong>or</strong></li>
          <li>5 days have passed after the delivery date without a dispute</li>
        </ul>
        <p style={{ marginTop: 12 }}>This protects you from paying for items you never receive. All card and Mobile Money payments are processed securely via <strong>Paystack</strong> (PCI-DSS compliant).</p>
      </Section>

      <Section icon="local_shipping" title="Pay-on-Delivery">
        <p>Cash on Delivery is available in the following metro zones:</p>
        <ul style={{ marginTop: 8, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li><strong>Accra Metro</strong> — Greater Accra Region</li>
          <li><strong>Kumasi Metro</strong> — Ashanti Region</li>
          <li><strong>Tamale Metro</strong> — Northern Region</li>
        </ul>
        <p style={{ marginTop: 12 }}>Pay-on-delivery is not available for orders above GH₵ 2,000 or for vendors outside Ghana. AfriCart reserves the right to suspend CoD for customers with a history of refused deliveries.</p>
      </Section>

      <Section icon="privacy_tip" title="Data Protection (Ghana DPA 2012)">
        <p>AfriCart complies with the <strong>Ghana Data Protection Act 2012</strong>. We are registered with the Data Protection Commission.</p>
        <ul style={{ marginTop: 8, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <li>We collect only data necessary to process your orders</li>
          <li>Your payment details are never stored on our servers (processed entirely by Paystack)</li>
          <li>We do not sell your personal data to third parties</li>
          <li>You can request deletion of your account data at any time</li>
          <li>Vendor verification documents are stored securely and reviewed only by authorised staff</li>
        </ul>
        <p style={{ marginTop: 12 }}>To request a data export or deletion, email <strong>privacy@africart.app</strong>.</p>
      </Section>

      {/* CTA */}
      <div style={{ background: 'linear-gradient(135deg, var(--surface), var(--surface-container))', border: '1px solid var(--outline)', borderRadius: 20, padding: '28px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-lexend)', fontSize: 16, fontWeight: 900, marginBottom: 8 }}>Need Help With an Order?</p>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: 12, marginBottom: 20, fontFamily: 'var(--font-inter)' }}>Our support team is ready to help resolve any issue quickly.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/track" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 12, background: 'var(--lime-400)', color: '#000', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>local_shipping</span>
            Track Order
          </Link>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 12, border: '1px solid var(--outline)', background: 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-lexend)', fontWeight: 800, fontSize: 12, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>shopping_bag</span>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
