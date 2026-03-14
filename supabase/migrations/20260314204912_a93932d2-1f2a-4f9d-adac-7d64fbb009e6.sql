
-- 1. login_events table
CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  city text,
  country text,
  login_method text DEFAULT 'password',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login events" ON public.login_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login events" ON public.login_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert login events" ON public.login_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. user_sessions table
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  ip_address text,
  user_agent text,
  last_active_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON public.user_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert sessions" ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. user_2fa_secrets table
CREATE TABLE public.user_2fa_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  is_enabled boolean DEFAULT false,
  backup_codes text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_2fa_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own 2fa" ON public.user_2fa_secrets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all 2fa" ON public.user_2fa_secrets
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT/UPDATE - handled by edge functions via service role

-- 4. Add is_2fa_enabled to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_2fa_enabled boolean DEFAULT false;
