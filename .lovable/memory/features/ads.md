Advertising & Sponsored Listings system for monetizing site traffic

## Database
- `ads` table: title, description, image_url, link_url, link_text, placement (enum), is_active, starts_at, ends_at, priority, impression_count, click_count, created_by
- `ad_events` table: ad_id, event_type (impression/click), user_id (nullable)
- Enums: ad_placement (dashboard_banner, sidebar, landing_sponsor, live_prices, public_footer), ad_event_type (impression, click)
- RLS: admins manage all, anyone can read active ads, anyone can insert events

## Components
- `src/hooks/use-ads.ts` — useAds(placement) + useAdTracking() hooks
- `src/components/ads/AdBanner.tsx` — Banner with sponsored label, image, CTA, dismiss
- `src/components/ads/SidebarAd.tsx` — Compact sidebar card
- `src/components/ads/SponsorStrip.tsx` — Logo row for landing page

## Placements
- DashboardLayout: AdBanner after AnnouncementBanner, SidebarAd above sign-out
- PublicLayout: AdBanner above footer
- Landing.tsx: SponsorStrip between Features and Steps
- LivePrices.tsx: AdBanner above price grid

## Admin
- `/admin/ads` — CRUD, toggle active, scheduling, CTR stats
- Nav item uses Megaphone icon
