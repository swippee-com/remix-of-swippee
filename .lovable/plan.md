

# Swippee OTC Desk — MVP Gap Analysis and Plan

## What's Done (working with real data)
- Auth (login, signup, forgot/reset password, role-based routing)
- Quote requests list (user + admin) — live from Supabase
- Quote detail with accept/decline (user) and create quote modal (admin)
- Database schema, RLS, storage buckets all set up

## What's Still Using Demo/Mock Data (not connected to Supabase)
Almost every other page is a **static shell with hardcoded arrays**. Here is the priority list to make this a real MVP:

---

### Phase 1 — Core Workflows (must-have for MVP)

**1. New Quote Request form** (`NewQuotePage.tsx`)
- Currently a dummy form that navigates away on submit
- Wire to Supabase: insert into `quote_requests`, link user's payment methods and payout addresses via dropdowns fetched from DB
- Add Zod validation, proper error handling, success toast

**2. KYC submission** (`KycPage.tsx`)
- Currently hardcoded `kycStatus = "not_submitted"`, form submits to nowhere
- Fetch user's existing KYC submission from `kyc_submissions`
- On submit: insert into `kyc_submissions`, upload files to `kyc-documents` storage bucket, insert into `kyc_documents`
- Show real status (pending, approved, rejected, needs_more_info)

**3. Admin KYC queue** (`AdminKycPage.tsx`)
- Currently hardcoded array
- Fetch from `kyc_submissions` with profile join
- Wire approve/reject/request-info buttons to update status + create audit log
- Add document preview (view uploaded files from storage)

**4. Payment Methods CRUD** (`PaymentMethodsPage.tsx`)
- Currently hardcoded array
- Full CRUD against `payment_methods` table with add/edit modal, delete confirmation, set-default toggle

**5. Payout Addresses CRUD** (`PayoutAddressesPage.tsx`)
- Same pattern — wire to `payout_addresses` table with add/edit/delete

**6. User Dashboard overview** (`DashboardOverview.tsx`)
- Replace hardcoded stats with real counts from Supabase (KYC status from `kyc_submissions`, trade counts from `otc_trades`, payment method count)
- Recent activity from `quote_requests` + `otc_trades` ordered by date

**7. Trades pages** (user `TradesPage.tsx` + admin `AdminTradesPage.tsx`)
- Fetch from `otc_trades` with filters
- User: own trades only; Admin: all trades with search/filter
- Link to trade detail pages

**8. Trade detail page** (new: `/dashboard/trades/:id` and `/admin/trades/:id`)
- Show trade info, status timeline from `trade_status_history`
- User: upload payment proof (to `payment-proofs` bucket + `payment_proofs` table)
- Admin: update trade status, review payment proofs, add settlement notes

### Phase 2 — Admin Operations

**9. Admin Users page** (`AdminUsersPage.tsx`)
- Fetch from `profiles` + `user_roles` + KYC status join
- Search, filter, role management

**10. Admin Overview dashboard** (`AdminOverview.tsx`)
- Replace hardcoded stats with real aggregate queries
- Recent activity from `audit_logs`

**11. Admin Ledger page** (`AdminLedgerPage.tsx`)
- Fetch from `ledger_entries` with filters by bucket, date range, user
- Auto-create ledger entries when trade statuses change

**12. Admin Audit Logs page** (`AdminAuditLogsPage.tsx`)
- Fetch from `audit_logs` with search/filter

### Phase 3 — Support & Settings

**13. Support tickets** (user `SupportDashboardPage.tsx` + admin `AdminSupportPage.tsx`)
- CRUD against `support_tickets` + `support_messages`
- Ticket detail with message thread, file attachments

**14. Settings page** (`SettingsPage.tsx`)
- Wire profile update to `profiles` table
- Wire password change to `supabase.auth.updateUser`

**15. Notifications**
- Fetch from `notifications` table
- Bell icon in nav with unread count
- Create notifications on key events (KYC status change, quote sent, trade update)

---

### Summary

There are **~15 pages still on hardcoded data**. The most impactful batch to build next would be **Phase 1 items 1-8** — they complete the core user journey: KYC -> quote -> trade -> settlement.

Which phase would you like me to implement first, or should I tackle all of Phase 1 in one go?

