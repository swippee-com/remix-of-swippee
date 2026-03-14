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
- Supabase client: src/integrations/supabase/client.ts
- Supabase types: src/integrations/supabase/types.ts

## Backend (Lovable Cloud / Supabase)
- Enabled and connected
- 16 tables: profiles, user_roles, kyc_submissions, kyc_documents, payment_methods, payout_addresses, quote_requests, quotes, otc_trades, trade_status_history, payment_proofs, ledger_entries, audit_logs, notifications, support_tickets, support_messages, admin_notes, app_settings
- Roles: user, admin, compliance (stored in user_roles table, NOT profiles)
- has_role() security definer function for RLS
- Auto-create profile + user role on signup via triggers
- 4 storage buckets: kyc-documents, payment-proofs, support-attachments, avatars
- All tables have RLS enabled with proper policies
- Linter: zero issues

## Next Steps
- Wire up real auth flow (login, signup, password reset)
- Connect pages to real data via Supabase queries
- Build quote/trade detail pages
