'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();

  const faqs = [
    { q: 'How do I track my order?', a: 'You can track your order in the "My Orders" section of your account.' },
    { q: 'What is your return policy?', a: 'We accept returns within 30 days of purchase for a full refund.' },
    { q: 'How do I contact customer service?', a: 'You can email us at support@reedstore.com or call 1-800-REED-STR.' },
  ];

  return (
    <div style={{ padding: '0 16px', paddingBottom: 32 }}>
      <div className="animate-fade-in-up" style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 24, fontWeight: 900, color: '#fff' }}>Help & Support</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        <div className="animate-fade-in-up stagger-1" style={{ background: 'var(--lime-400)', borderRadius: 12, padding: 20, color: '#000' }}>
          <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, marginBottom: 8 }}>Need Immediate Help?</h2>
          <p style={{ fontSize: 14, marginBottom: 16 }}>Our customer support team is available 24/7.</p>
          <button style={{
            background: '#000', color: 'var(--lime-400)', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span className="material-symbols-outlined">chat</span> Start Live Chat
          </button>
        </div>

        <h2 className="animate-fade-in-up stagger-2" style={{ fontFamily: 'var(--font-lexend)', fontSize: 18, color: '#fff', marginTop: 16 }}>Frequently Asked Questions</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} className={`animate-fade-in-up stagger-${i + 3}`} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
              <h3 style={{ fontSize: 14, color: '#fff', marginBottom: 8 }}>{faq.q}</h3>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
