

## Plan: i18n — Nepali + English Toggle (Dashboard Only)

### Approach

Use React Context + a simple translation dictionary pattern. No external i18n library needed — the scope is limited to the dashboard and the translation set is manageable.

### Files to create

| File | Purpose |
|------|---------|
| `src/contexts/LanguageContext.tsx` | Context provider with `locale` (en/ne), `setLocale`, and `t()` function. Persists choice in `localStorage`. |
| `src/i18n/en.ts` | English strings dictionary |
| `src/i18n/ne.ts` | Nepali strings dictionary |
| `src/i18n/index.ts` | Exports both dictionaries, type for translation keys |

### Files to modify

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap dashboard routes with `<LanguageProvider>` |
| `src/components/layout/DashboardLayout.tsx` | Add language toggle button (EN/ने) in header next to theme toggle. Translate sidebar nav labels and "Sign Out" |
| `src/config/navigation.ts` | Change `label` values to translation keys (e.g. `"nav.overview"`) |
| `src/pages/dashboard/DashboardOverview.tsx` | Use `t()` for headings, stat labels, empty states |
| `src/pages/dashboard/SettingsPage.tsx` | Use `t()` for section headers, form labels. Add "Language" section with EN/NE selector |
| `src/components/shared/PageHeader.tsx` | Accept translated strings (no change needed, already receives props) |
| Other dashboard pages | Use `t()` for page headers and key UI text |

### Translation dictionary structure

```typescript
// src/i18n/en.ts
export const en = {
  "nav.overview": "Overview",
  "nav.wallet": "Wallet",
  "nav.portfolio": "Portfolio",
  "nav.kyc": "KYC",
  "nav.quotes": "Quote Requests",
  "nav.trades": "Trades",
  "nav.paymentMethods": "Payment Methods",
  "nav.payoutAddresses": "Payout Addresses",
  "nav.support": "Support",
  "nav.settings": "Settings",
  "nav.signOut": "Sign Out",
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome back! Here's your account overview.",
  "dashboard.newQuote": "New Quote",
  "dashboard.walletBalance": "Wallet Balance",
  "dashboard.kycStatus": "KYC Status",
  "dashboard.activeTrades": "Active Trades",
  "dashboard.completedTrades": "Completed Trades",
  "dashboard.paymentMethods": "Payment Methods",
  "dashboard.recentActivity": "Recent Activity",
  "dashboard.noActivity": "No recent activity yet.",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.appearance": "Appearance",
  "settings.profile": "Profile",
  "settings.security": "Security",
  // ... more keys
} as const;
```

Nepali file mirrors the same keys with Nepali translations.

### Context implementation

```typescript
const t = (key: string): string => {
  return translations[locale][key] ?? key;
};
```

### Language toggle

A compact button in the DashboardLayout header: shows "EN" or "ने" — clicking toggles. Also a proper selector in Settings > Language section.

### Scope

Dashboard pages only — public pages and admin pages remain English-only for now. Navigation labels, page headers, form labels, stat card titles, empty states, and button text will be translated. Dynamic data (asset names, user content) stays as-is.

