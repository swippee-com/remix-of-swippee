

# Onboarding Wizard Plan

## Overview
Add a step-by-step onboarding wizard that appears on the dashboard when a new user hasn't completed setup. It guides them through 4 steps: email verification, KYC submission, adding a payment method, and creating their first quote request.

## Approach
Rather than building a separate multi-page wizard, create an **onboarding checklist component** that sits at the top of the Dashboard Overview page. Each step links to the relevant existing page. Steps auto-complete based on real data queries.

This avoids duplicating the existing KYC form, payment method form, and quote request form — those pages already work.

## Components to Create

### 1. `src/components/dashboard/OnboardingWizard.tsx`
A card component with 4 steps displayed as a vertical checklist with progress bar:

| Step | Check Condition | CTA |
|------|----------------|-----|
| Verify Email | `user.email_confirmed_at` exists | "Resend verification email" button |
| Complete KYC | `kyc_submissions` status = `approved` or `pending_review` | Link to `/dashboard/kyc` |
| Add Payment Method | `payment_methods` count > 0 | Link to `/dashboard/payment-methods` |
| Create First Quote | `quote_requests` count > 0 | Link to `/dashboard/quotes/new` |

- Shows a progress bar (0/4 to 4/4)
- Each completed step gets a green checkmark
- Current (first incomplete) step is highlighted/expanded with description + CTA button
- Once all 4 complete, the wizard shows a "You're all set!" message with a dismiss button
- Dismissed state stored in `localStorage` so it doesn't reappear

### 2. Modify `src/pages/dashboard/DashboardOverview.tsx`
- Import and render `OnboardingWizard` above the stat cards
- Pass down the existing query data (kyc status, payment method count) to avoid duplicate queries
- Only show when not all steps complete or not dismissed

## Data Queries
Reuse existing queries already in DashboardOverview (kyc status, pm count). Add:
- Quote request count query (simple `select count`)
- Email verification check from `user.email_confirmed_at` (already available via `useAuth`)

## UI Design
- Matches the "private banking" aesthetic: subtle borders, slate palette, no flashy colors
- Uses `Card` component with step indicators
- Progress bar using the existing `Progress` component
- Lucide icons: `Mail`, `Shield`, `CreditCard`, `FileText`, `CheckCircle`

## No Database Changes Required
All data needed already exists in current tables. Wizard state (dismissed) uses localStorage.

