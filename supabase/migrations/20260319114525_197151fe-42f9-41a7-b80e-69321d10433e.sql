
-- Rate limiting table for edge function endpoints
CREATE TABLE public.rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_key_endpoint_created ON public.rate_limit_entries (key, endpoint, created_at DESC);

-- Auto-cleanup old entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_entries WHERE created_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_rate_limits
AFTER INSERT ON public.rate_limit_entries
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_rate_limit_entries();

-- RLS: no direct client access, only service role
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- Rate limit check function (used by edge functions via service role)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _key text,
  _endpoint text,
  _max_requests integer,
  _window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  SELECT count(*) INTO _count
  FROM public.rate_limit_entries
  WHERE key = _key
    AND endpoint = _endpoint
    AND created_at > now() - (_window_seconds || ' seconds')::interval;

  IF _count >= _max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_entries (key, endpoint)
  VALUES (_key, _endpoint);

  RETURN true;
END;
$$;
