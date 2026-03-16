
-- 1. New enum for order status
CREATE TYPE public.order_status AS ENUM (
  'draft',
  'rate_locked',
  'awaiting_payment',
  'payment_proof_uploaded',
  'under_review',
  'manual_review',
  'approved_for_settlement',
  'settlement_in_progress',
  'completed',
  'expired',
  'cancelled',
  'rejected'
);

-- 2. pricing_configs
CREATE TABLE public.pricing_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset public.crypto_asset NOT NULL,
  network public.crypto_network,
  side public.trade_side,
  fixed_markup_npr numeric,
  percent_spread numeric,
  network_fee_npr numeric NOT NULL DEFAULT 0,
  payment_adjustments jsonb NOT NULL DEFAULT '{}',
  min_order_npr numeric NOT NULL DEFAULT 0,
  max_auto_order_npr numeric NOT NULL DEFAULT 500000,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pricing configs" ON public.pricing_configs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read active pricing configs" ON public.pricing_configs
  FOR SELECT TO authenticated USING (is_active = true);

CREATE TRIGGER update_pricing_configs_updated_at
  BEFORE UPDATE ON public.pricing_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. market_price_snapshots
CREATE TABLE public.market_price_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset public.crypto_asset NOT NULL,
  crypto_usd_price numeric NOT NULL,
  usd_npr_rate numeric NOT NULL,
  source_crypto text NOT NULL DEFAULT 'coingecko',
  source_fx text NOT NULL DEFAULT 'nrb',
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_price_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage snapshots" ON public.market_price_snapshots
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read snapshots" ON public.market_price_snapshots
  FOR SELECT TO authenticated USING (true);

-- 4. rate_locks
CREATE TABLE public.rate_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset public.crypto_asset NOT NULL,
  network public.crypto_network NOT NULL,
  side public.trade_side NOT NULL,
  payment_method public.payment_method_type,
  amount_input_type text NOT NULL CHECK (amount_input_type IN ('npr', 'crypto')),
  amount_input_value numeric NOT NULL,
  crypto_usd_price numeric NOT NULL,
  usd_npr_rate numeric NOT NULL,
  base_npr_price numeric NOT NULL,
  final_rate_npr numeric NOT NULL,
  fees_npr numeric NOT NULL DEFAULT 0,
  total_pay numeric NOT NULL,
  total_receive numeric NOT NULL,
  expires_at timestamptz NOT NULL,
  pricing_config_id uuid REFERENCES public.pricing_configs(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate locks" ON public.rate_locks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage rate locks" ON public.rate_locks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 5. orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rate_lock_id uuid REFERENCES public.rate_locks(id),
  side public.trade_side NOT NULL,
  asset public.crypto_asset NOT NULL,
  network public.crypto_network NOT NULL,
  payment_method_id uuid REFERENCES public.payment_methods(id),
  payout_address_id uuid REFERENCES public.payout_addresses(id),
  input_amount_npr numeric,
  input_amount_crypto numeric,
  final_rate_npr numeric NOT NULL,
  fee_total_npr numeric NOT NULL DEFAULT 0,
  total_pay_npr numeric NOT NULL,
  total_receive_crypto numeric NOT NULL,
  order_type text NOT NULL DEFAULT 'instant' CHECK (order_type IN ('instant', 'manual_review', 'vip')),
  requires_manual_review boolean NOT NULL DEFAULT false,
  risk_score numeric,
  status public.order_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Frozen users cannot create orders" ON public.orders
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_account_frozen(auth.uid()));

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. order_status_history
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status public.order_status,
  new_status public.order_status NOT NULL,
  actor_id uuid,
  actor_role text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order history" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage order history" ON public.order_status_history
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. inventory_balances
CREATE TABLE public.inventory_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset public.crypto_asset NOT NULL,
  network public.crypto_network NOT NULL,
  available_amount numeric NOT NULL DEFAULT 0,
  reserved_amount numeric NOT NULL DEFAULT 0,
  low_threshold numeric NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(asset, network)
);

ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory" ON public.inventory_balances
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default pricing configs for supported assets
INSERT INTO public.pricing_configs (asset, side, fixed_markup_npr, percent_spread, network_fee_npr, max_auto_order_npr) VALUES
  ('USDT', 'buy', 15, NULL, 0, 500000),
  ('USDT', 'sell', 11, NULL, 0, 500000),
  ('USDC', 'buy', 15, NULL, 0, 500000),
  ('USDC', 'sell', 11, NULL, 0, 500000),
  ('BTC', 'buy', NULL, 2.5, 50, 1000000),
  ('BTC', 'sell', NULL, 1.8, 50, 1000000),
  ('ETH', 'buy', NULL, 2.5, 50, 1000000),
  ('ETH', 'sell', NULL, 1.8, 50, 1000000);

-- Seed default inventory
INSERT INTO public.inventory_balances (asset, network, available_amount, low_threshold) VALUES
  ('USDT', 'TRC20', 10000, 1000),
  ('USDT', 'ERC20', 5000, 500),
  ('USDT', 'BEP20', 5000, 500),
  ('USDC', 'ERC20', 5000, 500),
  ('USDC', 'Polygon', 5000, 500),
  ('BTC', 'ERC20', 1, 0.1),
  ('ETH', 'ERC20', 10, 1);
