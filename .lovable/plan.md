

# SEO Optimization Plan — Nepal-Targeted

## Changes

### 1. `index.html` — Enhanced meta tags
- Add Nepal-targeting: `geo.region`, `geo.placename`, `content-language`
- Add Nepal-relevant keywords meta tag
- Update OG tags with proper Nepal-focused descriptions
- Add canonical link tag
- Add `lang="en"` + hreflang
- Add structured data (JSON-LD) for Organization schema
- Remove TODO comment, fix twitter:site

### 2. `public/robots.txt` — Block dashboard/admin/auth
- Disallow `/dashboard`, `/admin`, `/auth`, `/reset-password`
- Add sitemap reference

### 3. `public/sitemap.xml` — New file
- Include all public routes: `/`, `/about`, `/how-it-works`, `/fees`, `/support`, `/live`, `/terms`, `/privacy`, `/refund-policy`, `/aml-policy`
- Exclude dashboard, admin, auth routes

### 4. `src/hooks/use-page-meta.ts` — New hook
- Simple hook that sets `document.title` and meta description per page
- Called from each public page component

### 5. Update all public pages
- Add `usePageMeta()` calls with unique title + description for each page
- Nepal-focused keywords in descriptions (e.g., "buy crypto in Nepal", "Nepal OTC desk")

### 6. Landing page (`src/pages/Landing.tsx`)
- Add JSON-LD structured data for the homepage (LocalBusiness or FinancialService schema targeting Nepal)

