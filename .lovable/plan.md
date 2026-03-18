

## Audit: Improvements & Security Risks in Existing Features

After reviewing the codebase thoroughly, here are the findings organized by severity.

---

### Security Issues (High Priority)

**1. `calculate-price` edge function has no authentication**
The `calculate-price` function accepts unauthenticated requests — no `Authorization` header check. Anyone can call it to probe pricing configs, forex rates, and inventory logic. While it doesn't write data, it leaks business-sensitive pricing configuration details (`pricing_config_id`, `min_order_npr`, `max_auto_order_npr`).

*Fix*: Add auth check or at minimum strip sensitive config IDs from the response.

**2. `lock-rate` trusts client-supplied pricing data**
The `lock-rate` function receives the entire `pricing` object from the client and stores it directly into `rate_locks`. A malicious user could tamper with `final_rate_npr`, `fees_npr`, `total_pay_npr`, or `total_receive_crypto` to get a better rate. The server should **re-calculate** pricing server-side rather than trusting the client payload.

*Fix*: Have `lock-rate` call the pricing logic internally instead of accepting it from the client.

**3. User can update `settlement_tx_hash` directly via RLS**
In `OrderDetailPage.tsx`, the user submits a tx hash by calling `supabase.from("orders").update({ settlement_tx_hash })`. The RLS policy "Users can cancel own awaiting orders" only allows updating `status` to `cancelled`, but the general update path may still allow writing other columns depending on how Postgres evaluates the policies. This needs verification — and ideally a dedicated edge function for tx hash submission.

**4. No server-side input validation on KYC, payment methods, or payout addresses**
All form submissions (KYC, payment methods, payout addresses) go directly to the database via the client SDK with no server-side validation. There are no length limits, format checks, or sanitization beyond basic `.trim()` in a few places. Malicious input could store excessively long strings or invalid data.

**5. Password policy is weak**
Only 6 characters minimum, no complexity requirements (uppercase, number, special char). For a financial platform, this is insufficient.

---

### Security Issues (Medium Priority)

**6. `phone_verified: true` is set in user metadata at signup**
In `Signup.tsx`, the signup call passes `phone_verified: true` in `options.data`, and the `handle_new_user` trigger reads it. A user could bypass phone verification by crafting a direct API call to signup with `phone_verified: true`. The phone verification status should only be set server-side.

**7. No rate limiting on login attempts (client-side)**
While there's a `RateLimitIndicator` component, there's no actual server-side rate limiting on failed login attempts. Supabase has some built-in protection, but custom brute-force protection is absent.

**8. File upload has no size/type validation**
Payment proof uploads accept any file matching `image/*,.pdf` with no size limit. Large files could abuse storage.

---

### Code Quality & Reliability Improvements

**9. Excessive `as any` casts (175 matches)**
Many database operations use `as any` to bypass TypeScript type checking, which hides potential bugs and makes refactoring dangerous.

**10. No error handling on `track-login` invocation**
In `Login.tsx`, `supabase.functions.invoke("track-login", ...)` is fire-and-forget with no `.catch()`. If it fails, it silently swallows the error.

**11. Stale sell pricing — same markup for buy and sell**
In `calculate-price`, stablecoin pricing uses the same `fixed_markup_npr` for both buy and sell sides (lines 109-114). This means the platform doesn't differentiate spread direction, which is unusual for a broker.

**12. `calculate-price` forex fallback is hardcoded**
If the NRB API fails, forex rate falls back to a hardcoded `147.64`. This could cause significant pricing errors if the real rate diverges.

---

### Recommended Implementation Plan

I'd prioritize these fixes in this order:

1. **Fix `lock-rate` to re-calculate pricing server-side** — This is the most critical vulnerability. A user can manipulate rates.
2. **Add auth to `calculate-price`** — Prevent unauthenticated probing.
3. **Fix `phone_verified` bypass** — Move verification check to a server-side function.
4. **Add file size limits** — Cap uploads at 5MB.
5. **Strengthen password policy** — Require 8+ chars with complexity.
6. **Add input validation** — Server-side length/format checks on KYC and payment method forms.

Shall I proceed with implementing these fixes?

