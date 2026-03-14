Swippee OTC Crypto Desk - design system, brand config, architecture decisions

## Brand
- Name: "Swippee" (configurable via src/config/brand.ts)
- Product: OTC crypto brokerage desk, manual settlement
- Supported assets: USDT, BTC, ETH, USDC
- Default fiat: NPR

## Design System
- Font: Inter (Google Fonts)
- Aesthetic: "Private Banking" - high whitespace, subtle borders, slate palette
- Primary: zinc-900 (240 6% 10%)
- No crypto gradients, no neon
- Custom shadows: premium, subtle, card
- Status colors: success (green), warning (amber), destructive (red)
- Button variants: hero, hero-outline, success added

## Architecture
- Brand config: src/config/brand.ts (single source for brand changes)
- Navigation config: src/config/navigation.ts
- Types: src/types/index.ts
- Shared components: src/components/shared/ (StatusBadge, StatCard, PageHeader, EmptyState, Timeline)
- Layouts: PublicLayout, DashboardLayout, AdminLayout
- Timeline component uses `steps` prop with `completed`, `active`, `timestamp` fields

## Implemented (live Supabase data)
- Auth (login, signup, forgot/reset password, role-based routing)
- Quote requests list + detail + accept/decline (user + admin)
- Admin quote creation modal with pricing calculator
- New Quote Request form with payment method/payout address selection
- KYC submission with file uploads to kyc-documents bucket
- Admin KYC queue with approve/reject/request-info + audit logs
- Payment Methods CRUD (add/edit/delete/set-default)
- Payout Addresses CRUD (add/edit/delete)
- Dashboard Overview with real stats + recent activity
- Trades list (user + admin) from otc_trades
- Trade detail pages (user: payment proof upload; admin: status management + proof review)

- Admin Users page with role management (add/remove roles + audit logs)
- Admin Overview with real stats (pending KYC, open quotes, active/disputed trades, daily volume, monthly fees)
- Admin Ledger from ledger_entries with bucket/search filters
- Admin Audit Logs from audit_logs with action filters + actor names

## Remaining for MVP
- Phase 3: Support tickets, Settings profile/password, Notifications
