

# Redesign Admin Pricing Page + Buy/Sell Enable/Disable

## Problems
1. Current pricing page has too many separate cards with individual Save buttons — tedious to manage
2. No way to enable/disable buy or sell for a specific asset — `is_active` exists per-config row but doesn't clearly map to "disable buying USDT"
3. The `is_active` flag is already checked by the `calculate-price` edge function (line 79), but the frontend TradeWidget doesn't check it — users can still see disabled assets
4. Live Calculator sends wrong params (`amount_npr` instead of `amount` + `amount_type`), causing NaN results

## Solution

### 1. Redesign Admin Pricing Page — grouped by asset
Replace the current tab-heavy layout with a single-page view grouped by asset. Each asset gets one card showing:
- Buy/Sell enable toggles (maps to `is_active` on the side-specific config rows)
- Markup/spread value inline
- Network fee, min/max order — all in one form
- Single Save per asset-side combo
- Collapse network fees and payment adjustments into expandable sections

### 2. Frontend: TradeWidget respects disabled configs
- Fetch active pricing configs in TradeWidget (or via a hook)
- When an asset+side combo has no active config, disable that side's tab or show "Currently unavailable"
- Grey out the Buy or Sell button with a message like "USDT buying is currently paused"

### 3. Fix Live Calculator
- Send `amount` and `amount_type: "npr"` instead of `amount_npr`
- Display `pricing.final_rate_npr` etc. from the nested `pricing` object (edge function returns `{ success, pricing: {...} }`)

## File Changes

### `src/pages/admin/AdminPricingPage.tsx` — Full rewrite
- Group configs by asset (USDT, USDC, BTC, ETH)
- Each asset section: a table/grid showing all side+network combos
- Buy Enable / Sell Enable toggles per row
- Inline editable fields for markup/spread, network fee, min/max
- Single save button per row
- Keep Global Settings and Live Calculator as separate sections below
- Fix calculator to send correct params and read `data.pricing`

### `src/components/trade/TradeWidget.tsx` — Check availability
- Query `pricing_configs` for the selected asset+side to check `is_active`
- If no active config exists, show a banner "Buying/Selling [ASSET] is currently unavailable" and disable the CTA
- Also filter the asset dropdown or add a "paused" badge

### `src/hooks/use-trade-availability.ts` — New hook
- Fetches all active pricing config summaries (asset, side, is_active)
- Returns `isAvailable(asset, side): boolean`
- Used by TradeWidget and optionally by LivePrices page to hide Buy/Sell buttons for disabled pairs

