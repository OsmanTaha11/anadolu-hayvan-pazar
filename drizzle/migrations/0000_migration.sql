DROP POLICY IF EXISTS listing_media_public_read ON storage.objects;
DROP POLICY IF EXISTS listing_media_read ON storage.objects;
DROP POLICY IF EXISTS listing_media_delete ON storage.objects;
DROP POLICY IF EXISTS listing_media_update ON storage.objects;

CREATE OR REPLACE FUNCTION public.is_published_listing_media(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.status <> 'draft'
      AND ('storage:' || _name) IN (l.reels_video_url, l.thumbnail_url)
  ) OR EXISTS (
    SELECT 1 FROM public.vet_inspections v
    WHERE v.is_approved
      AND (v.scale_ticket_photo_url IN ('storage:' || _name, _name)
        OR v.video_360_url IN ('storage:' || _name, _name))
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_published_listing_media(text) TO anon, authenticated;

CREATE POLICY listing_media_published_read ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'listing-media' AND public.is_published_listing_media(name));

CREATE POLICY listing_media_owner_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'listing-media' AND (
  (storage.foldername(name))[1] = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'vet')
));