
-- =============================================
-- SWIPPEE OTC DESK — FULL SCHEMA RESTORE
-- =============================================

-- 0. GRANT DEFAULT PERMISSIONS ON PUBLIC SCHEMA
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'compliance');
CREATE TYPE public.kyc_status AS ENUM ('not_submitted', 'pending_review', 'approved', 'rejected', 'needs_more_info');
CREATE TYPE public.payment_method_type AS ENUM ('bank_transfer', 'esewa', 'khalti', 'ime_pay', 'other');
CREATE TYPE public.trade_side AS ENUM ('buy', 'sell');
CREATE TYPE public.crypto_asset AS ENUM ('USDT', 'BTC', 'ETH', 'USDC');
CREATE TYPE public.crypto_network AS ENUM ('TRC20', 'ERC20', 'BEP20', 'Polygon');
CREATE TYPE public.quote_request_status AS ENUM ('draft', 'submitted', 'under_review', 'quoted', 'awaiting_user_acceptance', 'accepted', 'rejected', 'expired', 'cancelled', 'converted_to_trade');
CREATE TYPE public.trade_status AS ENUM ('pending_settlement', 'awaiting_fiat_payment', 'payment_proof_uploaded', 'fiat_received', 'awaiting_crypto_transfer', 'crypto_received', 'ready_to_release', 'completed', 'disputed', 'cancelled', 'failed');
CREATE TYPE public.ledger_direction AS ENUM ('debit', 'credit');
CREATE TYPE public.ledger_bucket AS ENUM ('client_receivable', 'client_payable', 'fees_revenue', 'settlement_pending', 'otc_inventory', 'fiat_clearing', 'crypto_clearing', 'manual_adjustment');
CREATE TYPE public.support_ticket_status AS ENUM ('open', 'pending_user', 'pending_admin', 'resolved', 'closed');
CREATE TYPE public.notification_type AS ENUM ('kyc_update', 'quote_update', 'trade_update', 'payment_update', 'support_update', 'system');
CREATE TYPE public.wallet_tx_type AS ENUM ('deposit', 'withdrawal', 'trade_debit', 'trade_credit', 'adjustment');
CREATE TYPE public.wallet_tx_status AS ENUM ('pending', 'completed', 'rejected');
CREATE TYPE public.announcement_type AS ENUM ('info', 'warning', 'maintenance');
CREATE TYPE public.promotion_placement AS ENUM ('dashboard_banner', 'sidebar', 'landing_sponsor', 'live_prices', 'public_footer');
CREATE TYPE public.promotion_event_type AS ENUM ('impression', 'click');

-- 2. UTILITY FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  country TEXT DEFAULT 'Nepal',
  timezone TEXT DEFAULT 'Asia/Kathmandu',
  avatar_url TEXT,
  is_2fa_enabled BOOLEAN DEFAULT false,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Unique verified phone index
CREATE UNIQUE INDEX unique_verified_phone ON public.profiles (phone) WHERE phone IS NOT NULL AND phone_verified = true;

-- 4. USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. SECURITY DEFINER FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_account_frozen(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_frozen FROM public.profiles WHERE id = _user_id), false)
$$;

-- 6. handle_new_user + handle_new_user_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, phone_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, false)
  );
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. KYC SUBMISSIONS
CREATE TABLE public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_legal_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  country TEXT NOT NULL DEFAULT 'Nepal',
  nationality TEXT NOT NULL DEFAULT 'Nepali',
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  occupation TEXT NOT NULL,
  source_of_funds TEXT NOT NULL,
  expected_monthly_volume TEXT,
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  status kyc_status NOT NULL DEFAULT 'pending_review',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_kyc_updated_at BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. KYC DOCUMENTS
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_submission_id UUID NOT NULL REFERENCES public.kyc_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- 9. PAYMENT METHODS
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  payment_type payment_method_type NOT NULL DEFAULT 'bank_transfer',
  account_holder_name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  wallet_id TEXT,
  qr_image_path TEXT,
  notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. PAYOUT ADDRESSES
