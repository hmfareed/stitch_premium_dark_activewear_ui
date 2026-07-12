# AfriCart Storefront Redesign Brief — For Claude Code / Coding Agent

Target site: africart-one.vercel.app (Next.js, deployed on Vercel, client-rendered `/shop` route)

---

## 1. Audit Findings (current state)

From inspecting the live markup:

1. **Category navigation overflow** — ~25+ flat category links (`All, Electronics, Fashion, Home, Beauty, Laptops, Phones, Mobile Accessories, Groceries, Cooling, Washers/Dryers, Gaming, Health, Sports, Books, Automotive, Baby, Baby Products, Toys, Computing, Phones/Tablets, Pet Supplies, Home Appliances, Phone Accessories, Beverages, Accessories, Cosmetics, Food`) render inline in the header with no grouping, dropdown, or overflow handling.
2. **Duplicate cart icons** — 5 instances of a `shopping_cart` icon render in the header. This is a bug, not a design choice (likely a `.map()` over a list rendering an icon per item instead of once).
3. **Unlabeled `forum` icon** — purpose unclear from markup; likely meant to be chat/support but has no accessible label.
4. **No skeleton/loading UI** — `/shop` renders literal text "Loading Shop..." with nothing else while data fetches client-side.
5. **Flat category taxonomy** — parent/child categories aren't structurally related (`Home` vs `Home Appliances`, `Phones` vs `Phones/Tablets` are siblings, not parent-child), which will make the mega-menu and filter sidebar harder to build correctly later.
6. **Dark base theme** (`#0a0a0a`) is declared but component-level contrast isn't verifiable from markup — needs explicit palette work, not assumed dark-mode defaults.

---

## 2. Redesign Goals

- Fix the header so it scales to hundreds of categories without breaking layout.
- Remove duplicate/broken icon rendering; give every icon a real purpose and label.
- Add proper loading states (skeletons) so the shop feels fast and finished, not broken.
- Normalize categories into a real parent → child hierarchy in the data model, then reflect that in the mega-menu and sidebar filters.
- Ship a dark-first palette with verified contrast ratios (WCAG AA minimum) for text on `#0a0a0a`.

---

## 3. Target Information Architecture

```
Category (top-level)
  └── Subcategory
        └── Product
```
Examples to fix immediately:
- `Home` (parent) → `Home Appliances`, `Cooling`, `Washers/Dryers` (children)
- `Phones` (parent) → `Phones/Tablets`, `Phone Accessories`, `Mobile Accessories` (children)
- `Baby` (parent) → `Baby Products`, `Toys` (children, if toys is baby-specific — otherwise Toys is its own top-level)

Agent task: normalize the categories table/collection to include a `parentCategory` field (nullable for top-level) before touching any UI.

---

## 4. Header Redesign Spec

- **Structure:** Logo (left) → search bar (center-dominant) → icons: wishlist, cart (single instance, with live badge count), account/login (right).
- **Category row:** Replace the flat link list with:
  - 6–8 top-level categories shown as text links.
  - A **"More" dropdown or hamburger "All Categories" drawer** for the rest, grouped by parent category from the new hierarchy.
  - Hovering a top-level category (desktop) opens a mega-menu column showing its children.
- **Cart icon:** Single icon, badge shows live item count, opens a slide-in drawer (not a page navigation) on click.
- **Remove or repurpose the `forum` icon:** if it's meant for support/chat, give it a clear icon (e.g. chat bubble) + tooltip/label ("Help" or "Support"). If unused, remove it.

---

## 5. Loading State Spec

Replace "Loading Shop..." text with:
- Skeleton product cards (gray rounded rectangles matching the real card's image + text block proportions) — show 8–12 skeletons in the grid immediately on route load.
- Skeleton shimmer animation (subtle left-to-right gradient sweep) rather than a static gray block.
- Category nav and header should NOT show loading states — only the product grid area, since nav data is likely static/cached.

---

## 6. Product Grid & Card Spec (dark theme)

- **Background:** `#0a0a0a` page background, cards at `#141414` or `#161616` (slightly lighter than page bg) with a 1px border `#262626` to separate from background.
- **Text:** Primary text `#F5F5F5`, secondary/vendor text `#A3A3A3`, price in an accent color (pick one brand accent, e.g. `#22C55E` green or `#F59E0B` amber) — verify 4.5:1 contrast against `#141414`.
- **Grid:** 12-col desktop (5–6 product columns), 2-column mobile — same density rules as standard marketplace grids.
- **Card:** Square image, vendor name, 2-line title, rating, price row, and a bottom action row with a filled accent "Add to Cart" button + outline icon-only "View" button opening a quick-view modal. (Full spec matches the general multivendor card spec already provided separately — reuse that.)

---

## 7. Implementation Task List (for the agent)

1. **Fix the icon bug first** — locate the component rendering the header icons, find why `shopping_cart` renders 5×, reduce to a single instance with a badge bound to cart state.
2. **Audit and label the `forum` icon** — find its onClick handler to determine intended purpose; either wire it to a real support/chat feature with a label, or remove it.
3. **Normalize category data** — add `parentCategory` field to the categories schema/seed data; migrate existing flat categories into the hierarchy in Section 3.
4. **Rebuild header nav** — implement top-level links + "More"/mega-menu drawer sourced from the new hierarchy; ensure it doesn't overflow at any breakpoint (test at 320px, 768px, 1440px).
5. **Add skeleton loading component** — build a reusable `ProductCardSkeleton` and render 8–12 on `/shop` while data is in-flight; swap for real cards on load.
6. **Rebuild product card component** — apply the dark palette, grid ratios, and Add to Cart / View button spec above; test hover, loading, and "added" states.
7. **Convert cart click to a drawer, not a route** — implement a slide-in cart drawer (right on desktop, bottom sheet on mobile) triggered from the header cart icon and from "Add to Cart" clicks.
8. **Accessibility pass** — verify color contrast on all new text/background pairs, add `aria-label`s to icon-only buttons (cart, wishlist, view, forum/support).
9. **Responsive QA** — verify the new header and grid at 320px, 768px, 1024px, 1440px widths.

---

**Note for the agent:** Steps 1–3 are bug fixes and data-model work — do these before any visual restyling, since the mega-menu and cart badge depend on them being correct first.