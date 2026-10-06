CREATE OR REPLACE FUNCTION public.add_my_role(_role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _role NOT IN ('seller'::public.app_role, 'vet'::public.app_role) THEN RAISE EXCEPTION 'role not allowed'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), _role) ON CONFLICT DO NOTHING;
END; $$;
REVOKE EXECUTE ON FUNCTION public.add_my_role(public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_my_role(public.app_role) TO authenticated;

DROP POLICY IF EXISTS escrow_buyer_insert ON public.escrow_orders;
CREATE POLICY escrow_buyer_insert ON public.escrow_orders FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND public.has_role(auth.uid(), 'seller'::public.app_role)
  AND buyer_id IS DISTINCT FROM seller_id
  AND NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
);