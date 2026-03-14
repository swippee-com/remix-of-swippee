
-- Fix overly permissive INSERT policies
DROP POLICY "Service can insert login events" ON public.login_events;
CREATE POLICY "Users can insert own login events" ON public.login_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY "Service can insert sessions" ON public.user_sessions;
CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
