
DROP POLICY IF EXISTS "Anyone can create cart sessions" ON public.cart_sessions;
DROP POLICY IF EXISTS "Anyone can update cart sessions" ON public.cart_sessions;
REVOKE INSERT, UPDATE ON public.cart_sessions FROM anon, authenticated;
