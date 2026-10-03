REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_published_listing_media(_name text)
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
REVOKE ALL ON FUNCTION private.is_published_listing_media(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_published_listing_media(text) TO anon, authenticated;

DROP POLICY IF EXISTS listing_media_published_read ON storage.objects;
CREATE POLICY listing_media_published_read ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'listing-media' AND private.is_published_listing_media(name));

DROP FUNCTION public.is_published_listing_media(text);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;