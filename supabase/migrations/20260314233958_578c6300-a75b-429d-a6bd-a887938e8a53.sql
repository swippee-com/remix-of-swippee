
CREATE OR REPLACE FUNCTION public.increment_ad_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'impression' THEN
    UPDATE ads SET impression_count = impression_count + 1 WHERE id = NEW.ad_id;
  ELSIF NEW.event_type = 'click' THEN
    UPDATE ads SET click_count = click_count + 1 WHERE id = NEW.ad_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ad_event_insert
  AFTER INSERT ON public.ad_events
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_ad_counter();
