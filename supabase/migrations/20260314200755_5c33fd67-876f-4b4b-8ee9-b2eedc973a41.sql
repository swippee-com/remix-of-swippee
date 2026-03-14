
-- Add notification creation to the trade creation trigger
CREATE OR REPLACE FUNCTION public.create_trade_on_quote_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_qr quote_requests%ROWTYPE;
  v_quote quotes%ROWTYPE;
  v_trade_id uuid;
BEGIN
  -- Only fire when is_accepted changes to true
  IF NEW.is_accepted IS NOT TRUE OR (OLD.is_accepted IS TRUE) THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_quote FROM quotes WHERE id = NEW.id;
  SELECT * INTO v_qr FROM quote_requests WHERE id = v_quote.quote_request_id;

  -- Create the trade
  INSERT INTO otc_trades (
    quote_id, quote_request_id, user_id, side, asset, network,
    fiat_currency, quoted_rate, fee_amount, gross_amount, net_amount, status
  ) VALUES (
    v_quote.id, v_qr.id, v_qr.user_id, v_qr.side, v_qr.asset, v_qr.network,
    v_qr.fiat_currency, v_quote.quoted_price, v_quote.fee_amount,
    CASE WHEN v_qr.side = 'buy' THEN v_quote.total_user_pays ELSE v_quote.total_user_receives END,
    CASE WHEN v_qr.side = 'buy' THEN v_quote.total_user_receives ELSE v_quote.total_user_pays END,
    'pending_settlement'
  ) RETURNING id INTO v_trade_id;

  -- Update quote request status
  UPDATE quote_requests SET status = 'converted_to_trade' WHERE id = v_qr.id;

  -- Create notification for the user
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    v_qr.user_id,
    'trade_update',
    'Trade Created',
    'Your quote for ' || v_qr.side || ' ' || v_qr.asset || ' has been accepted and a trade has been created.',
    '/dashboard/trades/' || v_trade_id
  );

  -- Add initial trade status history entry
  INSERT INTO trade_status_history (trade_id, from_status, to_status, note)
  VALUES (v_trade_id, NULL, 'pending_settlement', 'Trade created from accepted quote');

  RETURN NEW;
END;
$$;
