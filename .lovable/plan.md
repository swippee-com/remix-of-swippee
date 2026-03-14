

# Admin Analytics Dashboard

## Overview
Add a dedicated analytics page at `/admin/analytics` with four Recharts-based charts, plus enhance the existing admin overview with quick chart summaries.

## New Page: `src/pages/admin/AdminAnalyticsPage.tsx`

A full analytics page with four chart sections in a 2x2 grid:

### 1. Trade Volume Over Time (AreaChart)
- Query `otc_trades` for last 30 days
- Group by date, sum `gross_amount * quoted_rate` per day
- X-axis: dates, Y-axis: volume in NPR
- Filterable: 7d / 30d / 90d toggle

### 2. Revenue Breakdown (BarChart)
- Query `ledger_entries` where `account_bucket = 'fees_revenue'`
- Group by month (last 6 months)
- Show fee revenue per month
- Secondary bar for trade count

### 3. User Growth (LineChart)
- Query `profiles` ordered by `created_at`
- Cumulative user count over time (last 6 months, grouped by week)
- Shows total registered users growth curve

### 4. Asset Distribution (PieChart/DonutChart)
- Query `otc_trades` grouped by `asset`
- Show percentage breakdown of trade volume by asset (USDT, BTC, ETH, USDC)
- Donut chart with legend

## Data Fetching
- Each chart has its own `useQuery` with independent loading states
- All queries use existing tables with existing admin RLS policies (admin can read all)
- No database changes needed

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/admin/AdminAnalyticsPage.tsx` | Create — full page with 4 charts |
| `src/config/navigation.ts` | Add "Analytics" nav item to `adminNavItems` |
| `src/App.tsx` | Add route `/admin/analytics` |

## UI Design
- Uses existing `AdminLayout`, `PageHeader`, `Card` components
- Charts use the existing `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` from `src/components/ui/chart.tsx`
- Period selector using `Tabs` component (7d/30d/90d)
- Recharts is already installed (used by chart.tsx)
- Matches the private banking aesthetic — muted colors, clean grid layout

## Chart Config Colors
- Volume: `hsl(var(--primary))` 
- Revenue: green tones
- Users: blue tones
- Assets: distinct muted colors per asset

