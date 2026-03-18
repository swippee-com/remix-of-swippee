-- Allow users to cancel their own orders that are in awaiting_payment or rate_locked status
CREATE POLICY "Users can cancel own awaiting orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('awaiting_payment', 'rate_locked')
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'cancelled'
);

-- Allow users to insert order status history for their own orders
CREATE POLICY "Users can insert own order status history"
ON public.order_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM orders o WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid()
  )
);