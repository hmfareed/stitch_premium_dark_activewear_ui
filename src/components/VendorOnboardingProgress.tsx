'use client';

import React from 'react';

interface VendorOnboardingProgressProps {
  currentStep: number; // 1 to 5
}

const STEPS = [
  { step: 1, title: 'Business Info', icon: 'storefront' },
  { step: 2, title: 'Verification', icon: 'verified_user' },
  { step: 3, title: 'Subscription', icon: 'workspace_premium' },
  { step: 4, title: 'Payment Setup', icon: 'payments' },
  { step: 5, title: 'Completion', icon: 'task_alt' },
];

export default function VendorOnboardingProgress({ currentStep }: VendorOnboardingProgressProps) {
  return (
    <div style={{ width: '100%', marginBottom: 32 }}>
      {/* Progress Bar Line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', maxWidth: 680, margin: '0 auto' }}>
        
        {/* Background Connecting Line */}
        <div style={{ position: 'absolute', top: 18, left: 30, right: 30, height: 3, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 1 }}>
          <div
            style={{
              height: '100%',
              backgroundColor: '#10b981',
              width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {STEPS.map((s) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;

          return (
            <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  backgroundColor: isDone || isCurrent ? '#10b981' : '#1e293b',
                  color: isDone || isCurrent ? '#ffffff' : '#64748b',
                  border: isCurrent ? '3px solid #a3e635' : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  boxShadow: isCurrent ? '0 0 16px rgba(16,185,129,0.5)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {isDone ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{s.icon}</span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isCurrent ? 800 : 600,
                  color: isCurrent ? '#a3e635' : isDone ? '#ffffff' : '#64748b',
                  marginTop: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
