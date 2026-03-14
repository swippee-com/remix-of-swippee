-- Add phone_verified column to profiles
ALTER TABLE public.profiles ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;

-- Create phone_verification_codes table
CREATE TABLE public.phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified boolean NOT NULL DEFAULT false
);

-- Enable RLS but no public policies (service role only via edge functions)
ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;