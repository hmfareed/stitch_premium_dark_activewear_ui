# Phase 8 — OTP Integration (new — proposed design)
Not previously specced. Proposed here as a standard pattern across all four human
roles (customer, vendor, staff, rider) wherever phone-number trust matters.

### 8.1 Where OTP Is Used
1. Account creation (any role) — verify phone ownership before account activation
2. Login fallback — OTP as an alternative to password, or as 2FA for vendor/superadmin high-privilege actions
3. Checkout confirmation — optional OTP step before high-value orders, or for guest checkout without a saved account
4. Delivery handoff — customer receives an OTP when the order is out for delivery; rider
   enters it (or customer shows it) to confirm proof-of-delivery — this is the standard
   Jumia/Bolt Food pattern and prevents "marked delivered but never received" disputes
5. Vendor staff invite acceptance — invite link plus OTP confirms the phone number
   belongs to the invited person before StaffMembership is created

### 8.2 OTP Flow (generic)
1. Client requests OTP → server generates a time-limited code (typically 6-digit, 5–10
   min expiry), stores hashed in OTPRequest with purpose enum (signup, login,
   delivery_confirm, staff_invite)
2. Server sends via Hubtel/mNotify SMS API
3. Client submits code → server validates against stored hash + expiry + attempt count
   (rate-limit to prevent brute force, e.g. max 5 attempts, lock with backoff)
4. On success, consume the OTP (single-use) and proceed with the tied action
5. Resend flow: cooldown timer (e.g. 60s) before allowing a new send, to control SMS costs

### 8.3 Considerations for the Ghana Context
- SMS delivery latency varies by network — show a visible "resend" option early rather than making users wait indefinitely
- Cost management: OTP SMS is a real per-message cost via Hubtel/mNotify — worth
  rate-limiting aggressively and considering whether every login needs OTP vs. just signup + delivery confirmation
- Act 843 (Data Protection Act) compliance: phone numbers and OTP logs are personal
  data — retention policy should purge OTPRequest records after a short window (e.g. 24–48 hrs) rather than keeping them indefinitely
