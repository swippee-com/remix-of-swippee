

# Fix Payout Address Requirement Logic

## The Issue — You're Right, It's Backwards

The current logic is wrong. Here's what makes sense for your business:

- **User BUYS crypto** → They pay you NPR, you send them crypto. You need their **crypto wallet address** (payout address) to send the crypto to. **Should require payout address.**
- **User SELLS crypto** → They send you crypto, you pay them NPR. You need their **bank/payment method** to send NPR to. **Should NOT require payout address** (they already need a payment method, which covers this).

Currently the code does the opposite — requires payout address only for "sell" and skips it for "buy".

## Fix

**File: `src/hooks/use-trade-readiness.ts`**

Swap the condition — show the payout address step for `side === "buy"` instead of `side === "sell"`:

```typescript
...(side === "buy"
  ? [{
      key: "payout",
      label: "Add a payout address",
      passed: hasPayoutAddress,
      href: "/dashboard/payout-addresses",
      cta: "Add Payout Address",
    }]
  : []),
```

Also update the query's `enabled` flag to match:
```typescript
enabled: !!user && side === "buy",
```

One file change, two lines swapped.

