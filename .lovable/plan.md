

# Rebuild Swippee: Manual OTC → Instant-Price Crypto Broker

This is a large-scale product transformation. Given the scope (new pricing engine, new DB tables, new pages, redesigned flows), it must be broken into phases to be implementable without breaking the existing working app.

## Phased approach

### Phase 1: Database & Pricing Engine Foundation
New tables and backend logic that power instant pricing.

**Database migrations:**
- `pricing_configs` — admin-defined markup/spread rules per asset, network, side
- `market_price_snapshots` — cached market + forex data
- `rate_locks` — temporary locked pricing for users (45s default)
- `orders` — replaces quote_requests as the primary trade object for instant flow
- `order_status_history` — status audit trail
- `inventory_balances` — admin-managed inventory per asset/network

**New edge function: `calculate-price`**
- Accepts asset, network, side, amount, payment_method
- Fetches latest crypto price (CoinGecko) + forex rate (NRB)
- Looks up `pricing_configs` for the asset/side combo
- Applies stablecoin fixed markup OR volatile asset percentage spread
- Returns final buy/sell rate in NPR, fees, total

**New edge function: `lock-rate`**
- Creates a `rate_locks` row with 45s expiry
- Stores full pricing snapshot (crypto price, forex rate, config version, final rate)
- Returns lock_id + expires_at

**New edge function: `place-order`**
- Validates rate lock is still valid
- Creates `orders` row with immutable pricing snapshot
- Checks manual review conditions (amount threshold, inventory, KYC tier, etc.)
- Sets `requires_manual_review` flag if needed
- Creates `order_status_history` entry

### Phase 2: Trade Widget & Public Pages
The main conversion surface.

**New component: `TradeWidget`**
- Buy/Sell segmented tabs
- Asset dropdown, network dropdown
- "You pay" / "You receive" with toggle (NPR ↔ crypto)
- Payment method selector
- Live rate display with countdown timer
- Fee breakdown accordion
- CTA: "Buy Now" / "Sell Now"
- States: calculating, rate loaded, rate expired, error, manual review required
- Used on homepage hero AND `/trade` page

**Updated Landing page:**
- Hero section with embedded TradeWidget
- Keep existing sections (features, steps, supported assets, CTA)
- Update copy from "quote-based" to "instant pricing"

**New `/trade` page:**
- Full-page trade interface
- Left: TradeWidget
- Right: market summary, Swippee rates, fee explanation
- Mobile: single column, sticky CTA

**Updated `/live` page:**
- Add Swippee buy/sell rates next to market price
- Add "Buy Now" / "Sell Now" CTAs per asset

### Phase 3: Dashboard Redesign — Orders Flow
Replace quotes-centric dashboard with orders-centric flow.

**Updated dashboard overview:**
- Quick trade buttons (Buy USDT, Sell USDT)
- Onboarding progress (keep existing, add "Place first order")
- Recent orders instead of recent quotes/trades

**New `/dashboard/orders` page:**
- Tabs: All, Awaiting Payment, Under Review, Completed, Cancelled, Manual Review
- Each row: asset, side, locked rate, amount, payment method, status, created time

**New `/dashboard/orders/:id` page:**
- Order summary with locked rate snapshot
- Payment instructions
- Upload payment proof
- Package-tracking style timeline
- Support button

**Keep existing pages:** quotes (legacy), trades (legacy), wallet, payment methods, payout addresses, KYC, settings, support

### Phase 4: Admin — Pricing Config & Order Management

**New `/admin/pricing` page:**
- USDT/USDC sell markup NPR, buy markup NPR
- BTC/ETH sell spread %, buy spread %
- Network fee buffers (ERC20, TRC20, BEP20, Polygon)
- Payment method adjustments
- Rate lock duration config
- Max auto order size
- Manual review thresholds
- Live preview calculator

**New `/admin/orders` page:**
- Tabs: New, Awaiting Payment, Proof Uploaded, Manual Review, Settlement Pending, Completed, Cancelled
- Quick actions: verify proof, approve, mark settlement, cancel

