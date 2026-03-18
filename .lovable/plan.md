

# Fix: "Confirm Buy" doesn't place an order

## Problem
When the user clicks "Confirm Buy USDT" (state `locked`), `TradeWidget.tsx` line 76 simply navigates to `/dashboard/orders?lock=${rateLock.id}` without ever calling the `place-order` edge function. The OrdersPage ignores the `lock` query param, so no order is created.

## Solution
Change the confirm action in TradeWidget to call the `place-order` edge function, then navigate to the newly created order's detail page on success.

## Changes

### 1. `src/components/trade/TradeWidget.tsx` — call place-order on confirm

Replace the `handleCTA` logic for the `locked` state:

```typescript
} else if (state === "locked" && rateLock) {
  // Call place-order edge function
  const { data, error: fnError } = await supabase.functions.invoke("place-order", {
    body: { rate_lock_id: rateLock.id },
  });
  if (fnError || !data?.success) {
    toast({ title: "Order failed", description: data?.error || fnError?.message || "Failed to place order", variant: "destructive" });
    return;
  }
  toast({ title: "Order placed!", description: `Your ${side} order for ${asset} has been created.` });
  navigate(`/dashboard/orders/${data.order.id}`);
}
```

This requires:
- Adding `import { supabase }` (already available via the hook, but needs direct import)
- Adding `import { toast }` from the toast hook
- Adding a brief loading state during order placement (reuse `locking` or add a new state)

### 2. Add order-placing state to prevent double-clicks

Add a local `placing` state in TradeWidget to disable the button while the order is being submitted, and show a spinner.

## Scope
- 1 file edit: `src/components/trade/TradeWidget.tsx`
- No database or edge function changes needed — `place-order` already exists and works correctly

