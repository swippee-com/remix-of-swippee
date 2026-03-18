

# Phase 5: Polish & Readiness Gates

## What we're building

1. **Dynamic ReadinessGate** — Fetch real KYC status and payment method/payout address counts from the database instead of hardcoded `false`. Use Drawer on mobile, Dialog on desktop. Show progress indicator (e.g., "2 of 4 complete").

2. **TradeWidget mobile optimization** — Sticky CTA button at bottom on mobile, larger Buy/Sell toggle touch targets, fee breakdown collapsed by default (already is), responsive amount input sizing.

3. **Timeline vertical mobile layout** — The Timeline component already renders vertically; add compact spacing on mobile with smaller circles and tighter text.

4. **PricingExplainer enhancement** — Add a visual step flow (numbered steps: Market Price → Forex Conversion → Spread → Fees → Final Rate) above the existing accordion. Reuse on Trade page and Order Detail page.

## Files to update

### `src/components/trade/ReadinessGate.tsx`
- Replace Dialog with conditional: use `Drawer` (from `@/components/ui/drawer`) on mobile, `Dialog` on desktop via `useIsMobile()`
- Add queries to check real data:
  - KYC: fetch `kyc_submissions` where `user_id = auth.uid()` and `status = 'approved'`
  - Payment methods: fetch count from `payment_methods` for buy side
  - Payout addresses: fetch count from `payout_addresses` for sell side
- Add progress bar at top: "2 of 4 steps complete"
- For sell side, show both payment method step (for receiving NPR) AND payout address step (for sending crypto) — currently only shows one

### `src/components/trade/TradeWidget.tsx`
- Wrap CTA button in a sticky container on mobile: `className="sticky bottom-0 bg-card pb-4 pt-2 -mx-6 px-6"` (only on mobile via `useIsMobile()`)
- Increase Buy/Sell toggle height on mobile: `py-3` instead of `py-2`
- Add `text-3xl` for amount input on mobile for better touch UX
- Pass `readiness` check before `lockRate()` — if any gate fails, open ReadinessGate instead of proceeding

### `src/components/trade/PricingExplainer.tsx`
- Add a visual numbered step flow above the accordion:
  ```
  ① Market Price → ② USD/NPR Rate → ③ Spread Applied → ④ Fees Added → ⑤ Your Rate
  ```
- Use horizontal pill/chip layout on desktop, vertical on mobile
- Keep the existing accordion for detailed explanations below

### `src/components/shared/Timeline.tsx`
- Add responsive sizing: smaller circles (`h-8 w-8`) and tighter gap on mobile
- Accept optional `compact` prop for use in order detail on mobile

### `src/pages/dashboard/OrderDetailPage.tsx`
- Use compact Timeline on mobile
- Add PricingExplainer section below rate snapshot card

## Technical notes
- `useIsMobile()` hook already exists at `src/hooks/use-mobile.tsx`
- Drawer component exists at `src/components/ui/drawer.tsx`
- No database migrations needed — all tables (kyc_submissions, payment_methods, payout_addresses) already exist with correct RLS
- ReadinessGate queries should be lightweight `.select("id").limit(1)` checks, only fetched when the gate is open

## Scope
- 5 files updated, 0 new files
- No database changes

