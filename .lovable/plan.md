

# Phase 2: TradeWidget + Trade Page + Landing Redesign

## Overview
Build the core TradeWidget component and integrate it into a redesigned landing page hero and a new `/trade` page. This is the main conversion surface for the instant-price broker model.

## Components to create

### 1. `src/hooks/use-trade-pricing.ts` — Custom hook for pricing engine
- Calls `calculate-price` edge function with debounced inputs (asset, network, side, amount, amount_type, payment_method)
- Returns: pricing data, loading state, error state
- Auto-refreshes every 30s while active
- Exposes `lockRate()` function that calls `lock-rate` edge function
- Manages countdown timer state (45s default)
- States: `idle`, `calculating`, `priced`, `locking`, `locked`, `expired`, `error`

### 2. `src/components/trade/TradeWidget.tsx` — Main broker widget
Structure:
- **Buy/Sell segmented toggle** at top (styled tabs, not shadcn Tabs)
- **Asset selector** — dropdown with USDT, BTC, ETH, USDC
- **Network selector** — dropdown filtered by asset (TRC20, ERC20, BEP20, Polygon)
- **"You pay" input** — numeric input with NPR label
- **"You receive" output** — calculated display with crypto label
- **Swap toggle** — flip between entering NPR amount vs crypto amount
- **Payment method selector** — dropdown (Bank Transfer, eSewa, Khalti)
- **Live rate card** — shows Swippee rate, market rate, fee breakdown
- **Countdown timer** — "Rate valid for 45s" with animated progress bar
- **Fee breakdown** — collapsible accordion showing spread, network fee, payment adjustment
- **CTA button** — "Buy USDT" / "Sell BTC" etc., changes based on state
- **States**: empty, calculating (skeleton), priced, rate expired (refresh CTA), error, locked (confirmation step)

Props: `variant?: 'compact' | 'full'` — compact for homepage hero, full for /trade page

### 3. `src/components/trade/RateLockTimer.tsx` — Countdown component
- Circular or linear progress indicator
- Seconds remaining display
- "Rate expired — Refresh" state
- Uses `useEffect` interval for countdown

### 4. `src/components/trade/PricingExplainer.tsx` — Trust component
- "How Swippee pricing works" expandable section
- Simple language: market price → forex → spread → final rate
- Used on /trade page sidebar

### 5. `src/components/trade/ReadinessGate.tsx` — Pre-trade checks
- When user clicks CTA, checks: logged in → phone verified → KYC → payment method → payout address
- Shows a modal/drawer with progressive steps and links to complete each
- Does NOT block the widget from showing prices — only blocks order placement

## Pages to create/update

### 6. `src/pages/Trade.tsx` — New `/trade` page
- Two-column layout on desktop (widget left, market info right)
- Single column on mobile with sticky bottom CTA
- Right panel: market summary cards (Swippee buy/sell rates for each asset), PricingExplainer, supported payment methods
- Wrapped in PublicLayout

### 7. Updated `src/pages/Landing.tsx`
- Hero section rebuilt: headline "Buy & Sell Crypto in Nepal", subheadline about live rates
- **TradeWidget (compact variant)** embedded in hero right side (desktop) or below headline (mobile)
- Trust chips row: "Local NPR Payments", "KYC-Secured", "Instant Pricing"
- Update features array copy from "quote-based" to instant pricing language
- Update steps to: Select asset → See live rate → Pay & receive
- Keep existing sections (supported assets, CTA footer)

### 8. Updated `src/pages/LivePrices.tsx`
- Add Swippee buy/sell rate columns to each asset card
- Add "Buy Now" / "Sell Now" CTA buttons per supported asset (link to `/trade?asset=X&side=buy`)

## Routing & Navigation

### 9. Update `src/App.tsx`
- Add route: `/trade` → Trade page

### 10. Update `src/config/navigation.ts`
- Add "Trade" to `publicNavItems` (between "Home" and "About")

### 11. Update `src/config/brand.ts`
- Update `description` from quote-based language to instant pricing language

## Technical details

- The TradeWidget calls `calculate-price` edge function (already built) for live pricing
- Rate locking calls `lock-rate` edge function (already built) — requires auth
- Unauthenticated users can see prices but must sign in to lock rate / place order
- All pricing is server-side; frontend only displays
- TanStack Query for data fetching with appropriate stale/refetch intervals
- Framer Motion for widget transitions and countdown animations
- Mobile-first responsive design with Tailwind

## File count: ~8 new files, ~4 updated files

