-- Matchmaking: filter by provider_voices.language_id so paired voices share same language (locale)
-- Requires provider_voices.language_id (from 20260218120000_provider_voices_language.sql)

-- get_matchmaking_candidates_by_model: only include models whose voice is tagged with p_language_id
CREATE OR REPLACE FUNCTION public.get_matchmaking_candidates_by_model(p_language_id uuid)
RETURNS TABLE (
  provider_id uuid,
  model_id text,
  gender text,
  rating real,
  matches_played integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (m.provider_id, m.model_id)
    m.provider_id,
    m.model_id,
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
  LEFT JOIN elo_ratings_by_language_model e
    ON e.provider_id = m.provider_id AND e.model_id = m.model_id AND e.language_id = p_language_id
  WHERE m.is_active = true
  ORDER BY m.provider_id, m.model_id, m.id;
$$;

-- pick_random_voice_for_model: only pick voices tagged with p_language_id (keeps p_gender filter)
CREATE OR REPLACE FUNCTION public.pick_random_voice_for_model(
  p_provider_id uuid,
  p_model_id text,
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
  INNER JOIN provider_voices pv ON pv.provider_id = m.provider_id AND pv.voice_id = m.voice_id AND pv.language_id = p_language_id
  INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = p_language_id
  WHERE m.provider_id = p_provider_id
    AND m.model_id = p_model_id
    AND m.is_active = true
    AND (p_gender IS NULL OR m.gender = p_gender)
  ORDER BY random()
  LIMIT 1;
$$;
