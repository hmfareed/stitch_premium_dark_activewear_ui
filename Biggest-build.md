# AfriCart — Feature Roadmap to Best-in-Class Marketplace

**Live site:** africart-one.vercel.app
**Goal:** Take AfriCart from a functional multi-vendor PWA to an outstanding, trusted Ghana-market marketplace.

Phases are ordered by what unlocks buyer/vendor trust and conversion first, then growth, then scale. Each phase assumes the previous one is stable in production before starting the next.

---

## Phase 0 — Foundation Fixes (Polish & Trust Basics)
*Goal: remove friction and rough edges in what already exists before adding anything new.*

- Replace plain-text loading states (e.g. "Loading Shop...") with skeleton UI grids across shop, product, and cart pages
- Image optimization + lazy loading for 3G/4G budgets
- Guest checkout (no forced signup)
- Persistent cart across sessions/devices
- Clear delivery fee shown **before** final payment step, never a surprise at checkout
- Buyer protection policy page (refund/return window, dispute contact) clearly linked in footer/checkout
- SSL/data handling messaging aligned with Ghana Data Protection Act 2012
- Basic order status timeline: Confirmed → Processing → Shipped → Delivered

---

## Phase 1 — Ghana-Specific Payments & Checkout
*Goal: match how Ghanaians actually expect to pay.*

- Mobile Money shown as first-class, distinct checkout buttons (MTN MoMo, Telecel Cash, AirtelTigo) rather than buried inside Paystack's generic flow
- Pay-on-delivery option for Accra/Kumasi/Tamale metro zones
- Installment/layaway option for higher-ticket electronics (Paystack supports this)
- Delivery cost engine calculated by region/zone (Accra vs. Tamale vs. rural), not a flat rate
- SMS order/delivery notifications via mNotify/Hubtel (not email-only)

---

## Phase 2 — Core Shopping Experience Upgrade
*Goal: make browsing and buying feel premium.*

- Smart search: autocomplete, typo-tolerance, filter-as-you-type, "no results" fallback with suggested categories
- Faceted filtering: price range, brand, rating, vendor, in-stock only, delivery speed — combinable with live result counts
- Product pages: multiple images + zoom, video support, variant selection (size/color) with live stock per variant
- Product Q&A section
- Reviews with photo/video upload, verified-purchase badges, helpful-vote sorting, vendor response capability
- "Customers also bought" / related products
- Recently viewed products
- Wishlist → price-drop alerts (extend existing wishlist)

---

## Phase 3 — Store/Vendor Registration & Onboarding
*Goal: make it easy to become a seller, but structured enough to keep quality high.*

