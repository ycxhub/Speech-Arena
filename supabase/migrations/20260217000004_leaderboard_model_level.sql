-- Leaderboard RPCs at model level (Phase 5)
-- Returns rows from elo_ratings_global_model / elo_ratings_by_language_model
-- with display name derived from models (one per provider_id, model_id)

CREATE OR REPLACE FUNCTION public.get_leaderboard_global_model(
  p_provider_id uuid DEFAULT NULL,
  p_min_matches integer DEFAULT NULL
)
RETURNS TABLE (
  provider_id uuid,
  model_id text,
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
    e.model_id,
    (SELECT m.name FROM models m
     WHERE m.provider_id = e.provider_id AND m.model_id = e.model_id AND m.is_active = true
     ORDER BY m.name LIMIT 1) AS model_name,
    p.name AS provider_name,
    p.slug AS provider_slug,
    e.rating,
    e.matches_played,
    e.wins,
    e.losses,
    e.last_updated,
    (SELECT m.tags FROM models m
     WHERE m.provider_id = e.provider_id AND m.model_id = e.model_id AND m.is_active = true
     ORDER BY m.name LIMIT 1) AS tags
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
  model_id text,
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
    e.model_id,
    (SELECT m.name FROM models m
     WHERE m.provider_id = e.provider_id AND m.model_id = e.model_id AND m.is_active = true
     ORDER BY m.name LIMIT 1) AS model_name,
    p.name AS provider_name,
    p.slug AS provider_slug,
    e.rating,
    e.matches_played,
    e.wins,
    e.losses,
    e.last_updated,
    (SELECT m.tags FROM models m
     WHERE m.provider_id = e.provider_id AND m.model_id = e.model_id AND m.is_active = true
     ORDER BY m.name LIMIT 1) AS tags
  FROM elo_ratings_by_language_model e
  INNER JOIN providers p ON p.id = e.provider_id AND p.is_active = true
  WHERE e.language_id = p_language_id
    AND (p_provider_id IS NULL OR e.provider_id = p_provider_id)
    AND (p_min_matches IS NULL OR e.matches_played >= p_min_matches)
  ORDER BY e.rating DESC;
$$;
