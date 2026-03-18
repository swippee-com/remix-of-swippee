
-- 1. Fix profile UPDATE RLS: restrict to safe columns only
-- Create a security definer function to check column changes
CREATE OR REPLACE FUNCTION public.check_profile_update_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block changes to sensitive columns by non-admin users
  IF NOT has_role(auth.uid(), 'admin') THEN
    IF NEW.is_frozen IS DISTINCT FROM OLD.is_frozen THEN
      RAISE EXCEPTION 'Cannot modify is_frozen';
    END IF;
    IF NEW.is_2fa_enabled IS DISTINCT FROM OLD.is_2fa_enabled THEN
      RAISE EXCEPTION 'Cannot modify is_2fa_enabled';
    END IF;
    IF NEW.phone_verified IS DISTINCT FROM OLD.phone_verified THEN
      RAISE EXCEPTION 'Cannot modify phone_verified';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Cannot modify email directly';
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      RAISE EXCEPTION 'Cannot modify phone directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_profile_update_allowed();

-- 2. Create trigger to auto-transition order status on payment proof insert
CREATE OR REPLACE FUNCTION public.auto_transition_order_on_proof()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  IF NEW.order_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = NEW.order_id;

  IF v_order.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_order.status IN ('awaiting_payment', 'rate_locked') THEN
    UPDATE orders SET status = 'payment_proof_uploaded' WHERE id = v_order.id;

    INSERT INTO order_status_history (order_id, old_status, new_status, actor_id, actor_role, note)
    VALUES (v_order.id, v_order.status, 'payment_proof_uploaded', NEW.user_id, 'user', 'Payment proof uploaded by user');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_transition_order_on_proof
AFTER INSERT ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.auto_transition_order_on_proof();