CREATE TABLE public.payout_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset crypto_asset NOT NULL,
  network crypto_network NOT NULL,
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  destination_tag TEXT,
  is_whitelisted BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_addresses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_payout_addresses_updated_at BEFORE UPDATE ON public.payout_addresses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. QUOTE REQUESTS
CREATE TABLE public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side trade_side NOT NULL,
  asset crypto_asset NOT NULL,
  network crypto_network NOT NULL,
  amount_crypto NUMERIC,
  amount_fiat NUMERIC,
  fiat_currency TEXT NOT NULL DEFAULT 'NPR',
  preferred_payment_method_id UUID REFERENCES public.payment_methods(id),
  payout_address_id UUID REFERENCES public.payout_addresses(id),
  notes TEXT,
  status quote_request_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. QUOTES
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  quoted_price NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  spread_amount NUMERIC,
  total_user_pays NUMERIC NOT NULL,
  total_user_receives NUMERIC NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  settlement_instructions TEXT,
  internal_note TEXT,
  is_accepted BOOLEAN,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 13. OTC TRADES
CREATE TABLE public.otc_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id),
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  side trade_side NOT NULL,
  asset crypto_asset NOT NULL,
  network crypto_network NOT NULL,
  fiat_currency TEXT NOT NULL DEFAULT 'NPR',
  quoted_rate NUMERIC NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  gross_amount NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  settlement_notes TEXT,
  settlement_references JSONB,
  assigned_admin UUID REFERENCES auth.users(id),
  status trade_status NOT NULL DEFAULT 'pending_settlement',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.otc_trades ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_otc_trades_updated_at BEFORE UPDATE ON public.otc_trades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. TRADE STATUS HISTORY
CREATE TABLE public.trade_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.otc_trades(id) ON DELETE CASCADE,
  from_status trade_status,
  to_status trade_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_status_history ENABLE ROW LEVEL SECURITY;

-- 15. PAYMENT PROOFS
CREATE TABLE public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.otc_trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- 16. LEDGER ENTRIES
CREATE TABLE public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES public.otc_trades(id),
  user_id UUID REFERENCES auth.users(id),
  entry_type TEXT NOT NULL,
  asset TEXT,
  currency TEXT,
  amount NUMERIC NOT NULL,
  direction ledger_direction NOT NULL,
  account_bucket ledger_bucket NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- 17. AUDIT LOGS
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  target_type TEXT NOT NULL,
  target_id UUID,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 18. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 19. SUPPORT TICKETS
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT,
  status support_ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 20. SUPPORT MESSAGES
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  file_path TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 21. ADMIN NOTES
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- 22. APP SETTINGS
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 23. LOGIN EVENTS
CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  city text,
  country text,
  login_method text DEFAULT 'password',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- 24. USER SESSIONS
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  ip_address text,
  user_agent text,
  last_active_at timestamptz DEFAULT now(),
  is_current boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 25. USER 2FA SECRETS
CREATE TABLE public.user_2fa_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  is_enabled boolean DEFAULT false,
  backup_codes text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_2fa_secrets ENABLE ROW LEVEL SECURITY;

-- 26. WALLETS
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance_npr NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 27. WALLET TRANSACTIONS
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 28. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 29. PROMOTIONS (formerly ads)
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT NOT NULL,
  link_text TEXT NOT NULL DEFAULT 'Learn More',
  placement promotion_placement NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0,
  impression_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 30. PROMOTION EVENTS
CREATE TABLE public.promotion_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  event_type promotion_event_type NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promotion_events ENABLE ROW LEVEL SECURITY;

-- 31. PHONE VERIFICATION CODES
CREATE TABLE public.phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified boolean NOT NULL DEFAULT false
);
ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- KYC Submissions
CREATE POLICY "Users can view own KYC" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own KYC" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending KYC" ON public.kyc_submissions FOR UPDATE USING (auth.uid() = user_id AND status IN ('not_submitted', 'needs_more_info'));
CREATE POLICY "Admins can view all KYC" ON public.kyc_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));
CREATE POLICY "Admins can update KYC" ON public.kyc_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));

-- KYC Documents
CREATE POLICY "Users can view own KYC docs" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload own KYC docs" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all KYC docs" ON public.kyc_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));

