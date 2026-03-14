
-- Create a trigger function to notify user on trade status change
CREATE OR REPLACE FUNCTION public.notify_user_on_trade_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trade otc_trades%ROWTYPE;
  v_status_label text;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_status_label := replace(initcap(replace(NEW.status::text, '_', ' ')), '_', ' ');

  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'trade_update',
    'Trade Status Updated',
    'Your ' || NEW.side || ' ' || NEW.asset || ' trade status changed to ' || v_status_label || '.',
    '/dashboard/trades/' || NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trade_status_changed
  AFTER UPDATE ON otc_trades
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_on_trade_status_change();
