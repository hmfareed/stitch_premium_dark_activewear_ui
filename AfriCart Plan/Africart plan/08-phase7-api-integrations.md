# Phase 7 — API Integrations Summary

| Service | Purpose | Key Endpoints/Flows |
|---|---|---|
| Paystack | Payments, split payouts | Subaccount creation, split payment initialization, webhook listener for charge.success, transfer.success |
| Cloudinary | Media storage | Product images, store banners/logos, KYC docs, delivery proof photos |
| Hubtel / mNotify | SMS | OTP delivery, staff invites, order status SMS, rider assignment alerts |
| GhanaPost GPS | Addressing | Digital address lookup/validation for delivery + rider navigation |
| Vercel | Hosting/deploy | CI/CD, edge functions if used for webhook latency |

Webhook handling note: Paystack webhooks (payment confirmation, transfer status)
should be idempotent and signature-verified — this was already a focus in the split
payment work; the same discipline applies to any SMS delivery-status callbacks from Hubtel/mNotify if used.
