# Phase 0 — Architecture Overview

### Tech Stack
- Framework: Next.js (full-stack — App Router, API routes / server actions)
- Database: MongoDB (Mongoose ODM)
- Payments: Paystack Ghana (split payments, subaccounts, webhooks)
- Media: Cloudinary (product images, store assets, KYC documents)
- Hosting: Vercel
- SMS: Hubtel / mNotify (OTP, order notifications, staff invites)
- PWA: Service worker, offline-aware shell, network-conscious asset loading (2G/3G
  tolerant — key for Ghana's connectivity profile)

### The Five Roles
1. Customer — browses, buys across multiple vendors in one checkout
2. Vendor — owns a store, manages products/orders/staff
3. Vendor Staff — scoped sub-accounts under a vendor (e.g. inventory clerk, order picker)
4. Rider — handles delivery/fulfillment (new role, specced below)
5. Superadmin — platform-level control (vendor approval, disputes, payouts oversight, module registry)

### Core Data Model Clusters
- Identity: User (base), with role-specific extension documents (VendorProfile, RiderProfile, StaffMembership)
- Catalog: Store, Product, Category (nested/hierarchical, not flat), Variant
- Commerce: Cart (multi-vendor, splits into SubOrder per vendor at checkout), Order, SubOrder, Payment, PaystackSplit
- Fulfillment: Delivery, RiderAssignment, DeliveryZone, Warehouse (hub location), ConsignmentStock (vendor inventory held at a warehouse), HubDropoff (vendor-delivered-to-hub record awaiting rider pickup)
- Trust/Access: KYCDocument, VendorApproval, AuditLog, PermissionScope, SubscriptionPlan (admin-configured tier definitions), VendorSubscription (a vendor's active/historical plan enrollment)
- Comms: OTPRequest, SMSLog, Notification

### Why Cart-Splitting Matters Architecturally
A single customer cart can contain items from N vendors. At checkout, the cart splits
into N SubOrders, each tied to its vendor's Paystack subaccount. One payment intent,
split via Paystack's split-payment API, disburses to each vendor's subaccount minus
platform commission — this is a hard architectural constraint that touches checkout,
order tracking, refunds, and rider assignment (a rider may need to visit multiple vendor
pickup points for one customer's order, or sub-orders may ship/deliver independently).

### Fulfillment Model: Hub-Based Logistics
AfriCart uses a warehouse/hub fulfillment model, not pure vendor-direct dropship. This
is the core loop:
1. Vendor lists products as normal.
2. Customer orders.
3. Vendor fulfills the order in one of two ways per product/SKU:
   - On-demand drop-off — vendor delivers the specific item to the AfriCart warehouse/hub once an order comes in
   - Pre-stocked consignment — vendor stores inventory at the hub in advance, so orders for that SKU are fulfilled straight from hub stock with no per-order vendor trip
4. Riders either collect from the hub (the common case) or, for vendors without
   consignment stock and who haven't dropped off in time, collect directly from the
   vendor's location.
5. Rider delivers to the customer.

This means SubOrder fulfillment routing needs a `fulfillmentSource` field
(`hub_stock`, `vendor_dropoff_pending`, `vendor_direct_pickup`) so riders and the
ops/admin view know exactly where to collect from for each sub-order — this is now
more consequential than the multi-vendor pickup problem alone, since even a single-
vendor order might route through the hub rather than the vendor's own address.

**Scope: Tamale-first, single hub.** AfriCart is launching in Tamale only, with one physical
warehouse/hub. Don't build multi-region/multi-hub logic now — but don't hardcode
assumptions that would make adding a second hub later painful either. Practical
implications:
- Warehouse is a real collection with a single seeded record for now, not a hardcoded
  constant in code — this costs almost nothing today and avoids a migration later
- Delivery zones and rider assignment are scoped to "distance/area within Tamale,"
  not a regionId/hubId matching system — that layer gets added when a second city comes online
- Vendor onboarding doesn't need a "select your region" step yet — every vendor is implicitly Tamale-based
- When expansion happens later, the main additions are: hubId on Warehouse-linked
  records, a region field on vendor/rider onboarding, and hub-to-hub routing logic if a
  vendor's product needs to move between hubs — none of that needs to be designed
  now, just kept in mind so early schema choices don't block it
