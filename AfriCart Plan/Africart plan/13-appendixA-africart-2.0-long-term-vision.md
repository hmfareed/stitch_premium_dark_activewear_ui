# Appendix A — Long-Term Vision: "Africart 2.0" (Not Current Build Plan)

⚠️ This section is aspirational only. Everything above (Phases 0–11) describes what's
actually being built: a Tamale-first, single-hub, multi-vendor marketplace on Next.js +
MongoDB + Vercel + Paystack. This appendix captures a much larger long-term
product vision provided separately, and is recorded here for reference — it should not
be fed to Antigravity as a build spec, and it does not change any decision made above.

The two documents are not compatible as-is if pursued literally at the same time:
- Tech stack conflict: this vision specs PostgreSQL + NestJS + microservices +
  Kubernetes; the current build is MongoDB + Next.js on Vercel. Adopting this vision later would mean a deliberate migration decision, not an incremental extension.
- Scope conflict: this vision includes ride-hailing, food delivery, a wallet/payments
  system, an AI shopping assistant, and pharmacy/parcel delivery as core modules —
  each roughly the size of AfriCart's entire current scope on its own. Treat this as a multi-year roadmap, not a near-term target.

### A.1 Vision Summary
Africart 2.0 is framed as an AI-powered African super app combining: multi-vendor
marketplace, food delivery, grocery, pharmacy, digital wallet/payments, parcel delivery,
ride hailing, an AI shopping assistant, vendor management, a rider network, and
business analytics — modeled loosely on the Jumia/Bolt/Gojek "super app" pattern.

### A.2 Additional Roles Beyond Current Spec
- Admin (distinct from Superadmin) — day-to-day platform operations: users,
  vendors, products, orders, payments, categories, commissions, coupons, AI moderation, fraud detection, support tickets
- Super Admin — system-level control: other admins, system settings, AI configuration,
  commission rates, payment gateway config, server settings, feature flags, database backups, audit logs
- Driver (ride-hailing) — separate from delivery Rider

### A.3 Additional Modules Beyond Current Spec
- AI Shopping Assistant — natural language product search/recommendation/comparison, checkout completion via chat, voice chat, image search, barcode scanning, RAG over the product catalog
- Food Delivery — restaurant/menu module, separate flow from marketplace vendor orders
- Ride Hailing — pickup/destination, fare estimate, driver matching, trip payment, rating
- Digital Wallet — deposit/withdraw/transfer, cashback, refunds, transaction history — a genuine e-money layer beyond just "checkout via Paystack"
- Loyalty/Rewards System — points for purchases, referrals, reviews, daily login, challenges; redeemable for coupons/discounts/wallet credit
- Parcel Delivery — peer-to-peer sending, separate from vendor→customer delivery
- Pharmacy — a regulated vendor category likely needing its own compliance layer

### A.4 Proposed Tech Stack (differs from current build)

| Layer | This vision | Current AfriCart build |
|---|---|---|
| Frontend | Next.js, React, Tailwind, TypeScript | Next.js (same) |
| Backend | Node.js, NestJS (or Express for MVP) | Next.js API routes/server actions |
| Database | PostgreSQL + Redis + Elasticsearch | MongoDB |
| Storage | Cloudflare R2 or AWS S3 | Cloudinary |
| Auth | Clerk/Auth.js, JWT, OAuth | Custom (password-only currently) |
| Real-time | Socket.IO/WebSockets | Not yet specced (HANARA SMS uses Socket.io separately) |
| Payments | Paystack, Flutterwave, Stripe | Paystack (same) |
| AI | OpenAI/Gemini + vector DB + RAG | Not in current scope |
| Deployment | Docker, Kubernetes, Vercel/Railway/AWS | Vercel only |

### A.5 If/When You Revisit This
Worth returning to this appendix once the Tamale hub-and-rider model (Phases 0–11)
is actually live and generating real usage data. At that point the honest questions become:
- Which one or two modules from A.3 have genuine demand signal from Tamale customers/vendors — pick the smallest, not "all of them at once"
- Whether the MongoDB→PostgreSQL migration is worth the cost at your actual scale, or whether it's premature optimization
- Whether "AI shopping assistant" is better started as a scoped, low-cost feature (e.g. a
  search/recommendation layer using an LLM API) rather than the full RAG + vector DB + voice + barcode scanning bundle described here
