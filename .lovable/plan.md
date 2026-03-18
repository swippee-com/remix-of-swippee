

# Phase 3: Dashboard Redesign — Orders Flow

## What we're building

1. **Updated Dashboard Overview** — Add quick trade buttons (Buy USDT, Sell USDT), update onboarding wizard to include "Place first order" step, replace recent activity to show orders instead of quotes/trades
2. **New `/dashboard/orders` page** — Tabbed order list with filters
3. **New `/dashboard/orders/:id` page** — Order detail with pricing snapshot, payment instructions, proof upload, package-tracking timeline, support button
4. **Navigation + routing updates** — Add "Orders" nav item (prioritized above legacy Quotes/Trades), add routes

## Files to create

### `src/pages/dashboard/OrdersPage.tsx`
- Fetches from `orders` table joined with `rate_locks` for locked rate info
- Tab filters: All, Awaiting Payment, Under Review, Completed, Cancelled, Manual Review
- Each row: asset, side (buy/sell badge), locked rate, amount (NPR), payment method, status badge, created time
- Links to `/dashboard/orders/:id`
- Empty state with CTA to `/trade`

### `src/pages/dashboard/OrderDetailPage.tsx`
- Fetches single order + its `order_status_history` + `payment_proofs` (reuse existing proof upload pattern from TradeDetailPage)
- **Order summary card**: side, asset, network, locked rate, fees, total pay/receive, order type, payment method
- **Rate snapshot card**: crypto USD price, USD/NPR rate, base NPR price, final rate, spread/fees — from the linked `rate_locks` row
- **Payment instructions section**: contextual based on side (buy = show payment details, sell = show crypto deposit instructions)
- **Payment proof upload**: reuse same pattern from TradeDetailPage (file upload + ref number + notes)
- **Timeline**: package-tracking style using existing `Timeline` component, built from `order_status_history`
- **Support button**: link to `/dashboard/support` with order context

## Files to update

### `src/pages/dashboard/DashboardOverview.tsx`
- Add quick trade buttons row: "Buy USDT", "Sell USDT", "Buy BTC", "Sell BTC" linking to `/trade?asset=X&side=Y`
- Change primary CTA from "New Quote" to "Buy / Sell Crypto" linking to `/trade`
- Replace `recentActivity` query to fetch from `orders` table instead of quotes+trades
- Add order count query for onboarding wizard
- Keep realtime invalidation on `orders` table

### `src/components/dashboard/OnboardingWizard.tsx`
- Change last step from "Request your first quote" to "Place your first order"
- Update description/CTA to link to `/trade` instead of `/dashboard/quotes/new`
- Accept `orderCount` prop instead of `quoteCount`

### `src/config/navigation.ts`
- Add `{ labelKey: "nav.orders", href: "/dashboard/orders", icon: ShoppingCart }` after Portfolio, before KYC
- Keep legacy Quotes and Trades nav items (they still work)

### `src/App.tsx`
- Add routes: `/dashboard/orders` and `/dashboard/orders/:id`
- Import new page components

### `src/i18n/en.ts` + `src/i18n/ne.ts`
- Add translation keys: `nav.orders`, order-related labels for the new pages

### `src/components/shared/StatusBadge.tsx`
- Add order_status styles: `rate_locked`, `awaiting_payment`, `manual_review`, `approved_for_settlement`, `settlement_in_progress` (map to appropriate colors)

### `src/components/layout/DashboardLayout.tsx`
- Add `/dashboard/orders` to `ALLOWED_FROZEN_PATHS` (view-only for frozen users)

## Technical notes

- Orders table already exists with RLS policies from Phase 1
- `order_status_history` table exists with user-visible SELECT via orders join
- Reuse `payment_proofs` table/bucket — need to support `order_id` reference (currently `trade_id`). Will need a migration to add nullable `order_id` column to `payment_proofs` table
- The `rate_locks` table stores the full pricing snapshot; join on `orders.rate_lock_id`
- StatusBadge already handles unknown statuses gracefully (falls back to muted style)

## Database migration needed

Add `order_id` column to `payment_proofs` table so proofs can be linked to orders (not just legacy trades):

```sql
ALTER TABLE payment_proofs ADD COLUMN order_id uuid REFERENCES orders(id);
-- Update RLS to allow proof upload for orders too
```

## Estimated scope
- 2 new page files
- 6-7 updated files  
- 1 small migration

