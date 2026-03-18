

# Fix: Enforce Readiness Gate Before Order Placement

## Problem
The ReadinessGate checklist only triggers when the user is **not logged in** (line 71-73 of TradeWidget). Logged-in users bypass all checks (phone verification, KYC, payment method) and can lock rates and place orders freely.

## Solution
Two layers of enforcement:

### 1. Client-side: TradeWidget.tsx — open ReadinessGate for incomplete users
- Add a readiness check that mirrors the ReadinessGate logic: query `kyc_submissions`, `payment_methods`, and `payout_addresses` (for sell), plus check `profile.phone_verified`
- In `handleCTA`, when `state === "priced"` (about to lock rate), check if all steps are complete. If not, open the ReadinessGate instead of calling `lockRate()`.
- Extract the readiness queries into a shared hook (`useTradeReadiness`) so both `ReadinessGate` and `TradeWidget` can use the same data without duplicating queries.

### 2. Server-side: `place-order` edge function — reject orders from incomplete accounts
Add validation checks before creating the order:
- Verify `profile.phone_verified === true`
- Verify at least one approved `kyc_submissions` exists
- Verify at least one `payment_methods` row exists
- For sell orders, verify at least one `payout_addresses` row exists
- Return a clear error message indicating which step is missing

## Changes

### New file: `src/hooks/use-trade-readiness.ts`
- Accepts `side: "buy" | "sell"` and `userId`
- Queries phone_verified from profile, KYC status, payment method count, payout address count (sell only)
- Returns `{ allReady: boolean, steps: [...] }` — reusable by both ReadinessGate and TradeWidget

### Edit: `src/components/trade/TradeWidget.tsx`
- Import and call `useTradeReadiness(side, user?.id)`
- In `handleCTA`, before `lockRate()`, check `allReady`. If false, `setGateOpen(true)` and return.

### Edit: `src/components/trade/ReadinessGate.tsx`
- Refactor to use the shared `useTradeReadiness` hook instead of inline queries (reduces duplication)

### Edit: `supabase/functions/place-order/index.ts`
- After the frozen check (line 94), add server-side validation:
  - Query `profiles` for `phone_verified`
  - Query `kyc_submissions` for approved status
  - Query `payment_methods` for existence
  - For sell: query `payout_addresses` for existence
- Return 403 with descriptive error if any check fails

