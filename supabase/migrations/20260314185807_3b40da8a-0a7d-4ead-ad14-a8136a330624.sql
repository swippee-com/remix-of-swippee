
-- =============================================
-- SWIPPEE OTC DESK — FULL SCHEMA
-- =============================================

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
  country TEXT DEFAULT 'Nepal',
  timezone TEXT DEFAULT 'Asia/Kathmandu',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 5. SECURITY DEFINER: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. RLS for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 7. RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 8. KYC SUBMISSIONS
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

CREATE POLICY "Users can view own KYC" ON public.kyc_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own KYC" ON public.kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending KYC" ON public.kyc_submissions FOR UPDATE USING (auth.uid() = user_id AND status IN ('not_submitted', 'needs_more_info'));
CREATE POLICY "Admins can view all KYC" ON public.kyc_submissions FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));
CREATE POLICY "Admins can update KYC" ON public.kyc_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));

-- 9. KYC DOCUMENTS
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_submission_id UUID NOT NULL REFERENCES public.kyc_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- id_front, id_back, selfie, proof_of_address
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC docs" ON public.kyc_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload own KYC docs" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all KYC docs" ON public.kyc_documents FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'compliance'));

-- 10. PAYMENT METHODS
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

CREATE POLICY "Users can view own payment methods" ON public.payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment methods" ON public.payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment methods" ON public.payment_methods FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 11. PAYOUT ADDRESSES
CREATE TABLE public.payout_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset crypto_asset NOT NULL,
  network crypto_network NOT NULL,
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  destination_tag TEXT,
  is_whitelisted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payout_addresses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_payout_addresses_updated_at BEFORE UPDATE ON public.payout_addresses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own payout addresses" ON public.payout_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payout addresses" ON public.payout_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payout addresses" ON public.payout_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payout addresses" ON public.payout_addresses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payout addresses" ON public.payout_addresses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 12. QUOTE REQUESTS
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

CREATE POLICY "Users can view own quote requests" ON public.quote_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quote requests" ON public.quote_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own draft/submitted quotes" ON public.quote_requests FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'submitted'));
CREATE POLICY "Admins can view all quote requests" ON public.quote_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update quote requests" ON public.quote_requests FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 13. QUOTES (admin-created responses)
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

CREATE POLICY "Users can view quotes for own requests" ON public.quotes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.quote_requests qr WHERE qr.id = quote_request_id AND qr.user_id = auth.uid()));
CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 14. OTC TRADES
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

CREATE POLICY "Users can view own trades" ON public.otc_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all trades" ON public.otc_trades FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update trades" ON public.otc_trades FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert trades" ON public.otc_trades FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 15. TRADE STATUS HISTORY
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

CREATE POLICY "Users can view own trade history" ON public.trade_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.otc_trades t WHERE t.id = trade_id AND t.user_id = auth.uid()));
CREATE POLICY "Admins can manage trade history" ON public.trade_status_history FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 16. PAYMENT PROOFS
CREATE TABLE public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.otc_trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, reupload_requested
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment proofs" ON public.payment_proofs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload payment proofs" ON public.payment_proofs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all payment proofs" ON public.payment_proofs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update payment proofs" ON public.payment_proofs FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- 17. LEDGER ENTRIES
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

CREATE POLICY "Admins can manage ledger" ON public.ledger_entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries FOR SELECT USING (auth.uid() = user_id);

-- 18. AUDIT LOGS
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

CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 19. NOTIFICATIONS
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

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 20. SUPPORT TICKETS
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

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.support_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 21. SUPPORT MESSAGES
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

CREATE POLICY "Users can view non-internal messages on own tickets" ON public.support_messages FOR SELECT
  USING (
    is_internal = false AND EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND st.user_id = auth.uid())
  );
CREATE POLICY "Users can send messages on own tickets" ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND is_internal = false
    AND EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND st.user_id = auth.uid())
  );
CREATE POLICY "Admins can manage support messages" ON public.support_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 22. ADMIN NOTES
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL, -- user, trade, quote_request, kyc
  target_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin notes" ON public.admin_notes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 23. APP SETTINGS
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 24. INDEXES
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

-- 25. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies: kyc-documents
CREATE POLICY "Users can upload own KYC docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own KYC docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all KYC docs storage" ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: payment-proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own payment proofs" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all payment proofs storage" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: support-attachments
CREATE POLICY "Users can upload support attachments" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own support attachments" ON storage.objects FOR SELECT
  USING (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all support attachments" ON storage.objects FOR SELECT
  USING (bucket_id = 'support-attachments' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies: avatars
CREATE POLICY "Avatars are publicly readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
