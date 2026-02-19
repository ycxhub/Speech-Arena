-- ELO tables: key by (provider_id, definition_name) instead of (provider_id, model_id)
-- Enables matchmaking by provider_model_definitions.name to avoid duplicates when model_id has voice baked in

-- Step 1: Create new tables with definition_name
CREATE TABLE public.elo_ratings_global_model_v2 (
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  definition_name text NOT NULL,
  rating real NOT NULL DEFAULT 1500,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, definition_name)
);

CREATE TABLE public.elo_ratings_by_language_model_v2 (
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  definition_name text NOT NULL,
  language_id uuid NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  rating real NOT NULL DEFAULT 1500,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, definition_name, language_id)
);

-- Step 2: Backfill from existing ELO
-- Resolve (provider_id, model_id) -> definition_name via provider_model_definitions; fallback to model_id
-- When multiple model_ids map to same name, merge: sum matches/wins/losses, weighted avg for rating
INSERT INTO public.elo_ratings_global_model_v2 (provider_id, definition_name, rating, matches_played, wins, losses, last_updated)
SELECT
  e.provider_id,
  COALESCE(pmd.name, e.model_id) AS definition_name,
  CASE WHEN SUM(e.matches_played) > 0 THEN SUM(e.rating * e.matches_played)::real / SUM(e.matches_played) ELSE 1500 END AS rating,
  SUM(e.matches_played)::integer AS matches_played,
  SUM(e.wins)::integer AS wins,
  SUM(e.losses)::integer AS losses,
  MAX(e.last_updated) AS last_updated
FROM public.elo_ratings_global_model e
LEFT JOIN public.provider_model_definitions pmd
  ON pmd.provider_id = e.provider_id AND pmd.model_id = e.model_id
GROUP BY e.provider_id, COALESCE(pmd.name, e.model_id);

INSERT INTO public.elo_ratings_by_language_model_v2 (provider_id, definition_name, language_id, rating, matches_played, wins, losses, last_updated)
SELECT
  e.provider_id,
  COALESCE(pmd.name, e.model_id) AS definition_name,
  e.language_id,
  CASE WHEN SUM(e.matches_played) > 0 THEN SUM(e.rating * e.matches_played)::real / SUM(e.matches_played) ELSE 1500 END AS rating,
  SUM(e.matches_played)::integer AS matches_played,
  SUM(e.wins)::integer AS wins,
  SUM(e.losses)::integer AS losses,
  MAX(e.last_updated) AS last_updated
FROM public.elo_ratings_by_language_model e
LEFT JOIN public.provider_model_definitions pmd
  ON pmd.provider_id = e.provider_id AND pmd.model_id = e.model_id
GROUP BY e.provider_id, COALESCE(pmd.name, e.model_id), e.language_id;

-- Step 3: Drop old tables and rename v2
DROP TABLE public.elo_ratings_by_language_model CASCADE;
DROP TABLE public.elo_ratings_global_model CASCADE;

ALTER TABLE public.elo_ratings_global_model_v2 RENAME TO elo_ratings_global_model;
ALTER TABLE public.elo_ratings_by_language_model_v2 RENAME TO elo_ratings_by_language_model;

-- Step 4: Indexes
CREATE INDEX idx_elo_ratings_global_model_rating ON public.elo_ratings_global_model(rating DESC);
CREATE INDEX idx_elo_ratings_by_language_model_lang_rating ON public.elo_ratings_by_language_model(language_id, rating DESC);

COMMENT ON TABLE public.elo_ratings_global_model IS 'ELO ratings keyed by (provider_id, definition_name) from provider_model_definitions.name';
COMMENT ON TABLE public.elo_ratings_by_language_model IS 'ELO ratings per language keyed by (provider_id, definition_name)';
