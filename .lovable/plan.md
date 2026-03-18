

# Fix: Missing Auth Triggers + Phone Verification Flow

## Root Cause
The database functions `handle_new_user()` and `handle_new_user_role()` exist but **no triggers are attached to `auth.users`**. On signup:
- No profile row is created
- No wallet row is created  
- No `user` role is assigned
- Phone/phone_verified from signup metadata is never persisted

This explains why the profile table is empty and phone verification keeps being requested.

## Fix 1: Create missing triggers (database migration)

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
```

## Fix 2: Backfill existing user's profile

Insert the missing profile row for the existing user (`54b92dd1-9e6e-4e7b-87e5-040d48430619`) using their auth metadata, and create their wallet + role.

## Fix 3: Prevent settings page from overwriting phone

In `SettingsPage.tsx`, the profile save mutation (line 46) sends `phone: phone || null` which can overwrite phone data set by the verification flow. Remove `phone` from the profile update mutation — phone should only be updated through the PhoneVerification component's edge function.

## Fix 4: PhoneVerification during signup (no auth context)

The `verify-phone-otp` edge function only updates profiles `if (userId)`. During signup, there's no auth session so userId is null. This is actually fine because the trigger will handle it — once Fix 1 is in place, the signup metadata (`phone`, `phone_verified: true`) flows through `handle_new_user()` into the profiles table.

## Files to update
- **Database migration**: Create the two missing triggers on `auth.users`
- **Database insert**: Backfill profile, wallet, and role for existing user
- `src/pages/dashboard/SettingsPage.tsx`: Remove `phone` from profile update mutation

## Scope
- 1 migration (2 triggers)
- 1 data backfill
- 1 file edit

