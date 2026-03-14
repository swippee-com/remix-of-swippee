

# Security & Trust Features — IP/Device Logging, 2FA, Session Management, Login History, Rate Limiting

## Overview
Implement a comprehensive security suite: login event tracking with IP/device info, TOTP-based 2FA, session visibility, login history for users, and rate limiting indicators for quote requests.

## Database Changes

### New Tables

**`login_events`** — Tracks every login with IP, device, location metadata
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to auth.users, not null |
| ip_address | text | From request headers |
| user_agent | text | Browser/device string |
| city | text | nullable, from IP lookup |
| country | text | nullable |
| login_method | text | 'password', 'token_refresh', 'totp' |
| created_at | timestamptz | default now() |

RLS: Users can SELECT own rows. Admins can SELECT all.

**`user_sessions`** — Tracks active sessions (mirrors Supabase auth sessions)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | not null |
| session_id | text | Supabase session ID |
| ip_address | text | |
| user_agent | text | |
| last_active_at | timestamptz | |
| is_current | boolean | default false |
| created_at | timestamptz | default now() |
| revoked_at | timestamptz | nullable |

RLS: Users can SELECT/UPDATE own rows. Admins can SELECT all.

**`user_2fa_secrets`** — Stores TOTP secrets
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | unique, not null |
| secret | text | encrypted TOTP secret |
| is_enabled | boolean | default false |
| backup_codes | text[] | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Users can SELECT/UPDATE own row. No direct INSERT from client (edge function handles).

### Alter `profiles` table
Add column: `is_2fa_enabled boolean default false` — cached flag for quick checks.

## Edge Functions

### `track-login` 
Called after successful login from the client. Receives session info, extracts IP from headers, user-agent, and inserts into `login_events` and upserts `user_sessions`.

### `setup-2fa`
- POST: Generates TOTP secret using `otpauth` library, returns QR code URI + secret
- PUT: Verifies user-provided TOTP code against secret, enables 2FA if valid, generates backup codes

### `verify-2fa`
Called during login when 2FA is enabled. Validates TOTP token before granting access.

### `revoke-session`
Takes a session ID, marks it as revoked in `user_sessions`. Cannot revoke current session.

## Frontend Changes

### Settings Page (`src/pages/dashboard/SettingsPage.tsx`)
Expand the Security section with 4 new subsections:

1. **Two-Factor Authentication** — Replace "Coming Soon" with:
   - Setup flow: show QR code, verify with 6-digit code, display backup codes
   - If enabled: show status badge, option to disable (requires TOTP verification)

2. **Active Sessions** — Card showing list of sessions with:
   - Device/browser (parsed from user-agent)
   - IP address, approximate location
   - "Current" badge on active session
   - "Revoke" button on other sessions

3. **Login History** — Table/list of recent 20 logins showing:
   - Date/time, IP address, device, location
   - Login method label

4. **Rate Limiting Indicator** — Small info card showing:
   - Quote requests made today vs daily limit (from `app_settings`)
   - Progress bar visualization

### Login Flow (`src/pages/auth/Login.tsx`)
- After successful password auth, check if user has 2FA enabled
- If yes, show TOTP input modal before completing login
- Call `track-login` edge function on successful login

### New Components
| Component | Purpose |
|-----------|---------|
| `src/components/security/TwoFactorSetup.tsx` | QR code display, TOTP verification form, backup codes |
| `src/components/security/ActiveSessions.tsx` | Session list with revoke buttons |
| `src/components/security/LoginHistory.tsx` | Login events table |
| `src/components/security/TotpVerifyModal.tsx` | 6-digit TOTP input dialog shown during login |
| `src/components/security/RateLimitIndicator.tsx` | Quote request usage bar |

### New Hook
`src/hooks/use-login-tracker.ts` — Calls `track-login` edge function after auth state change to "SIGNED_IN".

## Implementation Order
1. Create database tables + RLS policies (migration)
2. Build `track-login` edge function + client hook
3. Build Login History UI in Settings
4. Build Active Sessions UI + `revoke-session` edge function
5. Build 2FA setup/verify edge functions + Settings UI + Login flow integration
6. Add rate limiting indicator

## Technical Notes
- IP extraction in edge functions via `req.headers.get("x-forwarded-for")` or `req.headers.get("cf-connecting-ip")`
- TOTP uses RFC 6238 standard; can use `otpauth` npm package in edge functions
- User-agent parsing done client-side with a simple regex (no heavy library needed)
- Rate limit data: count today's quote_requests for the user vs a configurable limit in `app_settings`
- 2FA secret stored server-side only; never sent to client after initial setup

