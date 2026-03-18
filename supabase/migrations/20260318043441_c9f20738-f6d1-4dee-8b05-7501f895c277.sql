-- Allow authenticated users to read ALL pricing configs (including inactive)
-- so the frontend can show "paused" state properly
DROP POLICY IF EXISTS "Authenticated can read active pricing configs" ON public.pricing_configs;
CREATE POLICY "Authenticated can read all pricing configs"
  ON public.pricing_configs
  FOR SELECT
  TO authenticated
  USING (true);