

# Fix Live Prices Search

## Problem
The search only works against the 50 pre-loaded coins (top 50 by market cap). Coins like POLYGON or TRUMP aren't in the top 50, so they'll never appear.

## Solution
Add a **CoinGecko search API fallback**: when the local filter returns no results and the user has typed 2+ characters, query CoinGecko's `/search` endpoint to find matching coins, then fetch their market data.

### Changes

**`src/hooks/use-market-prices.ts`**
- Increase `per_page` from 50 → 100 for broader coverage
- Export a new `searchCoins(query)` async function that:
  1. Calls `https://api.coingecko.com/api/v3/search?query={q}` to get matching coin IDs
  2. Takes top 10 results and fetches their market data via `/coins/markets?ids=...`
  3. Returns `MarketPrice[]`

**`src/pages/LivePrices.tsx`**
- Add a debounced remote search: when local `filtered` is empty and `search.length >= 2`, call `searchCoins(search)`
- Show a "Searching…" spinner during remote search
- Display remote results in the same card grid
- Clear remote results when local results exist or search is cleared

This way the search bar works for any coin CoinGecko knows about, not just the top 100.

