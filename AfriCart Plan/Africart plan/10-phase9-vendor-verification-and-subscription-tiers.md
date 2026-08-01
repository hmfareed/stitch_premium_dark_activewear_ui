# Phase 9 — Vendor Verification & Subscription Tiers (new — deep dive)
Not previously specced. This is the monetization layer for AfriCart: vendors pay an
annual subscription for selling access and features, gated by tier. Two axes are
involved and it's worth keeping them mentally separate even though they interact:
- Verification status (trust axis): unverified → verified — earned once via KYC +
  Paystack subaccount approval (already in Phase 3), doesn't expire
- Subscription tier (monetization axis): none → trial → basic → plus → pro — trial is
  free/time-limited, paid tiers are annual, can lapse, can be switched at any time

Confirmed: Unverified vendors cannot sell at all — draft-only until KYC-approved, per your confirmation.

Updated per your latest input:
- All verified vendors get a 1-month free trial before any payment is required
- Commission rate is 0% across all tiers for now — a deliberate growth-phase decision
  to attract vendors; revisit once you have volume
- Plus tier gets 4 staff seats (not 3)
- Support is unified across all paid tiers — contact-based support for everyone, not staggered by tier
- Additional tier-differentiating features added below since commission and support are no longer differentiators

### 9.1 The Five States

| State | Trust | Can sell publicly? | Cost |
|---|---|---|---|
| Unverified | KYC not submitted or pending review | No — store is in draft/preview only | Free |
| Trial | Verified | Yes — full selling, time-limited | Free for 1 month |
| Basic | Verified | Yes — entry-level selling | Annual, lowest price point |
| Plus | Verified | Yes — mid-tier selling | Annual, mid price point |
| Pro | Verified | Yes — full selling power | Annual, top price point |

A vendor cannot reach Trial/Basic/Plus/Pro without first being verified. The moment
verification is approved, the vendor is automatically enrolled in a 1-month free trial —
no plan selection or payment required upfront, so newly verified vendors can start
selling immediately. This removes the "second gate" that would otherwise sit between
approval and going live, which matters for early growth: you want verified vendors
listing products same-day, not stalling on a subscription decision.

Trial-tier access level: the trial should mirror the Basic tier's limits (product cap, no
storefront customization, etc.) rather than granting full Pro-level access — enough to
prove the platform works, not so much that there's no incentive to subscribe once the trial ends.

### 9.2 Verification Flow (recap + tier interaction)
1. Vendor registers → unverified
2. KYC docs submitted + Paystack subaccount created (Phase 3, steps 2–3)
3. Superadmin reviews → approve flips status to verified (permanent, doesn't need
   renewal) — or reject with a reason, vendor can resubmit
4. Approval automatically starts the 1-month free trial — VendorSubscription record
   created with plan: trial, startDate: now, endDate: now + 30 days, status: active, no payment involved
5. Store can go live immediately, subject to trial-tier (Basic-equivalent) limits
6. At day 30, vendor is prompted to choose and pay for Basic, Plus, or Pro to continue selling — see 9.6 for what happens if they don't

### 9.3 Tier Benefits & Access Table

| Feature | Unverified | Trial (1 month) | Basic | Plus | Pro |
|---|---|---|---|---|---|
| Store visibility | Draft only, not public | Public | Public | Public | Public |
| Active product listings | 0 (draft only) | e.g. up to 50 (Basic-equivalent) | e.g. up to 50 | e.g. up to 200 | Unlimited |
| Platform commission rate | N/A | 0% | 0% | 0% | 0% |
| Staff seats (Phase 4) | 0 | 1 | 1 | 4 | Unlimited |
| Product images per listing | N/A | 3 | 3 | 6 | Unlimited |
| Product video on listings | No | No | No | Yes | Yes, unlimited |
| Bulk/CSV product upload | No | No | No | Yes | Yes, no batch limit |
| Storefront customization (once built) | No | No | No | Basic (theme + banner) | Full — unrestricted (theme, banner, featured rail, about section, custom sections) |
| Search/category placement | N/A | Standard | Standard | Slight boost | Top priority placement, always |
| Homepage/featured promotion | No | No | No | Occasional rotation | Guaranteed, unlimited featured slots |
| Discount/coupon campaigns | No | No | Up to 1 active | Up to 5 active | Unlimited active campaigns |
| "Verified Pro Seller" badge | No | No | No | No | Yes |
| Analytics depth | None | Basic sales totals | Basic sales totals | + trends over time | Full — advanced/exportable reports, repeat customer insights, unrestricted date ranges |
| Multi-store management | No | No | No | No | Yes, unlimited under one owner |
| Payout speed | N/A | Standard Paystack schedule | Standard | Standard | Priority/faster disbursement if feasible with Paystack's account settlement options |
| Support | None (self-serve only) | Contact support | Contact support | Contact support | 100% priority of queue, fastest response |
| Fulfillment method choice (Phase 6) | N/A | Hub drop-off only | Hub drop-off only | Hub drop-off or consignment | Hub drop-off, consignment, unrestricted priority hub processing |
| Early access to new platform features | No | No | No | No | Yes |
| Price | Free | Free (1 month) | Lowest annual price | Mid annual price | Highest annual price |

