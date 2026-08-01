# Appendix C — Full From-Scratch Build Roadmap (Generalized: "How to Build This Class of Platform")

This is a reusable roadmap, not specific to AfriCart's current codebase. If you or
anyone else were building a multi-vendor marketplace + hub-fulfillment + rider
network + subscription-tiered vendor platform from zero, this is the dependency-
ordered sequence — everything referenced below is fully detailed in Phases 0–11
above; this section just sequences it correctly and explains why that order. Stack
assumed: the Appendix B recommendation (Next.js full-stack + PostgreSQL + Prisma),
though the sequence itself is stack-agnostic.

**Roadmap Phase I — Foundations (nothing user-facing yet)**
Goal: the skeleton every later phase depends on.
- Project setup, database schema for base entities: users, stores, products, categories (see Phase 0's data model, Appendix B.2)
- Auth (password-based to start — OTP comes later, Phase 8/Roadmap Phase V)
- Role scaffolding for all five+ roles even if most aren't functional yet: customer, vendor, vendor staff, rider, superadmin
- Paystack account + sandbox integration verified end-to-end with a dummy charge
  before building anything else on top of it — payment plumbing is the thing you least want to discover is broken after building three phases on top of it

**Roadmap Phase II — Core Marketplace Loop (Phases 2–3, minus advanced vendor features)**
Goal: a customer can buy something from a vendor, end to end.
- Vendor registration + KYC submission + Paystack subaccount creation (Phase 3.1, steps 1–3)
- Superadmin manual approval queue (Phase 5) — even a bare-bones version, just enough to flip verified
- Basic store setup wizard + product CRUD (Phase 3.1 step 6, Phase 3.2)
- Customer browsing + vendor storefront page (Phase 2.1) — skip customization
  entirely at this stage, fixed layout only
- Cart with multi-vendor splitting logic + checkout (Phase 2.2) — this is the
  architecturally load-bearing piece (see "Why Cart-Splitting Matters," Phase 0), build and test it thoroughly before anything else touches SubOrder

Exit criteria for this phase: a real customer can pay a real vendor, via split payment,
and the vendor's Paystack subaccount receives funds. Everything else in the roadmap builds on top of a proven version of this loop.

**Roadmap Phase III — Fulfillment Infrastructure (Phase 6's hub model, minus riders)**
Goal: orders have a defined path from "paid" to "physically at a collection point."
- Warehouse/hub entity (single location to start, per your Tamale-first decision) — Phase 6's fulfillment model section
- fulfillmentSource field on SubOrder and the three-way routing logic (hub stock / vendor drop-off pending / vendor direct pickup)
- Vendor-side: fulfillment method choice in onboarding, hub inventory view, hub-received confirmation flow (Phase 3.2, Phase 6.5)

Exit criteria: every paid sub-order has an unambiguous, correct collection point
recorded — this must be right before rider assignment logic (next phase) can mean anything.

**Roadmap Phase IV — Rider Network (Phase 6, riders)**
Goal: delivery actually happens.
- Rider role, registration, approval (Phase 6.1)
- Availability toggle + basic assignment (manual or simple area-matching to start, per the Tamale single-hub scope, Roadmap note under Phase 6.4)
- Rider dashboard: active delivery card showing collection point, delivery history, earnings (Phase 6.3)
- Status transitions: collected → out for delivery → delivered

Exit criteria: a full order lifecycle — customer pays, vendor/hub prepares, rider
collects and delivers — works end to end without manual intervention.

**Roadmap Phase V — Trust & Verification Layer (Phase 8, scoped)**
Goal: close the biggest trust gap first, not all of OTP at once.
- OTP for delivery confirmation only — this is the single highest-leverage use case,
  since it directly prevents "marked delivered but never received" disputes now that a rider network exists
- Signup/login OTP, staff-invite OTP: defer until there's a concrete reason (fraud pattern, support burden) — password auth is fine at this stage

Exit criteria: delivery disputes have a clear resolution mechanism (OTP-confirmed handoff), not just "he said, she said."

**Roadmap Phase VI — Monetization Layer (Phase 9)**
Goal: the platform can sustain itself financially.
- SubscriptionPlan + VendorSubscription schemas, auto-enrolled free trial on verification (Phase 9.2, 9.8)
- Plan selection + simple one-time annual Paystack charge, surfaced as trial nears expiry
- Gate the two features that actually matter for revenue pressure: product listing cap
  and staff seat cap (commission-rate gating only matters once/if commission moves off 0%)
- Renewal reminders, grace period, lapse-to-draft logic

Exit criteria: a vendor's access is correctly tied to a paid, trackable subscription
state, and the trial→paid conversion path works without manual intervention.

**Roadmap Phase VII — Delivery Fee Engine (Phase 11)**
Goal: delivery cost reflects actual distance rather than a flat/arbitrary fee.
- Lat/long fields on Warehouse and Store; DeliveryFeeConfig schema + seeded defaults (Phase 11.4)
- Server-side Haversine + multiplier distance calc wired into checkout, resolved
  per-sub-order against fulfillmentSource (hub vs. vendor origin) (Phase 11.1–11.2)
- Superadmin Commission & Fees screen for runtime fee-config edits (Phase 10.1, Phase 11.5)

Exit criteria: every sub-order's delivery fee is calculated from a real distance and
stored immutably at checkout; fee config can change without a deploy.

**Roadmap Phase VIII — Admin Tooling Depth (Phase 5, full; Phase 10 sidebars)**
Goal: the platform is operable without you personally touching the database.
- Full superadmin dashboard: vendor approval queue, subscription/plan management,
  dispute resolution, category/taxonomy management, audit log
- Hub operations view (Phase 6.5) if not already built as part of Roadmap Phase III
- Full sidebar navigation for all three panels as specified in Phase 10, if not already assembled incrementally in earlier roadmap phases

Exit criteria: day-to-day platform operations (approving vendors, handling disputes, managing plans) don't require a developer.

**Roadmap Phase IX — Growth & Polish**
Goal: competitive parity features that aren't load-bearing for the core loop.
- Storefront customization (theme, banner, featured rail) — now doubles as a
  Plus/Pro subscription benefit, so it has a monetization reason to exist, not just polish
- Reviews/ratings, vendor analytics depth, notifications, wishlist/favorites
- Staff invite system full scoping (Phase 4) if not already built earlier for a specific vendor's need
- Live rider tracking (Phase 11.3's Stage-2-plus capability) if demand signal justifies the added mapping API cost

Exit criteria: none — this phase is genuinely open-ended and prioritized by what users actually ask for.

**Roadmap Phase X — Scale Decisions (deferred until real signal)**
Goal: don't build this until Phase I–IX are proven at your actual current scale.
- Multi-hub/multi-region support (only once expanding beyond Tamale)
- Commission-rate activation (only once 0% has served its growth purpose and you have volume data)
- Anything from Appendix A's "Africart 2.0" super-app vision (ride-hailing, food
  delivery, wallet, AI assistant) — evaluate module-by-module against real demand signal, not as a bundle
- Stack migration (Appendix B) — only if a specific, felt pain point justifies it

### Why This Order (the load-bearing logic)
Each roadmap phase is a strict prerequisite for the next: you can't route riders to the
right collection point (III) without the hub model existing, can't assign riders (IV)
without knowing where they're collecting from, can't meaningfully OTP-confirm a
delivery (V) without a rider network delivering things, can't gate subscription tiers on
features (VI) until those features (products, staff seats, storefront customization)
actually exist to be gated, and can't calculate a meaningful distance-based fee (VII)
until the hub/vendor coordinates and fulfillment routing from Phase III are already in
place. Building out of this order is the most common way this kind of build stalls — e.g.
building subscription billing before the core marketplace loop is proven, or building
delivery-fee logic before the hub model is decided.
