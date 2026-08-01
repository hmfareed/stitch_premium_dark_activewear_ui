# Phase 11 — Distance-Based Delivery Fee Engine

New in this addendum. Replaces any flat/unspecified delivery fee with a fee that
scales with the customer's distance from the collection point, using coordinates
already captured during checkout.

### 11.1 Collection Point Decision (confirm before Antigravity build)
The fee must be calculated from the correct collection point, not just "vendor to
customer," because of the hub model already locked in Phase 0 and Phase 6:
- `hub_stock` or `vendor_dropoff_pending` sub-orders → distance is **Hub → Customer**.
  Since Tamale is single-hub, this is one fixed point, which makes it the simplest and
  most consistent case — and it's also the majority case per Phase 6's "hub-first" framing.
- `vendor_direct_pickup` sub-orders (the fallback case) → distance is **Vendor Store → Customer**.

Recommendation: calculate and store the fee per sub-order at checkout, using
whichever collection point that sub-order's fulfillmentSource resolves to at that
moment. In a multi-vendor cart, this naturally produces the "3 vendors, 3 delivery
estimates" view already described in Phase 2.2 — no new checkout-flow change needed, just a smarter fee calculation feeding into it.

### 11.2 Fee Formula
```
deliveryFee = clamp(
  baseFee + max(0, distanceKm - freeRadiusKm) * perKmRate,
  minFee,
  maxFee
)
```
Example placeholder values (actual GHS amounts are a business decision, same caveat as the subscription pricing in Phase 9):
`baseFee = GHS 5, freeRadiusKm = 2, perKmRate = GHS 1.50/km, minFee = GHS 5, maxFee = GHS 30`

Store this as a `DeliveryFeeConfig` record (superadmin-editable, per Phase 10.1's
Commission & Fees section) rather than a hardcoded constant — same runtime-
configurable pattern already used for SubscriptionPlan in Phase 9, so a fee change never needs a deploy.

The computed fee AND the distance it was based on should both be written onto the
SubOrder at checkout time and never recalculated afterward — protects against
disputes if the config changes between order placement and delivery.

### 11.3 GPS / Mapping Integration Recommendation
What you already have: GPS capture during the customer's delivery-detail entry — this
is almost certainly resolving a GhanaPost GPS digital address (or a manual pin) to a
latitude/longitude, per Phase 2.2. That's the right layer to keep exactly as-is; it's an
addressing/geocoding step, not a distance engine, so nothing needs to change there.

What's missing is the layer that turns "two lat/longs" into "a distance to charge for,"
plus, later, live rider tracking. Recommended in two stages:

**Stage 1 (build now, zero external dependency, zero cost):**
Haversine formula — straight-line distance between the two coordinates you already
have, computed entirely server-side. Multiply by a road-distance correction factor
(roughly 1.3–1.4x is a reasonable starting point for Tamale's road layout) to
approximate real road distance without calling any external API. This has no per-
request cost, no rate limits, and no new vendor relationship to manage — consistent
with the same cost-conscious, ship-the-simple-version-first pattern already used for
subscription billing (Phase 9.4) and delivery zones (Phase 6.4).

**Stage 2 (once volume or accuracy complaints justify it):**
Google Maps Platform — Distance Matrix API or Directions API for actual driving
distance and ETA, replacing the Haversine-plus-multiplier approximation. This is the
safer default recommendation over Mapbox for a first integration: better
documentation, wide adoption, and it composes cleanly with the same platform's
Maps SDK if you later want live rider tracking on one map surface rather than two
separate vendor relationships. Mapbox is a reasonable alternative to revisit
specifically if Google's per-request pricing becomes a real cost concern at higher
order volume — its Directions API is comparable and often cheaper at scale, with a capable live-tracking SDK of its own.

**Live rider tracking (separate capability, not required for fee calculation):** if/when
you want customers to see the rider's dot moving toward them, that's Google Maps
Platform's Maps SDK + Geolocation API — the rider's phone pushes its coordinates
every 10–15 seconds to a lightweight endpoint, and the customer's app renders it on
the map. This is a nice-to-have UX layer on top of the Rider dashboard's navigation
handoff (Phase 6.3), not a prerequisite for the fee engine — worth sequencing after Stage 2, not before.

### 11.4 Data Model Additions
- `Warehouse` — add `latitude`, `longitude` (single seeded hub record already exists per Phase 0; just needs coordinates populated)
- `Store` — add `latitude`, `longitude` (required field going forward; needed for the vendor_direct_pickup fallback case)
- `SubOrder` — add `deliveryDistanceKm`, `deliveryFeeCharged` (snapshotted at checkout, immutable after)
- `DeliveryFeeConfig` — new collection: `baseFee`, `freeRadiusKm`, `perKmRate`,
  `minFee`, `maxFee`, `roadDistanceMultiplier`, `effectiveFrom` (so historical orders can still be audited against the config that was live when they were placed)

### 11.5 Suggested Build Slice
1. Add lat/long fields to Warehouse and Store; backfill the single hub's coordinates now
2. DeliveryFeeConfig schema + a seeded default config (placeholder values above)
3. Server-side Haversine + multiplier calculation, wired into checkout at the sub-order
   level, using each sub-order's resolved fulfillmentSource to pick hub-vs-vendor as the origin point
4. Surface the per-sub-order distance and fee on the existing "3 vendors, 3 delivery
   estimates" cart/checkout view (Phase 2.2) — this is a data-source swap, not a new UI
5. Superadmin Commission & Fees screen to edit DeliveryFeeConfig at runtime
6. Defer Google Distance Matrix / live tracking until Stage 1 is live and you have a
   concrete reason (accuracy complaints, or volume that justifies the API cost) to upgrade
