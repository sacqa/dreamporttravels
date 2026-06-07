
-- ============ customer_addresses ============
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses"
  ON public.customer_addresses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all addresses"
  ON public.customer_addresses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_customer_addresses_user_id ON public.customer_addresses(user_id);

-- ============ site_content ============
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site content"
  ON public.site_content FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins write site content"
  ON public.site_content FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_site_content_category ON public.site_content(category);

-- ============ shared updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER set_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Seed default content ============
INSERT INTO public.site_content (key, label, category, value) VALUES
  ('home.hero', 'Homepage Hero', 'homepage', '{"title":"Your Gateway to the Global Horizon","subtitle":"Premium visa processing and Umrah services tailored for Pakistani travelers. Seamless, secure, and fully digital.","cta_label":"Apply for Visa","cta_link":"/visas","secondary_label":"View Umrah Packages","secondary_link":"/umrah"}'::jsonb),
  ('home.banner', 'Promo Banner', 'homepage', '{"enabled":false,"text":"Limited time: 10% off all Umrah packages this month!","link":"/umrah","background":"#0f3460","color":"#ffffff"}'::jsonb),
  ('home.testimonials', 'Testimonials', 'homepage', '{"items":[{"name":"Ahmed K.","role":"Visa client","quote":"Smooth and transparent process from start to finish."},{"name":"Fatima R.","role":"Umrah pilgrim","quote":"Beautifully organized journey, every detail taken care of."}]}'::jsonb),
  ('app.settings', 'App Settings', 'settings', '{"site_name":"DreamPort Travels","support_phone":"0311-0406221","support_email":"info@dreamporttravels.online","whatsapp":"923110406221","facebook":"#","instagram":"#","youtube":"#"}'::jsonb),
  ('checkout.settings', 'Checkout Settings', 'checkout', '{"jazzcash_enabled":true,"easypaisa_enabled":true,"bank_transfer_enabled":true,"bank_details":"Bank: HBL\nAccount Title: DreamPort Travels\nAccount Number: 1234-5678-9012","instructions":"Our team will contact you within 24 hours to confirm payment and begin processing."}'::jsonb),
  ('footer.content', 'Footer Content', 'footer', '{"tagline":"Your trusted partner for visa and Umrah services across Pakistan.","copyright_note":""}'::jsonb);
