-- Matchmaking RPC functions for consolidated queries (PRD 08)
-- Reduces round-trips by using server-side SQL for candidate and sentence selection.

-- Returns candidate models with ELO ratings for a given language.
-- Filters: models.is_active, providers.is_active, model_languages, provider has active API key.
CREATE OR REPLACE FUNCTION public.get_matchmaking_candidates(p_language_id uuid)
RETURNS TABLE (
  model_id uuid,
  gender text,
  rating real,
  matches_played integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id AS model_id,
    m.gender,
    COALESCE(e.rating, 1500)::real AS rating,
    COALESCE(e.matches_played, 0)::integer AS matches_played
  FROM models m
  INNER JOIN providers p ON p.id = m.provider_id AND p.is_active = true
  INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = p_language_id
  INNER JOIN (
    SELECT DISTINCT provider_id FROM api_keys WHERE status = 'active'
  ) ak ON ak.provider_id = p.id
  LEFT JOIN elo_ratings_by_language e ON e.model_id = m.id AND e.language_id = p_language_id
  WHERE m.is_active = true;
$$;

-- Returns a random sentence for the language, excluding recently seen (with fallback).
CREATE OR REPLACE FUNCTION public.get_random_sentence(
  p_language_id uuid,
  p_user_id uuid,
  p_exclude_window integer DEFAULT 10
)
RETURNS TABLE (id uuid, text text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent AS (
    SELECT te.sentence_id
    FROM test_events te
    WHERE te.user_id = p_user_id
    ORDER BY te.created_at DESC
    LIMIT p_exclude_window
  ),
  preferred AS (
    SELECT s.id, s.text
    FROM sentences s
    WHERE s.language_id = p_language_id
      AND s.is_active = true
      AND s.id NOT IN (SELECT sentence_id FROM recent)
  ),
  fallback AS (
    SELECT s.id, s.text
    FROM sentences s
    WHERE s.language_id = p_language_id
      AND s.is_active = true
  )
  SELECT id, text FROM (
    SELECT id, text, 1 AS ord FROM preferred
    UNION ALL
    SELECT id, text, 2 AS ord FROM fallback
  ) combined
  ORDER BY ord, random()
  LIMIT 1;
$$;
