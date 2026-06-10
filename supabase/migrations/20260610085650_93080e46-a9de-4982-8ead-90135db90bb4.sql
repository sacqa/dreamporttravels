
-- 1. Tighten order_items INSERT: require referenced order belongs to the inserting user
--    (or is a recent guest order created in the last 10 minutes).
DROP POLICY IF EXISTS "Anyone create order items" ON public.order_items;
CREATE POLICY "Create order items for own recent order"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  quantity > 0
  AND unit_price_pkr >= 0
  AND total_price_pkr >= 0
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (
        (o.user_id IS NOT NULL AND o.user_id = auth.uid())
        OR (o.user_id IS NULL AND o.created_at > now() - interval '10 minutes')
      )
  )
);

-- 2. Lock down user_roles: only admins may insert/update/delete role assignments.
CREATE POLICY "Admins manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Move bank details out of publicly readable site_content into admin-only payment_configs.
INSERT INTO public.payment_configs (provider, enabled, sandbox, config, instructions)
VALUES (
  'bank_transfer',
  true,
  false,
  COALESCE(
    (SELECT value FROM public.site_content WHERE key = 'checkout.settings'),
    '{}'::jsonb
  ),
  'Bank transfer details. Edit from the admin Payments tab.'
)
ON CONFLICT (provider) DO UPDATE
SET config = EXCLUDED.config,
    updated_at = now();

DELETE FROM public.site_content WHERE key = 'checkout.settings';
