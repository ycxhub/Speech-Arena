-- Leaderboard RPCs: use definition_name from ELO (Phase 3)
-- ELO tables now key by (provider_id, definition_name)
-- Drop first because return type changed (model_id -> definition_name)
DROP FUNCTION IF EXISTS public.get_leaderboard_global_model(uuid, integer);
DROP FUNCTION IF EXISTS public.get_leaderboard_by_language_model(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_leaderboard_global_model(
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
    e.provider_id,
    e.definition_name,
    e.definition_name AS model_name,
    p.name AS provider_name,
    p.slug AS provider_slug,
    e.rating,
    e.matches_played,
    e.wins,
    e.losses,
    e.last_updated,
    (SELECT m.tags FROM models m
     INNER JOIN provider_model_definitions pmd ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id AND pmd.name = e.definition_name
     WHERE m.is_active = true
     LIMIT 1) AS tags
  FROM elo_ratings_global_model e
  INNER JOIN providers p ON p.id = e.provider_id AND p.is_active = true
  WHERE (p_provider_id IS NULL OR e.provider_id = p_provider_id)
    AND (p_min_matches IS NULL OR e.matches_played >= p_min_matches)
  ORDER BY e.rating DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_by_language_model(
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
    e.provider_id,
    e.definition_name,
    e.definition_name AS model_name,
    p.name AS provider_name,
    p.slug AS provider_slug,
    e.rating,
    e.matches_played,
    e.wins,
    e.losses,
    e.last_updated,
    (SELECT m.tags FROM models m
     INNER JOIN provider_model_definitions pmd ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id AND pmd.name = e.definition_name
     WHERE m.is_active = true
     LIMIT 1) AS tags
  FROM elo_ratings_by_language_model e
  INNER JOIN providers p ON p.id = e.provider_id AND p.is_active = true
  WHERE e.language_id = p_language_id
    AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
    AND (p_min_matches IS NULL OR e.matches_played >= p_min_matches)
  ORDER BY e.rating DESC;
$$;
