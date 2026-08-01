# Phase 6 — Rider Flow (new — proposed design)
Not previously specced. Designed here from Ghana delivery-platform patterns (Bolt
Food, Jumia Food rider apps). Treat as a draft for your review.

### 6.1 Rider Onboarding
1. Registration: phone number, ID document (Cloudinary), vehicle type
   (motorbike/bicycle/foot/car), preferred delivery area within Tamale (free-text or a
   short list of known neighborhoods — not a formal zone system yet)
2. OTP verification (see Phase 8) to confirm phone ownership before account creation proceeds
3. Superadmin (or a delegated ops role) reviews and approves — riders are a trust-
   sensitive role since they handle cash-on-hand and customer goods
4. Once approved, rider sets availability status (online/offline) and preferred delivery area (still just Tamale-wide for now)

### 6.2 Rider Roles / Responsibilities
- Pickup — hub-first: the majority of deliveries are collected from the AfriCart
  warehouse/hub, not the vendor's premises directly — either because the SKU is pre-
  stocked there (consignment) or the vendor already dropped it off for this order
- Pickup — direct from vendor (fallback case): when a vendor hasn't pre-stocked or
  dropped off in time, the rider collects directly from the vendor's location instead, per the sub-order's fulfillmentSource
- Multi-stop handling: a rider's route may combine a single hub stop covering several
  sub-orders (even across vendors, since hub stock is co-located) with occasional direct vendor stops for items still routed that way
- Proof of delivery: photo capture and/or OTP-confirmed handoff at the customer's door (ties into Phase 8)
- No cash handling: all orders are prepaid via Paystack (Mobile Money/card) before
  dispatch — riders never collect payment, which simplifies onboarding trust requirements and removes reconciliation from the rider dashboard entirely
- Status updates: rider is the source of truth for "collected from hub/vendor" → "out for delivery" → "delivered" transitions on the sub-order

### 6.3 Rider Dashboard — Proposed Contents
- Availability toggle: online/offline, visible at the top always
- Active delivery card(s): current assignment(s) showing collection point first —
  "Collect from: AfriCart Hub" or "Collect from: [Vendor name], [address]" — plus
  customer drop-off address, GhanaPost GPS-linked map, customer contact (masked, revealed on assignment acceptance)
- Earnings summary: today's completed deliveries, today's earnings, pending payout
  (per-delivery fee only — no cash reconciliation needed since orders are prepaid)
- Delivery queue/history: past deliveries with status and timestamps
- Navigation handoff: "Open in Maps" deep link using GhanaPost GPS or lat/long
- Incident/issue reporting: flag a failed delivery, wrong address, customer unreachable
- Area & schedule settings: preferred delivery area within Tamale, preferred operating hours

### 6.4 Rider Assignment Logic (suggested)
Scoped to single-hub Tamale operation — see fulfillment model note above. No cross-hub or region matching needed yet.
- Hub batching: since most stock lives at (or passes through) the one Tamale hub,
  assignment logic can batch multiple customer deliveries into one rider run departing
  the hub, rather than always doing one rider per sub-order
- Distance/area matching for the drop-off leg within Tamale (rider's current location or
  preferred area vs. customer location) — a simple deliveryArea field is enough for now,
  no need for a formal DeliveryZone polygon system yet unless you already want that granularity
- For the fallback direct-vendor-pickup case, match against the vendor's location the same simple way
- Availability + current active-delivery load (don't over-assign a rider mid-route)
- Optional: rider acceptance window (rider can accept/decline within N seconds before reassignment) rather than forced auto-assignment — reduces no-shows

### 6.5 Warehouse/Hub Operations (new surface this model requires)
The hub-based model implies a lightweight hub operations view — likely a scoped
superadmin or dedicated "hub staff" capability, not full superadmin access:
- Incoming drop-offs: vendors dropping off items get a hub-received confirmation
  (barcode/QR scan or manual confirm) that flips the sub-order's fulfillmentSource status
- Consignment stock ledger: running count of what each vendor has stored at the hub, reconciled against sales
- Outgoing handoffs: confirm which items a rider physically collected before they leave,
  so there's a clean chain of custody from vendor → hub → rider → customer

This is a genuinely new role/surface, not just a rider or vendor panel feature — worth
deciding whether it's a superadmin sub-view or its own lightweight role before Antigravity implementation starts.
