

# Advertising & Sponsored Listings System

## Ad Placement Opportunities

Here are all the places we can display ads, ranked by visibility:

```text
┌─────────────────────────────────────────────┐
│ 1. DASHBOARD BANNER (like announcements)    │
│    Below system announcements, above content │
│    Format: Banner with image, text, CTA      │
├─────────────────────────────────────────────┤
│ 2. SIDEBAR AD (dashboard sidebar bottom)    │
│    Below nav links, above sign-out button    │
│    Format: Small card with logo + text       │
├─────────────────────────────────────────────┤
│ 3. LANDING PAGE SPONSOR STRIP               │
│    Between sections (e.g. after Features)    │
│    Format: "Sponsored by" logo row           │
├─────────────────────────────────────────────┤
│ 4. LIVE PRICES PAGE INLINE AD               │
│    Between price rows or above the table     │
│    Format: Horizontal banner                 │
├─────────────────────────────────────────────┤
│ 5. QUOTE/TRADE DETAIL SIDEBAR               │
│    On detail pages where there's whitespace  │
│    Format: Small promotional card            │
├─────────────────────────────────────────────┤
│ 6. PUBLIC FOOTER BANNER                     │
│    Above footer on all public pages          │
│    Format: Full-width banner                 │
└─────────────────────────────────────────────┘
```

## What to Build

### Database: `ads` table
- `id`, `title`, `description`, `image_url` (optional banner image), `link_url`, `link_text` (CTA label)
- `placement` enum: `dashboard_banner`, `sidebar`, `landing_sponsor`, `live_prices`, `public_footer`
- `is_active`, `starts_at`, `ends_at` (same scheduling as announcements)
- `priority` (integer, higher = shown first)
- `impression_count`, `click_count` (basic analytics)
- `created_by`, `created_at`
- RLS: admins manage, authenticated users can read active ads

### Database: `ad_events` table (analytics)
- `id`, `ad_id`, `event_type` (impression/click), `user_id` (nullable), `created_at`
- Used to track performance; admin can see CTR

### Components
1. **`AdBanner`** — Reusable component similar to `AnnouncementBanner` but styled as a subtle sponsored card with "Sponsored" label, optional image, title, description, CTA button, and dismiss (X). Tracks impressions on mount, clicks on CTA.
2. **`SidebarAd`** — Compact version for the dashboard sidebar slot.
3. **`SponsorStrip`** — Logo row for landing page.

### Admin Management
- New **Admin Ads Page** (`/admin/ads`) — CRUD for ads with placement selector, date scheduling, image upload, link, and basic impression/click stats.
- Add "Ads" to admin nav.

### Frontend Integration
- `DashboardLayout`: Render `<AdBanner placement="dashboard_banner" />` after `<AnnouncementBanner />`
- `DashboardLayout` sidebar: Render `<SidebarAd />` above sign-out button
- `Landing.tsx`: Render `<SponsorStrip />` between Features and Steps sections
- `LivePrices.tsx`: Render `<AdBanner placement="live_prices" />` above the price table
- `PublicLayout.tsx`: Render `<AdBanner placement="public_footer" />` above footer

### Implementation Order
1. DB migration (ads + ad_events tables)
2. `AdBanner` + `SidebarAd` + `SponsorStrip` components
3. Integrate into layouts and pages
4. Admin Ads CRUD page
5. Basic impression/click tracking

