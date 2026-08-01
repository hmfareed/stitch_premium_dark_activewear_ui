# AfriCart — Overview & Sourcing Note

# AfriCart — Full Platform Specification

Note on sourcing: This document is compiled from the architecture, features, and
workflows we've developed together across prior AfriCart sessions, corrected
against what's actually live per your feedback:

- Rider role does not exist yet — registering as a rider currently falls back to a
  customer account (see bug flag below). Phase 6 is a greenfield build, not a
  description of something live.
- Auth is password-only — no OTP exists anywhere in the app yet. Phase 8 is a
  greenfield build.
- Storefront customization is not built — vendors cannot yet set
  theme/banner/featured rail. Removed from "current" vendor panel features
  below and moved to roadmap.
- COD (cash on delivery) is not in scope — Mobile Money/card via Paystack only.
  Rider dashboard earnings section adjusted accordingly.

⚠️ Bug to log separately: rider signup silently creating a customer role instead of
failing or routing to rider onboarding. Worth checking whether there's a missing
role param on that registration form/endpoint, or whether the rider role simply isn't
defined in the User schema yet and the backend is defaulting.