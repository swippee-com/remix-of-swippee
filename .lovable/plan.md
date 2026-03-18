

## Remaining Improvements for Existing Features

After a thorough review, here are the issues found, ordered by severity.

---

### Critical Security: Profile Update RLS is Too Permissive

The `profiles` table's "Users can update own profile" RLS policy allows updating **any column** including `is_frozen`, `is_2fa_enabled`, and `phone_verified`. A malicious user could:
- Unfreeze their own account by setting `is_frozen = false`
- Set `phone_verified = true` without actually verifying
- Set `is_2fa_enabled` to bypass or enable 2FA flags

**Fix**: Replace the permissive UPDATE policy with one that only allows updating safe columns (`full_name`, `country`, `avatar_url`, `timezone`). Sensitive fields (`is_frozen`, `is_2fa_enabled`, `phone_verified`) should only be updatable by admin or server-side functions (which already use service role key).

This requires a database migration to:
1. Drop the current "Users can update own profile" policy
2. Create a new restrictive policy that uses a `WITH CHECK` expression or a SECURITY DEFINER function that only permits updates to whitelisted columns

---

### Medium: Order Status Update via Client-Side RLS

In `OrderDetailPage.tsx`, when a user uploads a payment proof, the client directly updates the order status from `awaiting_payment` to `payment_proof_uploaded` (line 134). The RLS policy "Users can cancel own awaiting orders" restricts `WITH CHECK` to only `status = 'cancelled'`, so this update **should fail**. However, this means the proof upload flow is likely broken for status transitions, or there's an unintended policy gap.

**Fix**: Move the order status transition (`awaiting_payment → payment_proof_uploaded`) into a server-side edge function or a database trigger that fires on `payment_proofs` insert. The client should not update order status directly.

---

### Medium: Deposit/Withdrawal Missing Input Validation

- `DepositModal`: No maximum amount limit — a user could submit a deposit of NPR 999,999,999
- `WithdrawModal`: Client-side max is `balance`, but no server-side validation prevents negative amounts or amounts exceeding actual balance
- Neither has server-side validation via edge functions — they insert directly into `wallet_transactions`

**Fix**: Add reasonable min/max limits client-side, and ideally move wallet transaction creation to an edge function with server-side balance validation.

---

### Low: Login Page Duplicate Code

`Login.tsx` has the `completeLogin` function (lines 33-51) and near-identical logic inline in `handleLogin` (lines 72-100). The track-login call and frozen check are duplicated.

**Fix**: Have `handleLogin` call `completeLogin` after successful non-2FA login instead of duplicating the logic.

---

### Low: PricingData Interface Still Has `pricing_config_id`

In `use-trade-pricing.ts`, the `PricingData` interface still includes `pricing_config_id` (line 20), even though we stripped it from the `calculate-price` response in the previous fix. This field will always be `undefined`, causing no harm but is misleading.

**Fix**: Remove `pricing_config_id` from the `PricingData` interface.

---

### Recommended Implementation Order

1. **Fix profile UPDATE RLS** — Critical privilege escalation. Create a migration to restrict updatable columns.
2. **Move order status transition server-side** — Create a trigger or update the proof upload edge function to handle status changes.
3. **Deduplicate Login.tsx** — Refactor to use `completeLogin` in both paths.
4. **Clean up PricingData interface** — Remove stale `pricing_config_id` field.
5. **Add wallet transaction validation** — Add min/max limits to deposit/withdrawal.

