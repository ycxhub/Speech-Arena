-- Provider voices: voice IDs with mandatory gender, managed under provider (not model)
CREATE TABLE public.provider_voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  voice_id text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'neutral')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_voices_provider_id ON public.provider_voices(provider_id);

ALTER TABLE public.provider_voices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider_voices" ON public.provider_voices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
