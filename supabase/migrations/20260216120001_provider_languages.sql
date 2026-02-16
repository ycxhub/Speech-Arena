-- Provider languages: which languages each provider supports (for model language selection)
CREATE TABLE public.provider_languages (
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, language_id)
);

CREATE INDEX idx_provider_languages_provider_id ON public.provider_languages(provider_id);

ALTER TABLE public.provider_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider_languages" ON public.provider_languages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
