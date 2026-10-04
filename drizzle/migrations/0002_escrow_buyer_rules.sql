DROP POLICY IF EXISTS escrow_buyer_insert ON public.escrow_orders;
CREATE POLICY escrow_buyer_insert ON public.escrow_orders FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND NOT public.has_role(auth.uid(), 'vet'::public.app_role)
  AND buyer_id IS DISTINCT FROM seller_id
  AND NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.seller_id = auth.uid())
);