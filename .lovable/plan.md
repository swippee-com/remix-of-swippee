

# Mobile Responsiveness Fixes

## Issues Found

1. **`App.css` — `#root` has `max-width: 1280px` and `padding: 2rem`**: This is a leftover Vite boilerplate. While it doesn't seem to cause visible issues right now (likely overridden), it's unnecessary and could cause subtle layout problems.

2. **NPR Exchange Rate bar on `/live` (line 126-137)**: Uses `flex items-center gap-2` with `ml-auto` on the date — on mobile the date and rate text all try to fit in one line and overflow.

3. **Trades page date filter row (line 97-110)**: Uses `flex items-center gap-3` which doesn't wrap on small screens — the two date inputs and clear button overflow.

4. **Portfolio page tables**: The holdings table has 7 columns and trade history table has 7 columns — no `overflow-x-auto` wrapper since it uses the `<Table>` component directly inside `<CardContent>`.

5. **Payout Addresses table**: Same issue — 6 columns in a table that will overflow on mobile without proper scrolling indication.

6. **Dashboard overview stat cards**: Uses `lg:grid-cols-5` — on mobile with `sm:grid-cols-2`, an odd number (5) leaves one card orphaned, which is fine but could look better.

## Changes

### 1. `src/App.css` — Remove `#root` constraints
Remove the `max-width`, `padding`, and `text-align: center` from `#root` as these are Vite boilerplate leftovers.

### 2. `src/pages/LivePrices.tsx` — Fix NPR rate bar
Wrap the exchange rate bar to stack on mobile using `flex-col sm:flex-row` and remove `ml-auto` on date.

### 3. `src/pages/dashboard/TradesPage.tsx` — Fix date filter row  
Change `flex items-center gap-3` to `flex flex-wrap items-center gap-3` so the date inputs wrap on mobile.

### 4. `src/pages/dashboard/PortfolioPage.tsx` — Add overflow-x-auto to tables
Wrap both `<Table>` components in `<div className="overflow-x-auto">` so they scroll horizontally on mobile.

### 5. `src/pages/dashboard/PayoutAddressesPage.tsx` — Already has `overflow-x-auto`, OK.

### 6. `src/pages/dashboard/DashboardOverview.tsx` — Adjust stat grid
Change `sm:grid-cols-2 lg:grid-cols-5` to `grid-cols-2 lg:grid-cols-5` with the wallet balance card spanning full width on small screens using `col-span-2 lg:col-span-1` so the layout looks clean.

