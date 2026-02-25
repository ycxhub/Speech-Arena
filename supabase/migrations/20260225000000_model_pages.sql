-- Model pages: SEO/marketing pages for each TTS engine definition
-- Links to provider_model_definitions via (provider_id, definition_name) where definition_name = provider_model_definitions.name
-- Idempotent: safe to run when tables already exist

CREATE TABLE IF NOT EXISTS public.model_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  definition_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  one_liner text NOT NULL,
  overview_md text,
  rank_override integer,
  use_elo_rank boolean NOT NULL DEFAULT true,
  latency_ms integer,
  price_input_per_million_chars decimal,
  price_output_per_million_chars decimal,
  data_residency text,
  on_prem boolean,
  launched_at date,
  launched_at_text text,
  multilingual boolean,
  multilingual_count integer,
  endpoint_streaming boolean NOT NULL DEFAULT false,
  endpoint_websocket boolean NOT NULL DEFAULT false,
  endpoint_non_streaming boolean NOT NULL DEFAULT false,
  feature_voice_cloning boolean,
  feature_voice_design boolean,
  feature_open_source boolean,
  use_case_conversational boolean,
  use_case_voice_agents boolean,
  use_case_expressive boolean,
  use_case_flat_content boolean,
  use_case_multilingual boolean,
  strengths text[] DEFAULT '{}',
  weaknesses text[] DEFAULT '{}',
  pricing_description text,
  meta_title text,
  meta_description text,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, definition_name)
);

CREATE INDEX IF NOT EXISTS idx_model_pages_slug ON public.model_pages(slug);
CREATE INDEX IF NOT EXISTS idx_model_pages_provider_definition ON public.model_pages(provider_id, definition_name);
CREATE INDEX IF NOT EXISTS idx_model_pages_is_featured ON public.model_pages(is_featured) WHERE is_featured = true;

ALTER TABLE public.model_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read model_pages" ON public.model_pages;
CREATE POLICY "Anyone can read model_pages" ON public.model_pages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage model_pages" ON public.model_pages;
CREATE POLICY "Admins can manage model_pages" ON public.model_pages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Compare pages: admin-defined or dynamic model comparisons
CREATE TABLE IF NOT EXISTS public.compare_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  model_page_a_id uuid NOT NULL REFERENCES public.model_pages(id) ON DELETE CASCADE,
  model_page_b_id uuid NOT NULL REFERENCES public.model_pages(id) ON DELETE CASCADE,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (model_page_a_id != model_page_b_id)
);

CREATE INDEX IF NOT EXISTS idx_compare_pages_slug ON public.compare_pages(slug);

ALTER TABLE public.compare_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read compare_pages" ON public.compare_pages;
CREATE POLICY "Anyone can read compare_pages" ON public.compare_pages FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage compare_pages" ON public.compare_pages;
CREATE POLICY "Admins can manage compare_pages" ON public.compare_pages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Add logo_url to providers
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS logo_url text;