### Registration flow
- Multi-step signup: business info → contact/ID verification → store branding → bank/MoMo payout details → review & submit
- Business types supported: individual/sole trader, registered business (Ghana Registrar General's Dept. reg. number field), informal/unregistered seller (lower trust tier, capped listing limits until verified)
- Document upload: Ghana Card or business certificate, proof of address, optional product photos of existing stock
- Store setup during registration: store name/handle (unique, e.g. africart-one.vercel.app/store/name), logo, banner, short bio, categories they'll sell in, return policy per store
- Email/SMS OTP verification before store goes live
- Terms of service + commission rate disclosure shown and accepted at signup (transparency reduces vendor churn later)
- Application status tracking for the vendor: Submitted → Under Review → Approved/Rejected (with reason) → Live
- Admin approval queue before a new store can publish products (manual or auto-approve based on tier)
- Onboarding checklist/progress bar inside vendor dashboard after approval: add first product, set payout method, set delivery zones, publish store

### Vendor trust tiers
- **Unverified**: can list, limited product count, payouts held longer
- **Verified** (ID/business doc approved): full listing limits, "Verified" badge, faster payout cycle
- **Featured/Premium**: top vendors by performance, eligible for homepage placement, lower commission or paid upgrade option

---

## Phase 4 — Vendor Dashboard & Store Management
*Goal: make vendors want to stay and sell more.*

- Branded vendor storefronts (mini-shop pages) with follow-a-vendor
- Vendor rating separate from product rating
- Order management: view/accept/reject orders, print packing slip, mark shipped with tracking info
- Bulk inventory upload/update via CSV, plus single-product form with variant support
- Low-stock and out-of-stock alerts, auto-hide out-of-stock listings (configurable)
- Vendor promotional tools: vendor-run discounts, flash sales, coupon codes scoped to their store
- Sales analytics per vendor: revenue over time, best-selling products, conversion rate, repeat customer rate
- Automated payout schedule (e.g. weekly) with a clear payout statement showing gross sale, commission deducted, net payout, and running balance
- Payout method management: MoMo number or bank account, editable with re-verification
- Multi-staff store accounts (owner can invite a staff login with limited permissions — useful for small businesses with helpers)
- In-app messaging between vendor and buyer, scoped to an order (keeps disputes and questions on-platform instead of leaking to WhatsApp)
- Dispute resolution flow between buyer/vendor with admin arbitration and evidence upload (photos, order history)

---

## Phase 5 — Logistics & Delivery Integration
*Goal: solve the hardest part of Ghana e-commerce — getting the product there reliably.*

- Integration with a local courier/dispatch API for live tracking (e.g. Bolt/Yango-style dispatch or dedicated logistics partner)
- Click-and-collect / vendor pickup option to avoid delivery fees for local buyers
- Delivery zone management tied into the Phase 1 cost engine
- Return pickup flow (not just drop-off instructions)

---

## Phase 6 — Growth & Retention
*Goal: turn one-time buyers into repeat buyers, and grow without pure ad spend.*

- Referral program (buyer and vendor incentives)
- Abandoned cart email/SMS/push sequence
- Loyalty points redeemable across vendors
- Personalized homepage based on browse history
- Push notifications for order status, price drops, back-in-stock (PWA install prompt tuned for Android)

---

## Phase 7 — Admin Panel (Platform Control Center)
*Goal: give the platform operator (you) full visibility and control without touching the database directly.*

### Dashboard & analytics
- Platform-wide overview: GMV, total orders, take-rate revenue, active vendors, active buyers, category performance, top-selling products
- Revenue breakdown: commission earned vs. paid out to vendors, by day/week/month
- Vendor performance leaderboard (sales, ratings, dispute rate, fulfillment speed)
- Customer analytics: repeat purchase rate, average order value, cart abandonment rate, cohort retention

### Vendor management
- Vendor approval queue (approve/reject new store applications with reason)
- Vendor list with filters: status (pending/verified/suspended), tier, category, sales volume
- Ability to suspend/reinstate a vendor, adjust their commission rate individually, or feature them on the homepage
- View/edit vendor payout details and manually trigger or hold a payout if needed

### Product & content moderation
- Product listing approval queue (auto-approve for verified vendors, manual review for new/unverified)
- Flagged listing review (reported by buyers or auto-flagged: banned keywords, suspicious pricing, duplicate images)
- Category and attribute management (add/edit categories, subcategories, required fields per category)
- Banner/homepage promotion management (schedule featured banners, flash sale sections, category spotlights)

### Order & dispute management
- Full order list across all vendors with search/filter (status, date, vendor, buyer, payment method)
- Manual order intervention: refund, cancel, reassign, resend notification
- Dispute queue with evidence viewer (photos, messages, order history) and resolution actions (refund buyer, side with vendor, partial refund)
- Return/refund tracking dashboard

### User management
- Buyer account list: search, view order history, suspend account for fraud/abuse
- Admin role management: super admin, support staff, finance staff — each with scoped permissions
- Activity/audit log of admin actions (who approved what, who issued which refund) for accountability

### Platform configuration
- Commission rate defaults and per-category overrides
- Delivery zone and fee configuration (feeds Phase 1/5 delivery cost engine)
- Payment method toggles (enable/disable MoMo providers, pay-on-delivery, installment by region)
- SMS/email notification template editor (order confirmations, payout statements, dispute updates)
- Fraud rules configuration: velocity thresholds, flagged keyword list, auto-suspend triggers

### Trust, safety & compliance
- Content moderation queue for new vendor listings before going live
- Fraud detection: velocity checks on rapid repeat orders, duplicate account detection
- A/B testing capability for homepage banners/promotions
- Data export tools for compliance with Ghana Data Protection Act 2012 requests

---

## Phase 8 — Community & Engagement Layer
*Goal: make the forum/community feature (already present) work for discovery, not sit disconnected.*

- Tie community content to product discovery: buying guides, vendor spotlights, user-generated "hauls"
- Link community posts to shoppable products/vendors directly
- Moderation tools consistent with Phase 7 content moderation queue

---

## Suggested Immediate Priority (if picking 4 things right now)
1. Pay-on-delivery + Mobile Money-first checkout (Phase 1)
2. Skeleton loading / UX polish (Phase 0)
3. Vendor registration flow + admin approval queue (Phase 3 & 7)
4. Delivery cost engine by zone (Phase 1/5)

These four separate a "working marketplace" from one Ghanaian buyers and vendors actually trust enough to stick with.

---

