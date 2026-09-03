CREATE POLICY "listing_media_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'listing-media');
CREATE POLICY "listing_media_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing_media_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listing_media_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);