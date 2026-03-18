
ALTER TABLE public.payment_proofs ADD COLUMN order_id uuid REFERENCES public.orders(id);

-- Allow users to upload proofs for their own orders
CREATE POLICY "Users can upload order payment proofs"
ON public.payment_proofs
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND order_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

-- Allow users to view proofs for their own orders
CREATE POLICY "Users can view own order proofs"
ON public.payment_proofs
FOR SELECT
TO public
USING (
  auth.uid() = user_id
  AND order_id IS NOT NULL
);
