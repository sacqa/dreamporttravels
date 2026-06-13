
-- Close the guest order_items insert window. The app now creates orders + items
-- atomically through the placeOrder server function using the service role.
DROP POLICY IF EXISTS "Create order items for own recent order" ON public.order_items;

-- Cart sessions: writes are intentionally service-role only.
COMMENT ON TABLE public.cart_sessions IS
  'All writes go through the upsertCartSession server function (service role). No anon or authenticated INSERT/UPDATE policies are defined by design; clients cannot mutate this table directly.';
