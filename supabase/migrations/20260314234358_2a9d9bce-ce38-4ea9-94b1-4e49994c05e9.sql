
-- Rename tables
ALTER TABLE public.ads RENAME TO promotions;
ALTER TABLE public.ad_events RENAME TO promotion_events;

-- Rename enums
ALTER TYPE public.ad_placement RENAME TO promotion_placement;
ALTER TYPE public.ad_event_type RENAME TO promotion_event_type;

-- Rename the counter function
CREATE OR REPLACE FUNCTION public.increment_promotion_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'impression' THEN
    UPDATE promotions SET impression_count = impression_count + 1 WHERE id = NEW.ad_id;
  ELSIF NEW.event_type = 'click' THEN
    UPDATE promotions SET click_count = click_count + 1 WHERE id = NEW.ad_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_ad_event_insert ON public.promotion_events;
CREATE TRIGGER on_promotion_event_insert
  AFTER INSERT ON public.promotion_events
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_promotion_counter();

-- Drop old function
DROP FUNCTION IF EXISTS public.increment_ad_counter();
