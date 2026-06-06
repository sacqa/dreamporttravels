
-- Tighten insert checks (replace permissive 'true' with field validation)
DROP POLICY "Anyone create orders" ON public.orders;
CREATE POLICY "Anyone create orders" ON public.orders FOR INSERT
  WITH CHECK (length(customer_name) > 1 AND length(customer_email) > 3 AND length(customer_phone) > 5 AND total_pkr > 0);

DROP POLICY "Anyone create order items" ON public.order_items;
CREATE POLICY "Anyone create order items" ON public.order_items FOR INSERT
  WITH CHECK (quantity > 0 AND unit_price_pkr >= 0 AND total_price_pkr >= 0);

DROP POLICY "Anyone submit inquiry" ON public.inquiries;
CREATE POLICY "Anyone submit inquiry" ON public.inquiries FOR INSERT
  WITH CHECK (length(name) > 1 AND length(email) > 3 AND length(message) > 3);

-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
