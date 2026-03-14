
CREATE OR REPLACE FUNCTION public.create_trade_on_quote_accept()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_qr quote_requests%ROWTYPE;
  v_quote quotes%ROWTYPE;
BEGIN
  -- Only fire when is_accepted changes to true
  IF NEW.is_accepted IS NOT TRUE OR (OLD.is_accepted IS TRUE) THEN
    RETURN NEW;
  END IF;

  -- Get the quote row
  SELECT * INTO v_quote FROM quotes WHERE id = NEW.id;

  -- Get the quote request
  SELECT * INTO v_qr FROM quote_requests WHERE id = v_quote.quote_request_id;

  -- Create the trade
  INSERT INTO otc_trades (
    quote_id,
    quote_request_id,
    user_id,
    side,
    asset,
    network,
    fiat_currency,
    quoted_rate,
    fee_amount,
    gross_amount,
    net_amount,
    status
  ) VALUES (
    v_quote.id,
    v_qr.id,
    v_qr.user_id,
    v_qr.side,
    v_qr.asset,
    v_qr.network,
    v_qr.fiat_currency,
    v_quote.quoted_price,
    v_quote.fee_amount,
    CASE WHEN v_qr.side = 'buy' THEN v_quote.total_user_pays ELSE v_quote.total_user_receives END,
    CASE WHEN v_qr.side = 'buy' THEN v_quote.total_user_receives ELSE v_quote.total_user_pays END,
    'pending_settlement'
  );

  -- Update quote request status to converted_to_trade
  UPDATE quote_requests SET status = 'converted_to_trade' WHERE id = v_qr.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quote_accepted
  AFTER UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION create_trade_on_quote_accept();
