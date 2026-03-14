
-- Security definer function to check if a user's account is frozen
CREATE OR REPLACE FUNCTION public.is_account_frozen(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_frozen FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Block frozen users from creating quote requests
CREATE POLICY "Frozen users cannot create quote requests"
ON public.quote_requests
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_account_frozen(auth.uid()));

-- Block frozen users from updating quote requests
CREATE POLICY "Frozen users cannot update quote requests"
ON public.quote_requests
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (NOT public.is_account_frozen(auth.uid()));

-- Block frozen users from creating wallet transactions (deposits/withdrawals)
CREATE POLICY "Frozen users cannot create wallet transactions"
ON public.wallet_transactions
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_account_frozen(auth.uid()));

-- Block frozen users from accepting quotes
CREATE POLICY "Frozen users cannot update quotes"
ON public.quotes
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (NOT public.is_account_frozen(auth.uid()));

-- Block frozen users from uploading payment proofs
CREATE POLICY "Frozen users cannot upload payment proofs"
ON public.payment_proofs
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_account_frozen(auth.uid()));

-- Block frozen users from managing payment methods
CREATE POLICY "Frozen users cannot insert payment methods"
ON public.payment_methods
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_account_frozen(auth.uid()));

CREATE POLICY "Frozen users cannot update payment methods"
ON public.payment_methods
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (NOT public.is_account_frozen(auth.uid()));

-- Block frozen users from managing payout addresses
CREATE POLICY "Frozen users cannot insert payout addresses"
ON public.payout_addresses
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (NOT public.is_account_frozen(auth.uid()));

CREATE POLICY "Frozen users cannot update payout addresses"
ON public.payout_addresses
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (NOT public.is_account_frozen(auth.uid()));
