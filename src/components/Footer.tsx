'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/AppContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const { showToast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    // Premium feedback via AfriCart's toast system
    showToast('Welcome to the inner circle! Exclusive drops and activewear updates are on their way.', 'success');
    setEmail('');
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        <div className="site-footer-grid">
          
          {/* Newsletter Section */}
          <div className="footer-col-newsletter">
            <span className="footer-section-tag">STAY IN THE KNOW</span>
            <h3 className="footer-newsletter-title">
              Subscribe for premium activewear, tech & exclusive drops.
            </h3>
            <form onSubmit={handleSubscribe} className="footer-newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="footer-newsletter-input"
                required
              />
              <button type="submit" className="footer-newsletter-btn">
                Subscribe
              </button>
            </form>
          </div>

          {/* Spacer */}
          <div className="footer-col-spacer" />

          {/* Brand Info */}
          <div className="footer-col-brand">
            <h3 className="footer-brand-title">AfriCart</h3>
            <p className="footer-brand-desc">
              Africa's premium online marketplace. Discover curated top-tier activewear, electronics, home essentials, and custom cyber-dark essentials.
            </p>
            <a href="tel:0209878744" className="footer-phone-link">
              <span className="material-symbols-outlined footer-phone-icon">call</span>
              <span>0209878744</span>
            </a>
          </div>

          {/* Links Grid */}
          <div className="footer-col-links">
            <div className="footer-links-grid">
              
              {/* Shop */}
              <div>
                <h4 className="footer-link-group-title">Shop</h4>
                <ul className="footer-links-list">
                  <li>
                    <Link href="/shop?category=Fashion" className="footer-link-item">
                      Fashion
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop?category=Electronics" className="footer-link-item">
                      Electronics
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop?category=Home" className="footer-link-item">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop" className="footer-link-item">
                      All Products
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="footer-link-group-title">Company</h4>
                <ul className="footer-links-list">
                  <li>
                    <Link href="/community" className="footer-link-item">
                      Community
                    </Link>
                  </li>
                  <li>
                    <Link href="/apply" className="footer-link-item">
                      Apply as Vendor
                    </Link>
                  </li>
                  <li>
                    <Link href="/track" className="footer-link-item">
                      Track Order
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Account */}
              <div>
                <h4 className="footer-link-group-title">Account</h4>
                <ul className="footer-links-list">
                  <li>
                    <Link href="/login" className="footer-link-item">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link href="/register" className="footer-link-item">
                      Register
                    </Link>
                  </li>
                  <li>
                    <Link href="/wishlist" className="footer-link-item">
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" className="footer-link-item">
                      Cart
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="footer-link-group-title">Legal</h4>
                <ul className="footer-links-list">
                  <li>
                    <Link href="/terms" className="footer-link-item">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/buyer-protection" className="footer-link-item">
                      Buyer Protection
                    </Link>
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Credits and Paystack */}
        <div className="footer-bottom-row">
          <p>© 2026 AfriCart. All rights reserved.</p>
          <div className="footer-credits">
            <p>Secured payment by Paystack</p>
            <p className="hidden md:block">•</p>
            <p>
              Built by
              <strong className="footer-credit-badge">
                Fareed Core Tech
              </strong>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
