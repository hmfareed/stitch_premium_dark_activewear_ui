# AfriCart — Vendor Registration & Store Creation: Full Antigravity Kickoff Prompts (All Phases)

This document contains four sequential Antigravity kickoff prompts covering the full vendor onboarding journey: Store Setup Wizard, Payment/Payout Setup, Verification, and Go-Live & Dashboard Handoff. Since account registration itself (the dual customer/vendor signup) already exists, these phases pick up right after a vendor has registered and start from "now let's create your store."

Run these in order — each phase assumes the previous one's data already exists.

---

## PHASE 1: Store Setup Wizard

### Kickoff prompt for Antigravity

Once someone registers as a vendor, they currently don't have a store yet — registration and store creation are separate steps, which matters because a vendor may eventually own more than one store, and this flow needs to be re-enterable later as "create a new store" from an existing vendor's dashboard, not just a one-time first-signup path.

This phase builds the store creation wizard itself. A newly registered vendor (or an existing vendor starting a second store) should be walked through entering their store name, which needs to generate a URL slug for their public store page — validate slug uniqueness against existing stores, and if the desired name is taken, suggest reasonable alternatives rather than just rejecting it outright.

Alongside the name, capture a store category (clothing, electronics, food, beauty, etc. — whatever category list already exists elsewhere in AfriCart's product taxonomy should be reused here rather than inventing a new one), a business type distinguishing an individual/sole proprietor seller from a registered business, public-facing store contact details (phone and/or email, which may differ from the vendor's personal account contact info), and a pickup/return address for logistics and delivery estimate purposes.

At the end of this wizard, a Store document should be created and linked to the vendor's User account, but in a "pending" or "unpublished" status — it should not be visible in customer-facing browsing or search yet, since payment setup and verification haven't happened. The vendor should land somewhere that makes clear their store exists but isn't live yet, with a next step pointing them toward payment setup.

### Out of scope for this phase

Do not build the Paystack subaccount creation flow — that's Phase 2. Do not build any verification logic or documents — that's Phase 3. Do not make the store visible or biddable in customer-facing search/browse under any circumstance in this phase, regardless of what fields are filled in — visibility is gated on later phases. Do not touch the existing account registration/signup flow itself.

---

## PHASE 2: Payment / Payout Setup

### Kickoff prompt for Antigravity

With a pending Store now created from Phase 1, this phase builds the flow where a vendor connects the financial infrastructure that lets their store actually receive money — this is the stage that creates the Paystack subaccount tied to this specific store.

The vendor needs to be walked through providing a bank account or Mobile Money number for settlement, along with whatever identity information Paystack's subaccount creation API currently requires — check the live Paystack subaccount API documentation directly for the current required fields rather than assuming, since these requirements can shift and this flow needs to match what Paystack actually expects today.

Once the vendor submits this information, the system should call Paystack's subaccount creation API and store the returned subaccount code on the Store document — this is the same subaccount code that AfriCart's existing split-payment and webhook settlement architecture already depends on, so this phase is purely the vendor-facing onboarding surface sitting on top of backend integration work that already exists; do not rebuild or modify the underlying split-payment or webhook handling logic.

Treat "subaccount verified and active on Paystack's end" as a hard gate before the store can move toward go-live — a store accepting orders it can't get paid out for is a worse failure mode than a slightly longer onboarding wait, so this phase should clearly show the vendor a pending/verifying state if Paystack hasn't confirmed the subaccount yet, rather than letting them proceed as if everything is ready.

Also build handling for what happens if a vendor abandons this step mid-way — they should be able to resume exactly here on next login rather than restarting the whole store creation process, since this is the step people are most likely to stall on and come back to later.

### Out of scope for this phase

Do not modify the existing Paystack subaccount, split-payment, or webhook backend logic — only build the vendor-facing onboarding UI and the subaccount creation call itself. Do not build the verification stage from Phase 3. Do not make the store live or visible to customers in this phase — that only happens after Phase 3 and Phase 4.

---

## PHASE 3: Verification

### Kickoff prompt for Antigravity

This phase establishes the baseline trust checks a store needs to pass before it can go live on AfriCart. Keep this deliberately lightweight for now: confirm the vendor's phone number was verified at registration (this should already exist from the account registration system — just check the flag rather than re-verifying), confirm the Paystack subaccount from Phase 2 is verified and active, and add a simple review step — manual or lightly automated — where the store's category and description get checked for anything obviously prohibited or fraudulent before the store is allowed to go live.

Design this as a baseline tier only. Do not build a heavier "verified vendor" badge system with ID document uploads or business registration certificate checks in this phase — that's worth designing later as an optional add-on layered on top of this baseline, not a blocking requirement for every vendor from day one, since requiring heavy documentation upfront tends to suppress signups from smaller, informal sellers who are a meaningful part of AfriCart's target market. If you want to leave a hook for that future tier, a simple `verificationTier: "baseline" | "verified"` field on the Store document is enough for now — don't build out the verified tier's actual document upload or review flow yet.

Once a store passes this baseline verification and Phase 2's payment gate, it should be eligible to move to Phase 4's go-live step.

### Out of scope for this phase

Do not build the heavier ID/business-document verification tier — leave only a placeholder field for it. Do not build the go-live/publish logic itself — that's Phase 4. Do not touch phone verification logic from the existing registration system beyond reading its existing status.

---

## PHASE 4: Go-Live & Dashboard Handoff

### Kickoff prompt for Antigravity

This is the final phase that flips a Store from pending to active once it has passed Phase 2's payment gate and Phase 3's baseline verification. Build the logic that checks both conditions are met and, once they are, changes the Store's status to active and makes it visible in customer-facing browsing and search for the first time.

Immediately after go-live, route the vendor into the main admin dashboard (the restructured one from the earlier Admin Dashboard Restructure phase), landing on the Home section. From there, also surface a clear prompt pointing them toward the storefront customization flow — something like "your store is live, now make it yours" — since a freshly created store with no banner or bio is a weak first impression for customers who find it. This should link directly into the "Store Design" section built in the Vendor Storefront Customization phase, not just mention it vaguely.

Also handle the ongoing case, not just the initial go-live: if a store's Paystack subaccount later becomes invalid (for example, a bank account changes and settlement starts failing), the store should auto-unpublish or at minimum show a prominent, hard-to-miss flag in the vendor's dashboard — silent payout failure on a live store is the kind of bug that erodes vendor trust in the whole platform, so this shouldn't be a passive background state the vendor has to notice on their own.

### Out of scope for this phase

Do not rebuild the admin dashboard structure or the storefront customization editor themselves — only build the routing/handoff into them and the go-live gating logic. Do not build the heavier verification tier. Do not change how Paystack subaccounts are created — only how their ongoing validity is monitored and surfaced.

---

## Suggested execution order

Run these four phases in order — Store Setup Wizard, then Payment/Payout Setup, then Verification, then Go-Live & Dashboard Handoff — since each one depends on data or state created by the phase before it. This entire sequence assumes the Admin Dashboard Restructure and Vendor Storefront Customization phases from the earlier Shopify-structure work are either already built or will be built in parallel, since Phase 4 hands the vendor directly into both of them.