

# Fix: Enforce Min/Max Order Limits

## The Bug

The `calculate-price` edge function returns `min_order_npr` and `max_auto_order_npr` from the pricing config, but **nobody checks them**:
- Frontend doesn't validate the amount against these limits
- `lock-rate` doesn't reject amounts below minimum
- `place-order` doesn't reject amounts below minimum

So a user can place a 100 NPR order even when min is 1000 NPR.

## Fix — 3 layers of defense

### 1. Frontend validation (`TradeWidget.tsx`)
- When `pricing` data arrives (which includes `min_order_npr`), check if `total_pay_npr < min_order_npr`
- Show inline error message: "Minimum order is रू 1,000"
- Disable the CTA button when below min
- Also show a warning when amount exceeds `max_auto_order_npr` (not blocking, but informational since it triggers manual review)

### 2. `lock-rate` edge function — reject below minimum
- After receiving the pricing data, look up the pricing config and check `min_order_npr`
- Return 400 error if `total_pay_npr < min_order_npr`
- This prevents rate locks from being created for invalid amounts

### 3. `place-order` edge function — final guard
- After validating the rate lock, check `total_pay` against the pricing config's `min_order_npr`
- Return 400 if below minimum
- Defense in depth — catches any edge cases

## File Changes

| File | Change |
|------|--------|
| `src/components/trade/TradeWidget.tsx` | Add min/max validation display + disable CTA when below min |
| `supabase/functions/lock-rate/index.ts` | Add min_order_npr check before creating lock |
| `supabase/functions/place-order/index.ts` | Add min_order_npr check before creating order |