-- Payment Methods
CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment methods" ON public.payment_methods FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Payout Addresses
CREATE POLICY "Users can view own payout addresses" ON public.payout_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payout addresses" ON public.payout_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payout addresses" ON public.payout_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payout addresses" ON public.payout_addresses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payout addresses" ON public.payout_addresses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Quote Requests
CREATE POLICY "Users can view own quote requests" ON public.quote_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quote requests" ON public.quote_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own draft/submitted quotes" ON public.quote_requests FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'submitted'));
CREATE POLICY "Admins can view all quote requests" ON public.quote_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update quote requests" ON public.quote_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Quotes
CREATE POLICY "Users can view quotes for own requests" ON public.quotes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.quote_requests qr WHERE qr.id = quote_request_id AND qr.user_id = auth.uid()));
CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- OTC Trades
CREATE POLICY "Users can view own trades" ON public.otc_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all trades" ON public.otc_trades FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trades" ON public.otc_trades FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert trades" ON public.otc_trades FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trade Status History
CREATE POLICY "Users can view own trade history" ON public.trade_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.otc_trades t WHERE t.id = trade_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins can manage trade history" ON public.trade_status_history FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Payment Proofs
CREATE POLICY "Users can view own payment proofs" ON public.payment_proofs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload payment proofs" ON public.payment_proofs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payment proofs" ON public.payment_proofs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Ledger
CREATE POLICY "Admins can manage ledger" ON public.ledger_entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries FOR SELECT USING (auth.uid() = user_id);

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Support Tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Support Messages
CREATE POLICY "Users can view non-internal messages on own tickets" ON public.support_messages FOR SELECT
  USING (is_internal = false AND EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND st.user_id = auth.uid()));
CREATE POLICY "Users can send messages on own tickets" ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND is_internal = false AND EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND st.user_id = auth.uid()));
CREATE POLICY "Admins can manage support messages" ON public.support_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin Notes
CREATE POLICY "Admins can manage admin notes" ON public.admin_notes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- App Settings
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Login Events
CREATE POLICY "Users can view own login events" ON public.login_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all login events" ON public.login_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own login events" ON public.login_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User Sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own sessions" ON public.user_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.user_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2FA Secrets
CREATE POLICY "Users can view own 2fa" ON public.user_2fa_secrets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all 2fa" ON public.user_2fa_secrets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Wallets
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update wallets" ON public.wallets FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Wallet Transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert deposit/withdrawal requests" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id AND type IN ('deposit', 'withdrawal'));
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update transactions" ON public.wallet_transactions FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Announcements
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can read active announcements" ON public.announcements FOR SELECT TO authenticated USING (is_active = true);

-- Promotions
CREATE POLICY "Admins can manage ads" ON public.promotions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active ads" ON public.promotions FOR SELECT TO public USING (is_active = true);

-- Promotion Events
CREATE POLICY "Admins can manage ad events" ON public.promotion_events FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert ad events" ON public.promotion_events FOR INSERT TO public WITH CHECK (true);

-- =============================================
-- FROZEN ACCOUNT RESTRICTIVE POLICIES
-- =============================================
CREATE POLICY "Frozen users cannot create quote requests" ON public.quote_requests AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot update quote requests" ON public.quote_requests AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot create wallet transactions" ON public.wallet_transactions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot update quotes" ON public.quotes AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot upload payment proofs" ON public.payment_proofs AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot insert payment methods" ON public.payment_methods AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot update payment methods" ON public.payment_methods AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot insert payout addresses" ON public.payout_addresses AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (NOT public.is_account_frozen(auth.uid()));
CREATE POLICY "Frozen users cannot update payout addresses" ON public.payout_addresses AS RESTRICTIVE FOR UPDATE TO authenticated USING (NOT public.is_account_frozen(auth.uid()));

-- =============================================
-- TRIGGERS (on auth.users)
-- =============================================
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- =============================================
-- TRIGGER FUNCTIONS (business logic)
-- =============================================

