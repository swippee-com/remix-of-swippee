

# Fee Calculator on /fees Page

## What We're Building
Add an interactive fee calculator to the existing `/fees` page. Users select an asset, enter a trade amount, pick a direction (Buy/Sell), and instantly see the estimated fee breakdown — all using live market prices and the NRB exchange rate. No signup required.

## Calculator Behavior

**Inputs:**
- Asset selector: USDT, BTC, ETH, USDC (from `BRAND.supportedAssets`)
- Direction toggle: Buy / Sell
- Amount input: in NPR (default) or USD, with currency toggle
- Network selector: TRC20, ERC20, BEP20, Polygon (from `BRAND.supportedNetworks`)

**Fee Logic (client-side, illustrative):**
- Trading fee: tiered — 1.5% for amounts < $1,000, 1.0% for $1,000–$10,000, 0.5% for $10,000+
- Network fee: static estimates per network (TRC20: ~$1, ERC20: ~$5, BEP20: ~$0.50, Polygon: ~$0.10)
- Total = amount + trading fee + network fee

**Output (live-updating):**
- Trading fee amount + percentage
- Network fee
- Total cost
- Approximate crypto amount received (using live CoinGecko price)
- All values shown in selected currency (USD/NPR)

## Changes

### `src/pages/Fees.tsx`
- Import `useMarketPrices`, `useNprRate`, `convertPrice`, `currencySymbol` from the existing hook
- Add a `FeeCalculator` section below the existing fee info cards
- Calculator is a self-contained form with `useState` for asset, direction, amount, network, currency
- Uses `useMemo` for fee computation
- Results card updates reactively

### No new files needed
Everything fits within the Fees page as inline component logic. No database changes, no edge functions — purely client-side with existing hooks.

## UI Layout
```text
┌─────────────────────────────────────────┐
│  Fee Calculator                         │
│                                         │
│  [Buy ● | Sell]    [USD | NPR toggle]   │
│                                         │
│  Asset:    [USDT ▾]                     │
│  Amount:   [___________] NPR            │
│  Network:  [TRC20 ▾]                    │
│                                         │
│  ┌─ Estimate ──────────────────────┐    │
│  │  Trade Amount:     रू 100,000   │    │
│  │  Trading Fee (1%): रू 1,000     │    │
│  │  Network Fee:      रू 147       │    │
│  │  Total Cost:       रू 101,147   │    │
│  │  ─────────────────────────────  │    │
│  │  You receive:  ~680.12 USDT     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [Get a Quote →]  (links to signup)     │
└─────────────────────────────────────────┘
```

Styled consistently with the existing Fees page cards — `bg-card`, `shadow-card`, `rounded-lg border`.

