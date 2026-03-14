
CREATE OR REPLACE FUNCTION public.notify_wallet_tx_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Deposit approved
  IF NEW.type = 'deposit' AND NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'payment_update',
      'Deposit Approved',
      'Your deposit of NPR ' || NEW.amount::text || ' has been approved and credited to your wallet.',
      '/dashboard/wallet'
    );
  END IF;

  -- Deposit rejected
  IF NEW.type = 'deposit' AND NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'payment_update',
      'Deposit Rejected',
      'Your deposit request of NPR ' || NEW.amount::text || ' was rejected.' ||
        CASE WHEN NEW.admin_note IS NOT NULL THEN ' Reason: ' || NEW.admin_note ELSE '' END,
      '/dashboard/wallet'
    );
  END IF;

  -- Withdrawal completed
  IF NEW.type = 'withdrawal' AND NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'payment_update',
      'Withdrawal Processed',
      'Your withdrawal of NPR ' || NEW.amount::text || ' has been processed.',
      '/dashboard/wallet'
    );
  END IF;

  -- Withdrawal rejected
  IF NEW.type = 'withdrawal' AND NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      'payment_update',
      'Withdrawal Rejected',
      'Your withdrawal request of NPR ' || NEW.amount::text || ' was rejected.' ||
        CASE WHEN NEW.admin_note IS NOT NULL THEN ' Reason: ' || NEW.admin_note ELSE '' END,
      '/dashboard/wallet'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_wallet_tx_status_change
  AFTER UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_wallet_tx_status_change();
