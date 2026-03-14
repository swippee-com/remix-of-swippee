
-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true);

-- Allow admins to upload ad images
CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete ad images
CREATE POLICY "Admins can delete ad images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow anyone to view ad images (public bucket)
CREATE POLICY "Anyone can view ad images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ad-images');
