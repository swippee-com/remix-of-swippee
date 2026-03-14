
-- Wallet transaction type enum
CREATE TYPE public.wallet_tx_type AS ENUM ('deposit', 'withdrawal', 'trade_debit', 'trade_credit', 'adjustment');

-- Wallet transaction status enum
CREATE TYPE public.wallet_tx_status AS ENUM ('pending', 'completed', 'rejected');

-- Wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance_npr NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type wallet_tx_type NOT NULL,
  amount NUMERIC NOT NULL,
  balance_after NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  admin_note TEXT,
  status wallet_tx_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallets RLS policies
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wallets" ON public.wallets FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Wallet transactions RLS policies
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert deposit/withdrawal requests" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id AND type IN ('deposit', 'withdrawal'));
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.wallet_transactions FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Auto-create wallet for new users (extend handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

-- Updated_at trigger for wallets
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for wallet_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
