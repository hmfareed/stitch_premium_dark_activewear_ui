# Appendix B — Greenfield Rebuild Blueprint (Hypothetical: "If Building From Scratch Today")

⚠️ This is a hypothetical, not a migration plan. Your live app is Next.js + MongoDB on
Vercel — nothing above changes. This answers "what would I build if starting AfriCart
today with everything we now know (Phases 0–11)" and gives my honest stack
recommendation, which differs from both your current stack and from the
NestJS+Mongo combination floated in Appendix A.

### B.1 Recommended Stack

| Layer | Recommendation | Why |
|---|---|---|
| Frontend + Backend | Next.js full-stack (App Router, server actions/API routes) | Same framework as today — one deployable unit, fastest for a solo dev, plays well with Antigravity's spec-to-code workflow |
| Database | PostgreSQL | AfriCart is fundamentally relational (vendors↔products↔orders↔suborders↔payments↔splits↔subscriptions↔staff permissions↔hub inventory) with money and stock changing hands — Postgres gives real transactional integrity where Mongo requires more careful discipline to avoid consistency bugs |
| ORM | Prisma | Type-safe, schema-first — the schema.prisma file doubles as living documentation of every relationship in this doc, and generates fully-typed queries an AI coding agent can use reliably |
| Payments | Paystack Ghana (unchanged) | Already the right fit for Ghana |
| Media | Cloudinary (unchanged) | Already the right fit |
| SMS | Hubtel/mNotify (unchanged) | Already the right fit |
| Hosting | Vercel (unchanged) + a managed Postgres provider (Neon, Supabase, or Railway — all have generous free/low tiers and handle backups) | No infra to self-manage as a solo dev |
| Auth | NextAuth/Auth.js or a lightweight custom JWT layer, extended with the OTP flow from Phase 8 | Keep this simple; don't add Clerk/third-party auth vendors unless team size grows |

What I'd explicitly avoid and why:
- NestJS — real overhead (modules, DI, decorators, separate deploy target) that pays off
  with a backend team, not a solo builder. Next.js API routes/server actions cover everything AfriCart's backend needs.
- Microservices — a single well-organized Next.js monolith easily handles Tamale-scale
  (and honestly, national-scale) traffic. Splitting into services now would be solving a scaling problem you don't have yet at real cost to development speed.
- MongoDB for this specific app — flexible schemas matter more for content-heavy or
  rapidly-changing-shape data; AfriCart's core entities are stable and relational, which is exactly Postgres's strength.

### B.2 Data Model as Relational Schema (high-level)
Rather than Mongo collections, think in terms of tables with real foreign keys:
- `users` (base identity) → `vendor_profiles`, `rider_profiles`, `staff_memberships`, `customer_profiles` (1:1 or 1:many extensions)
- `stores` (belongs to a vendor_profile) → `products` → `product_variants`, `product_images`
- `categories` (self-referencing parent_id for the hierarchical taxonomy)
- `carts` → `cart_items` (each tagged with store_id for the split logic) → on checkout, splits into `orders` → `sub_orders` (one per vendor) → `sub_order_items`
- `payments`, `paystack_splits` (linked to sub_orders)
- `warehouses` (single Tamale row for now, extensible), `consignment_stock`, `hub_dropoffs`
- `deliveries`, `rider_assignments`
- `subscription_plans` (admin-configured), `vendor_subscriptions` (linked to vendor_profiles, with plan_id, status, start_date, end_date)
- `kyc_documents`, `vendor_approvals`, `audit_logs`
- `otp_requests`, `sms_logs`, `notifications`

Every relationship implied throughout Phases 0–11 (a sub-order belongs to exactly one
vendor and one order; a vendor subscription belongs to exactly one vendor; staff
memberships scope to exactly one store) becomes an actual enforced foreign key
instead of an application-level convention — this is the concrete benefit over Mongo for this specific domain.

### B.3 What Doesn't Change
Every flow, role, and feature in Phases 1–11 (customer flow, vendor onboarding, rider
hub-collection model, staff permissions, subscription tiers, OTP, delivery-fee
distance logic) is stack-agnostic — none of that logic changes based on database
choice. This appendix only affects how data is structured and persisted, not what the
product does. If you ever did rebuild, Phases 1–11 stay as your product spec unchanged; only Phase 0's architecture section and the entity list above would differ.

### B.4 Honest Take on Whether to Actually Do This
Given you already have a working Next.js + MongoDB app, a full rewrite is a significant
cost with real risk (time away from shipping the rider/hub/subscription work that's
actually next). I'd only seriously consider this if:
- You're hitting genuine data-integrity pain with Mongo (e.g. orphaned records, split-
  payment mismatches) that's costing you real debugging time, or
- You're doing this as a learning exercise for a future job/portfolio, separate from AfriCart's actual timeline

Otherwise, my honest advice: finish the Tamale MVP (rider bug fix → hub model →
subscription tiers → delivery fee engine, per the build orders above) on what you already
have, and revisit the stack question only if a specific, felt pain point shows up — not preemptively.
