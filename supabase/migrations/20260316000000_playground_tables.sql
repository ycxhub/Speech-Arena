-- Playground comparison pages and sample sentences

CREATE TABLE public.playground_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  headline text NOT NULL,
  model_a_label text NOT NULL,
  model_b_label text NOT NULL,
  model_a_provider_slug text NOT NULL,
  model_a_model_id text NOT NULL,
  model_b_provider_slug text NOT NULL,
  model_b_model_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.playground_sample_sentences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playground_page_id uuid NOT NULL REFERENCES public.playground_pages(id) ON DELETE CASCADE,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_playground_pages_slug ON public.playground_pages(slug);
CREATE INDEX idx_playground_sentences_page_lang ON public.playground_sample_sentences(playground_page_id, language_id);

-- RLS: public read, admin-only write
ALTER TABLE public.playground_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playground_sample_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read playground_pages"
  ON public.playground_pages FOR SELECT
  USING (true);

CREATE POLICY "Admin insert playground_pages"
  ON public.playground_pages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update playground_pages"
  ON public.playground_pages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin delete playground_pages"
  ON public.playground_pages FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Public read playground_sample_sentences"
  ON public.playground_sample_sentences FOR SELECT
  USING (true);

CREATE POLICY "Admin insert playground_sample_sentences"
  ON public.playground_sample_sentences FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update playground_sample_sentences"
  ON public.playground_sample_sentences FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin delete playground_sample_sentences"
  ON public.playground_sample_sentences FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
