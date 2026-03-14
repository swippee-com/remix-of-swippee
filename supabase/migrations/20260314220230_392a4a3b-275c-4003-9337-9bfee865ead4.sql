
-- Create announcement_type enum
CREATE TYPE public.announcement_type AS ENUM ('info', 'warning', 'maintenance');

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'info',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can CRUD
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can read active announcements
CREATE POLICY "Authenticated users can read active announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (is_active = true);

-- Insert default 2FA withdrawal threshold
INSERT INTO public.app_settings (key, value)
VALUES ('withdrawal_2fa_threshold', '{"amount": 50000}'::jsonb)
ON CONFLICT DO NOTHING;
