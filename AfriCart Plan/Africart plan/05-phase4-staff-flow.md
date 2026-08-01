# Phase 4 — Staff Flow
1. Vendor owner invites staff by phone number → SMS sent via Hubtel/mNotify with an invite link/code
2. Staff accepts → creates account or links existing AfriCart account → StaffMembership document created, scoped to that vendor's storeId
3. Owner assigns a permission scope at invite time or after (e.g. products:write, orders:read, orders:write — no payouts or staff:manage by default)
4. If a person works for multiple stores (or the owner runs multiple stores), the panel
   shows a store-switcher in the header — switching context reloads scoped data for that store only
5. Staff actions are attributed in the AuditLog against the staff member's identity, not the owner's, for accountability