Commission at 0% is a deliberate, temporary growth-phase decision to reduce friction
for early Tamale vendors — the subscription fee itself becomes the entire
monetization mechanism while commission is off. Worth deciding upfront whether this
is time-boxed (e.g. "0% for the first 6 months of platform life" or "until 50 active
vendors") rather than open-ended, so it doesn't quietly become the permanent model
by default. Revisit once you have real order volume data.

Pricing left as placeholders — actual GHS amounts are a business decision, not a
technical one. With commission at 0% and Pro now genuinely unlimited on every
dimension, Pro's annual price is essentially "pay this once a year and every cap
disappears" — that's a clean, easy-to-communicate pitch to vendors, but it also
means Pro needs to be priced high enough that it doesn't become the obvious default
choice for everyone (which would collapse the tier system into one plan). Worth
stress-testing the price gap between Plus and Pro specifically for that reason.

### 9.4 Subscription Flow — How a Vendor Subscribes
1. Trial starts automatically on verification approval — no action needed from the vendor (9.2, step 4)
2. Plan selection screen: surfaces starting a few days before trial expiry (see reminder
   cadence in 9.6), and always accessible from the vendor panel's Subscription & Billing
   tab once trial is active. Shows the tier comparison table above with a clear "current plan" indicator and days remaining on trial.
3. Payment: annual charge via Paystack. Two implementation options:
   - Simple (recommended for launch): a one-time annual charge through standard
     Paystack transaction initialization, with your backend tracking the renewal date
     manually and prompting for the next payment when it approaches
   - Recurring (more complex): Paystack's Plans & Subscriptions API for auto-charging
     saved cards — Mobile Money doesn't support true recurring auto-debit the way
     cards do in Ghana, so this path mainly benefits card-paying vendors and still needs a manual fallback for Mobile Money vendors
   - Given your vendor base likely pays via Mobile Money, start with the simple annual-
     charge-plus-reminder model and only build true auto-renew later if enough vendors are on cards to justify it
4. Webhook confirms payment → VendorSubscription record updated: plan
   (basic/plus/pro), startDate, endDate (start + 365 days), status: active,
   paymentReference — replaces the trial record
5. Store stays live uninterrupted through the trial→paid transition, as long as the vendor subscribes before the trial's grace period runs out

### 9.5 Switching Plans
- Upgrade (Basic→Plus, Plus→Pro, Basic→Pro): takes effect immediately on payment —
  vendor pays the price difference or a fresh full-tier charge (simpler to implement:
  charge the new tier's full price and extend/reset the endDate to 365 days from the
  upgrade date, rather than prorating — proration is a nice-to-have, not a launch requirement)
- Downgrade (Pro→Plus, Plus→Basic): takes effect at the next renewal, not immediately
  — this avoids yanking away product listings or staff seats mid-cycle if the vendor is
  currently over the lower tier's limits. Vendor sees "Downgrading to Basic on [renewal date]" as a pending state.
- What happens if a downgrade would exceed the new tier's limits (e.g. vendor on Pro
  has 300 products, downgrades to Basic which caps at 50): don't auto-delete products.
  Instead, listings beyond the cap flip to inactive/hidden, and the vendor chooses which
  ones stay active up to the new limit. This needs to be a deliberate UI moment, not a silent mass-deactivation.

### 9.6 Renewal & Expiry
Trial expiry (first month):
1. Reminders: SMS + in-app notification at 7 days, 3 days, and 1 day before the trial's
   endDate — shorter cadence than paid renewals since it's only a 30-day window
2. Grace period: short (e.g. 3 days) past trial expiry where the store stays live but shows a "subscribe now" banner
3. Lapse: if the grace period passes with no plan chosen, store goes back to non-
   public/draft state — verification status is untouched, so the vendor just needs to pick and pay for a plan to go live again, no re-review needed

