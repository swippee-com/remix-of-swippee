

## Plan: 2FA Enforcement for Large Withdrawals + System Announcements Banner

### Feature 1: 2FA Enforcement for Large Withdrawals

**How it works:** When a user submits a withdrawal above a configurable threshold (stored in `app_settings`), the `WithdrawModal` checks if the user has 2FA enabled. If yes, it opens the existing `TotpVerifyModal` before submitting. If 2FA is not enabled, the user is warned they must enable 2FA for large withdrawals.

**Database:**
- Insert a default threshold into `app_settings` table: key `withdrawal_2fa_threshold`, value `{"amount": 50000}` (NPR 50,000)

**Code changes:**

1. **`src/components/dashboard/WithdrawModal.tsx`**
   - Fetch the user's `is_2fa_enabled` from profiles
   - Fetch the threshold from `app_settings` (key: `withdrawal_2fa_threshold`)
   - Add state for `showTotpModal` 
   - On submit: if amount >= threshold and 2FA is enabled, show `TotpVerifyModal` first; on verified, proceed with mutation
   - If amount >= threshold and 2FA is NOT enabled, show a warning with link to Settings to enable 2FA, block submission
   - Show an info note below the amount input when the entered amount exceeds the threshold

2. **`src/pages/admin/AdminSettingsPage.tsx`** — Add a field for admins to configure the withdrawal 2FA threshold

---

### Feature 2: System Announcements Banner

**How it works:** Admins create announcements (stored in `app_settings` or a new `announcements` table). Active announcements display as a dismissible banner at the top of both DashboardLayout and AdminLayout.

**Database:**
- New migration: Create `announcements` table with columns: `id`, `title`, `message`, `type` (info/warning/maintenance), `is_active`, `starts_at`, `ends_at`, `created_by`, `created_at`
- RLS: Admins can CRUD, all authenticated users can SELECT where `is_active = true`

**Code changes:**

1. **New `src/components/shared/AnnouncementBanner.tsx`**
   - Fetches active announcements from the `announcements` table (where `is_active = true` and current time is between `starts_at` and `ends_at`)
   - Renders a colored banner (info=blue, warning=amber, maintenance=red) with dismiss button
   - Dismissed announcements stored in `localStorage` by ID so they don't reappear

2. **`src/components/layout/DashboardLayout.tsx`** — Add `<AnnouncementBanner />` above `{children}` in main content

3. **`src/components/layout/AdminLayout.tsx`** — Add `<AnnouncementBanner />` similarly

4. **`src/pages/admin/AdminSettingsPage.tsx`** — Add an "Announcements" section where admins can:
   - Create new announcements (title, message, type, start/end dates)
   - Toggle active/inactive
   - Delete announcements

---

### Summary of changes

| Area | Files |
|------|-------|
| DB migration | New table `announcements`, insert default 2FA threshold setting |
| WithdrawModal | Add 2FA gate with threshold check |
| AnnouncementBanner | New shared component |
| DashboardLayout | Render banner |
| AdminLayout | Render banner |
| AdminSettingsPage | Add threshold config + announcement management UI |

