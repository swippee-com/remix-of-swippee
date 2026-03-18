

## Mobile UX Fix Plan

The core problem: both the Orders and Portfolio pages use wide `<table>` elements that force horizontal scrolling on mobile. The stat cards also stack in a single column taking up excessive vertical space.

### Changes

**1. Orders Page — Mobile Card Layout** (`src/pages/dashboard/OrdersPage.tsx`)
- On mobile (`< md`), render each order as a compact card instead of a table row
- Card shows: side badge + asset on top line, rate + amount on second line, status + date on third line, tap navigates to detail
- Keep the table for `md+` screens
- Hide the Date and Action columns on `sm` to reduce table width as an intermediate step

**2. Portfolio Page — Mobile Card Layout** (`src/pages/dashboard/PortfolioPage.tsx`)
- Holdings tab: render each holding as a card on mobile showing asset name/icon, quantity, value, P&L — hide avg cost, current price, 24h columns
- Order History tab: same card pattern — date, side badge, asset, amount, total
- Stat cards grid: change from single-column to `grid-cols-2` on mobile for Portfolio stats

**3. Wallet Page — Mobile Card Layout** (`src/pages/dashboard/WalletPage.tsx`)
- Transaction history table: render as cards on mobile showing type, amount, status, date

**4. Dashboard Overview — Compact Mobile Layout** (`src/pages/dashboard/DashboardOverview.tsx`)
- The 5-column stat grid already uses `grid-cols-2` which is fine
- No major changes needed

**5. Stat Card Compact Mode** (`src/components/shared/StatCard.tsx`)
- Reduce padding on mobile from `p-6` to `p-4` for tighter cards

### Implementation Pattern
Each page will use a shared approach:
```text
{/* Desktop: table */}
<div className="hidden md:block">
  <table>...</table>
</div>

{/* Mobile: card list */}
<div className="md:hidden space-y-3">
  {items.map(item => (
    <Link to={...} className="block rounded-lg border bg-card p-4">
      {/* compact card content */}
    </Link>
  ))}
</div>
```

This avoids horizontal scroll entirely on mobile while keeping the dense table view on desktop.

