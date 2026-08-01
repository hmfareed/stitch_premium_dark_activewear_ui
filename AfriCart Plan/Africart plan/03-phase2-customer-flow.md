# Phase 2 — Customer Flow

### 2.1 Browsing → Vendor Store Page
When a customer taps a product or a vendor name/logo, they land on the Vendor
Storefront — this is the vendor's public-facing "mini-site" within AfriCart, not just a
product list:
- Header block: store banner, logo, store name, verified badge (post-KYC) + tier badge
  (Basic/Plus/Pro — see Phase 9), rating + review count, "Chat with vendor" (if messaging enabled), follow/favorite store
- Store stats strip: response time, fulfillment rate, number of products, "member since"
- Customization layer (roadmap — not yet built): vendors will be able to set a theme
  accent color, featured product rail, and a short "About this store" section (part of the
  Shopify-inspired storefront customization pillar). Today the storefront likely renders
  with a fixed/default layout only.
- Category tabs: filtered to that vendor's own taxonomy
- Product grid: paginated/infinite-scroll, with stock status visible
- Policies tab: vendor-set return/delivery policies
- Adding items to cart from this view tags them with that vendorId for cart-splitting

### 2.2 Cart & Checkout
1. Cart view groups items by vendor visually, even before checkout, so the customer sees "3 vendors, 3 delivery estimates"
2. Address capture uses GhanaPost GPS digital address as primary, with a manual fallback (landmark + area) for customers without one
3. Payment: Paystack — Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money) as primary rails, card as secondary
4. On payment success → cart splits into SubOrders → Paystack split payment disburses to vendor subaccounts minus commission → each vendor notified independently
5. Order tracking shows per-sub-order status, not one blended status, since vendors fulfill independently
