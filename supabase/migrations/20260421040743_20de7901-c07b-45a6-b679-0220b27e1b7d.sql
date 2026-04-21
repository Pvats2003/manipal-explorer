
INSERT INTO storage.buckets (id, name, public) VALUES ('spot-images', 'spot-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Spot images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'spot-images');

CREATE POLICY "Admins upload spot images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'spot-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update spot images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'spot-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete spot images"
ON storage.objects FOR DELETE
USING (bucket_id = 'spot-images' AND public.has_role(auth.uid(), 'admin'));
