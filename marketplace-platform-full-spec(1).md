# Multi-Vendor Marketplace Platform — Complete Build Specification
### (Multi-vendor commerce + hub fulfillment + rider network + subscription-tiered vendors)

This is a single, dependency-ordered specification for building this class of platform from scratch — a multi-vendor marketplace with warehouse/hub-based fulfillment, an in-house rider network, and subscription-tiered vendor monetization. Phases are ordered by build dependency: each phase is a prerequisite for the one after it.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + Backend | **Next.js full-stack** (App Router, server actions/API routes) | One deployable unit, fastest iteration for a small team, plays well with AI coding agents generating code from spec |
| Database | **MongoDB** | The domain is fundamentally relational — vendors↔products↔orders↔sub-orders↔payments↔splits↔subscriptions↔staff permissions↔hub inventory, all with real foreign-key relationships and money/stock changing hands. Postgres gives transactional integrity where a document database requires much more application-level discipline to avoid consistency bugs. |
| Payments | **Paystack** (or regional equivalent) | Split payments, subaccounts per vendor, webhook-driven settlement |
| Media storage | **Cloudinary** | Product images, store assets, KYC documents, delivery proof photos |
| SMS | **Arkacel** (or regional SMS gateway) | OTP, order notifications, staff invites |
| Hosting | **Vercel** |
| Auth | Password-based to start, extended with OTP for specific high-value moments (Phase 6) | Simple; avoid third-party auth vendors unless team size grows |

**Deliberately avoided:** NestJS and a microservices split (overhead that pays off with a larger backend team, not early-stage); MongoDB for this specific domain (its flexible-schema strength doesn't outweigh the relational integrity this domain needs).

---

## Phase 0 — Foundations & Data Model

**Goal:** the skeleton every later phase depends on. Nothing user-facing yet.

### Roles
1. **Customer** — browses, buys across multiple vendors in one checkout
2. **Vendor** — owns a store, manages products/orders/staff
3. **Vendor Staff** — scoped sub-accounts under a vendor
4. **Rider** — handles delivery/fulfillment
5. **Superadmin** — platform-level control

### Core Schema (MongoDB)
- **Identity:** `users` (base identity/auth), `sessions` (database-backed login sessions, Phase 0.1b) → `vendor_profiles`, `rider_profiles`, `staff_memberships`, `customer_profiles` (1:1 or 1:many extensions)
- **Catalog:** `stores` (belongs to a `vendor_profile`), `products`, `product_variants`, `product_images`, `categories` (self-referencing `parent_id` for a real hierarchical taxonomy, not flat)
- **Commerce:** `carts` → `cart_items` (each tagged with `store_id`), which split at checkout into `orders` → `sub_orders` (one per vendor, carrying the full status state machine — see Phase 3.6) → `sub_order_items`, `payments`, `paystack_splits`
- **Fulfillment:** `warehouses`, `consignment_stock`, `hub_dropoffs`, `deliveries`, `rider_assignments`
- **Monetization:** `subscription_plans` (admin-configured tier definitions), `vendor_subscriptions`
- **Trust/Access:** `kyc_documents`, `vendor_approvals`, `audit_logs`, `permission_scopes`
- **Comms:** `otp_requests`, `sms_logs`, `notifications`

Every relationship implied by the flows below (a sub-order belongs to exactly one vendor and one order; a subscription belongs to exactly one vendor; a staff membership scopes to exactly one store) is an **enforced foreign key**, not an application-level convention.

### Setup Tasks
- Auth (password-based), role scaffolding for all five roles even before each is fully functional
- Paystack sandbox integration verified end-to-end with a dummy charge **before** building anything on top of it — payment plumbing is the thing you least want to discover is broken three phases later

### 0.1 Authentication & Verification — Full Roadmap

**Design decision: one base identity, phone-primary, not email-primary. Phone is required; email is optional and add-later, never a parallel choice at signup.** Given the Mobile Money/Ghana context already established throughout this spec, phone number is the natural primary identifier. A genuine "pick phone or email" choice at registration was considered and deliberately rejected — it would require two parallel identity paths (some accounts phone-verified-only, some email-verified-only), ambiguity at login over which identifier someone's typing, and a branching password-reset flow depending on which one they originally chose. That complexity isn't worth it when the stated audience mostly doesn't want email at all — the better version of "give people flexibility" is letting a customer **add** an email later from account settings (for a receipt copy or backup contact) without it ever becoming a second way to log in or reset a password. One canonical identifier, no ambiguity, still flexible for anyone who wants email as an extra. All five roles (customer, vendor, rider, staff, superadmin) share the same base `users` table and the same auth mechanics; only the profile extension (`vendor_profiles`, `rider_profiles`, etc.) and post-login routing differ.

**Design decision: one identity can hold multiple roles.** A person could plausibly be a customer *and* a vendor on the same phone number/login — don't force separate accounts per role. This mirrors the store-switcher pattern already built for staff/multi-store vendors (Phase 4): if a logged-in user has more than one active role/profile, show a lightweight role-switcher rather than requiring a second registration.

#### 0.1a Registration
1. Phone number + password (email optional, can be added later from account settings)
2. Password hashed with **bcrypt or argon2** — never reversible encryption, never plain text
3. Password requirements: reasonable minimum (8+ characters) — avoid overly strict complexity rules that hurt signup completion for a market where this may be someone's first digital account; length matters more than forced special-character rules
4. **Phone verification is progressive, not a signup gate for customers** — don't make a customer verify OTP before they're even allowed to browse; that's friction with no payoff this early. Verification happens naturally at the first moment it actually matters: checkout (ties into guest checkout's OTP requirement, Phase 1.2c) or delivery/pickup confirmation (Phase 6). **Vendors and riders are the exception** — their phone verification is already a mandatory gate as part of KYC/onboarding (Phase 1.1, Phase 3.1), since they're trust-sensitive roles from day one.

