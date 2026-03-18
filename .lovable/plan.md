

# Phase 4: Admin — Pricing Config, Order Management & Inventory

## Overview
Add three new admin pages (Pricing, Orders, Inventory) and update admin navigation. These give operators full control over the broker pricing engine, order lifecycle, and crypto inventory.

## Files to create

### 1. `src/pages/admin/AdminPricingPage.tsx`
- Fetch all rows from `pricing_configs` table
- Editable table/card layout grouped by asset type:
  - **Stablecoins (USDT/USDC)**: fixed_markup_npr fields for buy/sell
  - **Volatile (BTC/ETH)**: percent_spread fields for buy/sell
- Network fee section: editable `network_fee_npr` per config row
- Payment method adjustments: editable JSON `payment_adjustments` per config
- Global settings section (from `app_settings`): rate lock duration, max auto order size, manual review threshold
- **Live preview calculator**: inline mini-form (select asset/side/amount) that calls `calculate-price` edge function and displays result
- All edits use mutations to update `pricing_configs` or `app_settings` tables
- Toggle `is_active` per config row

### 2. `src/pages/admin/AdminOrdersPage.tsx`
- Fetch from `orders` table joined with profiles for user info
- Tabs: All, New (draft/rate_locked), Awaiting Payment, Proof Uploaded, Manual Review, Settlement Pending, Completed, Cancelled
- Table columns: user, side badge, asset, locked rate, amount NPR, payment method, status badge, created time, actions
- Quick action buttons per row:
  - "Verify Proof" → link to detail page
  - "Approve" → update status to `approved_for_settlement`
  - "Mark Settled" → update status to `completed`
  - "Cancel" → update status to `cancelled`
- Status updates insert into `order_status_history` and update `orders.status`
- Search by user name, filter by status
- Realtime invalidation on `orders` table

### 3. `src/pages/admin/AdminOrderDetailPage.tsx`
- Fetch single order + rate_lock + payment_proofs + order_status_history + user profile + KYC summary
- **User card**: name, email, KYC status badge, link to user detail
- **Order summary card**: side, asset, network, order type, payment method, amounts
- **Pricing snapshot card**: from linked `rate_locks` row — crypto USD price, USD/NPR rate, base price, spread, fees, final rate
- **Payment proof section**: display uploaded proofs with ProofImage component, approve/reject buttons
- **Payout details**: payout address info for buy orders (crypto destination)
- **Internal notes**: AdminNotes component (reuse existing pattern from AdminTradeDetailPage)
- **Timeline**: from `order_status_history`, using Timeline component
- **Action buttons**: status transition dropdown + note field (same pattern as AdminTradeDetailPage)
- Order status flow: `draft` → `rate_locked` → `awaiting_payment` → `payment_proof_uploaded` → `under_review` → `approved_for_settlement` → `settlement_in_progress` → `completed` (plus `manual_review`, `cancelled`)

### 4. `src/pages/admin/AdminInventoryPage.tsx`
- Fetch from `inventory_balances` table
- Card grid: one card per asset/network combination
- Each card shows: available amount, reserved amount, total, low threshold
- Color-coded warnings when `available_amount < low_threshold`
- Toggle `is_enabled` per route
- Edit form for `available_amount`, `reserved_amount`, `low_threshold`
- Add new inventory row form

## Files to update

### 5. `src/config/navigation.ts`
- Add to `adminNavItems`:
  - `{ label: "Pricing", href: "/admin/pricing", icon: DollarSign }` after Analytics
  - `{ label: "Orders", href: "/admin/orders", icon: ShoppingCart }` after KYC Queue
  - `{ label: "Inventory", href: "/admin/inventory", icon: Package }` after Wallets

### 6. `src/App.tsx`
- Add routes: `/admin/pricing`, `/admin/orders`, `/admin/orders/:id`, `/admin/inventory`
- Import new page components

### 7. `src/components/shared/StatusBadge.tsx`
- Ensure all order_status values have color mappings (some were added in Phase 3, verify completeness for: `draft`, `payment_proof_uploaded`, `under_review`, `approved_for_settlement`, `settlement_in_progress`)

## Technical notes
- `pricing_configs` table already exists with RLS for admin ALL access
- `inventory_balances` table already exists with admin-only RLS
- `orders` table has admin ALL policy
- `order_status_history` has admin ALL policy
- Reuse `AdminNotes` component for internal notes on orders
- Reuse `ProofImage` component for payment proof display
- Reuse `Timeline` component for order history
- Admin status updates should also insert `audit_logs` entries
- All mutations use TanStack Query with optimistic invalidation

## Scope
- 4 new page files
- 3 updated files (navigation, App.tsx, StatusBadge)

