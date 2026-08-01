# Phase 10 — Sidebar & Navigation Specification (Admin, Vendor, Rider)

New in this addendum. This lays out, section by section, what each panel's sidebar
actually contains and the flow a user follows through it — filling in the navigation
structure that Phases 3, 5, and 6 implied but never listed as a standalone nav tree.

### 10.1 Superadmin Sidebar

**Dashboard** — Platform snapshot: pending vendor approvals count, pending rider
approvals count, today's GMV, open disputes, failed payments needing follow-up. Each
stat links directly into its own section below — this is a launch pad, not a standalone view.

**Vendors**
- Approval Queue — KYC docs + Paystack subaccount status, approve/reject/request-more-info
- All Vendors — searchable/filterable list by status (unverified/trial/basic/plus/pro), store name, join date
- Vendor Subscriptions — plan per vendor, renewal dates, grace-period flags, manual
  override (comp a plan, force downgrade, extend), failed Paystack charges surfaced here for follow-up

**Orders & Disputes**
- All Orders — cross-vendor view of every order/sub-order, filterable by status and vendor
- Disputes — order/sub-order history, chat/contact log, refund initiation, mediation notes

**Hub Operations**
- Incoming Drop-offs — vendor drop-offs awaiting hub-received confirmation (barcode/QR or manual)
- Consignment Ledger — running stock-per-vendor held at the hub, reconciled against sales
- Outgoing Handoffs — confirms what a rider physically collected before leaving the hub

(Decide before build: this can be its own scoped "hub staff" role instead of a
superadmin sub-view, per the open question already flagged in Phase 6.5 — the
sidebar entry works identically either way, only the permission boundary changes.)

**Riders**
- Approval Queue — ID doc + vehicle type review
- All Riders — status (online/offline), active load, approval state, area

**Categories & Taxonomy** — Top-level category tree editor (vendors select from this; hierarchical, not flat)

**Subscription Plans** — Edit Basic/Plus/Pro/Trial: price, product cap, staff seat cap,
feature flags — read from the SubscriptionPlan collection at runtime, no code deploy needed

**Commission & Fees**
- Commission rate config (currently 0% platform-wide, kept editable for when that changes)
- Delivery Fee Configuration — new, see Phase 11. This is where baseFee, perKmRate,
  freeRadiusKm, and min/max fee caps are set and edited without a deploy

**Module Registry** — Enable/disable modules per vendor tier (advanced analytics, promotions engine, etc.)

**Content Moderation** — Flagged products, flagged reviews

**Audit Log** — Cross-vendor visibility: staff actions, approval decisions, payout anomalies, plan overrides

**Settings** — Platform-level config: SMS provider keys (Hubtel/mNotify), mapping/GPS
provider keys (see Phase 11.3), Paystack keys, Warehouse/hub record management

Flow: superadmin logs in → Dashboard surfaces anything time-sensitive via badge
counts → drills into the relevant section → action taken is logged automatically to
Audit Log in the background, not as a separate manual step.

### 10.2 Vendor Sidebar

**Dashboard** — Sales overview, pending orders count, low-stock alerts, payout
summary, trial/subscription status banner if a renewal or trial expiry is approaching

**Orders** — Incoming sub-orders, status pipeline (pending → confirmed → packed →
dropped off at hub / ready for hub pickup / ready for direct pickup → handed to rider →
delivered), order detail with masked customer contact until confirmed

**Products** — CRUD, bulk actions, variant management, stock tracking — capped by subscription tier

**Hub Inventory** — (only meaningful if vendor uses consignment) current stock held at
the hub, request restock/top-up, drop-off history, hub-received confirmations

**Staff** — Invite by phone (SMS via Hubtel/mNotify), assign scoped permissions, store-
switcher if the person operates or works across multiple stores — seat count capped by tier

**Storefront** — Store name/logo/banner, category selection, delivery zone & base
policy, fulfillment method per product. Customization (theme accent, featured rail,
about section) shows as a disabled/roadmap panel with a tier-gate note (Plus/Pro) until it's actually built

**Subscription & Billing** — Current plan, days remaining on trial, renewal date,
upgrade/downgrade, payment history

**Payouts** — Paystack subaccount balance, payout history

**Analytics** — Top products, repeat customer rate, fulfillment SLA — depth varies by tier

**Reviews** — View and respond to customer reviews

**Settings** — Store location (latitude/longitude — required input for delivery-fee
distance calc when a direct vendor pickup applies, see Phase 11.1), business info, notification preferences

Flow: vendor logs in → Dashboard → most action happens in Orders (day-to-day) and
Products (catalog upkeep); Staff/Subscription/Storefront are visited less often and can
collapse into a secondary nav group on mobile to keep the primary sidebar short.

### 10.3 Rider Sidebar

**Home / Dashboard** — Availability toggle (online/offline) pinned at the top always,
active delivery card(s) showing collection point first ("Collect from: AfriCart Hub" or
"Collect from: [Vendor], [address]"), customer drop-off address, masked customer contact revealed on acceptance

**Active Delivery** — Full detail view of the current assignment: items, collection point,
drop-off address, map/navigation handoff, OTP entry field for proof-of-delivery once Phase 8's delivery OTP is live

**Delivery History** — Past deliveries with status, timestamps, per-delivery fee earned

**Earnings** — Today's completed deliveries, today's earnings, pending payout — no cash reconciliation since all orders are prepaid

**Navigation** — "Open in Maps" deep link using the customer's captured GPS coordinates (see Phase 11.3)

**Report an Issue** — Flag failed delivery, wrong address, customer unreachable

**Area & Schedule** — Preferred delivery area within Tamale, preferred operating hours

**Profile** — ID document status, vehicle type, approval status

Flow: rider opens app → toggles online → assignment appears on Home with collection
point already resolved (hub vs. vendor, per fulfillmentSource) → rider taps into Active
Delivery for navigation → marks collected → out for delivery → OTP-confirms delivered → returns to Home for the next assignment or goes offline.

### 10.4 Shared Patterns Across All Three Panels
- Badge counts on sidebar items (pending approvals, pending orders, unread disputes)
  so the sidebar itself communicates what needs attention without opening each section
- Store-switcher (vendor panel only) sits above the sidebar, not inside it, since it changes the scope of every section below it
- Mobile: sidebar collapses to a bottom tab bar with 4–5 primary items (Dashboard,
  Orders, the panel's core action item, Settings) and a "More" overflow for the rest —
  consistent with the PWA's 2G/3G-tolerant, mobile-first framing from Phase 0
