'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Product } from '@/data/products';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [visible, setVisible] = useState(false);

  // Animate in
  useEffect(() => {
    if (product) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [product]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Lock body scroll
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'rgba(0, 0, 0, 0.85)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'zoom-out',
        }}
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close image preview"
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 1102,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>
            close
          </span>
        </button>

        {/* Image Frame */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '90vw',
            maxWidth: '480px',
            aspectRatio: '0.8',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'var(--surface-container)',
            border: '1px solid var(--outline)',
            transform: visible ? 'scale(1)' : 'scale(0.95)',
            opacity: visible ? 1 : 0,
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8)',
            cursor: 'default',
          }}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 90vw, 480px"
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </div>
    </>
  );
}
