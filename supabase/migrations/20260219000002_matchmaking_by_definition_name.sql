-- Matchmaking: key by (provider_id, definition_name) from provider_model_definitions.name
-- Returns one row per (provider_id, definition_name, gender) for same-gender constraint
-- Drop first because return type changed (model_id -> definition_name)
DROP FUNCTION IF EXISTS public.get_matchmaking_candidates_by_model(uuid);

CREATE OR REPLACE FUNCTION public.get_matchmaking_candidates_by_model(p_language_id uuid)
RETURNS TABLE (
  provider_id uuid,
  definition_name text,
  gender text,
  rating real,
  matches_played integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (m.provider_id, COALESCE(pmd.name, m.model_id), m.gender)
    m.provider_id,
    COALESCE(pmd.name, m.model_id) AS definition_name,
    m.gender,
    COALESCE(e.rating, 1500)::real AS rating,
    COALESCE(e.matches_played, 0)::integer AS matches_played
  FROM models m
  INNER JOIN providers p ON p.id = m.provider_id AND p.is_active = true
  INNER JOIN provider_voices pv ON pv.provider_id = m.provider_id AND pv.voice_id = m.voice_id AND pv.language_id = p_language_id
  INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = p_language_id
  INNER JOIN (
    SELECT DISTINCT provider_id FROM api_keys WHERE status = 'active'
  ) ak ON ak.provider_id = p.id
  LEFT JOIN provider_model_definitions pmd ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id
  LEFT JOIN elo_ratings_by_language_model e
    ON e.provider_id = m.provider_id AND e.definition_name = COALESCE(pmd.name, m.model_id) AND e.language_id = p_language_id
  WHERE m.is_active = true
  ORDER BY m.provider_id, COALESCE(pmd.name, m.model_id), m.gender, m.model_id, m.id;
$$;

-- Pick random voice for a (provider_id, definition_name)
-- definition_name matches provider_model_definitions.name, or model_id for orphans
CREATE OR REPLACE FUNCTION public.pick_random_voice_for_definition(
  p_provider_id uuid,
  p_definition_name text,
  p_language_id uuid,
  p_gender text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id
  FROM models m
  LEFT JOIN provider_model_definitions pmd ON pmd.provider_id = m.provider_id AND pmd.model_id = m.model_id
  INNER JOIN provider_voices pv ON pv.provider_id = m.provider_id AND pv.voice_id = m.voice_id AND pv.language_id = p_language_id
  INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = p_language_id
  WHERE m.provider_id = p_provider_id
    AND COALESCE(pmd.name, m.model_id) = p_definition_name
    AND m.is_active = true
    AND (p_gender IS NULL OR m.gender = p_gender)
  ORDER BY random()
  LIMIT 1;
$$;
