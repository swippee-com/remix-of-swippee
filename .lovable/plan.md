

## Plan: Portfolio Tracker Page

Build a new **Portfolio** page at `/dashboard/portfolio` that calculates crypto holdings from completed OTC trades and shows live market valuations.

### How it works

- Query `otc_trades` where `status = 'completed'` for the logged-in user
- Aggregate net holdings per asset: **buy** trades add to holdings, **sell** trades subtract
- Use the existing `useMarketPrices()` hook for live USD prices and `useNprRate()` for NPR conversion
- No new database tables needed — everything derives from existing `otc_trades` data

### Page sections

1. **Summary cards** — Total portfolio value (NPR + USD), 24h change %, number of assets held
2. **Holdings table** — Per-asset rows showing: asset icon/name, quantity held, avg buy price, current price, current value, 24h change, P&L (profit/loss)
3. **Trade history tab** — Completed trades list filtered by selected asset (reuses existing trade data)
4. **Currency toggle** — Switch between NPR and USD display (reuses `useNprRate`)

### Files to create/modify

| Action | File |
|--------|------|
| Create | `src/pages/dashboard/PortfolioPage.tsx` — Main page with summary cards, holdings table, asset detail |
| Modify | `src/config/navigation.ts` — Add "Portfolio" nav item with `PieChart` icon after Wallet |
| Modify | `src/App.tsx` — Add route `/dashboard/portfolio` |

### Key logic (holdings calculation)

```typescript
// From completed trades, compute net holdings per asset
const holdings = trades.reduce((acc, trade) => {
  const qty = trade.side === 'buy' ? trade.net_amount : -trade.net_amount;
  acc[trade.asset] = (acc[trade.asset] || 0) + qty;
  return acc;
}, {});
```

For average cost basis, sum `(quoted_rate * net_amount)` per asset for buy trades, divided by total bought quantity.

No database changes required.

