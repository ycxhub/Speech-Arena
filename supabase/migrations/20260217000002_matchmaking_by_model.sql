-- Model-level matchmaking RPC (Phase 3)
-- Returns one row per distinct (provider_id, model_id) with ELO from elo_ratings_by_language_model

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
  INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = p_language_id
  INNER JOIN (
    SELECT DISTINCT provider_id FROM api_keys WHERE status = 'active'
  ) ak ON ak.provider_id = p.id
  LEFT JOIN elo_ratings_by_language_model e
    ON e.provider_id = m.provider_id AND e.model_id = m.model_id AND e.language_id = p_language_id
  WHERE m.is_active = true
  ORDER BY m.provider_id, m.model_id, m.id;
$$;

-- RPC to pick a random model-voice (models.id) for a given (provider_id, model_id)
-- Used when we have selected a model and need to pick which voice to use for audio
CREATE OR REPLACE FUNCTION public.pick_random_voice_for_model(
  p_provider_id uuid,
  p_model_id text,
  p_language_id uuid
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id
  FROM models m
  INNER JOIN model_languages ml ON ml.model_id = m.id AND ml.language_id = p_language_id
  WHERE m.provider_id = p_provider_id
    AND m.model_id = p_model_id
    AND m.is_active = true
  ORDER BY random()
  LIMIT 1;
$$;
