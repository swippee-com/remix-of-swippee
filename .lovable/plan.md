

# Phone Number Verification via SMS

## Overview
Add phone verification during signup using the SMSBit bulk SMS API. Users enter their phone number, receive a 6-digit OTP via SMS, and verify it before account creation completes. The verified status is tracked in the `profiles` table.

## Database Changes

1. **Add `phone_verified` column to `profiles` table** (boolean, default false)
2. **Create `phone_verification_codes` table** to store OTP codes:
   - `id` (uuid, PK)
   - `phone` (text, not null)
   - `code` (text, not null)
   - `user_id` (uuid, nullable — null during signup)
   - `created_at` (timestamptz, default now())
   - `expires_at` (timestamptz, default now() + 5 minutes)
   - `verified` (boolean, default false)
   - RLS: service role only (edge function access)

## Edge Function: `send-phone-otp`

- Accepts `{ phone }` in request body
- Generates a random 6-digit code
- Stores it in `phone_verification_codes` (expires in 5 min)
- Calls SMSBit API: `https://bulk.bedbyaspokhrel.com.np/smsapi/index.php` with params: `key`, `contacts`, `senderid=SMSBit`, `msg=Your Swippee verification code is XXXXXX`, `responsetype=json`, `campaign=7190`, `routeid=10261`, `type=text`
- Uses secret `SMSBIT_API_KEY` for the `key` param
- Returns success/error

## Edge Function: `verify-phone-otp`

- Accepts `{ phone, code }` 
- Checks `phone_verification_codes` for matching unexpired, unverified code
- If valid: marks code as verified, updates `profiles.phone_verified = true` and `profiles.phone = phone` for the authenticated user
- Returns success/error

## Frontend Changes

### Signup Page (`src/pages/auth/Signup.tsx`)
- Add phone number input field (required)
- After entering phone, "Send OTP" button triggers `send-phone-otp`
- Show OTP input (6-digit, using existing `InputOTP` component)
- Store phone in signup metadata; verify after account creation

### Settings Page (`src/pages/dashboard/SettingsPage.tsx`)
- Next to phone field, show verified badge or "Verify" button
- Clicking "Verify" opens inline OTP flow (send code → enter code)
- On success, refresh profile to show verified state

### Onboarding Wizard (`OnboardingWizard.tsx`)
- Add a "Verify phone number" step between email verification and KYC
- Completed when `profile.phone_verified === true`
- CTA links to settings page

### Auth Context
- Add `phone_verified` to the profile type and fetch query

## Secret Required
- `SMSBIT_API_KEY` — the API key for SMSBit bulk SMS service (user will add via secrets tool)

## Implementation Order
1. Add `SMSBIT_API_KEY` secret
2. DB migration (add column + table)
3. Create `send-phone-otp` edge function
4. Create `verify-phone-otp` edge function
5. Update AuthContext profile type
6. Add phone verification UI to Signup page
7. Add verification flow to Settings page
8. Update OnboardingWizard with phone step

