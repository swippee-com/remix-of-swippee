

# Restore Dropped Public Schema

Your `DROP SCHEMA public CASCADE` wiped all tables, enums, functions, triggers, and RLS policies. The auth.users table (managed by Supabase) is unaffected — your user accounts still exist. We need to rebuild everything from the migration history.

## What happened
- All 24+ tables, 12 enums, functions, triggers, RLS policies, and indexes in the `public` schema were deleted
- Storage buckets and auth users are **not affected** (they live in separate schemas)
- The `public` schema exists again (you ran `CREATE SCHEMA public`) but it's empty

## Recovery plan

Create a single migration that replays all 20 previous migrations in order, reconstructing:

1. **Grant default permissions** on the new public schema (required for Supabase to work)
2. **12 enums**: app_role, kyc_status, payment_method_type, trade_side, crypto_asset, crypto_network, quote_request_status, trade_status, ledger_direction, ledger_bucket, support_ticket_status, notification_type, wallet_tx_type, wallet_tx_status, announcement_type, promotion_placement, promotion_event_type
3. **Utility function**: `update_updated_at_column()`
4. **24 tables** with all columns, constraints, defaults: profiles, user_roles, kyc_submissions, kyc_documents, payment_methods, payout_addresses, quote_requests, quotes, otc_trades, trade_status_history, payment_proofs, ledger_entries, audit_logs, notifications, support_tickets, support_messages, admin_notes, app_settings, login_events, user_sessions, user_2fa_secrets, wallets, wallet_transactions, announcements, promotions, promotion_events, phone_verification_codes
5. **Security definer functions**: `has_role()`, `is_account_frozen()`
6. **All RLS policies** (permissive + restrictive frozen-account policies)
7. **All triggers**: updated_at triggers, `handle_new_user`, `handle_new_user_role`, `create_trade_on_quote_accept`, `notify_user_on_trade_status_change`, `notify_wallet_tx_status_change`, `increment_promotion_counter`
8. **All indexes** (14 indexes + unique verified phone index)
9. **Realtime publication**: re-add tables to `supabase_realtime`
10. **Seed data**: default app_settings row for withdrawal_2fa_threshold

No code changes needed — only the database migration.

## Important notes
- Existing user accounts in `auth.users` are preserved; the `handle_new_user` trigger won't retroactively create profiles for them
- After the migration runs, you'll need to manually re-create profile rows for any existing users, or sign up fresh
- Storage buckets already exist so we skip bucket creation (only in the public schema portion)