-- Create trade on quote accept
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
  IF NEW.is_accepted IS NOT TRUE OR (OLD.is_accepted IS TRUE) THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_quote FROM quotes WHERE id = NEW.id;
  SELECT * INTO v_qr FROM quote_requests WHERE id = v_quote.quote_request_id;
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
  UPDATE quote_requests SET status = 'converted_to_trade' WHERE id = v_qr.id;
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    v_qr.user_id, 'trade_update', 'Trade Created',
    'Your quote for ' || v_qr.side || ' ' || v_qr.asset || ' has been accepted and a trade has been created.',
    '/dashboard/trades/' || v_trade_id
  );
  INSERT INTO trade_status_history (trade_id, from_status, to_status, note)
  VALUES (v_trade_id, NULL, 'pending_settlement', 'Trade created from accepted quote');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quote_accepted
  AFTER UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION create_trade_on_quote_accept();

-- Notify user on trade status change
CREATE OR REPLACE FUNCTION public.notify_user_on_trade_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id, 'trade_update', 'Trade Status Updated',
    'Your ' || NEW.side || ' ' || NEW.asset || ' trade status changed to ' || replace(initcap(replace(NEW.status::text, '_', ' ')), '_', ' ') || '.',
    '/dashboard/trades/' || NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trade_status_changed
  AFTER UPDATE ON otc_trades
  FOR EACH ROW EXECUTE FUNCTION notify_user_on_trade_status_change();

-- Notify wallet tx status change
CREATE OR REPLACE FUNCTION public.notify_wallet_tx_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.type = 'deposit' AND NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (NEW.user_id, 'payment_update', 'Deposit Approved', 'Your deposit of NPR ' || NEW.amount::text || ' has been approved and credited to your wallet.', '/dashboard/wallet');
  END IF;
  IF NEW.type = 'deposit' AND NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (NEW.user_id, 'payment_update', 'Deposit Rejected', 'Your deposit request of NPR ' || NEW.amount::text || ' was rejected.' || CASE WHEN NEW.admin_note IS NOT NULL THEN ' Reason: ' || NEW.admin_note ELSE '' END, '/dashboard/wallet');
  END IF;
  IF NEW.type = 'withdrawal' AND NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (NEW.user_id, 'payment_update', 'Withdrawal Processed', 'Your withdrawal of NPR ' || NEW.amount::text || ' has been processed.', '/dashboard/wallet');
  END IF;
  IF NEW.type = 'withdrawal' AND NEW.status = 'rejected' THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (NEW.user_id, 'payment_update', 'Withdrawal Rejected', 'Your withdrawal request of NPR ' || NEW.amount::text || ' was rejected.' || CASE WHEN NEW.admin_note IS NOT NULL THEN ' Reason: ' || NEW.admin_note ELSE '' END, '/dashboard/wallet');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_wallet_tx_status_change
  AFTER UPDATE ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION notify_wallet_tx_status_change();

-- Increment promotion counter
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

CREATE TRIGGER on_promotion_event_insert
  AFTER INSERT ON public.promotion_events
  FOR EACH ROW EXECUTE FUNCTION public.increment_promotion_counter();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_kyc_user ON public.kyc_submissions(user_id);
CREATE INDEX idx_kyc_status ON public.kyc_submissions(status);
CREATE INDEX idx_quote_requests_user ON public.quote_requests(user_id);
CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX idx_otc_trades_user ON public.otc_trades(user_id);
CREATE INDEX idx_otc_trades_status ON public.otc_trades(status);
CREATE INDEX idx_ledger_trade ON public.ledger_entries(trade_id);
CREATE INDEX idx_ledger_user ON public.ledger_entries(user_id);
CREATE INDEX idx_audit_target ON public.audit_logs(target_type, target_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_ads_placement_active ON public.promotions (placement, is_active);
CREATE INDEX idx_ad_events_ad_id ON public.promotion_events (ad_id);

-- =============================================
-- REALTIME
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.otc_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quote_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO public.app_settings (key, value)
VALUES ('withdrawal_2fa_threshold', '{"amount": 50000}'::jsonb)
ON CONFLICT DO NOTHING;
