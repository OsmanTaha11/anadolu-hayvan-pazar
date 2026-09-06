CREATE POLICY "listings_vet_update" ON public.listings
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'vet'::app_role))
WITH CHECK (has_role(auth.uid(), 'vet'::app_role));