**New `/admin/orders/:id` page:**
- User + KYC summary, pricing snapshot, payment proof, payout details
- Internal notes, timeline, action buttons

**New `/admin/inventory` page:**
- Asset/network inventory tracking
- Low-stock warnings
- Enable/disable routes

**Updated admin navigation** to include Pricing, Orders, Inventory

### Phase 5: Polish & Readiness Gates

**Readiness gate system:**
- When user clicks Buy/Sell, check: logged in → phone verified → KYC approved → payment method → payout address
- Progressive modal/drawer, not error pages

**Pricing explanation component:**
- "How Swippee pricing works" reusable section
- Simple language explaining market price → forex → spread → final rate

**Mobile optimization:**
- Sticky CTA on trade widget
- Large Buy/Sell toggle
- Collapsible fee details
- Vertical timeline for order tracking

## Technical details

### New database schema (Phase 1 migration)

```text
pricing_configs
├── id uuid PK
├── asset crypto_asset
├── network crypto_network (nullable)
├── side trade_side (nullable, null = both)
├── fixed_markup_npr numeric (nullable)
├── percent_spread numeric (nullable)
├── network_fee_npr numeric default 0
├── payment_adjustments jsonb default '{}'
├── min_order_npr numeric default 0
├── max_auto_order_npr numeric default 500000
├── is_active boolean default true
├── created_at, updated_at

rate_locks
├── id uuid PK
├── user_id uuid
├── asset, network, side
├── payment_method payment_method_type (nullable)
├── amount_input_type text ('npr' | 'crypto')
├── amount_input_value numeric
├── crypto_usd_price numeric
├── usd_npr_rate numeric
├── base_npr_price numeric
├── final_rate_npr numeric
├── fees_npr numeric
├── total_pay numeric
├── total_receive numeric
├── expires_at timestamptz
├── pricing_config_id uuid
├── status text ('active','used','expired')
├── created_at

orders
├── id uuid PK
├── user_id uuid
├── rate_lock_id uuid
├── side, asset, network
├── payment_method_id uuid (nullable)
├── payout_address_id uuid (nullable)
├── input_amount_npr, input_amount_crypto
├── final_rate_npr, fee_total_npr
├── total_pay_npr, total_receive_crypto (or vice versa)
├── order_type text ('instant','manual_review')
├── requires_manual_review boolean
├── risk_score numeric (nullable)
├── status order_status enum
├── created_at, updated_at

order_status_history
├── id, order_id, old_status, new_status
├── actor_id, actor_role, note, created_at

inventory_balances
├── id, asset, network
├── available_amount, reserved_amount
├── low_threshold, is_enabled
├── updated_at

market_price_snapshots
├── id, asset
├── crypto_usd_price, usd_npr_rate
├── source_crypto, source_fx
├── fetched_at
```

New enum: `order_status` with values: draft, rate_locked, awaiting_payment, payment_proof_uploaded, under_review, manual_review, approved_for_settlement, settlement_in_progress, completed, expired, cancelled, rejected

### RLS policies
- `pricing_configs`: admin ALL, authenticated SELECT active
- `rate_locks`: users can SELECT/INSERT own, admin ALL
- `orders`: users SELECT own + INSERT own, admin ALL
- `order_status_history`: users SELECT own (via orders join), admin ALL
- `inventory_balances`: admin ALL
- `market_price_snapshots`: authenticated SELECT, admin INSERT

### Backward compatibility
- Keep existing `quote_requests`, `quotes`, `otc_trades` tables and pages
- Old quote flow remains accessible via `/dashboard/quotes`
- New instant flow lives at `/trade` and `/dashboard/orders`
- Navigation updated to prioritize Orders over Quotes

## Recommended build order

Start with **Phase 1** (DB + edge functions), then **Phase 2** (trade widget + pages), then **Phase 3** (dashboard orders), then **Phase 4** (admin), then **Phase 5** (polish).

Each phase is independently deployable without breaking the existing app.

