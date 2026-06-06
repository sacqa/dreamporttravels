
CREATE TABLE IF NOT EXISTS public.payment_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sandbox boolean NOT NULL DEFAULT true,
  instructions text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_configs TO authenticated;
GRANT ALL ON public.payment_configs TO service_role;

ALTER TABLE public.payment_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payment_configs" ON public.payment_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_ref text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_payload jsonb;

INSERT INTO public.payment_configs (provider, enabled, sandbox, config, instructions)
VALUES
  ('jazzcash', false, true, '{"merchant_id":"","password":"","integrity_salt":"","return_url":""}'::jsonb, 'Fill Merchant ID, Password, Integrity Salt and Return URL from your JazzCash merchant portal.'),
  ('easypaisa', false, true, '{"store_id":"","hash_key":""}'::jsonb, 'Easypaisa store ID and hash key.'),
  ('bank_transfer', true, false, '{"bank_name":"Meezan Bank","account_title":"DreamPort Travels","account_number":"","iban":""}'::jsonb, 'Show these bank details to customers for manual transfer.')
ON CONFLICT (provider) DO NOTHING;
