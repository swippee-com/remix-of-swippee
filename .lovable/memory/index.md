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
- Navigation config: src/config/navigation.ts (uses labelKey for i18n)
- Types: src/types/index.ts
- Shared components: src/components/shared/ (StatusBadge, StatCard, PageHeader, EmptyState, Timeline)
- Layouts: PublicLayout, DashboardLayout, AdminLayout

## i18n
- Lightweight React Context pattern (no external library)
- LanguageContext: src/contexts/LanguageContext.tsx
- Dictionaries: src/i18n/en.ts, src/i18n/ne.ts
- Bikram Sambat converter: src/lib/bikram-sambat.ts
- Locale-aware date hook: src/hooks/use-formatted-date.ts
- Dashboard pages use useFormattedDate() for all dates — shows BS calendar when locale=ne
- CSV/PDF exports remain in English (date-fns format)