Paid-tier renewal (annual, ongoing):
1. Reminders: SMS (Hubtel/mNotify) + in-app notification at 30, 14, and 3 days before endDate
2. Grace period: e.g. 7 days past expiry where the store stays live but shows a "renew
   now" banner in the vendor panel — avoids punishing a vendor for a payment that's just running late
3. Lapse (grace period expires without renewal): store goes back to non-public/draft
   state, same as pre-subscription — but verification status is untouched, so renewing later skips KYC entirely and just requires picking a plan again
4. Manual renewal reminder to build early; auto-renew is a v2 feature given the Mobile Money constraint above

### 9.7 Superadmin Management of Subscriptions
- Plan configuration: superadmin can edit each tier's price, product cap, staff seat cap,
  commission rate, and feature flags — ideally without a code deploy (a
  SubscriptionPlan collection read at runtime, not hardcoded constants)
- Vendor subscription list: searchable/filterable view of all vendors by tier and status (active/grace period/lapsed)
- Manual overrides: ability to comp a plan (e.g. promotional free month/year), manually
  extend a subscription, or force a downgrade (e.g. for policy violations) — logged in the AuditLog
- Failed payment monitoring: webhook failures or declined charges surfaced here so
  support can follow up with the vendor directly (especially relevant for Mobile Money charge failures, which are common)
- Revenue reporting: subscription revenue by tier, renewal rate, upgrade/downgrade trends — feeds into Phase 5's broader analytics

### 9.8 Suggested Build Order Within Phase 9
1. SubscriptionPlan and VendorSubscription schemas + a hardcoded seed of trial + the
   three paid tiers (limits can be placeholder values initially, refined later)
2. Auto-trial enrollment on verification approval — this is the highest-priority piece
   since it's what actually gets vendors selling immediately, and it's simpler than payment integration
3. Plan selection + simple one-time annual Paystack charge, surfaced as trial nears expiry
4. Tier-based feature gating on the two things that matter most for launch: product
   listing cap and staff seat cap (commission is 0% everywhere for now, so it's not a
   gating mechanism yet). Implementation-wise, "unlimited" for Pro is just the absence
   of a cap check rather than a special case — cleanest to store limits as null/-1 =
   unlimited on the SubscriptionPlan record and have the gating logic skip the check
   when it sees that value, rather than hardcoding "if tier === pro, skip check" scattered through the codebase
5. Renewal reminders (SMS) + grace period + lapse-to-draft logic for both trial and paid tiers
6. Superadmin plan management view
7. Everything else in the benefits table (storefront customization gating, bulk upload,
   video listings, discount campaign limits, multi-store management) — layer in as
   those underlying features get built anyway, rather than gating features that don't exist yet

### Confirmed Current State (as of this spec)

| Item | Status |
|---|---|
| Rider role | Not implemented — signup currently mis-routes to customer role (bug) |
| Auth | Password-only — no OTP anywhere in the app |
| Storefront customization | Not built — roadmap item |
| COD | Not in scope — Paystack (Mobile Money/card) is the only payment path |
| Vendor tiers/subscriptions | Not built — currently every verified vendor presumably has uniform access; Phase 9 is entirely greenfield |

### Suggested Build Order for What's Genuinely New
1. Fix the rider signup bug first — even before building out the full rider flow, the
   User/registration logic needs a proper rider role branch so accounts stop silently becoming customers.
2. Warehouse/Hub entity + fulfillment method on vendor products — this needs to exist
   before rider assignment logic can be meaningful, since "where does the rider collect
   from" depends on it. Minimal version: a single hub location, a fulfillmentSource field
   on SubOrder, and a basic hub-received confirmation step.
3. Rider role + basic assignment flow (Phase 6) — minimal version: rider account type,
   availability toggle, single active-delivery view showing collection point (hub or
   vendor), manual/zone-based assignment. Multi-stop hub batching and the dedicated hub-ops view can come later.
4. Vendor subscription tiers, minimal slice (Phase 9) — this is real monetization, worth
   prioritizing over polish items: SubscriptionPlan/VendorSubscription schemas, auto-
   enrolled 1-month free trial on verification approval, simple annual Paystack charge
   once the trial nears expiry, and gating the product cap + staff seat cap (commission
   is 0% everywhere for now, so it's not a gating lever yet). Everything else in the tier table can layer in later.
5. OTP for delivery confirmation only (a slice of Phase 8) — highest-value use case first,
   since it directly closes the "marked delivered but never received" gap once riders exist. Signup/login OTP can wait.
6. Storefront customization (Phase 3 roadmap) — now doubles as a Plus/Pro tier benefit
   once built, so there's a monetization reason to prioritize it above pure polish, but it's still behind the rider/subscription core.
