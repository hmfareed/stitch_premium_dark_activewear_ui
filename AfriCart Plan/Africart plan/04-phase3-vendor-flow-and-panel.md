# Phase 3 — Vendor Flow & Panel

### 3.1 Vendor Onboarding / Store Setup (the hard gate)
1. Registration: separate signup endpoint from customer (`/vendor/register`), collects
   business info + owner identity — vendor starts in the Unverified state (see Phase 9)
2. KYC submission: business registration doc, owner ID, business address — uploaded via Cloudinary
3. Paystack subaccount creation — hard gate: the vendor account is not activated for
   selling until a Paystack subaccount is successfully created and linked. No subaccount
   → no "Go Live" button. This prevents orphaned vendors who can't be paid.
4. Superadmin approval: manual review step (KYC + subaccount check) — approval flips
   vendor status from unverified to verified
5. Subscription plan selection — second gate: once verified, the vendor must subscribe
   to Basic, Plus, or Pro before the store can go public. See Phase 9 for the full tier/billing deep dive.
6. Store creation wizard (post-subscription):
   - Store name, slug, logo, banner
   - Category selection (what the store sells)
   - Fulfillment method (per product or as a store default): pre-stock at the AfriCart hub
     (consignment) vs. drop off at the hub per order vs. hold for direct rider pickup at vendor location
   - Delivery zones & base delivery policy
   - First product upload (soft-required to exit wizard)
   - Storefront theme/customization (optional, can skip) — not yet built, see roadmap note below; also gated to Plus/Pro once it exists (Phase 9)

### 3.2 Vendor Panel Features
- Dashboard: sales overview, pending orders count, low-stock alerts, payout summary
- Products: CRUD, bulk actions, variant management, stock tracking — capped by subscription tier (Phase 9)
- Hub inventory (if using consignment): view current stock held at the warehouse,
  request restock/top-up, view drop-off history and hub-received confirmations
- Orders: incoming sub-orders, status transitions (pending → confirmed → packed →
  dropped off at hub / ready for hub pickup / ready for direct pickup → handed to rider
  → delivered), order detail with customer contact (masked until confirmed, per privacy/Act 843 handling)
- Staff: invite staff via SMS (Hubtel/mNotify), assign scoped roles (e.g. can manage
  products but not payouts), store-switcher if a staff member or owner operates multiple
  stores — staff seat count capped by subscription tier (Phase 9)
- Storefront customization (roadmap — not yet built): theme accent, banner, featured rail, about section — will be Plus/Pro only once built
- Subscription & billing: current plan, renewal date, upgrade/downgrade, payment history, auto-renew toggle (see Phase 9)
- Payouts: Paystack subaccount balance, payout history (Paystack handles actual disbursement schedule)
- Analytics: top products, repeat customer rate, fulfillment SLA — depth varies by tier (Phase 9)
- Reviews: view and respond to customer reviews
