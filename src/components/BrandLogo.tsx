'use client';

import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'icon';
  size?: number;
  textColor?: string;
  showSlogan?: boolean;
}

export default function BrandLogo({
  variant = 'full',
  size = 40,
  textColor = 'var(--on-surface)',
  showSlogan = true
}: BrandLogoProps) {
  // Height is proportional to the size when in 'full' mode
  const iconSize = size;
  
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', userSelect: 'none' }}>
      {/* 2. AFRICA MAP + CART SVG ICON */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, transition: 'all 0.2s ease' }}
      >
        {/* Africa Outline in vibrant green */}
        <path
          d="M 38,15 
             C 48,13 62,11 72,18 
             C 76,21 75,27 79,31 
             C 82,34 86,36 86,41 
             C 86,47 80,51 77,55 
             C 73,60 70,66 65,72 
             C 60,78 57,85 52,91 
             C 51,93 49,93 48,91 
             C 45,84 44,77 42,71 
             C 40,66 38,62 33,59 
             C 28,56 22,55 18,50 
             C 13,44 11,36 15,29 
             C 18,22 27,17 38,15 Z"
          stroke="#08BF5A"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Stylized Golden Shopping Cart overlapping the continent */}
        {/* Handle */}
        <path
          d="M 33,40 L 39,46 L 68,46"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Basket */}
        <path
          d="M 39,46 L 43,62 L 63,62 L 68,46 Z"
          fill="rgba(212, 175, 55, 0.08)"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Basket grid lines */}
        <path
          d="M 48,46 L 49,62 M 57,46 L 56,62 M 39,54 L 66,54"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Wheel joints */}
        <path
          d="M 45,62 L 43,69 M 61,62 L 59,69"
          stroke="#D4AF37"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Wheels */}
        <circle cx="43" cy="74" r="4.5" fill="#D4AF37" />
        <circle cx="59" cy="74" r="4.5" fill="#D4AF37" />
        {/* Wheel center hubs */}
        <circle cx="43" cy="74" r="1.5" fill="#000" />
        <circle cx="59" cy="74" r="1.5" fill="#000" />
      </svg>

      {/* Typography block */}
      {variant === 'full' && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span 
            className="font-lexend" 
            style={{ 
              fontSize: `${size * 0.48}px`, 
              fontWeight: 900, 
              color: textColor, 
              letterSpacing: '0.04em', 
              lineHeight: 1,
              textTransform: 'uppercase'
            }}
          >
            AFRI<span style={{ color: '#08BF5A' }}>CART</span>
          </span>
          {showSlogan && (
            <span 
              style={{ 
                fontSize: `${size * 0.16}px`, 
                fontWeight: 700, 
                color: '#D4AF37', 
                letterSpacing: '0.18em', 
                lineHeight: 1, 
                marginTop: '4px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-lexend)'
              }}
            >
              SHOP AFRICA. DELIVER ANYWHERE.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
