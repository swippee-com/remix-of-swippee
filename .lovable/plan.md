

# Remove Legacy Quotes & OTC Trades System

The quotes (quote_requests/quotes) and OTC trades (otc_trades) systems are legacy — the app now uses the instant order system (orders table). Here's everything that needs to change.

## Files to Delete (8 files)

**User dashboard pages:**
- `src/pages/dashboard/QuotesPage.tsx`
- `src/pages/dashboard/NewQuotePage.tsx`
- `src/pages/dashboard/QuoteDetailPage.tsx`
- `src/pages/dashboard/TradesPage.tsx`
- `src/pages/dashboard/TradeDetailPage.tsx`

**Admin pages:**
- `src/pages/admin/AdminQuotesPage.tsx`
- `src/pages/admin/AdminQuoteDetailPage.tsx`
- `src/pages/admin/AdminTradesPage.tsx`
- `src/pages/admin/AdminTradeDetailPage.tsx`
- `src/components/admin/CreateQuoteModal.tsx`

## Files to Edit

### `src/App.tsx`
- Remove all imports for the 10 deleted pages
- Remove all 8 routes: `/dashboard/quotes`, `/dashboard/quotes/new`, `/dashboard/quotes/:id`, `/dashboard/trades`, `/dashboard/trades/:id`, `/admin/quotes`, `/admin/quotes/:id`, `/admin/trades`, `/admin/trades/:id`

### `src/config/navigation.ts`
- Remove `nav.quotes` and `nav.trades` from `userNavItems`
- Remove "Quote Requests" and "Trades" from `adminNavItems`
- Clean up unused icon imports (`FileText`, `ArrowLeftRight`)

### `src/pages/admin/AdminOverview.tsx`
- Remove `quote_requests` query from the stats fetch
- Remove "Open Quotes" stat card
- Replace `otc_trades` query with `orders` query for volume/trade stats
- Rename "Active Trades" → "Active Orders"

### `src/pages/admin/AdminAnalyticsPage.tsx`
- Replace all `otc_trades` queries with `orders` table queries
- Adjust field names: `gross_amount` → `total_receive_crypto`, `quoted_rate` → `final_rate_npr`

### `src/pages/admin/AdminUserDetailPage.tsx`
- Remove the quotes and trades queries
- Remove the "Quotes" and "Trades" tabs
- Replace with an "Orders" tab querying the `orders` table
- Change default tab from "quotes" to "orders"

### `src/pages/dashboard/PortfolioPage.tsx`
- Replace `otc_trades` query with `orders` table (completed orders)
- Adjust field mappings for holdings computation

### `src/components/security/RateLimitIndicator.tsx`
- Replace `quote_requests` count with `orders` count for daily rate limiting

### `src/i18n/en.ts` and `src/i18n/ne.ts`
- Remove quote and trade-related translation keys (`nav.quotes`, `nav.trades`, `quotes.*`, `trades.*`, `tradeDetail.*`, `quoteDetail.*`)

### `src/pages/dashboard/DashboardOverview.tsx`
- Rename "Active Trades" stat label to "Active Orders" and "Completed Trades" to "Completed Orders" (these already use the orders table, just need label updates)

## What stays untouched
- The database tables (`quote_requests`, `quotes`, `otc_trades`) remain — they hold historical data. We're only removing UI/routes.
- The `orders` system, `TradeWidget`, rate lock flow, and `place-order` edge function are unaffected.

