
CREATE TABLE IF NOT EXISTS public.cart_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER NOT NULL DEFAULT 0,
  total_pkr NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','checkout_started','abandoned','converted')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cart_sessions_anon_id_key ON public.cart_sessions(anon_id);
CREATE INDEX IF NOT EXISTS cart_sessions_status_idx ON public.cart_sessions(status);
CREATE INDEX IF NOT EXISTS cart_sessions_created_at_idx ON public.cart_sessions(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.cart_sessions TO anon, authenticated;
GRANT ALL ON public.cart_sessions TO service_role;

ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create cart sessions"
  ON public.cart_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update cart sessions"
  ON public.cart_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins and editors can view cart sessions"
  ON public.cart_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE TRIGGER cart_sessions_set_updated_at
  BEFORE UPDATE ON public.cart_sessions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='site_content' AND policyname='Admins and editors can manage site_content') THEN
    DROP POLICY "Admins and editors can manage site_content" ON public.site_content;
  END IF;
END $$;

CREATE POLICY "Admins and editors can manage site_content"
  ON public.site_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));
