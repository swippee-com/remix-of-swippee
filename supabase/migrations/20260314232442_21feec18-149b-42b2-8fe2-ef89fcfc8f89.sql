
-- Ad placement enum
CREATE TYPE public.ad_placement AS ENUM (
  'dashboard_banner',
  'sidebar',
  'landing_sponsor',
  'live_prices',
  'public_footer'
);

-- Ad event type enum
CREATE TYPE public.ad_event_type AS ENUM ('impression', 'click');

-- Ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT NOT NULL,
  link_text TEXT NOT NULL DEFAULT 'Learn More',
  placement ad_placement NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0,
  impression_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad events table (analytics)
CREATE TABLE public.ad_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  event_type ad_event_type NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ads"
  ON public.ads FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active ads"
  ON public.ads FOR SELECT
  TO public
  USING (is_active = true);

-- RLS for ad_events
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ad events"
  ON public.ad_events FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert ad events"
  ON public.ad_events FOR INSERT
  TO public
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_ads_placement_active ON public.ads (placement, is_active);
CREATE INDEX idx_ad_events_ad_id ON public.ad_events (ad_id);
