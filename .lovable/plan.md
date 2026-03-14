

# Live Market Prices — Rate Ticker & Public /live Page

## Overview
Add a real-time crypto price ticker using the CoinGecko free API (no key required), displayed in two places:
1. A **ticker strip** on the user dashboard (above stat cards)
2. A new **public /live page** with detailed price cards, 24h change, and a scrolling ticker

## Data Source
CoinGecko free API — `/api/v3/simple/price` endpoint. No API key needed for basic usage. Fetches BTC, ETH, USDT, USDC prices in USD. Polling every 60 seconds via `useQuery` with `refetchInterval`.

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/use-market-prices.ts` | Shared hook — fetches prices from CoinGecko, returns `{ prices, isLoading }` with 60s auto-refresh |
| `src/components/shared/PriceTicker.tsx` | Compact horizontal ticker strip showing asset prices + 24h % change with color coding |
| `src/pages/LivePrices.tsx` | Public page with full price cards (price, 24h change, market cap) wrapped in `PublicLayout` |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/dashboard/DashboardOverview.tsx` | Add `<PriceTicker />` above stat cards |
| `src/config/navigation.ts` | Add `{ label: "Live Prices", href: "/live" }` to `publicNavItems` |
| `src/App.tsx` | Add `/live` route pointing to `LivePrices` |

## Hook Design (`use-market-prices.ts`)
- Calls `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
- Returns normalized array: `{ asset, symbol, price, change24h, marketCap }`
- `refetchInterval: 60000`, `staleTime: 30000`

## PriceTicker Component
- Horizontal scrollable row of pills/badges showing: `BTC $XX,XXX ▲1.2%`
- Green for positive change, red for negative
- Skeleton loaders while fetching
- Reusable on both dashboard and public page

## LivePrices Page
- `PublicLayout` wrapper
- `PageHeader` with title "Live Market Prices" and subtitle
- Grid of 4 cards (one per asset) showing: current price, 24h change %, market cap
- `PriceTicker` strip at top
- "Last updated" timestamp
- CTA button: "Start Trading" → `/auth/signup`

## Technical Notes
- CoinGecko free tier allows ~30 calls/min — 60s polling is safe
- All prices fetched client-side, no edge function needed
- USDT/USDC will show ~$1.00 which is expected and useful for users to confirm peg stability

