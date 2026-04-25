-- Bradley-Terry leaderboard tables and RPCs
-- Ratings are materialized from completed blind test_events by the refresh cron.

CREATE TABLE public.bradley_terry_ratings_global_model (
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  definition_name text NOT NULL,
  beta real NOT NULL DEFAULT 0,
  rating real NOT NULL DEFAULT 1000,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, definition_name)
);

COMMENT ON TABLE public.bradley_terry_ratings_global_model IS
  'Bradley-Terry MLE ratings keyed by (provider_id, definition_name), computed from completed blind tests';

CREATE TABLE public.bradley_terry_ratings_by_language_model (
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  definition_name text NOT NULL,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  beta real NOT NULL DEFAULT 0,
  rating real NOT NULL DEFAULT 1000,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, definition_name, language_id)
);

COMMENT ON TABLE public.bradley_terry_ratings_by_language_model IS
  'Per-language Bradley-Terry MLE ratings keyed by (provider_id, definition_name, language_id)';

CREATE INDEX idx_bradley_terry_global_model_rating
  ON public.bradley_terry_ratings_global_model(rating DESC);

CREATE INDEX idx_bradley_terry_by_language_model_lang_rating
  ON public.bradley_terry_ratings_by_language_model(language_id, rating DESC);

ALTER TABLE public.bradley_terry_ratings_global_model ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bradley_terry_ratings_by_language_model ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select bradley_terry_ratings_global_model"
  ON public.bradley_terry_ratings_global_model
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can select bradley_terry_ratings_by_language_model"
  ON public.bradley_terry_ratings_by_language_model
  FOR SELECT
  TO authenticated
  USING (true);

DROP FUNCTION IF EXISTS public.get_bradley_terry_leaderboard_global_model(uuid, integer);
DROP FUNCTION IF EXISTS public.get_bradley_terry_leaderboard_by_language_model(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_bradley_terry_leaderboard_global_model(
  p_provider_id uuid DEFAULT NULL,
  p_min_matches integer DEFAULT NULL
)
RETURNS TABLE (
  provider_id uuid,
  definition_name text,
  model_name text,
  provider_name text,
  provider_slug text,
  rating real,
  matches_played integer,
  wins integer,
  losses integer,
  last_updated timestamptz,
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bt.provider_id,
    bt.definition_name,
    bt.definition_name AS model_name,
    p.name AS provider_name,
    p.slug AS provider_slug,
    bt.rating,
    bt.matches_played,
    bt.wins,
    bt.losses,
    bt.last_updated,
    (SELECT m.tags FROM models m
     INNER JOIN provider_model_definitions pmd ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id AND pmd.name = bt.definition_name
     WHERE m.provider_id = bt.provider_id AND m.is_active = true
     LIMIT 1) AS tags
  FROM public.bradley_terry_ratings_global_model bt
  INNER JOIN providers p ON p.id = bt.provider_id AND p.is_active = true
  WHERE (p_provider_id IS NULL OR bt.provider_id = p_provider_id)
    AND (p_min_matches IS NULL OR bt.matches_played >= p_min_matches)
  ORDER BY bt.rating DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_bradley_terry_leaderboard_by_language_model(
  p_language_id uuid,
  p_provider_id uuid DEFAULT NULL,
  p_min_matches integer DEFAULT NULL
)
RETURNS TABLE (
  provider_id uuid,
  definition_name text,
  model_name text,
  provider_name text,
  provider_slug text,
  rating real,
  matches_played integer,
  wins integer,
  losses integer,
  last_updated timestamptz,
  tags text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bt.provider_id,
    bt.definition_name,
    bt.definition_name AS model_name,
    p.name AS provider_name,
    p.slug AS provider_slug,
    bt.rating,
    bt.matches_played,
    bt.wins,
    bt.losses,
    bt.last_updated,
    (SELECT m.tags FROM models m
     INNER JOIN provider_model_definitions pmd ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id AND pmd.name = bt.definition_name
     WHERE m.provider_id = bt.provider_id AND m.is_active = true
     LIMIT 1) AS tags
  FROM public.bradley_terry_ratings_by_language_model bt
  INNER JOIN providers p ON p.id = bt.provider_id AND p.is_active = true
  WHERE bt.language_id = p_language_id
    AND (p_provider_id IS NULL OR bt.provider_id = p_provider_id)
    AND (p_min_matches IS NULL OR bt.matches_played >= p_min_matches)
  ORDER BY bt.rating DESC;
$$;
