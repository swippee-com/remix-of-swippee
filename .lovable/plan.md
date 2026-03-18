

# Streamlined Order Lifecycle & Settlement Tracking

## Problem
1. Admin has to manually pick from all 12 statuses via a dropdown — tedious and error-prone
2. No auto-transitions: when user uploads payment proof, status stays unchanged; admin must manually advance each step
3. No way to record crypto settlement proof (tx hash) for either buy orders (admin sends crypto) or sell orders (user sends crypto)

## Solution

### 1. Auto-transition: payment proof upload → `payment_proof_uploaded`
When a user uploads a payment proof (in `OrderDetailPage.tsx` upload mutation), after successful insert, also update the order status to `payment_proof_uploaded` if current status is `awaiting_payment`. Add a corresponding status history entry.

### 2. Simplified admin action buttons instead of dropdown
Replace the generic status dropdown on `AdminOrderDetailPage.tsx` with contextual action buttons based on current status:

| Current Status | Action Button(s) |
|---|---|
| `payment_proof_uploaded` | **Accept Payment** → moves to `approved_for_settlement` |
| `manual_review` | **Approve** → `approved_for_settlement`, **Reject** → `rejected` |
| `approved_for_settlement` | **Begin Settlement** → `settlement_in_progress` (with tx hash input for buy orders) |
| `settlement_in_progress` | **Mark Completed** → `completed` |
| Any non-terminal | **Cancel** → `cancelled` |

Keep the full dropdown as a collapsible "Advanced" override for edge cases.

### 3. Add settlement fields to `orders` table
New migration to add columns:
- `settlement_tx_hash` (text, nullable) — blockchain transaction hash
- `settlement_notes` (text, nullable) — admin notes about settlement

### 4. Settlement proof UI

**For Buy orders** (admin sends crypto to user):
- When admin clicks "Begin Settlement" or "Mark Completed", show a form to paste the tx hash
- Display the tx hash on both admin and user order detail pages

**For Sell orders** (user sends crypto to platform):
- User gets a field to paste their tx hash when status is `awaiting_payment`
- Admin sees it on the order detail page

### 5. Auto-transition on proof approval
When admin approves a payment proof (`reviewProofMutation`), also auto-advance the order status to `approved_for_settlement`.

## Files to change

1. **Migration**: Add `settlement_tx_hash` and `settlement_notes` columns to `orders`
2. **`src/pages/admin/AdminOrderDetailPage.tsx`**: Replace dropdown with contextual action buttons + tx hash input
3. **`src/pages/dashboard/OrderDetailPage.tsx`**: Auto-update status on proof upload; add tx hash display; add user tx hash input for sell orders
4. **`src/pages/admin/AdminOrdersPage.tsx`**: Simplify inline action buttons to match new flow

