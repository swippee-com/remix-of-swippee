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
- Dark mode: fully supported via `.dark` class, toggle in Settings + header

## Architecture
- Brand config: src/config/brand.ts (single source for brand changes)
- Navigation config: src/config/navigation.ts
- Types: src/types/index.ts
- Shared components: src/components/shared/ (StatusBadge, StatCard, PageHeader, EmptyState, Timeline)
- Layouts: PublicLayout, DashboardLayout, AdminLayout
- Theme: src/hooks/use-theme.ts (light/dark/system, localStorage)
- Internal wallet: wallets + wallet_transactions tables, user deposit/withdraw flow, admin approval
- Trade export: CSV/PDF from TradesPage with date filters
