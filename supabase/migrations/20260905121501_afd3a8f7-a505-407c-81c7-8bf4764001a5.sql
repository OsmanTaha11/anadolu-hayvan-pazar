DROP POLICY IF EXISTS "listing_media_public_read" ON storage.objects;
CREATE POLICY "listing_media_public_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'listing-media');

DROP POLICY IF EXISTS "listing_media_owner_update" ON storage.objects;
CREATE POLICY "listing_media_owner_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "listing_media_owner_delete" ON storage.objects;
CREATE POLICY "listing_media_owner_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'listing-media' AND (storage.foldername(name))[1] = auth.uid()::text);