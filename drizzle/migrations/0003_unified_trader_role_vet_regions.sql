ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_cities text[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE r public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, city, district, service_cities)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'district',
    CASE WHEN NEW.raw_user_meta_data->>'city' IS NOT NULL AND NEW.raw_user_meta_data->>'role' = 'vet'
      THEN ARRAY[NEW.raw_user_meta_data->>'city'] ELSE '{}'::text[] END);
  r := CASE WHEN NEW.raw_user_meta_data->>'role' = 'vet' THEN 'vet'::public.app_role ELSE 'seller'::public.app_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

UPDATE public.user_roles SET role = 'seller' WHERE role = 'buyer'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles u2 WHERE u2.user_id = user_roles.user_id AND u2.role = 'seller');

DROP POLICY IF EXISTS listings_vet_read_region ON public.listings;