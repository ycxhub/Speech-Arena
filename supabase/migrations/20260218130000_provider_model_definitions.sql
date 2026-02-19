-- Model definitions: TTS engine templates (name, model_id, endpoint) before generating models rows
CREATE TABLE public.provider_model_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  model_id text NOT NULL,
  endpoint text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, model_id)
);

CREATE INDEX idx_provider_model_definitions_provider_id ON public.provider_model_definitions(provider_id);

ALTER TABLE public.provider_model_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider_model_definitions" ON public.provider_model_definitions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
