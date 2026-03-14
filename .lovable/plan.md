

# Implementation Plan: Internal Wallet + Dark Mode + Trade Export

Three features to implement, ordered by complexity.

---

## 1. Dark Mode Toggle

**Effort: Small** — CSS variables for `.dark` already exist in `index.css`.

### Changes:
- **`src/hooks/use-theme.ts`** (new) — Custom hook that reads/writes theme preference to `localStorage`, applies/removes `dark` class on `<html>` element, respects system preference as default.
- **`src/pages/dashboard/SettingsPage.tsx`** — Add "Appearance" section with light/dark/system toggle using existing Switch or ToggleGroup component.
- **`src/components/layout/DashboardLayout.tsx`** — Optionally add a quick theme toggle icon in the header/navbar.
- **`src/main.tsx`** — Initialize theme on app load (read localStorage, apply class before render to prevent flash).

---

## 2. Trade History Export (CSV/PDF)

**Effort: Small-Medium** — Pure client-side, no backend changes.

### Changes:
- **`src/pages/dashboard/TradesPage.tsx`** — Add "Export" dropdown button with CSV and PDF options.
- **CSV export**: Convert trades array to CSV string, trigger browser download. No library needed.
- **PDF export**: Use `jspdf` + `jspdf-autotable` (npm packages) to generate a styled PDF with trade table, header with Swippee branding, date range.
- Add optional date range filter (from/to) to scope the export.

---

## 3. Internal Fiat Wallet

**Effort: Medium** — Requires new database tables, RLS policies, and UI pages.

### Database (migration):
- **`wallets` table**: `id`, `user_id` (unique), `balance_npr` (numeric, default 0), `created_at`, `updated_at`
- **`wallet_transactions` table**: `id`, `wallet_id`, `user_id`, `type` (enum: `deposit`, `withdrawal`, `trade_debit`, `trade_credit`, `adjustment`), `amount`, `balance_after`, `reference_type`, `reference_id`, `description`, `status` (enum: `pending`, `completed`, `rejected`), `created_at`
- RLS: Users can SELECT own wallet/transactions, INSERT deposit/withdrawal requests. Admins can SELECT all, UPDATE status.
- Trigger: Auto-create wallet row when a new user signs up (extend `handle_new_user` function).

### New Files:
- **`src/pages/dashboard/WalletPage.tsx`** — Main wallet page showing:
  - Current NPR balance (large card)
  - Deposit button (opens modal with admin bank details + reference number generation)
  - Withdraw button (opens modal to select payment method + amount)
  - Transaction history table with filters
- **`src/components/dashboard/DepositModal.tsx`** — Shows admin's bank details, generates unique reference, user confirms deposit initiated
- **`src/components/dashboard/WithdrawModal.tsx`** — Amount input, payment method selector, submit withdrawal request

### Existing File Changes:
- **`src/config/navigation.ts`** — Add Wallet nav item (`/dashboard/wallet`, Wallet icon) after Overview
- **`src/App.tsx`** — Add route for `/dashboard/wallet`
- **`src/pages/dashboard/DashboardOverview.tsx`** — Add wallet balance stat card

### Admin Side:
- **`src/pages/admin/AdminWalletPage.tsx`** — View pending deposits/withdrawals, approve/reject with notes
- Add to admin nav + routes

### How it works (flow):
1. User requests deposit → gets reference number + admin bank details
2. User transfers NPR to Swippee's bank with reference number
3. Admin sees pending deposit, verifies payment, approves → balance credited
4. User can trade from balance or request withdrawal
5. Withdrawal: user requests → admin processes → sends NPR to user's payment method

---

## 4. Crypto Wallet Connection (RainbowKit + wagmi)

**Effort: Small** — Free, open-source. Used only for address verification, not custody.

### NPM packages:
- `@rainbow-me/rainbowkit`, `wagmi`, `viem`, `@tanstack/react-query` (already have)

### Changes:
- **`src/config/wagmi.ts`** (new) — Configure wagmi with public RPC providers (no API key needed), supported chains (Ethereum, BSC, Polygon, Tron via custom chain)
- **`src/pages/dashboard/PayoutAddressesPage.tsx`** — Add "Verify with Wallet" button next to payout addresses. When clicked, user connects wallet via RainbowKit modal; if connected address matches the payout address, mark it as verified.
- **`src/App.tsx`** — Wrap with `WagmiProvider` and `RainbowKitProvider`
- **Database**: Add `is_verified` boolean column to `payout_addresses` table

This is optional and can be done as a follow-up since it's independent of the wallet balance feature.

---

## Implementation Order
1. Dark mode (quick win, no DB changes)
2. Trade export (quick win, no DB changes)
3. Internal fiat wallet (DB + UI)
4. Crypto wallet connection (optional follow-up)