#### 0.1b Login
1. Phone (or email, if added) + password
2. **Session strategy: server-side/database-backed sessions in an httpOnly secure cookie**, not a JWT stored in localStorage or a mobile-style access/refresh token pair — this is a web/PWA app, not a native mobile app calling a separate API, so cookie-based sessions are simpler and avoid the XSS exposure of client-accessible token storage. A `sessions` table (or Auth.js/NextAuth's database session strategy) makes revocation trivial — critical for the password-reset flow below.
3. **Failed login handling:** rate-limit and temporarily lock an account after repeated failures (e.g. 5 failed attempts → 15-minute lockout) — same rate-limiting principle already established for OTP/checkout (Engineering Practices, below). Notify the account owner by SMS if there's a burst of failed attempts, since that's a real signal of a credential-stuffing attempt, not just a forgetful customer.

#### 0.1c Password Reset ("Forgot Password")
1. Customer enters their phone number (or email)
2. System sends an OTP — this reuses the exact same OTP infrastructure from Phase 6, just with a new `purpose: password_reset` value on `otp_requests`, not a separate implementation
3. OTP verified → a short-lived reset token is issued → customer sets a new password
4. **All existing sessions for that account are invalidated the moment the password changes** — this is what the database-backed session strategy (0.1b) makes trivial: just delete the account's session rows. This matters because a password reset is often triggered *because* the account may be compromised — leaving old sessions alive defeats the purpose.
5. Same rate-limiting/cooldown principle as every other OTP flow in this spec (Phase 6.3) — resetting shouldn't be a free way to spam someone's phone with SMS

#### 0.1d Password Change (while logged in)
- Requires re-entering the **current** password, not just being logged in — protects against a scenario where someone's already-open session on a shared/lost device gets used to lock the real owner out
- Same session-invalidation behavior as a reset: changing your password from a logged-in session should log out any *other* active sessions, keeping the current one alive

#### 0.1e Role-Based Routing & the Multi-Role Switcher
- On login, the system checks which profile extensions exist for that `user_id` (`customer_profiles`, `vendor_profiles`, `rider_profiles`, `staff_memberships`) and routes accordingly
- **Single role:** straight to that role's dashboard
- **Multiple roles:** land on a lightweight chooser ("Continue as Customer" / "Continue as Vendor"), same interaction pattern as the vendor store-switcher (Phase 4) — one login, multiple hats, no separate accounts to manage or remember passwords for

#### 0.1f Deferred (v2, not launch-critical)
- **2FA/login OTP** — already flagged as deferred in Phase 6.1 unless a specific fraud pattern justifies it; password + rate-limited lockout is sufficient at launch
- **Device/session management UI** ("log out of all other devices," a list of active sessions) — genuinely useful eventually, but not something a small early user base is likely to need or ask for on day one
- **Social login (Google/Apple/Facebook)** — adds real complexity (OAuth flow, account-linking edge cases) for a market where phone-based Mobile Money identity is already the natural primary path; only worth it if there's a clear signal customers want it

### Engineering Practices (start from day one, not retrofitted later)
- **Testing strategy:** unit tests around anything touching money or stock (checkout splitting, subscription billing, hub inventory decrements) from the start — these are the paths where a silent bug costs real money or a real out-of-stock sale, not just a UI glitch. Integration tests for the checkout→split-payment→sub-order pipeline specifically, since it's the most load-bearing flow in the whole system. End-to-end tests can wait until the core loop stabilizes.
- **CI/CD:** run tests + type-check on every push before merge, even as a solo dev — catches Prisma schema drift and broken migrations before they hit production. Vercel's preview deployments per branch/PR cover most of this for the frontend/API layer for free.
- **Backup & disaster recovery:** whichever managed Postgres provider you pick (Neon/Supabase/Railway), confirm automated daily backups are actually enabled and test a restore at least once before launch — an untested backup is not a backup.
- **Rate limiting/API hardening:** apply from day one on auth endpoints, OTP requests, and checkout — not just "add later once abused." A single unrate-limited OTP endpoint is a direct SMS-cost drain if discovered by a bad actor.
- **Webhook reliability:** every Paystack webhook (payment success, transfer/split settlement, subscription charge, refund) must be **idempotent** — store the Paystack event ID and check it before processing, so a retried or duplicate webhook delivery never double-credits a payout or double-fulfills an order. Always verify the webhook signature before trusting the payload. This matters more than almost anything else in Phase 0, since split payments, subscriptions, and refunds (Phase 2.5, Phase 7) all depend on webhooks firing correctly exactly once.
- **Caching/performance basics:** Redis for session state, cart state, and hot-path reads (category lists, featured products, a vendor's storefront data) — cheap to add early, expensive to retrofit once the database is under real read load. Cloudinary's own CDN handles image delivery, so no separate image CDN setup is needed. Don't reach for a dedicated search cache/Elasticsearch until Postgres full-text search (Phase 1.2b) actually becomes a bottleneck — premature caching infrastructure is itself a maintenance cost for a solo dev.
- **Legal/compliance pages:** Terms of Service, Privacy Policy, and a Vendor Agreement (covering commission terms, subscription billing, dispute handling, and what happens to a vendor's data/listings if they leave) — not code, but a genuine launch blocker. Draft these before public launch, not after; retrofitting terms onto vendors who already signed up under different (or no) terms is a real headache. A data protection compliance note (retention windows, what's collected, a vendor/customer's right to request deletion) belongs here too, extending the retention-window principle already applied to OTP logs (Phase 6.3) to the rest of the personal data the platform holds.

**Exit criteria:** a user can register as any of the five roles, and a test payment can be initiated and confirmed via webhook.

---

## Phase 1 — Core Marketplace Loop

**Goal:** a customer can buy something from a vendor, end to end. This is the load-bearing phase everything else builds on.

### 1.1 Vendor Onboarding (the hard gate)
1. **Registration** (`/vendor/register`, separate from customer signup) — vendor starts `unverified`
2. **KYC submission:** business registration doc, owner ID, business address — via Cloudinary
3. **Paystack subaccount creation — hard gate:** the vendor is *not* activated for selling until a subaccount is successfully created and linked. No subaccount → no "Go Live" button. This prevents vendors who can't be paid.
4. **Superadmin approval:** manual review (KYC + subaccount check) → approval flips status to `verified` (permanent, doesn't expire)
5. **Automatic 1-month free trial starts on verification approval** — no plan selection or payment needed upfront, so newly verified vendors can start selling same-day (full detail in Phase 7)
6. **Store creation wizard** (post-trial-start): store name/slug/logo/banner, category selection, fulfillment method choice (Phase 2), delivery zone/policy, first product upload (soft-required to exit wizard)

### 1.2 Customer Flow — Browsing → Vendor Storefront
When a customer taps a product or vendor, they land on the vendor's public storefront:
- **Header:** banner, logo, name, verified badge, subscription tier badge (Phase 7), rating/review count, follow/favorite store
- **Store stats:** response time, fulfillment rate, product count, "member since"
- **Category tabs:** scoped to that vendor's own taxonomy
- **Product grid:** paginated, stock status visible
- **Policies tab:** vendor-set return/delivery policies
- Adding to cart tags items with that `store_id` for the split logic below

### 1.2b Search & Discovery
- **Search bar:** keyword search across product title/description/category, platform-wide (not scoped to one vendor) — Postgres full-text search (`tsvector`/`tsquery`) is enough at launch scale; don't reach for Elasticsearch/a vector DB until product catalog size or query complexity actually demands it
- **Filters:** price range, category, vendor, in-stock only, rating
- **Sort:** relevance (default), price low→high/high→low, newest, best-selling
- **Recently viewed / recently searched:** simple per-customer list, no ML needed at this stage
- Search should degrade gracefully on slow connections — return results incrementally rather than blocking on a full page render

### 1.2c Guest Checkout
- Allow checkout without account creation: capture name, phone, delivery address, and OTP-verify the phone (Phase 6) as the trust mechanism in place of a password
- On order completion, offer "create an account to track this order" rather than forcing it upfront — account creation becomes optional, not gating
- Guest orders still create a `users` row internally (a lightweight `guest` role) so order history and support lookups work the same way as registered customers

### 1.3 Cart & Checkout — Multi-Vendor Splitting
1. Cart groups items **by vendor** visually before checkout ("3 vendors, 3 delivery estimates")
2. **Fulfillment method choice:** the customer selects, per sub-order (since a multi-vendor cart could mix methods), either **Home Delivery** (a rider brings it to them) or **Self-Pickup** (they collect it in person from the hub — see Phase 3.6a for how this branches the status flow). This is stored as `sub_orders.fulfillment_method` and is a separate axis from the vendor-side `fulfillment_source` (Phase 2.2, which is about how the item *gets to the hub*, not how it leaves it). **See 1.3d for how the fee differs between the two.**
3. Address capture (home delivery only): a digital/GPS addressing system as primary, manual fallback (landmark + area) for customers without one
4. Payment: Mobile Money as primary rail, card as secondary, via the payment gateway
5. On payment success → cart splits into `sub_orders` (one row per vendor, foreign-keyed to both `order_id` and `store_id`) → split payment disburses to vendor subaccounts minus platform commission → each vendor notified independently
6. Order tracking shows **per-sub-order status**, since vendors/hub fulfill independently, and diverges further based on fulfillment method (Phase 3.6)

### 1.3b Stock Race Conditions
Two customers can attempt to buy the last unit of the same product simultaneously. Handle this with a **short-lived stock reservation at checkout initiation**, not just a decrement after payment:
- When a customer starts checkout, reserve the quantity in cart (e.g. `products.reserved_qty` incremented, or a Postgres row-level lock/`SELECT ... FOR UPDATE` on the product row during the transaction) for a short window (e.g. 10–15 minutes)
- If payment completes within the window, the reservation converts to a real decrement
- If the window expires without payment, the reservation releases automatically
- If a second customer's checkout would exceed available stock (actual − reserved), they're told the item is no longer available *before* attempting payment, not after — never let two customers both pay for the same last unit
- This needs an actual Postgres transaction wrapping "check stock → reserve → proceed to payment," not an application-level check-then-write that can race

### 1.3c Order Cancellation
- **Before vendor/hub confirms:** customer or vendor can cancel a sub-order freely, full refund via payment gateway reversal, stock released back
- **After confirmed but before pickup:** vendor can still cancel (e.g. actually out of stock despite the count) — refund issued, customer notified with a reason; track this rate per vendor since a high vendor-cancellation rate is a quality signal worth surfacing in Phase 5's vendor oversight
- **After rider pickup:** cancellation is no longer simple — this becomes a **return** (see 2.5) rather than a cancellation, since the item physically exists in transit or at the customer
- **Multi-vendor carts:** cancellation is always scoped to one `sub_order`, never the whole `order` — other vendors' sub-orders proceed independently, which is exactly why sub-orders exist as their own entity rather than just order line items

### 1.3d Delivery Fee Calculation
- **Self-pickup should be free or noticeably cheaper than home delivery** — this gives customers a genuine incentive to choose it, which matters operationally since every self-pickup order is one less rider trip your hub has to schedule and pay for
- **Home delivery fee, simplest launch approach:** a flat fee per sub-order at single-hub Tamale scale (Phase 2.3) — distance-based pricing isn't worth the complexity until there's a second hub or the delivery area is large enough that a flat fee under- or over-charges noticeably at the edges
- **Multi-vendor carts:** each sub-order's delivery fee is calculated independently (since Phase 3.4's hub batching means one rider run can still cover several sub-orders — the fee doesn't need to reflect actual per-trip rider cost precisely, just needs to roughly cover it in aggregate)
- **Where the fee goes:** stored on the `sub_order` itself (`delivery_fee`) at checkout time, so a later change to the platform's fee structure never retroactively affects a placed order — this also means delivery fee revenue is separately visible from product-sale revenue in analytics (Phase 8), which matters since fee revenue isn't reduced by the current 0% commission decision (Phase 7)
- **Refunding the fee:** a cancelled sub-order (1.3c) refunds the delivery fee along with the product cost; a return (2.5) typically does **not** refund the delivery fee unless the return reason is a vendor/platform fault (wrong item, damaged) — worth deciding this policy explicitly rather than defaulting silently either way

### 1.3e Order Invoice & Receipt Generation
- **Customer receipt:** a downloadable/printable receipt per sub-order (PDF), generated once `paid` — itemized product cost, delivery fee (1.3d), commission line (currently 0%, shown explicitly per Phase 7's reasoning), total paid, payment method/reference. Accessible from the customer's order history at any time, not just emailed once and forgotten.
- **Vendor invoice:** effectively the same underlying data as the payout statement (Phase 1.4b), but framed as a per-sale invoice rather than a payout-period summary — useful for a vendor's own bookkeeping independent of when they actually get paid out
- **Implementation note:** both are generated from the same `sub_order` + `payment` + `delivery_fee` data — build one PDF-generation utility, not two, parameterized by which party's version is being rendered

### 1.4 Vendor Panel — Core Features
- **Dashboard:** sales overview, pending orders, low-stock alerts, payout summary
- **Products:** CRUD, bulk actions, variant management, stock tracking
- **Orders:** incoming sub-orders, status transitions, order detail with masked customer contact (revealed on confirmation)
- **Payouts:** subaccount balance, payout history (handled by the payment gateway's disbursement schedule)
- **Store status — pause/vacation mode:** a vendor can temporarily take their store offline (restocking, travel, personal reasons) without losing their verification, subscription, or listings. While paused:
  - Storefront shows as "Temporarily closed" rather than disappearing entirely — existing reviews/history stay visible, just no new orders accepted
  - No new checkouts allowed against this vendor's products; existing in-flight sub-orders continue through their normal lifecycle unaffected
  - Subscription billing (Phase 7) **keeps running** during a pause — this isn't a subscription cancellation, just a sales pause, so it shouldn't quietly stop the vendor's trial/paid-tier clock either
  - A vendor-set expected return date is optional but useful — shown to customers instead of leaving them guessing when browsing

### 1.4b Vendor Payout Statements
Beyond a raw payout history list, vendors need a genuinely itemized statement to trust the numbers:
- **Per-payout breakdown:** which sub-orders are included in a given payout, gross sale amount, commission deducted (currently 0% per Phase 7, but the line should exist and show 0 explicitly so vendors see the mechanism, not just an absent line), any refund clawbacks (Phase 2.5) netted against this payout, final amount disbursed
- **Downloadable/exportable statement** (PDF or CSV) per payout period — vendors will want this for their own bookkeeping/tax purposes regardless of what AfriCart itself withholds
- **Running ledger view:** a vendor can see, at any time, "what I've earned this month/year" without waiting for a payout event — this is really just a filtered view over `sub_orders` + `payments` + `returns`, not a separate ledger system to build
- This becomes more important, not less, whenever commission moves off 0% (Phase 9) — build the itemization now while the math is simple, rather than retrofitting it once commission makes the numbers more complex

**Exit criteria:** a real customer can pay a real vendor via split payment, and the vendor's subaccount receives funds. Build and test this thoroughly — everything else touches `sub_orders`.

---

## Phase 2 — Fulfillment Infrastructure (Hub Model)

**Goal:** every paid order has a defined, unambiguous physical path from "paid" to "ready for a rider to collect."

### 2.1 The Model
1. Vendor lists products as normal.
2. Customer orders.
3. Vendor fulfills each SKU one of two ways:
   - **On-demand drop-off** — vendor delivers the item to the warehouse/hub once an order comes in
   - **Pre-stocked consignment** — vendor stores inventory at the hub in advance; orders fulfill straight from hub stock
4. Riders collect from the **hub** (the common case) or, for vendors without consignment/timely drop-off, **directly from the vendor's location** (fallback case).
5. Rider delivers to the customer.

### 2.2 Schema Addition
- `sub_orders.fulfillment_source` enum: `hub_stock`, `vendor_dropoff_pending`, `vendor_direct_pickup` — this tells riders and ops exactly where to collect from, and matters even for single-vendor orders since they might route through the hub rather than the vendor's own address.

### 2.3 Scope: Single Hub to Start
Launch with **one physical warehouse** (`warehouses` table has one seeded row, not a hardcoded constant — costs nothing now, avoids a migration later). Delivery zones and rider assignment are scoped to "distance/area within the launch city," not a formal multi-hub/region-matching system — add that layer only when a second city/hub comes online. When expansion happens, the additions are: a `hub_id`/region field on records, a region step on vendor/rider onboarding, and hub-to-hub routing if needed — none of that needs designing now.

### 2.4 Vendor-Side Additions
- Fulfillment method choice in onboarding (per product or store default)
- **Hub inventory view** (if using consignment): current stock at the warehouse, restock requests, drop-off history, hub-received confirmations
- Order status now includes: packed → dropped off at hub / ready for hub pickup / ready for direct pickup → handed to rider → delivered

### 2.5 Returns & Reverse Logistics
A return is a distinct flow from a cancellation (1.3c) — the item already reached (or is with) the customer. A return can only be initiated while a sub-order is `delivered` and within the confirmation window (Phase 3.6b) — once a sub-order auto-completes, the return path should route through the support ticket system (Phase 5.5c) as an exception rather than the standard self-serve flow, since payout may have already released.
1. **Customer initiates return** within a vendor-set return window, selecting a reason (defective, wrong item, changed mind — vendor policy may restrict which reasons qualify)
2. **Vendor approves or disputes** the return request — a dispute escalates to superadmin mediation (Phase 5)
3. **Reverse pickup:** a rider is assigned to collect the item from the customer, same assignment logic as forward delivery (Phase 3.4), and brings it back to the **hub**, not directly to the vendor — this keeps the same chain-of-custody model as the forward flow
4. **Hub inspects/logs the returned item** (condition check, same barcode/QR confirmation pattern as a drop-off) before releasing a refund — protects against fraudulent "item was damaged" claims
5. **Refund issued** via payment gateway reversal once the hub confirms receipt; if the sub-order was part of a split payment, the reversal needs to correctly claw back from the vendor's subaccount, not just refund from platform funds
6. **Restocking:** hub updates `consignment_stock` (if applicable) or notifies the vendor the item is back and awaiting vendor pickup/disposal decision

**Schema addition:** `returns` table (`sub_order_id`, `reason`, `status`, `rider_assignment_id` for the reverse pickup, `refund_reference`)

**Exit criteria:** every paid sub-order has a correct `fulfillment_source` recorded. This must be right before rider assignment (Phase 3) can mean anything.

---

## Phase 3 — Rider Network

**Goal:** delivery actually happens.

### 3.1 Rider Onboarding
1. Registration: phone number, ID document, vehicle type, preferred delivery area (free-text/known-neighborhood list, not a formal zone system at single-hub scale)
2. **Emergency contact:** name + phone number of someone to notify in case of an incident — captured at registration, not treated as optional
3. OTP verification of phone ownership (Phase 6) before account creation completes
4. Superadmin approval — riders are trust-sensitive (handle customer goods)
5. Availability status (online/offline) + preferred delivery area

### 3.2 Rider Roles & Responsibilities
- **Pickup — hub-first:** most deliveries collected from the warehouse, whether pre-stocked or dropped off for this order
- **Pickup — direct from vendor (fallback):** per the sub-order's `fulfillment_source`
- **Multi-stop handling:** a route may combine one hub stop covering several sub-orders (even across vendors, since hub stock is co-located) with occasional direct vendor stops
- **Proof of delivery:** photo capture and/or OTP-confirmed handoff (Phase 6)
- **No cash handling:** all orders prepaid via the payment gateway before dispatch — riders never collect payment, which simplifies rider trust requirements and removes reconciliation from the dashboard entirely
- **Status updates:** rider is the source of truth for collected → out for delivery → delivered

### 3.3 Rider Dashboard
- Availability toggle (always visible)
- Active delivery card(s): **collection point first** ("Collect from: Hub" or "Collect from: [Vendor], [address]"), customer drop-off address + map link, masked customer contact (revealed on assignment)
- Earnings summary: today's completed deliveries, today's earnings, pending payout (per-delivery fee only — no cash reconciliation needed since orders are prepaid)
- Delivery queue/history
- Navigation deep link (Maps app)
- Incident/issue reporting (failed delivery, wrong address, unreachable customer)
- **SOS button:** always visible, one tap — immediately notifies superadmin/hub-ops (Phase 3.5) with the rider's current location and active delivery context, and offers a direct dial to the rider's emergency contact and to local emergency services. This should work even if the rider's data connection is poor — an SMS-based fallback (rider's location + a distress code sent via SMS if the in-app trigger can't reach the server) is worth considering given the network-aware PWA design already assumed elsewhere in this spec.
- Area & schedule settings

### 3.4 Assignment Logic
- **Hub batching:** since most stock passes through the hub, batch multiple customer deliveries into one rider run departing the hub, rather than one rider per sub-order
- Distance/area matching for the drop-off leg — a simple `delivery_area` field is enough at single-hub scale
- For the fallback direct-vendor-pickup case, match against the vendor's location the same way
- Availability + current active-delivery load (don't over-assign mid-route)
- Optional: rider acceptance window (accept/decline within N seconds before reassignment) rather than forced auto-assignment — reduces no-shows

### 3.4b Delivery SLA & Late Handling
- **Estimated delivery window:** shown to the customer at checkout (e.g. "today, 2–5pm" or "within 3 hours") — a simple estimate based on distance/current rider load is enough at launch; no need for a sophisticated ETA model before there's real delivery-time data to calibrate against
- **Late-delivery detection:** if a sub-order passes its estimated window without a "delivered" status, flag it in the superadmin dashboard (Phase 5) and notify the customer proactively rather than making them come ask
- **Accountability:** track whether a delay traces to the vendor (late drop-off/consignment shortfall), the hub (slow processing), or the rider (slow delivery) — this is why `fulfillment_source` and rider assignment timestamps both need to be logged, not just the final "delivered" timestamp
- **Customer compensation policy:** decide upfront whether a significantly late delivery earns the customer anything (a discount code, delivery fee refund) — even a simple flat policy ("delivery fee refunded if more than 2 hours late") is better than deciding ad hoc per complaint, and ties naturally into the support ticket system (Phase 5.5c) for customers to actually claim it

### 3.5 Warehouse/Hub Operations
A lightweight hub-ops capability (scoped superadmin sub-view, or a dedicated light "hub staff" role):
- **Incoming drop-offs:** vendor drop-offs get a hub-received confirmation (barcode/QR or manual) that flips `fulfillment_source`
- **Consignment stock ledger:** running count per vendor, reconciled against sales
- **Outgoing handoffs to riders:** confirm exactly what a rider physically collected before leaving — a clean chain of custody from vendor → hub → rider → customer (home delivery orders only)
- **Pickup counter for customers:** a separate function from rider handoffs — self-pickup orders (Phase 1.3, Phase 3.6a) are handed directly to the customer at the hub, confirmed via the pickup OTP the customer shows (see 3.6f's Hub Ops dashboard)

**Exit criteria:** a full order lifecycle — customer pays, vendor/hub prepares, and either a rider delivers it or the customer collects it in person — works end to end without manual intervention.

---

## Phase 3.6 — Order Status Lifecycle, Notifications & Role Access

**Goal:** one unambiguous state machine that every role reads from and only certain roles can advance, with the right notification firing at the right moment — not five different implicit "status" concepts scattered across vendor panel, rider dashboard, and superadmin.

### 3.6a The State Machine (`sub_orders.status`)
Status lives on the **sub-order**, not the parent order, since vendors/hub/riders fulfill independently (Phase 1.3). Each `order` shows an aggregate view over its `sub_orders`, but the source of truth is per sub-order.

**The flow branches based on `fulfillment_method` (Phase 1.3, step 2) — home delivery involves a rider's last mile; self-pickup means the customer collects in person and a rider is never assigned.** To avoid the ambiguity that came up earlier (does "picked up" mean the rider collected it from the vendor/hub, or the customer collected it themselves?), the internal states are named explicitly so there's no overloaded term:

**Shared states (both paths, before the branch):**
| Status | Who triggers it | What it means |
|---|---|---|
| `pending_payment` | System (checkout initiated) | Cart reserved (Phase 1.3b), awaiting payment webhook |
| `paid` | System (payment webhook) | Payment confirmed, split disbursed, sub-order officially exists |
| `vendor_processing` | **Vendor** | Vendor has acknowledged and is preparing the item |
| `awaiting_hub_dropoff` | System (derived from `fulfillment_source`, Phase 2.2) | Vendor needs to physically bring the item to the hub |
| `hub_received` | **Hub** | Hub has confirmed receipt of a vendor drop-off (skipped if already consignment stock) |

**Branch A — Home Delivery (`fulfillment_method = home_delivery`):**
| Status | Who triggers it | What it means |
|---|---|---|
| `ready_for_rider_pickup` | System | Item is at the hub (or held by vendor for direct pickup), waiting for a rider |
| `rider_assigned` | System (assignment logic, Phase 3.4) | A specific rider is tasked with this sub-order |
| `rider_collected` | **Rider** | Rider has physically collected the item — *this is the "rider picked it up" moment, distinct from the customer pickup below* |
| `out_for_delivery` | **Rider** | Rider is en route to the customer |
| `delivered` | **Rider**, gated by OTP confirmation (Phase 6) | Rider completed handoff; not yet final — see confirmation window below |

**Branch B — Self-Pickup (`fulfillment_method = self_pickup`, no rider involved at all):**
| Status | Who triggers it | What it means |
|---|---|---|
| `ready_for_customer_pickup` | System | Item is at the hub, waiting for the customer to come collect it — triggers a "ready for pickup" notification with a pickup OTP (Phase 6) |
| `customer_picked_up` | **Hub Ops**, gated by OTP confirmation the customer shows at the counter | *This is what "Picked" means* — the customer has come in person and collected their own order |

**Shared terminal states (both paths converge back here):**
| Status | Who triggers it | What it means |
|---|---|---|
| `completed` | System (auto, after confirmation window) or **Customer** (explicit confirm, home delivery only — see 3.6b) | Order is fully closed; this is what triggers final payout eligibility (Phase 1.4b) |
| `cancelled` | **Vendor** (pre-collection) or **Customer** (pre-confirm, per Phase 1.3c) | Terminal — refund issued |
| `return_requested` → `return_in_transit` → `return_received` → `refunded` | **Customer** initiates, **Rider** transports (home delivery returns) or **Customer** brings back in person (self-pickup returns), **Hub** confirms (Phase 2.5) | Terminal — parallel path off of `delivered`/`customer_picked_up`/`completed` |
| `failed_delivery` | **Rider** (home delivery only) | Delivery attempt failed (unreachable customer, wrong address) — routes back to reassignment or return-to-hub, not silently stuck. No equivalent state exists for self-pickup, since the customer initiates that final step themselves. |

### 3.6b The Confirmation Window (customer confirmation, explained)
Applies with a slight variation depending on `fulfillment_method`:

**Home delivery:** `delivered` and `completed` are deliberately separate states:
1. Rider marks `delivered`, OTP-confirmed at handoff (Phase 6) — this proves the item physically reached the customer, but doesn't yet mean the transaction is settled
2. A **confirmation window** opens (e.g. 48 hours): the customer can tap "Confirm Receipt" to close it early, or **file a return/dispute** within this window (Phase 2.5) if something's wrong
3. If the window lapses with no dispute, the sub-order **auto-completes** — no customer action required

**Self-pickup:** `customer_picked_up` is already OTP-confirmed at the hub counter, so there's no separate "confirm receipt" tap needed — the customer's physical presence at collection *is* the confirmation. The same confirmation **window still applies before `completed`**, but only for filing a condition/quality dispute (Phase 2.5) — not for confirming receipt itself, since that's not in question. In both cases:

**Vendor payout eligibility is tied to `completed`, not `delivered`/`customer_picked_up`** — this is the mechanism that protects against paying out a vendor and then having to claw back funds for a legitimate return filed a day later (ties directly into the payout statement in Phase 1.4b, which should show sub-orders as "pending confirmation" vs. "payout-eligible")

### 3.6c Role-Level Access to Order Status

| Role | Can view | Can change status to |
|---|---|---|
| **Customer** | Own orders/sub-orders only, full timeline | `completed` (early confirm, home delivery only), initiate `cancelled` (pre-collection) or `return_requested` (post-delivery/pickup, within window) |
| **Vendor** | Sub-orders belonging to their own store(s) only | `vendor_processing`, `cancelled` (pre-collection only) |
| **Vendor Staff** | Same as vendor, scoped by `permission_scopes` (Phase 4) — e.g. `orders:read` only sees, `orders:write` can transition | Same actions as vendor, if granted `orders:write` |
| **Rider** | Only sub-orders currently assigned to them (home delivery only — riders never see self-pickup sub-orders) | `rider_collected`, `out_for_delivery`, `delivered` (OTP-gated), `failed_delivery` |
| **Hub Ops** (Phase 3.5) | All sub-orders currently at or moving through the hub | `hub_received`, `ready_for_rider_pickup` / `ready_for_customer_pickup`, `customer_picked_up` (OTP-gated, at the pickup counter), confirms `return_received` |
| **Superadmin** | Everything, platform-wide | Any status, as a manual override — **always logged to `audit_logs` with a required reason**, since overriding the state machine bypasses the normal checks-and-balances (e.g. force-completing a disputed order, or force-cancelling a stuck one) |

No role can skip a state out of order through the normal UI (a vendor can't mark something `delivered`, a rider can't mark something `vendor_processing`) — only superadmin override bypasses sequencing, and that's intentionally friction-heavy (reason required, logged).

### 3.6d Notification Matrix
| Transition | Customer | Vendor | Rider/Hub | Channel |
|---|---|---|---|---|
| `paid` | Order confirmation | New order alert | — | SMS (vendor — time-sensitive for a small vendor who may not have the app open) + push (customer) |
| `vendor_processing` | "Being prepared" | — | — | Push/in-app only (not worth an SMS) |
| **— Home delivery branch —** | | | | |
| `rider_assigned` | — | Optional: "rider en route to collect" | New delivery assigned (rider) | Push |
| `rider_collected` | "Order picked up by rider" | — | — | Push |
| `out_for_delivery` | Delivery OTP code (Phase 6) | — | — | **SMS** (the OTP itself must be SMS, not push-only, in case the app isn't open) |
| `delivered` | "Delivered — confirm or report an issue" | Pending-payout notice | — | Push + in-app action prompt |
| `failed_delivery` | "Delivery attempt failed" + next steps | Notified if reassignment needed | — | Push + SMS |
| **— Self-pickup branch —** | | | | |
| `ready_for_customer_pickup` | "Delivered to pickup point — ready for you!" + pickup OTP code + hub address/hours (status shown: **Delivered**) | — | Hub Ops sees it enter the pickup queue | **SMS** (same reasoning as the delivery OTP — customer needs the code even if the app isn't open) |
| `customer_picked_up` | "Picked up — enjoy!" (status shown: **Picked**, confirmation not an action prompt) | Pending-payout notice | — | Push |
| **— Shared —** | | | | |
| `completed` | — | "Payout released" | — | Push/in-app (vendor) |
| SLA breach (Phase 3.4b) | Proactive "sorry for the delay" (home delivery only) | Flagged internally | — | Push + SMS |

Keep this list deliberately short — over-notifying on every minor internal transition (e.g. `awaiting_hub_dropoff`, `hub_received`) trains customers to ignore notifications entirely. Only notify on transitions the customer actually cares about.

### 3.6e Customer-Facing Status Simplification (Jumia-style)
The internal state machine (3.6a) has many granular states because vendor, rider, and hub-ops each genuinely need that precision to do their jobs. The **customer never sees that granularity** — showing a customer "awaiting_hub_dropoff" is confusing and operationally meaningless to them. Instead, the customer-facing UI collapses the internal states into your five labels — and both meanings of "Picked" you wanted are preserved, because **home delivery and self-pickup are two separate flows that never occur on the same sub-order**, so reusing a label across them causes no real ambiguity for the customer (they only ever see the one flow relevant to the order they placed):

**Home delivery orders:**
| Customer sees | Maps from internal status | What it means |
|---|---|---|
| **Pending** | `pending_payment`, `paid`, `vendor_processing`, `awaiting_hub_dropoff`, `hub_received`, `ready_for_rider_pickup`, `rider_assigned` | Order placed, vendor is preparing it |
| **Picked** | `rider_collected` | **Picked up by the rider**, who now has it and is about to head out |
| **Shipped** | `out_for_delivery` | Rider is en route to the customer right now |
| **Delivered** | `delivered`, `completed` | Arrived at the customer — "Confirm Receipt"/"Report an Issue" shown during the confirmation window (3.6b) |
| **Cancelled** | `cancelled` | Order cancelled, refund initiated |

**Self-pickup orders:**
| Customer sees | Maps from internal status | What it means |
|---|---|---|
| **Pending** | `pending_payment`, `paid`, `vendor_processing`, `awaiting_hub_dropoff` | Order placed, vendor is preparing it |
| **Delivered** | `hub_received`, `ready_for_customer_pickup` | **Delivered to the hub** — the item has arrived at the pickup point and is ready and waiting; this is when the "ready for pickup" SMS + pickup OTP fires (3.6d) |
| **Picked** | `customer_picked_up`, `completed` | **Picked up by the customer** in person at the hub — the collection itself |
| **Cancelled** | `cancelled` | Order cancelled, refund initiated |

So each flow uses "Picked" and "Delivered" at a **different point and with a different physical meaning** — for home delivery, "Picked" comes first (rider collects) and "Delivered" comes last (reaches the customer); for self-pickup, "Delivered" comes first (reaches the hub) and "Picked" comes last (customer collects it). Since an order is always exactly one or the other, a customer looking at their own order's stepper never sees a contradiction — they just see the sequence that matches the choice they made at checkout.

**Handling the edge cases this simplification creates:**
- **`failed_delivery`** (home delivery only): don't regress the customer-facing label back to "Pending" — that looks like a bug ("why did my order un-ship itself?"). Keep showing **"Shipped"** with a small status banner underneath ("We couldn't deliver your order — attempting redelivery") rather than changing the main label.
- **Returns (`return_requested` → `return_received` → `refunded`):** don't fold these into the five main labels at all — surface as a **separate "Return & Refund" tracker** that appears alongside the main status once initiated, the same way Jumia shows a distinct return-tracking view rather than repurposing the delivery stepper for it.
- **This is a display-layer mapping only** — `sub_orders.status` in the database stays exactly as granular as 3.6a defines it, with distinct internal names (`rider_collected` vs. `customer_picked_up`, `delivered` vs. `ready_for_customer_pickup`) even though they can render to the same customer-facing word. The five customer-facing labels are computed/derived at render time (a simple lookup keyed on both `status` and `fulfillment_method`, not a second parallel status field to keep in sync), so there's never a risk of the "real" status and the "shown" status drifting apart.
- **Vendor, rider, hub-ops, and superadmin dashboards keep the full granular internal status** — this simplification is customer-facing only. A vendor still needs to distinguish "awaiting hub dropoff" from "rider assigned," even though the customer just sees "Pending" for both.

### 3.6f Dashboard Features Tied to Status

**Customer dashboard (order tracking):**
- Visual stepper per sub-order — which sequence shows depends on `fulfillment_method`: home delivery shows Pending → Picked (rider collected) → Shipped → Delivered; self-pickup shows Pending → Delivered (arrived at hub) → Picked (customer collected). Cancelled is an alternate terminal state for either.
- "Confirm Receipt"/"Report an Issue" buttons appear only for home delivery, only while `delivered` and inside the confirmation window; for self-pickup, only "Report an Issue" is shown once `customer_picked_up` (no "Confirm Receipt," since collecting it in person already is the confirmation) while inside the window
- Countdown showing time remaining in the confirmation window
- A separate "Return & Refund" tracker if a return has been initiated (3.6e), not merged into the main stepper

**Vendor panel — Orders tab:**
- Filterable list/board by status, with a visible fulfillment-method tag per order (Home Delivery / Self-Pickup) so a vendor can see at a glance which path each order is on
- SLA countdown visible per order (ties to Phase 3.4b) — self-pickup orders have a different practical SLA (how long until the customer collects) than home-delivery orders
- Payout-eligibility indicator (pending confirmation vs. payout-eligible) ties directly to Phase 1.4b's statement view

**Rider dashboard (extends Phase 3.3):**
- Only ever shows home-delivery sub-orders — self-pickup orders never enter a rider's queue at all
- Active delivery card gets explicit action buttons matching the state machine: "Mark Collected" → "Mark Out for Delivery" → "Mark Delivered" (which triggers/validates the OTP entry, Phase 6) → "Report Failed Delivery"
- No free-text status entry — buttons only, so the state machine can't be bypassed or mistyped

**Hub Ops dashboard (extends Phase 3.5) — pickup counter view:**
- A queue of sub-orders in `ready_for_customer_pickup`, so staff can see who's expected
- A "Confirm Pickup" action: hub staff enters the OTP code the customer shows (or scans it), which transitions the sub-order to `customer_picked_up` — the same OTP mechanism as delivery confirmation (Phase 6), just used at a counter instead of a doorstep
- This is a genuinely distinct screen from the rider-facing hub handoff (3.5's "outgoing handoffs" to riders) — one is staff handing an item to a rider, the other is staff handing an item directly to the customer

**Superadmin dashboard (extends Phase 5):**
- Platform-wide live order/status feed, filterable by status, vendor, rider, hub, **or fulfillment method**
- SLA-breach alerts surfaced automatically (Phase 3.4b)
- Manual override control, with the mandatory-reason/audit-log requirement always enforced in the UI itself (not just a backend check) — no override button that skips the reason field

---

## Phase 4 — Staff & Permissions

**Goal:** vendors can delegate work without sharing full account access.

1. Vendor owner invites staff by phone number → SMS invite with a code/link
2. Staff accepts → account created/linked → `staff_memberships` row scoped to that vendor's `store_id`
3. Owner assigns a **permission scope** at invite time or after (e.g. `products:write`, `orders:read/write` — no `payouts` or `staff:manage` by default)
4. **Store-switcher:** if a person works for multiple stores, or an owner runs multiple stores, the panel header lets them switch context, reloading scoped data
5. Staff actions are attributed in `audit_logs` against the staff member's identity, not the owner's

**Exit criteria:** a vendor can grant a scoped teammate access without giving them payout or staff-management rights, and every staff action is individually attributable.

---

## Phase 5 — Superadmin & Platform Operations

**Goal:** the platform is operable without a developer touching the database directly.

- **Vendor approval queue:** review KYC + subaccount status → approve/reject/request more info
- **Subscription & plan management:** configure tier pricing/limits, view all vendor subscriptions, handle failed payments/expired accounts, manual overrides (full detail Phase 7)
- **Dispute resolution:** order/sub-order history, chat logs, refund/mediation
- **Category/taxonomy management:** curate the hierarchical top-level tree vendors select from
- **Module registry / feature flags:** enable/disable platform modules or features per vendor tier without a code deploy — the same mechanism that powers subscription-tier gating
- **Hub operations view:** if not already built in Phase 3.5
- **Platform audit log:** cross-vendor visibility into staff actions, approvals, payout anomalies

**Exit criteria:** day-to-day operations (approving vendors, handling disputes, managing plans) don't require engineering involvement.

---

## Phase 5.5 — Trust & Safety Layer

**Goal:** the platform can detect and respond to bad actors before they cause real damage, and customers/vendors have a real support channel beyond "chat with vendor."

### 5.5a Vendor Product Moderation
Store-level KYC (Phase 1.1) verifies the *business*, but doesn't review individual *listings*. Add a lightweight moderation step:
- New product listings enter a `pending_review` state before going public — for a small team, a simple manual review queue is enough at launch scale; automate only once volume makes manual review a bottleneck
- Flag categories that need extra scrutiny (anything regulated, e.g. pharmacy-adjacent items) for mandatory review regardless of vendor tier
- Customers/other vendors can flag a live listing, which pulls it back into the review queue rather than requiring a full takedown process

### 5.5b Fraud Detection Patterns
Not a machine-learning system at this stage — start with rule-based signals surfaced to superadmin, not automated blocking:
- **Rider fraud:** delivery marked complete without an OTP confirmation (Phase 6) is a direct red flag once that flow exists; track rate of "delivered without confirmation" per rider
- **Vendor fraud:** unusually high self-reported "out of stock, cancelling" rate (ties to 1.3c's cancellation tracking) after payment already succeeded
- **Return fraud:** repeat "item damaged/wrong item" claims from the same customer, or claims that don't match the hub's inspection at reverse pickup (2.5)
- **Payment fraud:** multiple failed payment attempts from the same device/IP in a short window before a success — common card-testing pattern
- Surface these as a **fraud alerts** view in the superadmin dashboard (Phase 5) rather than auto-suspending accounts — human review before punitive action, especially early on when false positives are costly to a small vendor base you're trying to grow

### 5.5c Customer Support / Helpdesk
- **Support ticket system:** customer or vendor opens a ticket (order dispute, payment issue, account problem) — separate from the informal "chat with vendor" messaging, since disputes need a record and an owner
- Tickets route to superadmin (or a dedicated support role, if the team grows beyond just superadmin) with status tracking (open/in-progress/resolved)
- Link tickets to the relevant `sub_order`/`return`/`vendor_subscription` record so context isn't lost in a back-and-forth chat log
- A simple FAQ/help-center page for common questions (how returns work, how subscriptions renew) reduces ticket volume before it starts

**Exit criteria:** a fraudulent pattern (rider or vendor) gets surfaced to a human before it repeats at scale, and a customer with a genuine problem has a trackable path to resolution beyond messaging a vendor directly.

---

## Phase 6 — Trust & Verification (OTP)

**Goal:** close the highest-leverage trust gap first, not build every OTP use case at once.

### 6.1 Priority Order
1. **Delivery confirmation** (build this first) — customer receives an OTP when out for delivery; rider enters it (or customer shows it) to confirm handoff. Directly prevents "marked delivered but never received" disputes, and only matters once a rider network exists (Phase 3), which is why it's sequenced here. **Pickup confirmation** (self-pickup orders, Phase 3.6a/3.6f) and **password reset** (Phase 0.1c) are the same underlying mechanism, just for different purposes — build one shared OTP implementation off a `purpose` enum (`delivery_confirm`, `pickup_confirm`, `password_reset`, `signup_verify`) rather than separate implementations per use case.
2. **Rider/vendor phone verification at signup** — confirms real phone ownership before account activation
3. **Staff invite acceptance** — confirms the invited phone number before `staff_memberships` is created
4. **Login/2FA** — defer unless a specific fraud pattern or support burden justifies it; password auth is fine at this stage

### 6.2 Generic OTP Flow
1. Client requests OTP → server generates a time-limited code (6-digit, 5–10 min expiry), stores it hashed in `otp_requests` with a `purpose` enum
2. Sent via SMS gateway
3. Client submits → server validates hash + expiry + attempt count (rate-limited, e.g. max 5 attempts with backoff)
4. Success → OTP consumed (single-use), tied action proceeds
5. Resend: cooldown timer (e.g. 60s) to control SMS cost

### 6.3 Practical Considerations
- SMS delivery latency varies by carrier — show a visible "resend" option early
- Cost management: OTP SMS is a real per-message cost — rate-limit aggressively, don't OTP every login by default
- Data protection compliance: phone numbers/OTP logs are personal data — purge `otp_requests` after a short retention window (24–48 hrs)

**Exit criteria:** delivery disputes have a clear resolution mechanism (OTP-confirmed handoff), not "he said, she said."

---

## Phase 7 — Vendor Verification & Subscription Tiers (Monetization)

**Goal:** the platform sustains itself financially, without adding friction to vendor growth in the early stage.

### 7.1 The Five States
Two axes, kept conceptually separate:
- **Verification** (trust): `unverified` → `verified` — earned once, doesn't expire
- **Subscription tier** (monetization): `none` → `trial` → `basic` → `plus` → `pro` — trial is free/time-limited, paid tiers annual, can lapse, can be switched anytime

| State | Trust | Can sell publicly? | Cost |
|---|---|---|---|
| Unverified | KYC not submitted/pending | No — draft/preview only | Free |
| Trial (1 month) | Verified | Yes — full selling, time-limited | Free |
| Basic | Verified | Yes | Annual, lowest price |
| Plus | Verified | Yes | Annual, mid price |
| Pro | Verified | Yes | Annual, highest price |

A vendor cannot reach any paid tier without being `verified` first. The moment verification is approved, the vendor is **automatically enrolled in a 1-month free trial** (mirroring Basic-tier limits) — no payment or plan decision required upfront, so vendors list products same-day.

### 7.2 Tier Benefits Table

| Feature | Unverified | Trial | Basic | Plus | Pro |
|---|---|---|---|---|---|
| Store visibility | Draft only | Public | Public | Public | Public |
| Active product listings | 0 | ~50 | ~50 | ~200 | **Unlimited** |
| Platform commission rate | N/A | **0%** | **0%** | **0%** | **0%** |
| Staff seats | 0 | 1 | 1 | **4** | **Unlimited** |
| Product images per listing | N/A | 3 | 3 | 6 | **Unlimited** |
| Product video on listings | No | No | No | Yes | **Yes, unlimited** |
| Bulk/CSV product upload | No | No | No | Yes | **Yes, no batch limit** |
| Storefront customization | No | No | No | Basic (theme + banner) | **Full — unrestricted** |
| Search/category placement | N/A | Standard | Standard | Slight boost | **Top priority, always** |
| Homepage/featured promotion | No | No | No | Occasional rotation | **Guaranteed, unlimited slots** |
| Discount/coupon campaigns | No | No | 1 active | 5 active | **Unlimited** |
| "Verified Pro Seller" badge | No | No | No | No | Yes |
| Analytics depth | None | Basic totals | Basic totals | + trends | **Full — advanced/exportable, unrestricted range** |
| Multi-store management | No | No | No | No | **Yes, unlimited stores** |
| Payout speed | N/A | Standard | Standard | Standard | **Priority/fastest** |
| Support | None | Contact | Contact | Contact | **100% priority — top of queue** |
| Fulfillment method choice | N/A | Hub drop-off only | Hub drop-off only | Hub or consignment | **Hub or consignment, unrestricted priority processing** |
| Early feature access | No | No | No | No | Yes |
| Price | Free | Free (1 mo) | Lowest | Mid | Highest |

**Commission at 0% is a deliberate, temporary growth-phase decision** — time-box it explicitly (e.g. "0% for the first 6 months" or "until N active vendors") so it doesn't quietly become permanent by default. With commission off, subscription price is the *entire* revenue mechanism — price the Plus→Pro gap carefully so Pro (fully unlimited) doesn't become the obvious default for everyone, which would collapse the tier system into one plan.

**Tax/VAT flag (not a technical decision, but worth surfacing here since this is where the money mechanics live):** vendor sales on the platform may fall under Ghana Revenue Authority VAT and/or withholding tax obligations depending on vendor size and registration status — this is a compliance question for you to check against actual GRA guidance, not something to guess at in a spec. Practically, this affects two things worth keeping in mind even before it's resolved: the invoice/receipt generator (1.3e) should have a place to show a VAT line once you know whether one applies, and the vendor payout statement (1.4b) should be structured so a VAT/withholding line can be inserted without redesigning the statement layout later.

### 7.3 Subscription Flow
1. Trial starts automatically on verification approval
2. Plan selection screen surfaces as trial nears expiry, always accessible from vendor panel's Billing tab
3. Payment: **start with a simple one-time annual charge** via standard payment initialization (not a recurring/auto-debit subscription API) — Mobile Money doesn't support true recurring auto-debit the way cards do, and most vendors will likely pay by Mobile Money, so build true auto-renew only later if enough vendors are on cards to justify it
4. Webhook confirms payment → `vendor_subscriptions` row created/updated with `plan`, `start_date`, `end_date` (+365 days), `status: active`, `payment_reference`
5. Store stays live uninterrupted through the trial→paid transition if the vendor subscribes before the grace period ends

### 7.4 Switching Plans
- **Upgrade:** immediate on payment — simplest to implement as charging the new tier's full price and resetting `end_date` to 365 days out, rather than prorating (proration is a nice-to-have, not a launch requirement)
- **Downgrade:** takes effect at next renewal, not immediately — avoids yanking listings/seats mid-cycle
- **Downgrade exceeding new limits** (e.g. 300 products on Pro, downgrading to Basic's ~50 cap): don't auto-delete. Flip excess listings to `inactive`, let the vendor choose which stay active — a deliberate UI moment, never a silent mass-deactivation

### 7.5 Renewal & Expiry
**Trial:** reminders at 7/3/1 days before expiry → short grace period (~3 days) → lapse to draft (verification untouched, just pick a plan to go live again)
**Paid tier:** reminders at 30/14/3 days → grace period (~7 days) → lapse to draft, same recovery path
Manual renewal reminders first; true auto-renew is a later feature given the Mobile Money constraint.

### 7.6 Superadmin Management
- Plan configuration (price, caps, seat limits, commission rate) stored in `subscription_plans`, read at runtime — not hardcoded constants, so pricing/limits change without a deploy
- Searchable vendor subscription list (by tier, status: active/grace/lapsed)
- Manual overrides: comp a plan, extend, force downgrade (policy violations) — logged in `audit_logs`
- Failed-payment monitoring, especially Mobile Money charge failures
- Revenue reporting: by tier, renewal rate, upgrade/downgrade trends

**Implementation note:** store "unlimited" as `null`/`-1` on the `subscription_plans` row and have gating logic skip the check on that value, rather than hardcoding `if tier === 'pro'` scattered through the codebase — cleaner if a tier above Pro is ever added.

**Exit criteria:** a vendor's access is correctly tied to a trackable subscription state, and the trial→paid conversion path works without manual intervention.

---

## Phase 8 — Growth & Polish

**Goal:** competitive-parity features that aren't load-bearing for the core loop, prioritized by what users actually ask for.

- **Storefront customization** (theme accent, banner, featured rail, about section) — now doubles as a Plus/Pro subscription benefit (Phase 7), giving it a monetization reason to build ahead of pure polish — see 8.0a for the actual vendor-facing build flow
- **Reviews & ratings** — products, stores, riders
- **Vendor analytics depth** — trends, exports (tier-gated per Phase 7)
- **Notifications** — push/SMS/email/in-app for order status, renewal reminders, etc.
- **Wishlist/favorites, recently viewed**

### 8.0a How Vendors Build Their Storefront

**Design decision: a templated builder, not a true drag-and-drop page editor.** A real page builder (think Wix/Webflow-style free-form editing) is a large, ongoing engineering investment — far more than this platform needs. Instead, vendors pick from a small set of professionally-designed **layout templates** and customize the content/colors within them. This gets 90% of the visual differentiation vendors actually want at a fraction of the build cost, and it's what most marketplace platforms (Etsy, early Shopify themes) actually do.

**1. Template selection (Plus/Pro only, per Phase 7's tier gating):**
- A small curated set of layout templates (start with 2–3, not 10+) — e.g. "Classic Grid" (logo, banner, straight product grid), "Featured Spotlight" (large hero banner + featured product carousel + grid below), "Story-Led" (banner + about section prominent + grid). Each template is a fixed arrangement of the same building blocks (Section 8.0a-2), just laid out differently.
- Basic tier vendors get the single default layout, no template choice — matches the existing tier table (no storefront customization at Basic)

**2. Content blocks (what's actually editable within a template):**
- **Banner/cover image** — upload via Cloudinary, with a recommended-dimensions guide shown in the UI so vendors don't upload badly-cropped images
- **Logo** — same, with a circular/square preview so vendors see how it'll actually render
- **Theme accent color** — a color picker constrained to a curated palette (not a full RGB picker) — this keeps every storefront looking professional even if the vendor has no design sense; unconstrained color choice is how you get unreadable white-text-on-yellow storefronts
- **About section** — a short text block (character-limited, e.g. 300 chars) — not a full rich-text editor, since that's another large feature surface for limited payoff at this stage
- **Featured products rail** (Plus: fixed small count, Pro: more/guaranteed rotation per Phase 7's tier table) — vendor manually selects which products appear here from their own catalog, not an algorithmic pick
- **Policies text** (returns, delivery expectations) — already exists as a basic field (Phase 1.2); this just becomes visually integrated into the chosen template rather than a plain tab

**3. Live preview before publishing:**
- Every change is staged, not live-published immediately — the vendor edits in a preview pane that renders using the actual customer-facing storefront component (not a separate mock), so what they see really is what customers will see
- A mobile/desktop preview toggle, since most customers will be on mobile (PWA, network-aware design already established) and a storefront that looks good on desktop can break on a small screen
- **Explicit "Publish" action** — changes don't go live automatically on save, so a vendor mid-edit (half-uploaded banner, half-written about section) never accidentally shows a broken storefront to real customers

**4. Store URL slug:**
- Vendor picks a URL slug at store creation (main spec Phase 1.1, step 6) — e.g. `africart.com/store/vendor-name` — validated for uniqueness and basic format (no special characters) at creation time
- Allow changing it later, but warn clearly that old links (shared on social media, saved by customers) will break — this is a real trade-off to surface, not silently allow

**5. Schema addition:** `stores.template_id`, `stores.theme_accent_color`, `stores.about_text`, `stores.featured_product_ids` (array or join table), plus the existing `banner_url`/`logo_url` fields already implied by store creation — all staged in a `draft_*` shadow set of columns (or a single `storefront_draft` JSONB column) versus the live published values, so the preview/publish distinction in Section 3 is a real mechanism, not just a UI convention with no backing.

### 8.1 Promotions & Flash Sales
- **Vendor-run discounts:** percentage or fixed-amount off a product or whole store, time-boxed, count capped per Phase 7's tier limits (Basic: 1 active, Plus: 5, Pro: unlimited — already in the tier table)
- **Platform-run flash sales:** superadmin-curated, cross-vendor promotional events (e.g. a homepage "Weekend Deals" rail) — needs a `promotions` table separate from individual vendor discounts, with its own start/end window and featured-product selection
- **Coupon codes:** vendor- or platform-issued, redeemable at checkout, with usage limits (per-customer, total-uses) to prevent abuse

### 8.2 Loyalty & Referral
- **Referral program:** a customer's unique referral link/code gives the referred customer a discount on their first order and credits the referrer (store credit or a discount code) once that first order completes — track via a `referrals` table linking referrer/referee `user_id`s to avoid double-crediting
- **Repeat-purchase incentive:** simple points-per-order accrual redeemable as store credit is enough at this stage — don't build a complex multi-tier loyalty program before there's evidence customers want one

### 8.3 Abandoned Cart Recovery
- Detect a cart with items added but no completed checkout after a set window (e.g. 2 hours)
- Send one SMS/notification reminder — not a drip sequence at this stage, since SMS has a real per-message cost (same consideration as OTP in Phase 6.3)
- Include a direct link back to the cart, not just a generic "you left something" message
- Cap this to once per abandoned cart to avoid feeling like spam

This phase is genuinely open-ended — no fixed exit criteria, just continuous prioritization against real usage signal.

---

## Phase 9 — Scale Decisions (Deferred Until Real Signal)

**Goal:** don't build any of this until Phases 0–8 are proven at your actual current scale.

- **Multi-hub/multi-region support** — only once expanding beyond the launch city; additions are a `hub_id`/region field, a region step on onboarding, and hub-to-hub routing
- **Activating commission** — only once the 0%-commission growth period has served its purpose and there's real order-volume data to price against
- **Adjacent modules** (food delivery, ride-hailing, digital wallet, AI shopping assistant, parcel delivery, pharmacy) — each is roughly the size of this entire spec on its own; evaluate module-by-module against real demand signal from actual users, not as a bundled "super app" vision pursued all at once
- **True recurring auto-renew billing** — once enough vendors pay by card rather than Mobile Money to justify it

---

## Why This Order (the load-bearing logic)

Each phase is a strict prerequisite for the next. You can't route riders to the correct collection point (Phase 2) without the hub model existing. You can't assign riders (Phase 3) without knowing where they're collecting from. OTP-confirmed delivery (Phase 6) only matters once a rider network is actually delivering things. Gating subscription tiers on features (Phase 7) only makes sense once those features — products, staff seats, storefront customization — exist to be gated. Building out of this order is the most common way this class of platform stalls: e.g. building subscription billing before the core marketplace loop is proven, or building rider assignment before the fulfillment model is decided.
